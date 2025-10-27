@echo off
chcp 65001 >nul
title 百度推送 URL 生成器
color 0A
cls

echo.
echo ========================================
echo   百度推送 URL 生成器
echo ========================================
echo.
echo 正在检查环境...
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"
echo 当前目录: %CD%
echo.

REM 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js！
    echo 请先安装 Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [成功] Node.js 已安装
node --version
echo.

REM 检查脚本文件是否存在
if not exist "get-today-urls.js" (
    echo [错误] 未找到 get-today-urls.js 文件！
    echo 请确保文件在当前目录下。
    echo.
    pause
    exit /b 1
)

echo [成功] 找到脚本文件
echo.
echo ========================================
echo   开始生成推送清单...
echo ========================================
echo.

REM 运行脚本
node get-today-urls.js

if %errorlevel% neq 0 (
    echo.
    echo [错误] 脚本执行失败！错误代码: %errorlevel%
    echo.
)

echo.
echo ========================================
echo   执行完成
echo ========================================
echo.
pause
