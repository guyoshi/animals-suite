@echo off
chcp 65001 >nul
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado. Execute COMPILAR_INSTALADOR.bat primeiro.
  pause
  exit /b 1
)
if not exist node_modules call npm install
start "Animals Suite Preview" cmd /k "npm run dev -- --host 127.0.0.1"
timeout /t 3 >nul
start http://127.0.0.1:5173/?mode=planner
