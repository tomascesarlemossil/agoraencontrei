@echo off
REM ============================================================
REM  upload-documentos.bat
REM  Script de upload de documentos para o Supabase Storage
REM  Imobiliaria Lemos - Sistema LemosBank
REM ============================================================
REM
REM  Como usar:
REM    1. Execute este arquivo como Administrador (clique direito -> Executar como administrador)
REM    2. Ou abra o Prompt de Comando (cmd) como Administrador e navegue ate:
REM       C:\Users\User\Desktop\agoraencontrei\apps\api
REM       Depois execute: scripts\upload-documentos.bat
REM
REM  Opcoes:
REM    --dry-run    : Simula o upload sem enviar nenhum arquivo
REM    --folder     : Filtra por nome de pasta (ex: "ARQUIVO MORTO")
REM    --year       : Filtra por ano (ex: 2025)
REM
REM  Exemplos:
REM    scripts\upload-documentos.bat --dry-run
REM    scripts\upload-documentos.bat --folder "ARQUIVO MORTO" --dry-run
REM    scripts\upload-documentos.bat --year 2025 --dry-run
REM    scripts\upload-documentos.bat
REM ============================================================

setlocal enabledelayedexpansion

REM Navegar para o diretorio correto
cd /d "%~dp0.."

echo ============================================================
echo   UPLOAD DOCUMENTOS - Imobiliaria Lemos
echo ============================================================
echo.

REM Verificar se o arquivo .env existe
if not exist ".env" (
    echo [ERRO] Arquivo .env nao encontrado!
    echo.
    echo Crie o arquivo apps\api\.env com o seguinte conteudo:
    echo.
    echo   SUPABASE_URL=https://oenbzvxcsgyzqjtlovdq.supabase.co
    echo   SUPABASE_SERVICE_ROLE_KEY=eyJ...
    echo   DATABASE_URL=postgresql://...
    echo   BACKUP_PATH=Y:\a lemos 2024
    echo.
    pause
    exit /b 1
)

REM Verificar se o tsx esta disponivel
if not exist "node_modules\.bin\tsx.cmd" (
    echo [ERRO] tsx nao encontrado! Execute primeiro:
    echo   pnpm install
    echo.
    pause
    exit /b 1
)

REM Verificar se o script existe
if not exist "scripts\upload-documents-supabase.ts" (
    echo [ERRO] Script de upload nao encontrado!
    echo   Esperado em: scripts\upload-documents-supabase.ts
    echo.
    pause
    exit /b 1
)

echo [OK] Ambiente verificado. Iniciando upload...
echo.

REM Executar o script com os argumentos passados
node_modules\.bin\tsx.cmd scripts\upload-documents-supabase.ts %*

echo.
echo ============================================================
echo   Upload concluido!
echo ============================================================
echo.
pause
