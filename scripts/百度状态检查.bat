@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo   百度 SEO 状态检查
echo ========================================
echo.
cd /d "%~dp0"
node check-baidu-status.js
echo.
echo.
pause
