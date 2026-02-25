// ============================================================
// 特朗普推文监控 Cloudflare Worker
// 功能：实时抓取RSS -> 翻译 -> 推送到PushPlus
// 部署：Cloudflare Workers + Cron Triggers (每分钟执行)
// ============================================================

// ---------------------- 配置区域 ----------------------
// 敏感信息通过环境变量配置，不在代码中硬编码
const CONFIG = {
  // PushPlus配置（通过 wrangler secret 设置）
  // PUSHPLUS_TOKEN: 从 env.PUSHPLUS_TOKEN 获取
  PUSHPLUS_TOPIC: 'trump',
  PUSHPLUS_API: 'http://www.pushplus.plus/send',
  
  // RSS源列表 - Truth Social 归档站
  RSS_URLS: [
    'https://www.trumpstruth.org/feed'
  ],
  
  // 翻译API (MyMemory免费API)
  TRANSLATE_API: 'https://api.mymemory.translated.net/get',
  
  // KV存储键名（用于记录已推送的推文ID）
  KV_LAST_ID_KEY: 'trump_last_tweet_id'
};

// ---------------------- 翻译功能 ----------------------
async function translateToChineseMyMemory(text) {
  if (!text || text.length === 0) return text;
  
  try {
    // 限制文本长度（API限制500字符）
    const truncatedText = text.substring(0, 500);
    const url = `${CONFIG.TRANSLATE_API}?q=${encodeURIComponent(truncatedText)}&langpair=en|zh-CN`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) {
      console.log('MyMemory翻译失败，尝试备用API');
      return await translateToChineseGoogle(text);
    }
    
    const result = await response.json();
    if (result.responseStatus === 200 && result.responseData?.translatedText) {
      return result.responseData.translatedText;
    }
    
    // 备用Google翻译
    return await translateToChineseGoogle(text);
  } catch (error) {
    console.error('翻译错误:', error);
    return text;
  }
}

