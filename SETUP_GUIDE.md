# 🚀 Telegram + 夸克网盘自动转存系统 - 完整操作指南

## 📋 准备工作

### 1. 创建Telegram Bot

#### 1.1 找到 BotFather
- 在Telegram中搜索 `@BotFather`
- 发送 `/start` 开始对话

#### 1.2 创建新Bot
```
发送: /newbot
输入: 你的Bot名称 (例如: 网盘转存助手)
输入: Bot用户名 (例如: netdisk_transfer_bot)
```

#### 1.3 获取Bot Token
- BotFather会返回一个Token，格式如: `1234567890:ABCdefGhIJKlmNoPQRsTuVwXyZ`
- **保存这个Token，稍后需要用到**

#### 1.4 将Bot添加到群组
- 找到你想监听的Telegram群组
- 添加你刚创建的Bot为管理员
- 记录群组ID（可以使用 @userinfobot 获取）

### 2. 环境准备

#### 2.1 Python环境
```bash
# 检查Python版本（需要3.8+）
python3 --version

# 如果没有Python，请安装：
# Windows: 从官网下载 https://python.org/downloads/
# macOS: brew install python3
# Ubuntu: sudo apt install python3 python3-pip
```

#### 2.2 Node.js环境
```bash
# 检查Node.js版本（需要16+）
node --version
npm --version

# 如果没有Node.js，请安装：
# 从官网下载 https://nodejs.org/
```

## 🔧 系统安装

### 步骤1: 克隆或下载代码
```bash
# 如果是Git项目
git clone [项目地址]
cd [项目目录]

# 或者直接在你的博客项目中使用已有文件
cd /c/Users/gao-huan/Desktop/netdisk-blog
```

### 步骤2: 安装Python依赖
```bash
# 安装Python包
pip install -r requirements.txt

# 安装Playwright浏览器
playwright install firefox
```

### 步骤3: 安装Node.js依赖
```bash
# 如果还没安装过
npm install

# 如果需要额外的包
npm install sqlite3
```

### 步骤4: 创建必要目录
```bash
mkdir -p data
mkdir -p logs
mkdir -p config
```

## ⚙️ 系统配置

### 步骤1: 配置Telegram Bot
```bash
# 复制配置模板
cp config/telegram_config.example.json config/telegram_config.json

# 编辑配置文件
nano config/telegram_config.json
# 或使用其他编辑器: code config/telegram_config.json
```

编辑内容：
```json
{
  "bot_token": "你的Bot Token",
  "chat_ids": [
    -1001234567890,
    -1001234567891
  ],
  "settings": {
    "auto_save": true,
    "send_confirmation": false,
    "max_links_per_message": 10,
    "excluded_keywords": ["广告", "推广"],
    "included_platforms": ["quark", "baidu", "aliyun", "tianyi", "123pan"]
  },
  "database": {
    "path": "data/netdisk_links.db",
    "backup_enabled": true,
    "backup_interval_hours": 24
  }
}
```

**重要参数说明：**
- `bot_token`: 从BotFather获取的Token
- `chat_ids`: 要监听的群组ID列表（负数）
- `included_platforms`: 要监听的网盘平台

### 步骤2: 获取群组ID
如果不知道群组ID，可以：

1. **方法一：临时运行获取**
```bash
# 创建临时脚本获取群组ID
python3 -c "
import asyncio
from telegram import Bot

async def get_updates():
    bot = Bot('你的Bot Token')
    updates = await bot.get_updates()
    for update in updates:
        if update.message and update.message.chat:
            print(f'群组: {update.message.chat.title}')
            print(f'ID: {update.message.chat.id}')

asyncio.run(get_updates())
"
```

2. **方法二：使用@userinfobot**
- 在群组中添加 @userinfobot
- 发送 `/start`，它会显示群组信息

## 🚀 启动系统

### 方法一：一键启动（推荐）
```bash
# 给脚本执行权限
chmod +x start_telegram_quark.sh

# 一键启动所有服务
./start_telegram_quark.sh
```

### 方法二：手动启动各个服务

#### 1. 启动Telegram监听器
```bash
# 前台运行（用于调试）
python3 scripts/telegram_listener.py

# 后台运行
nohup python3 scripts/telegram_listener.py > logs/telegram.log 2>&1 &
```

