@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Instalar-Dependencias-e-Compilar.ps1"
if errorlevel 1 (
  echo.
  echo A compilacao nao foi concluida. Leia a mensagem acima.
  pause
)
