# 特朗普推特监控器

这个程序会监控特朗普的推特账号，当有新推文发布时，自动通过 PushPlus 推送到微信。

## 功能特点

- 通过 RSS 源实时监控特朗普的推特账号
- 自动将新推文推送到微信（通过 PushPlus）
- 支持群组推送，一次发送多人接收
- 包含推文时间、内容和链接
- 每5分钟检查一次更新
- 错误自动重试机制

## 安装步骤

1. 克隆项目到本地
2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

3. 配置环境变量：
   - 复制 `.env.example` 为 `.env`
   - 填写 PushPlus 相关的配置信息

## 配置说明

### PushPlus 配置
1. 访问 [PushPlus 官网](https://www.pushplus.plus/) 并关注微信公众号
2. 获取你的用户 Token
3. 创建群组并获取群组编码（可选，用于一对多推送）
4. 将信息填入 `.env` 文件：
   ```
   PUSHPLUS_TOKEN=your_token
   PUSHPLUS_TOPIC=your_topic_code
   ```

## 本地运行

```bash
python trump_tweet_monitor.py
```

## Zeabur 部署

1. Fork 本仓库到你的 GitHub 账号
2. 登录 [Zeabur](https://zeabur.com/)
3. 创建新项目，选择从 GitHub 导入
4. 选择本仓库
5. 在环境变量中配置：
   - `PUSHPLUS_TOKEN`: 你的 PushPlus Token
   - `PUSHPLUS_TOPIC`: 群组编码
6. 部署完成后服务会自动运行

## 注意事项

- 程序使用 nitter 提供的 RSS 源来获取推文
- 请确保 PushPlus 配置正确
- 程序需要持续运行才能保持监控
- Zeabur 部署后会自动保持运行 