#### 2. 启动Web界面
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

#### 3. 首次夸克网盘登录
```bash
# 运行夸克转存管理器进行首次登录
python3 scripts/quark_transfer.py
```
- 会自动打开浏览器
- 手动登录夸克网盘
- 登录完成后按回车键
- 系统会保存cookies供后续使用

## 📱 使用系统

### 1. 访问Web管理界面
```
http://localhost:3000/telegram-quark
```

### 2. 功能说明

#### 📊 统计面板
- **总链接数**: 监听到的所有网盘链接
- **待转存**: 等待处理的链接数量
- **已完成**: 成功转存的链接
- **失败**: 转存失败的链接

#### 🔍 筛选功能
- **按状态筛选**: 全部/待转存/转存中/已完成/失败
- **按平台筛选**: 全部/夸克/百度/阿里云/天翼云/123云盘

#### 🚀 批量转存
- 点击"开始转存"按钮
- 系统会自动处理所有待转存的夸克链接
- 实时查看转存进度和结果

#### 📝 链接管理
- 查看链接详情（标题、密码、来源群组）
- 手动标记链接状态
- 重新尝试失败的链接

## 🔧 高级配置

### 1. 自定义监听规则
编辑 `config/telegram_config.json`:
```json
{
  "settings": {
    "excluded_keywords": ["广告", "推广", "垃圾"],
    "min_title_length": 5,
    "max_links_per_message": 20,
    "auto_extract_password": true
  }
}
```

### 2. 数据库配置
```json
{
  "database": {
    "path": "data/netdisk_links.db",
    "backup_enabled": true,
    "backup_interval_hours": 24,
    "cleanup_old_links_days": 30
  }
}
```

### 3. 夸克网盘设置
```json
{
  "quark": {
    "headless": true,
    "slow_mo": 1000,
    "max_retry_attempts": 3,
    "transfer_delay_seconds": 2
  }
}
```

## 🛠️ 故障排除

### 常见问题

#### 1. Telegram Bot无法接收消息
```bash
# 检查Bot Token是否正确
# 检查Bot是否被添加到群组
# 检查群组ID是否正确
```

#### 2. 夸克网盘登录失败
```bash
# 重新运行登录流程
python3 scripts/quark_transfer.py

# 清除旧的cookies
rm config/quark_cookies.json
```

#### 3. Web界面无法访问
```bash
# 检查Node.js服务是否启动
netstat -tulpn | grep :3000

# 重新启动服务
npm run dev
```

#### 4. Python依赖问题
```bash
# 升级pip
pip install --upgrade pip

# 重新安装依赖
pip install -r requirements.txt --force-reinstall
```

### 日志查看
```bash
# Telegram监听器日志
tail -f logs/telegram.log

# 夸克转存日志
tail -f logs/quark_transfer.log

# 系统日志
journalctl -f
```

## 📈 性能优化

### 1. 数据库优化
```sql
-- 定期清理旧数据
DELETE FROM netdisk_links WHERE created_at < datetime('now', '-30 days');

-- 重建索引
REINDEX;
```

### 2. 转存效率优化
- 使用夸克网盘VIP账号
- 设置合理的转存延迟
- 监控API调用频率

### 3. 系统监控
```bash
# 添加系统监控
pip install psutil

# 内存和CPU使用情况
python3 -c "
import psutil
print(f'CPU: {psutil.cpu_percent()}%')
print(f'内存: {psutil.virtual_memory().percent}%')
"
```

## 🔒 安全建议

1. **保护敏感信息**
   - 不要将Bot Token提交到Git
   - 使用环境变量存储敏感配置

2. **限制访问权限**
   - Web界面添加认证
   - 限制IP访问范围

3. **定期备份**
   - 备份数据库文件
   - 备份配置文件

## 📞 技术支持

如果遇到问题：
1. 查看日志文件确定错误原因
2. 检查配置文件格式是否正确
3. 确认所有依赖都已正确安装
4. 验证网络连接和API访问权限

---

🎉 **系统部署完成后，就可以实现全自动的Telegram群组网盘链接监听和批量转存功能！**