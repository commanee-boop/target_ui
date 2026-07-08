@echo off
cd /d "%~dp0"
start "target_ui live server" /min node dev-server.js
timeout /t 1 /nobreak > nul
start http://127.0.0.1:5173/
