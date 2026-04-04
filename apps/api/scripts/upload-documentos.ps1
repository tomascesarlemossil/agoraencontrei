# ============================================================
# upload-documentos.ps1
# Script de upload de documentos para o Supabase Storage
# Imobiliaria Lemos - Sistema LemosBank
# ============================================================
#
# Como usar (PowerShell como Administrador):
#   cd C:\Users\User\Desktop\agoraencontrei\apps\api
#   .\scripts\upload-documentos.ps1
#   .\scripts\upload-documentos.ps1 --dry-run
#   .\scripts\upload-documentos.ps1 --folder "ARQUIVO MORTO" --dry-run
#   .\scripts\upload-documentos.ps1 --year 2025
#
# Se aparecer erro de politica de execucao, execute antes:
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# ============================================================

param(
    [switch]$DryRun,
    [string]$Folder = "",
    [string]$Year = ""
)

# Navegar para o diretorio correto
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiDir = Split-Path -Parent $scriptDir
Set-Location $apiDir

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  UPLOAD DOCUMENTOS - Imobiliaria Lemos" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar .env
if (-not (Test-Path ".env")) {
    Write-Host "[ERRO] Arquivo .env nao encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Crie o arquivo apps\api\.env com o seguinte conteudo:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  SUPABASE_URL=https://oenbzvxcsgyzqjtlovdq.supabase.co" -ForegroundColor White
    Write-Host "  SUPABASE_SERVICE_ROLE_KEY=eyJ..." -ForegroundColor White
    Write-Host "  DATABASE_URL=postgresql://..." -ForegroundColor White
    Write-Host "  BACKUP_PATH=Y:\a lemos 2024" -ForegroundColor White
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Verificar tsx
$tsxPath = "node_modules\.bin\tsx.cmd"
if (-not (Test-Path $tsxPath)) {
    Write-Host "[ERRO] tsx nao encontrado! Execute primeiro: pnpm install" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Montar argumentos
$args = @()
if ($DryRun) { $args += "--dry-run" }
if ($Folder -ne "") { $args += "--folder"; $args += $Folder }
if ($Year -ne "") { $args += "--year"; $args += $Year }

Write-Host "[OK] Ambiente verificado. Iniciando upload..." -ForegroundColor Green
Write-Host ""

# Executar
& $tsxPath scripts\upload-documents-supabase.ts @args

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Upload concluido!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione Enter para sair"
