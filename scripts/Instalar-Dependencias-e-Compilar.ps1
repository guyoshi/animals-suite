$ErrorActionPreference = 'Stop'
$Host.UI.RawUI.WindowTitle = 'Animals Suite 0.11.0 | Preparação e compilação'

function Title($text) {
  Write-Host "`n============================================================" -ForegroundColor DarkGreen
  Write-Host " $text" -ForegroundColor Green
  Write-Host "============================================================" -ForegroundColor DarkGreen
}

function Has-Command($name) { return [bool](Get-Command $name -ErrorAction SilentlyContinue) }

function Install-WingetPackage($id, $extra = @()) {
  Write-Host "Verificando $id..." -ForegroundColor Cyan
  $installed = winget list --id $id --exact --accept-source-agreements 2>$null | Select-String -SimpleMatch $id
  if ($installed) { Write-Host "Já instalado: $id" -ForegroundColor DarkGreen; return }
  $args = @('install','--id',$id,'--exact','--accept-package-agreements','--accept-source-agreements') + $extra
  & winget @args
  if ($LASTEXITCODE -ne 0) { throw "Falha ao instalar $id (código $LASTEXITCODE)." }
}

function Run-NativeLogged($label, $command, $arguments, $logFile) {
  Write-Host "`n$label" -ForegroundColor Cyan
  Write-Host "> $command $($arguments -join ' ')" -ForegroundColor DarkGray
  & $command @arguments 2>&1 | Tee-Object -FilePath $logFile -Append
  $code = $LASTEXITCODE
  if ($code -ne 0) {
    Write-Host "`nFalha em: $label (código $code)" -ForegroundColor Red
    Write-Host "Log completo: $logFile" -ForegroundColor Yellow
    throw "$label falhou."
  }
}

Title 'Animals Suite 0.11.0'
Write-Host 'Este processo prepara o Windows e gera o instalador de atualização .exe.'
Write-Host 'O identificador do aplicativo foi mantido: os dados da versão anterior não são apagados.'

if (-not (Has-Command 'winget')) {
  Write-Host 'O WinGet não foi encontrado.' -ForegroundColor Red
  Write-Host 'Abra a Microsoft Store, atualize "Instalador de Aplicativo" e execute este arquivo novamente.'
  Read-Host 'Pressione Enter para fechar'
  exit 1
}

Title '1/5 - Dependências do Windows'
Install-WingetPackage 'OpenJS.NodeJS.LTS'
Install-WingetPackage 'Rustlang.Rustup'
Install-WingetPackage 'Microsoft.EdgeWebView2Runtime'
Install-WingetPackage 'Microsoft.VisualStudio.2022.BuildTools' @(
  '--override',
  '--wait --passive --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended'
)

$machinePath = [Environment]::GetEnvironmentVariable('Path','Machine')
$userPath = [Environment]::GetEnvironmentVariable('Path','User')
$env:Path = "$machinePath;$userPath;$env:USERPROFILE\.cargo\bin"

Title '2/5 - Rust MSVC'
if (-not (Has-Command 'rustup')) { throw 'Rustup não apareceu no PATH. Reinicie o Windows e execute novamente.' }
rustup default stable-msvc
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível selecionar a toolchain stable-msvc.' }
rustup update stable-msvc
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível atualizar a toolchain stable-msvc.' }

Title '3/5 - Dependências do projeto'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if (-not (Has-Command 'node')) { throw 'Node.js não apareceu no PATH. Reinicie o Windows e execute novamente.' }

$logDir = Join-Path $root 'Logs-Instalacao'
New-Item -ItemType Directory -Path $logDir -Force | Out-Null
$stamp = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$logFile = Join-Path $logDir "compilacao_$stamp.log"
"Animals Suite 0.11.0 | Log de compilação | $stamp" | Set-Content -Path $logFile -Encoding UTF8

Write-Host "Node: $(node --version)"
Write-Host "NPM:  $(npm --version)"
Write-Host "Rust: $(rustc --version)"
Write-Host "Cargo: $(cargo --version)"
Write-Host "Registro npm: $(npm config get registry)"

$lockPath = Join-Path $root 'package-lock.json'
if (Test-Path $lockPath) {
  $lockText = Get-Content -Path $lockPath -Raw
  if ($lockText -match 'applied-caas-gateway1\.internal\.api\.openai\.org') {
    throw 'O package-lock.json aponta para um servidor interno. Use o pacote 0.11.0 completo.'
  }
}

Run-NativeLogged 'Instalação das dependências npm' 'npm' @('ci','--no-audit','--no-fund') $logFile

Title '4/5 - Validação da interface'
Run-NativeLogged 'Lint' 'npm' @('run','lint') $logFile
Run-NativeLogged 'Compilação da interface' 'npm' @('run','build') $logFile

Title '5/5 - Compilação do instalador Tauri'
Run-NativeLogged 'Compilação Tauri' 'npm' @('run','tauri:build') $logFile

$bundle = Join-Path $root 'src-tauri\target\release\bundle\nsis'
$installer = Get-ChildItem -Path $bundle -Filter '*-setup.exe' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $installer) { throw "A compilação terminou, mas nenhum instalador foi encontrado em $bundle" }

$outDir = Join-Path $root 'Instalador'
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$outFile = Join-Path $outDir 'Animals-Suite-Setup-0.11.0.exe'
Copy-Item $installer.FullName $outFile -Force

Title 'Concluído'
Write-Host 'Instalador criado em:' -ForegroundColor Green
Write-Host $outFile -ForegroundColor White
Write-Host 'Execute o instalador por cima da versão anterior. O projeto será migrado ao primeiro início.' -ForegroundColor Cyan
Write-Host "Log da compilação: $logFile" -ForegroundColor DarkGray
Start-Process explorer.exe $outDir
Read-Host 'Pressione Enter para fechar'
