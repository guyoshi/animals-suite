$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

Write-Host "ANIMALS SUITE - GERAR CHAVES DO ATUALIZADOR" -ForegroundColor Cyan
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host 'ERRO: Node.js/npm não foi encontrado.' -ForegroundColor Red
  exit 1
}

$keyDirectory = Join-Path $env:USERPROFILE '.tauri'
$keyPath = Join-Path $keyDirectory 'animals-suite.key'
New-Item -ItemType Directory -Force -Path $keyDirectory | Out-Null

if (Test-Path $keyPath) {
  Write-Host "Já existe uma chave privada em: $keyPath" -ForegroundColor Yellow
  Write-Host 'Ela não será substituída. Guarde essa chave; perder ou trocar a chave quebra as atualizações das instalações antigas.' -ForegroundColor Yellow
  exit 0
}

npm ci
Write-Host "\nO Tauri pedirá uma senha opcional. Anote-a com segurança." -ForegroundColor Yellow
Write-Host "Ao terminar, copie a CHAVE PÚBLICA mostrada no terminal." -ForegroundColor Yellow
& npm run tauri signer generate -- -w $keyPath

Write-Host "\nChave privada criada em:" -ForegroundColor Green
Write-Host $keyPath -ForegroundColor White
Write-Host "\nNunca envie esse arquivo ao GitHub. Para copiar o conteúdo e cadastrar o Secret:" -ForegroundColor Cyan
Write-Host "Get-Content `"$keyPath`" -Raw | Set-Clipboard" -ForegroundColor White
