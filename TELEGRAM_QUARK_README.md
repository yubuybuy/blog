# Telegram 夸克网盘批量转存工具

基于 [QuarkPanTool](https://github.com/ihmily/QuarkPanTool) 的 Telegram 群组监听和自动转存系统。

## 功能特性

- 🤖 **Telegram Bot监听**: 自动监听群组中的网盘分享链接
- 📦 **多格式支持**: 支持夸克、百度、阿里、天翼等主流网盘
- 🔄 **批量转存**: 自动解析并转存到夸克网盘
- 🌐 **Web管理界面**: 可视化管理转存任务
- 📊 **实时监控**: 转存进度和状态实时查看
- 🔐 **安全认证**: 支持多用户权限管理

## 系统架构

```
Telegram群组 → Bot监听 → 链接解析 → 转存队列 → 夸克网盘
                                 ↓
                              Web界面 ← 任务管理 ← 用户认证
```

## 快速开始

### 1. 环境准备

```bash
# Python 3.11+
pip install -r requirements.txt
playwright install firefox

# Node.js 环境（Web界面）
npm install
```

### 2. 配置设置

```bash
# 复制配置模板
cp config/config.example.json config/config.json

# 编辑配置文件
{
  "telegram": {
    "bot_token": "你的Bot Token",
    "chat_ids": ["群组ID列表"]
  },
  "quark": {
    "auto_login": true,
    "headless": false
  }
}
```

### 3. 启动服务

```bash
# 启动Telegram监听服务
python telegram_listener.py

# 启动Web管理界面
npm run dev
```

## 使用说明

1. **添加Bot到群组**: 将Bot添加到你想监听的Telegram群组
2. **自动监听**: Bot会自动识别群组中的网盘分享链接
3. **Web管理**: 访问 http://localhost:3000 查看和管理转存任务
4. **批量转存**: 在Web界面中批量执行转存操作

## 注意事项

- 首次使用需要在浏览器中登录夸克网盘
- 建议使用夸克网盘VIP账号以获得更好的转存体验
- 请遵守相关服务的使用条款

## 技术栈

- **后端**: Python + AsyncIO + httpx + Playwright
- **前端**: Next.js + React + TypeScript
- **数据库**: SQLite / PostgreSQL
- **消息队列**: Redis (可选)

## License

MIT License