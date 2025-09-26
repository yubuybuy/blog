@echo off
chcp 65001
title 网盘资源爬虫+批量转存系统

echo.
echo ==========================================
echo 🕷️  网盘资源爬虫 + 批量转存系统
echo ==========================================
echo.

cd /d "%~dp0"

echo 📍 当前目录: %cd%
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python未安装或未添加到PATH
    echo 💡 请先安装Python 3.8+
    pause
    exit /b 1
)

echo ✅ Python已安装
python --version

echo.
echo 🚀 启动网盘爬虫系统...
echo.

python scripts\quick_start.py

echo.
echo 👋 程序已退出
pause