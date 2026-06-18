@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo  Animals - Planejador ^| Correcao e teste do npm
echo ============================================================
echo.
echo Registro configurado:
call npm config get registry
echo.
echo Testando acesso ao registro publico...
call npm ping --registry=https://registry.npmjs.org/
if errorlevel 1 (
  echo.
  echo O npm nao conseguiu acessar o registro publico.
  echo Verifique internet, antivirus, proxy ou firewall.
  pause
  exit /b 1
)
echo.
echo Removendo instalacao incompleta anterior...
if exist node_modules rmdir /s /q node_modules
if exist node_modules\.package-lock.json del /f /q node_modules\.package-lock.json

echo Instalando pelas versoes fixadas no package-lock corrigido...
call npm ci --registry=https://registry.npmjs.org/ --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo A instalacao ainda falhou. Envie o texto completo mostrado acima.
  pause
  exit /b 1
)
echo.
echo NPM corrigido e dependencias instaladas.
pause
