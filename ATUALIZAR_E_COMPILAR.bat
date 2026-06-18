@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo  Animals Suite 0.11.0 ^| Atualizar e compilar
 echo ============================================================
echo.
where npm >nul 2>nul
if errorlevel 1 goto :FULL
where cargo >nul 2>nul
if errorlevel 1 goto :FULL

if not exist Logs-Instalacao mkdir Logs-Instalacao
for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set d=%%d-%%b-%%c
set log=Logs-Instalacao\atualizacao_%RANDOM%.log

echo Instalando dependencias fixadas...
call npm ci --no-audit --no-fund >> "%log%" 2>&1
if errorlevel 1 goto :ERROR

echo Validando interface...
call npm run lint >> "%log%" 2>&1
if errorlevel 1 goto :ERROR
call npm run build >> "%log%" 2>&1
if errorlevel 1 goto :ERROR

echo Compilando instalador. A primeira compilacao pode demorar...
call npm run tauri:build >> "%log%" 2>&1
if errorlevel 1 goto :ERROR

if not exist Instalador mkdir Instalador
for /f "delims=" %%F in ('dir /b /a-d /o-d "src-tauri\target\release\bundle\nsis\*-setup.exe" 2^>nul') do (
  copy /y "src-tauri\target\release\bundle\nsis\%%F" "Instalador\Animals-Suite-Setup-0.11.0.exe" >nul
  goto :DONE
)
echo A compilacao terminou, mas o instalador nao foi encontrado.>> "%log%"
goto :ERROR

:FULL
echo As ferramentas de compilacao ainda nao estao disponiveis neste terminal.
echo Abrindo o instalador completo de dependencias...
call COMPILAR_INSTALADOR.bat
exit /b

:ERROR
echo.
echo A atualizacao nao foi concluida.
echo Log: %cd%\%log%
echo Envie esse arquivo para analise.
pause
exit /b 1

:DONE
echo.
echo CONCLUIDO.
echo Execute: Instalador\Animals-Suite-Setup-0.11.0.exe
start "" explorer.exe "%cd%\Instalador"
pause
