# 🦅 Trump Tweet Monitor

实时监控特朗普的 Truth Social 帖文，自动翻译成中文并推送到微信。

![Demo](https://img.shields.io/badge/Demo-Live-green) ![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange) ![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ 功能特点

- 🚀 **Cloudflare Workers** - 无服务器架构，全球边缘节点
- 🔄 **实时监控** - 每分钟自动检测新帖文
- 🌐 **自动翻译** - 英文帖文自动翻译成中文
- 📱 **微信推送** - 通过 PushPlus 推送到微信
- 🎨 **精美网页** - 玻璃拟态设计，响应式布局
- � **Truth Social** - 数据源来自 trumpstruth.org 归档站

## 📁 项目结构

```
trump/
├── src/
│   ├── index.js          # Cloudflare Worker 主脚本（含前端页面）
│   └── template.html     # 前端 HTML 模板
├── cloudflare-worker.js  # Worker 独立版脚本
├── index.html            # 静态网页展示（可独立使用）
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

在 `src/index.js` 中修改：

```javascript
const CONFIG = {
  PUSHPLUS_TOPIC: 'trump',
  RSS_URLS: [
    'https://www.trumpstruth.org/feed'
  ]
};
```

PUSHPLUS_TOKEN 通过 wrangler secret 设置：
```bash
wrangler secret put PUSHPLUS_TOKEN
```

## 📡 API 接口

| 路径 | 说明 |
| --- | --- |
| `/api/test` | 测试 Worker 状态 |
| `/api/check` | 手动触发检查新帖文 |
| `/api/tweets` | 获取所有帖文数据（JSON） |
| `/api/translate?text=xxx` | 测试翻译功能 |
| `/api/rss` | 测试 RSS 抓取 |

## 🎨 网页展示

直接在浏览器打开 `index.html` 即可查看精美的帖文展示页面：

- 🌙 暗色主题，玻璃拟态设计
- 📱 响应式布局，支持移动端
- 🔄 自动刷新，实时更新
- 🇨🇳 中英文对照显示

## 📝 技术栈

| 类别 | 技术 |
| --- | --- |
| Runtime | Cloudflare Workers |
| 翻译 | MyMemory API / Google Translate |
| 推送 | PushPlus |
| 数据源 | trumpstruth.org (Truth Social 归档) |
| 前端 | TailwindCSS + Vanilla JS |

## 📱 加入订阅群组

扫描下方二维码加入 PushPlus 订阅群组，实时接收特朗普帖文通知：

<p align="center">
  <img src="assets/qrcode.png" alt="群组二维码" width="300">
</p>

> 📧 联系方式：**传康KK** | 微信：**1837620622**

## 📄 License

MIT License © 2026