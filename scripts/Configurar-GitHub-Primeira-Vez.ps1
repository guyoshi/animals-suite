param(
  [string]$RepositoryUrl
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Fail([string]$Message) {
  Write-Host "`nERRO: $Message" -ForegroundColor Red
  exit 1
}

function Check-LastExitCode([string]$Message) {
  if ($LASTEXITCODE -ne 0) {
    Fail "$Message (código $LASTEXITCODE)."
  }
}

Write-Host "ANIMALS SUITE - CONFIGURAÇÃO INICIAL DO GITHUB" -ForegroundColor Cyan
Write-Host "Este assistente liga esta pasta a um repositório que você já criou no GitHub." -ForegroundColor Gray

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Fail 'Git não foi encontrado. Instale o Git for Windows e abra este arquivo novamente.'
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Fail 'Node.js/npm não foi encontrado. Instale o Node.js LTS e abra este arquivo novamente.'
}

if (-not $RepositoryUrl) {
  $RepositoryUrl = Read-Host 'Cole a URL HTTPS do repositório vazio (ex.: https://github.com/usuario/animals-suite.git)'
}
$RepositoryUrl = $RepositoryUrl.Trim()
if ($RepositoryUrl -notmatch '^https://github\.com/[^/]+/[^/]+(?:\.git)?$') {
  Fail 'A URL não parece ser um repositório HTTPS válido do GitHub.'
}

if (-not (Test-Path '.git')) {
  git init | Out-Host
  Check-LastExitCode 'Não foi possível iniciar o repositório Git'
}

git branch -M main | Out-Host
Check-LastExitCode 'Não foi possível definir a branch main'

# `git remote get-url origin` gera erro quando origin ainda não existe.
# Por isso, primeiro listamos os remotes sem provocar falha.
$remoteNames = @(git remote)
Check-LastExitCode 'Não foi possível consultar os remotes Git'
if ($remoteNames -contains 'origin') {
  git remote set-url origin $RepositoryUrl | Out-Host
  Check-LastExitCode 'Não foi possível atualizar o remote origin'
} else {
  git remote add origin $RepositoryUrl | Out-Host
  Check-LastExitCode 'Não foi possível criar o remote origin'
}

Write-Host "`nRepositório ligado a:" -ForegroundColor Green
Write-Host (git remote get-url origin) -ForegroundColor White
Check-LastExitCode 'Não foi possível confirmar o remote origin'

# Garante que o primeiro commit não falhe por falta de identidade local.
$gitName = (git config --get user.name)
$gitEmail = (git config --get user.email)
if (-not $gitName) {
  $gitName = Read-Host 'Digite o nome que aparecerá nos commits do GitHub'
  if (-not $gitName.Trim()) { Fail 'O nome do Git não pode ficar vazio.' }
  git config user.name $gitName.Trim()
  Check-LastExitCode 'Não foi possível salvar o nome do Git'
}
if (-not $gitEmail) {
  $gitEmail = Read-Host 'Digite o e-mail da sua conta do GitHub'
  if (-not $gitEmail.Trim()) { Fail 'O e-mail do Git não pode ficar vazio.' }
  git config user.email $gitEmail.Trim()
  Check-LastExitCode 'Não foi possível salvar o e-mail do Git'
}

Write-Host "`nInstalando dependências e validando a versão..." -ForegroundColor Yellow
npm ci
Check-LastExitCode 'A instalação das dependências falhou'
npm run validate:final
Check-LastExitCode 'A validação da Animals Suite falhou'

$changes = git status --porcelain
Check-LastExitCode 'Não foi possível verificar as alterações do Git'
if ($changes) {
  git add .
  Check-LastExitCode 'Não foi possível preparar os arquivos para commit'
  git commit -m "Animals Suite: versão inicial" | Out-Host
  Check-LastExitCode 'Não foi possível criar o primeiro commit'
} else {
  Write-Host 'Nenhuma alteração nova para commit.' -ForegroundColor DarkGray
}

Write-Host "`nEnviando a branch main. O Git pode abrir o navegador para você entrar na sua conta." -ForegroundColor Yellow
git push -u origin main | Out-Host
if ($LASTEXITCODE -ne 0) {
  Fail 'O envio ao GitHub falhou. Confirme se o repositório está vazio, se a URL está correta e se você autorizou o Git no navegador'
}

Write-Host "`nPasta ligada ao GitHub com sucesso." -ForegroundColor Green
Write-Host "Próximo passo: gere as chaves do atualizador e cadastre os Secrets conforme o guia GUIA_GITHUB_ATUALIZACOES_PASSO_A_PASSO.md." -ForegroundColor Cyan
