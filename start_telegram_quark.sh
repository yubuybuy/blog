#!/bin/bash
# Telegram 夸克网盘转存系统启动脚本

echo "🚀 启动 Telegram 夸克网盘转存系统..."

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装"
    exit 1
fi

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

# 创建数据目录
mkdir -p data
mkdir -p config

# 检查配置文件
if [ ! -f "config/telegram_config.json" ]; then
    echo "⚠️  配置文件不存在，请先配置 config/telegram_config.json"
    cp config/telegram_config.example.json config/telegram_config.json
    echo "已创建配置模板，请编辑后重新运行"
    exit 1
fi

# 安装Python依赖
echo "📦 安装Python依赖..."
pip install -r requirements.txt

# 安装Playwright浏览器
echo "🌐 安装Playwright浏览器..."
playwright install firefox

# 安装Node.js依赖
echo "📦 安装Node.js依赖..."
npm install

# 启动服务
echo "🎉 启动服务..."

# 后台启动Telegram监听器
echo "启动Telegram监听器..."
nohup python3 scripts/telegram_listener.py > logs/telegram.log 2>&1 &
TELEGRAM_PID=$!

# 启动Web界面
echo "启动Web管理界面..."
npm run dev &
WEB_PID=$!

echo "✅ 系统启动完成！"
echo "📱 Telegram监听器 PID: $TELEGRAM_PID"
echo "🌐 Web界面 PID: $WEB_PID"
echo "🔗 Web界面地址: http://localhost:3000/telegram-quark"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断信号
trap "echo '停止服务...'; kill $TELEGRAM_PID $WEB_PID; exit" INT

# 保持脚本运行
wait