param(
  [Parameter(Mandatory = $false)]
  [string]$Version
)

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Fail([string]$Message) {
  Write-Host "`nERRO: $Message" -ForegroundColor Red
  exit 1
}

function Invoke-NativeChecked {
  param(
    [Parameter(Mandatory = $true)][string]$Command,
    [Parameter(Mandatory = $false)][string[]]$Arguments = @(),
    [Parameter(Mandatory = $true)][string]$FailureMessage,
    [switch]$Capture
  )

  if ($Capture) {
    $output = @(& $Command @Arguments 2>&1)
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      $details = ($output -join [Environment]::NewLine).Trim()
      if ($details) { Fail "$FailureMessage`n$details" }
      Fail $FailureMessage
    }
    return ($output -join [Environment]::NewLine).Trim()
  }

  & $Command @Arguments
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) { Fail "$FailureMessage (código $exitCode)." }
}

Write-Host 'ANIMALS SUITE - PUBLICAR ATUALIZAÇÃO' -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Fail 'Git não encontrado.' }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { Fail 'Node.js/npm não encontrado.' }
if (-not (Test-Path '.git')) { Fail 'Esta pasta ainda não foi ligada ao GitHub. Execute CONFIGURAR_GITHUB_PRIMEIRA_VEZ.bat.' }
if (-not (Test-Path 'suite.manifest.json')) { Fail 'suite.manifest.json não foi encontrado na pasta principal.' }

$origin = Invoke-NativeChecked -Command 'git' -Arguments @('remote', 'get-url', 'origin') -FailureMessage 'O remote origin não está configurado. Execute CONFIGURAR_GITHUB_PRIMEIRA_VEZ.bat novamente.' -Capture
Write-Host "Repositório: $origin" -ForegroundColor DarkGray

if (-not $Version) { $Version = Read-Host 'Digite a nova versão (ex.: 1.0.2)' }
$Version = $Version.Trim()
if ($Version -notmatch '^\d+\.\d+\.\d+$') { Fail 'Use o formato X.Y.Z, por exemplo 1.0.2.' }

$manifestPath = Join-Path (Get-Location) 'suite.manifest.json'
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$current = [string]$manifest.version
$tag = "app-v$Version"

try {
  $requestedVersion = [version]$Version
  $currentVersion = [version]$current
  if ($requestedVersion -lt $currentVersion) {
    Fail "A versão solicitada ($Version) é inferior à versão atual do projeto ($current). Use $current ou uma versão superior."
  }
} catch {
  Fail "Não foi possível comparar a versão atual '$current' com '$Version'."
}

# Consulta segura: não usa rev-parse, portanto a ausência da tag não é um erro.
$existingTag = Invoke-NativeChecked -Command 'git' -Arguments @('tag', '--list', $tag) -FailureMessage 'Não foi possível consultar as tags locais.' -Capture
if ($existingTag -eq $tag) { Fail "A tag $tag já existe localmente." }

$remoteTag = Invoke-NativeChecked -Command 'git' -Arguments @('ls-remote', '--tags', 'origin', "refs/tags/$tag") -FailureMessage 'Não foi possível consultar as tags do GitHub. Verifique a internet e a autenticação.' -Capture
if ($remoteTag) { Fail "A tag $tag já existe no GitHub." }

if ($current -ne $Version) {
  $manifest.version = $Version
  $manifest.releaseDate = (Get-Date).ToString('yyyy-MM-dd')
  $manifest.contentVersion = "$(Get-Date -Format 'yyyy.MM.dd')-$Version"
  $manifest | ConvertTo-Json -Depth 20 | Set-Content $manifestPath -Encoding utf8
} else {
  Write-Host "Publicando a versão atual $Version pela primeira vez." -ForegroundColor DarkGray
}

Write-Host "`nSincronizando versões, instalando dependências e validando..." -ForegroundColor Yellow
Invoke-NativeChecked -Command 'npm' -Arguments @('ci') -FailureMessage 'A instalação das dependências falhou.'
Invoke-NativeChecked -Command 'npm' -Arguments @('run', 'validate:final') -FailureMessage 'A validação da Animals Suite falhou.'

$branch = Invoke-NativeChecked -Command 'git' -Arguments @('branch', '--show-current') -FailureMessage 'Não foi possível identificar a branch atual.' -Capture
if (-not $branch) {
  $branch = 'main'
  Invoke-NativeChecked -Command 'git' -Arguments @('branch', '-M', 'main') -FailureMessage 'Não foi possível definir a branch main.'
}

Write-Host "`nResumo do que será enviado:" -ForegroundColor Yellow
Invoke-NativeChecked -Command 'git' -Arguments @('status', '--short') -FailureMessage 'Não foi possível consultar o status do Git.'
$confirm = Read-Host "Publicar Animals Suite v$Version no GitHub? (S/N)"
if ($confirm.ToUpperInvariant() -ne 'S') {
  Fail 'Publicação cancelada. Se a versão do manifesto foi alterada, execute novamente quando estiver pronto ou reverta a alteração.'
}

$changes = Invoke-NativeChecked -Command 'git' -Arguments @('status', '--porcelain') -FailureMessage 'Não foi possível verificar as alterações do Git.' -Capture
if ($changes) {
  Invoke-NativeChecked -Command 'git' -Arguments @('add', '.') -FailureMessage 'Não foi possível preparar os arquivos para commit.'
  Invoke-NativeChecked -Command 'git' -Arguments @('commit', '-m', "Release Animals Suite v$Version") -FailureMessage 'Não foi possível criar o commit da versão.'
} else {
  Write-Host 'Nenhuma alteração de código para commit; será criada apenas a tag da versão atual.' -ForegroundColor DarkGray
}

Invoke-NativeChecked -Command 'git' -Arguments @('push', 'origin', $branch) -FailureMessage 'Não foi possível enviar a branch ao GitHub.'
Invoke-NativeChecked -Command 'git' -Arguments @('tag', '-a', $tag, '-m', "Animals Suite v$Version") -FailureMessage 'Não foi possível criar a tag da versão.'
Invoke-NativeChecked -Command 'git' -Arguments @('push', 'origin', $tag) -FailureMessage 'Não foi possível enviar a tag ao GitHub.'

Write-Host "`nAtualização enviada." -ForegroundColor Green
Write-Host 'O GitHub Actions agora compilará o instalador, criará a Release e publicará latest.json.' -ForegroundColor Cyan
Write-Host 'Acompanhe em: repositório > Actions > Publicar Animals Suite.' -ForegroundColor Gray
