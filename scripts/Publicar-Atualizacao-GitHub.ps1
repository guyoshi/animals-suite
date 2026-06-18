param(
  [Parameter(Mandatory=$false)]
  [string]$Version
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Fail([string]$Message) {
  Write-Host "\nERRO: $Message" -ForegroundColor Red
  exit 1
}

Write-Host "ANIMALS SUITE - PUBLICAR ATUALIZAÇÃO" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail 'Git não encontrado.' }
if (-not (Test-Path '.git')) { Fail 'Esta pasta ainda não foi ligada ao GitHub. Execute CONFIGURAR_GITHUB_PRIMEIRA_VEZ.bat.' }
if (-not $Version) { $Version = Read-Host 'Digite a nova versão (ex.: 1.0.1)' }
if ($Version -notmatch '^\d+\.\d+\.\d+$') { Fail 'Use o formato X.Y.Z, por exemplo 1.0.1.' }

$manifestPath = Join-Path (Get-Location) 'suite.manifest.json'
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$current = [string]$manifest.version
$tag = "app-v$Version"
git rev-parse $tag 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) { Fail "A tag $tag já existe." }

if ($current -ne $Version) {
  $manifest.version = $Version
  $manifest.releaseDate = (Get-Date).ToString('yyyy-MM-dd')
  $manifest.contentVersion = "$(Get-Date -Format 'yyyy.MM.dd')-$Version"
  $manifest | ConvertTo-Json -Depth 20 | Set-Content $manifestPath -Encoding utf8
} else {
  Write-Host "Publicando a versão atual $Version pela primeira vez." -ForegroundColor DarkGray
}

Write-Host "\nSincronizando versões, instalando dependências e validando..." -ForegroundColor Yellow
npm ci
npm run validate:final

$branch = (git branch --show-current).Trim()
if (-not $branch) { $branch = 'main'; git branch -M main | Out-Host }

Write-Host "\nResumo do que será enviado:" -ForegroundColor Yellow
git status --short | Out-Host
$confirm = Read-Host "Publicar Animals Suite v$Version no GitHub? (S/N)"
if ($confirm.ToUpperInvariant() -ne 'S') { Fail 'Publicação cancelada. A versão do manifesto foi alterada localmente; reverta-a ou execute novamente quando estiver pronto.' }

$changes = git status --porcelain
if ($changes) {
  git add .
  git commit -m "Release Animals Suite v$Version" | Out-Host
} else {
  Write-Host 'Nenhuma alteração de código para commit; será criada apenas a tag da versão atual.' -ForegroundColor DarkGray
}
git push origin $branch | Out-Host
git tag -a $tag -m "Animals Suite v$Version"
git push origin $tag | Out-Host

Write-Host "\nAtualização enviada." -ForegroundColor Green
Write-Host "O GitHub Actions agora compilará o instalador, criará a Release e publicará latest.json." -ForegroundColor Cyan
Write-Host "Acompanhe em: repositório > Actions > Publicar Animals Suite." -ForegroundColor Gray
