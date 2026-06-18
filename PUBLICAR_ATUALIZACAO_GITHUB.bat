@echo off
chcp 65001 >nul
cd /d "%~dp0"
set /p VERSION=Digite a nova versao (ex.: 1.0.1): 
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Publicar-Atualizacao-GitHub.ps1" -Version "%VERSION%"
echo.
pause
