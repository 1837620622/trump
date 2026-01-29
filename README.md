# 🦅 Trump Tweet Monitor

实时监控特朗普的Twitter/X推文，自动翻译成中文并推送到微信。

![Demo](https://img.shields.io/badge/Demo-Live-green) ![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ 功能特点

- 🚀 **Cloudflare Workers** - 无服务器架构，全球边缘节点
- 🔄 **实时监控** - 每分钟自动检测新推文
- 🌐 **自动翻译** - 英文推文自动翻译成中文
- 📱 **微信推送** - 通过PushPlus推送到微信
- 🎨 **精美网页** - 响应式设计，支持图片展示
- 📊 **多数据源** - 支持多个RSS源聚合

## 📁 项目结构

```
trump/
├── cloudflare-worker.js  # Cloudflare Worker 主脚本
├── index.html            # 精美网页展示
├── test-worker.js        # 本地测试脚本
├── wrangler.toml         # Cloudflare 部署配置
└── README.md             # 项目文档
```

## 🚀 快速开始

### 本地测试

```bash
# 测试RSS抓取和翻译功能
node test-worker.js

# 测试推送功能
node test-worker.js push
```

### Cloudflare Workers 部署

1. 安装 Wrangler CLI
```bash
npm install -g wrangler
```

2. 登录 Cloudflare
```bash
wrangler login
```

3. 创建 KV 命名空间（用于存储已推送ID）
```bash
wrangler kv:namespace create "TRUMP_KV"
```

4. 修改 `wrangler.toml` 填入 KV ID

5. 部署
```bash
wrangler deploy
```

### 配置 Cron 触发器

在 Cloudflare Dashboard 中设置 Cron Triggers：
- 表达式：`* * * * *`（每分钟执行）

## 🔧 配置说明

在 `cloudflare-worker.js` 中修改：

```javascript
const CONFIG = {
  PUSHPLUS_TOKEN: 'your-token',      // PushPlus Token
  PUSHPLUS_TOPIC: 'trump',           // 推送主题
  RSS_URLS: [                        // RSS源列表
    'https://rss.app/feeds/xxx.xml',
  ]
};
```

## 📡 API 接口

| 路径 | 说明 |
|------|------|
| `/test` | 测试Worker状态 |
| `/check` | 手动触发检查新推文 |
| `/translate?text=xxx` | 测试翻译功能 |
| `/rss` | 测试RSS抓取 |

## 🎨 网页展示

直接在浏览器打开 `index.html` 即可查看精美的推文展示页面：

- 🌙 暗色主题，护眼设计
- 📱 响应式布局，支持移动端
- 🖼️ 支持推文图片展示
- 🔄 自动刷新，实时更新
- 🇨🇳 中英文对照显示

## 📝 技术栈

- **Runtime**: Cloudflare Workers
- **翻译**: MyMemory API / Google Translate
- **推送**: PushPlus
- **数据源**: RSS.app
- **前端**: TailwindCSS + Vanilla JS

## � 加入推送群组

扫描下方二维码加入微信推送群，实时接收特朗普推文通知：

<p align="center">
  <img src="assets/qrcode.png" alt="群组二维码" width="300">
</p>

> ⚠️ **注意**：二维码有效期 **30天**，如已过期请联系更新
> 
> 📧 联系方式：**传康KK** | 微信：**1837620622**

## �📄 License

MIT License © 2026