// 备用翻译：Google Translate免费接口
async function translateToChineseGoogle(text) {
  if (!text || text.length === 0) return text;
  
  try {
    const truncatedText = text.substring(0, 500);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(truncatedText)}`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    if (!response.ok) return text;
    
    const result = await response.json();
    if (result && result[0]) {
      return result[0].map(item => item[0]).filter(Boolean).join('');
    }
    return text;
  } catch (error) {
    console.error('Google翻译错误:', error);
    return text;
  }
}

// ---------------------- RSS解析功能 ----------------------
function parseRSSItems(xmlText) {
  const items = [];
  
  // 简单的XML解析（提取<item>标签内容）
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    
    // 提取title
    const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) 
                    || itemXml.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // 提取link
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
    const link = linkMatch ? linkMatch[1].trim() : '';
    
    // 提取guid作为唯一ID
    const guidMatch = itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/);
    const guid = guidMatch ? guidMatch[1].trim() : '';
    
    // 提取发布时间
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    
    // 提取作者
    const creatorMatch = itemXml.match(/<dc:creator><!\[CDATA\[([\s\S]*?)\]\]><\/dc:creator>/);
    const creator = creatorMatch ? creatorMatch[1].trim() : '';
    
    if (title && guid) {
      items.push({ title, link, guid, pubDate, creator });
    }
  }
  
  return items;
}

// ---------------------- 抓取RSS ----------------------
async function fetchRSS(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      }
    });
    
    if (!response.ok) {
      console.error(`RSS获取失败: ${url}, 状态码: ${response.status}`);
      return null;
    }
    
    const xmlText = await response.text();
    return parseRSSItems(xmlText);
  } catch (error) {
    console.error(`RSS抓取错误 ${url}:`, error);
    return null;
  }
}

// ---------------------- PushPlus推送 ----------------------
async function sendToPushPlus(title, content, env) {
  try {
    // 从环境变量获取 Token
    const token = env?.PUSHPLUS_TOKEN || '';
    if (!token) {
      console.error('PUSHPLUS_TOKEN 未配置');
      return false;
    }
    
    const response = await fetch(CONFIG.PUSHPLUS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token,
        title: title,
        content: content,
        topic: CONFIG.PUSHPLUS_TOPIC,
        template: 'txt'
      })
    });
    
    const result = await response.json();
    if (result.code === 200) {
      console.log('推送成功:', result.data);
      return true;
    } else {
      console.error('推送失败:', result.msg);
      return false;
    }
  } catch (error) {
    console.error('推送错误:', error);
    return false;
  }
}

// ---------------------- 格式化消息 ----------------------
async function formatTweetMessage(item) {
  // 翻译内容
  const translatedTitle = await translateToChineseMyMemory(item.title);
  
  const message = `🦅 特朗普 Truth Social

⏰ 时间：${item.pubDate}
👤 来源：${item.creator || '@realDonaldTrump'}

📝 原文：
${item.title}

🇨🇳 翻译：
${translatedTitle}

🔗 链接：${item.link}`;

  return message;
}

// ---------------------- 主逻辑 ----------------------
async function checkNewTweets(env) {
  console.log('开始检查新推文...');
  
  // 从KV获取上次推送的ID
  let lastPushedIds = [];
  if (env && env.TRUMP_KV) {
    try {
      const stored = await env.TRUMP_KV.get(CONFIG.KV_LAST_ID_KEY);
      if (stored) {
        lastPushedIds = JSON.parse(stored);
      }
    } catch (e) {
      console.log('KV读取失败，使用空数组');
    }
  }
  
  let allItems = [];
  
  // 从所有RSS源获取推文
  for (const url of CONFIG.RSS_URLS) {
    const items = await fetchRSS(url);
    if (items && items.length > 0) {
      console.log(`从 ${url} 获取到 ${items.length} 条推文`);
      allItems = allItems.concat(items);
    }
  }
  
  if (allItems.length === 0) {
    console.log('未获取到任何推文');
    return { success: false, message: '未获取到推文' };
  }
  
  // 去重（按guid）
  const uniqueItems = [];
  const seenGuids = new Set();
  for (const item of allItems) {
    if (!seenGuids.has(item.guid)) {
      seenGuids.add(item.guid);
      uniqueItems.push(item);
    }
  }
  
  // 按时间排序（最新的在前）
  uniqueItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  
  // 找出新推文（未推送过的）
  const newItems = uniqueItems.filter(item => !lastPushedIds.includes(item.guid));
  
  if (newItems.length === 0) {
    console.log('没有新推文');
    return { success: true, message: '没有新推文', count: 0 };
  }
  
  console.log(`发现 ${newItems.length} 条新推文`);
  
  // 推送新推文（最多推送3条，避免刷屏）
  const itemsToPush = newItems.slice(0, 3);
  let pushedCount = 0;
  
  for (const item of itemsToPush) {
    const message = await formatTweetMessage(item);
    const success = await sendToPushPlus('🦅 特朗普新动态', message, env);
    
    if (success) {
      pushedCount++;
      lastPushedIds.push(item.guid);
      // 短暂延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 保留最近100个ID，避免KV存储过大
  if (lastPushedIds.length > 100) {
    lastPushedIds = lastPushedIds.slice(-100);
  }
  
  // 保存到KV
  if (env && env.TRUMP_KV) {
    try {
      await env.TRUMP_KV.put(CONFIG.KV_LAST_ID_KEY, JSON.stringify(lastPushedIds));
    } catch (e) {
      console.error('KV保存失败:', e);
    }
  }
  
  return { success: true, message: `推送了 ${pushedCount} 条新推文`, count: pushedCount };
}

// ---------------------- Worker入口 ----------------------
export default {
  // HTTP请求处理（用于手动触发和测试）
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 测试接口
    if (url.pathname === '/test') {
      return new Response(JSON.stringify({
        status: 'ok',
        message: 'Trump Tweet Monitor Worker is running',
        config: {
          rss_urls: CONFIG.RSS_URLS,
          pushplus_topic: CONFIG.PUSHPLUS_TOPIC
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 手动触发检查
    if (url.pathname === '/check') {
      const result = await checkNewTweets(env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 测试翻译
    if (url.pathname === '/translate') {
      const text = url.searchParams.get('text') || 'Hello World';
      const translated = await translateToChineseMyMemory(text);
      return new Response(JSON.stringify({
        original: text,
        translated: translated
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 测试RSS抓取
    if (url.pathname === '/rss') {
      const items = await fetchRSS(CONFIG.RSS_URLS[0]);
      return new Response(JSON.stringify({
        count: items ? items.length : 0,
        items: items ? items.slice(0, 5) : []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // 默认返回使用说明
    return new Response(`
Trump Tweet Monitor - Cloudflare Worker

接口说明：
- GET /test      - 测试Worker状态
- GET /check     - 手动触发检查新推文
- GET /translate?text=xxx - 测试翻译功能
- GET /rss       - 测试RSS抓取

Cron触发：每分钟自动检查新推文
    `, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  },
  
  // 定时任务处理（Cron Trigger）
  async scheduled(event, env, ctx) {
    console.log('Cron触发：检查新推文');
    const result = await checkNewTweets(env);
    console.log('检查结果:', result);
  }
};
