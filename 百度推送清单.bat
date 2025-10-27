@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo   百度推送 URL 生成器
echo ========================================
echo.
cd /d "%~dp0"
node get-today-urls.js
echo.
echo.
pause
