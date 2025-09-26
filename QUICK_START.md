# 🚀 快速开始 - Telegram + 夸克网盘自动转存系统

## 📋 预检清单

在开始之前，确保你有：
- ✅ Python 3.8+ 和 Node.js 16+
- ✅ 一个Telegram账号
- ✅ 一个夸克网盘账号
- ✅ 需要监听的Telegram群组的管理权限

## ⚡ 5分钟快速部署

### 第1步：创建Telegram Bot
1. 在Telegram中找到 `@BotFather`
2. 发送 `/newbot` 并按提示创建Bot
3. 保存返回的Bot Token：`1234567890:ABCdefGhIJKlmNoPQRsTuVwXyZ`
4. 将Bot添加到你的群组并设为管理员

### 第2步：获取群组ID
发送以下命令获取群组ID：
```bash
python3 -c "
import asyncio
from telegram import Bot

async def get_id():
    bot = Bot('你的Bot Token')
    updates = await bot.get_updates()
    for update in updates[-5:]:
        if update.message:
            chat = update.message.chat
            print(f'群组: {chat.title} | ID: {chat.id}')

asyncio.run(get_id())
"
```

### 第3步：配置系统
```bash
# 复制配置模板
cp config/telegram_config.example.json config/telegram_config.json

# 编辑配置（使用你的Bot Token和群组ID）
nano config/telegram_config.json
```

配置内容：
```json
{
  "bot_token": "你的Bot Token",
  "chat_ids": [-1001234567890],
  "settings": {
    "auto_save": true,
    "included_platforms": ["quark", "baidu", "aliyun"]
  }
}
```

### 第4步：安装依赖
```bash
# 验证配置
npm run validate:config

# 安装Python依赖
pip install -r requirements.txt
playwright install firefox

# 安装Node.js依赖
npm install
```

### 第5步：首次登录夸克网盘
```bash
# 运行夸克登录（会打开浏览器）
npm run quark:transfer
```
在打开的浏览器中登录你的夸克网盘账号，登录完成后按回车。

### 第6步：启动系统
```bash
# 一键启动所有服务
npm run system:all

# 或者分别启动
npm run telegram:start  # 启动Telegram监听器
npm run dev             # 启动Web管理界面
```

## 📱 使用系统

### Web管理界面
访问 http://localhost:3000/telegram-quark 查看：
- 📊 实时统计面板
- 📋 链接管理列表
- 🚀 批量转存控制
- 📈 系统状态监控

### 基本操作
1. **查看统计**：实时查看监听到的链接数量和转存状态
2. **筛选链接**：按平台、状态筛选链接
3. **批量转存**：点击"开始转存"批量处理待转存链接
4. **手动管理**：标记链接状态、重试失败链接

## 🛠️ 常用命令

```bash
# 系统管理
npm run telegram:monitor    # 健康检查
npm run telegram:cleanup    # 清理旧数据
npm run test:system        # 系统测试
npm run optimize:all       # 系统优化
npm run maintenance        # 定期维护

# 单独控制
npm run telegram:start     # 只启动Telegram监听
npm run quark:transfer     # 只运行转存
```

## 🔧 故障排除

### 常见问题

#### Bot无法接收消息
```bash
# 检查配置
npm run validate:config

# 检查Bot权限
# 确保Bot在群组中有管理员权限
```

#### 夸克登录失败
```bash
# 重新登录
rm config/quark_cookies.json
npm run quark:transfer
```

#### Web界面无法访问
```bash
# 检查端口
netstat -tulpn | grep :3000

# 重启服务
npm run dev
```

## 📊 监控和维护

### 日常监控
- 查看Web界面统计信息
- 定期运行 `npm run telegram:monitor`
- 检查日志文件：`tail -f logs/telegram.log`

### 定期维护
建议每周运行一次：
```bash
npm run maintenance
```

这会自动：
- 优化数据库性能
- 清理旧日志文件
- 运行系统健康检查
- 清理临时文件

### 性能优化
如果系统运行缓慢：
```bash
# 数据库优化
npm run optimize:database

# 完整系统优化
npm run optimize:all
```

## 🚨 重要提醒

1. **定期备份**：数据库文件位于 `data/netdisk_links.db`
2. **安全配置**：不要将Bot Token提交到Git
3. **资源监控**：关注系统CPU和内存使用情况
4. **日志检查**：出现问题时首先查看 `logs/` 目录下的日志

## 📈 高级功能

### 自定义监听规则
编辑 `config/telegram_config.json`：
```json
{
  "settings": {
    "excluded_keywords": ["广告", "推广"],
    "min_title_length": 5,
    "max_links_per_message": 10,
    "auto_extract_password": true
  }
}
```

### 批量处理配置
编辑 `config/performance_config.json`：
```json
{
  "transfer": {
    "concurrent_transfers": 3,
    "retry_attempts": 3,
    "batch_delay_seconds": 2
  }
}
```

---

🎉 **系统现已准备就绪！发送包含网盘链接的消息到监听的群组，系统将自动检测并提供转存功能。**

如需技术支持，请查看详细的 `SETUP_GUIDE.md` 或运行 `npm run test:system` 诊断问题。