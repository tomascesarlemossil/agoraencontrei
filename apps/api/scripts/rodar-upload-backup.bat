@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM rodar-upload-backup.bat
REM Execute este arquivo na pasta apps\api para fazer o upload do backup
REM ─────────────────────────────────────────────────────────────────────────────

echo.
echo ============================================================
echo   UPLOAD BACKUP → SUPABASE STORAGE
echo ============================================================
echo.

REM Verificar se o .env existe
if not exist ".env" (
    echo ERRO: Arquivo .env nao encontrado!
    echo Copie o arquivo .env.backup-upload.example para .env
    echo e preencha a SUPABASE_SERVICE_ROLE_KEY
    pause
    exit /b 1
)

echo Opcoes de upload:
echo.
echo  1. Todas as pastas (upload completo)
echo  2. Somente ARQUIVO MORTO 2025
echo  3. Somente FINANCEIRO 2026
echo  4. Somente LOCACAO 2026
echo  5. Somente ADITIVO 2026
echo  6. Somente IPTU 2026
echo  7. Somente JURIDICO 2026
echo  8. Somente RESCISAO 2026
echo  9. Somente VISTORIAS DE IMOVEIS
echo  0. Dry-run (teste sem enviar arquivos)
echo.
set /p opcao="Escolha uma opcao (0-9): "

if "%opcao%"=="0" (
    echo Executando DRY-RUN (sem upload real)...
    npx tsx scripts/upload-documents-supabase.ts --dry-run
) else if "%opcao%"=="1" (
    echo Executando upload COMPLETO de todas as pastas...
    npx tsx scripts/upload-documents-supabase.ts
) else if "%opcao%"=="2" (
    echo Executando upload: ARQUIVO MORTO 2025...
    npx tsx scripts/upload-documents-supabase.ts --folder "ARQUIVO MORTO 2025"
) else if "%opcao%"=="3" (
    echo Executando upload: FINANCEIRO 2026...
    npx tsx scripts/upload-documents-supabase.ts --folder "FINANCEIRO 2026"
) else if "%opcao%"=="4" (
    echo Executando upload: LOCACAO 2026...
    npx tsx scripts/upload-documents-supabase.ts --folder "LOCACAO 2026"
) else if "%opcao%"=="5" (
    echo Executando upload: ADITIVO 2026...
    npx tsx scripts/upload-documents-supabase.ts --folder "ADITIVO 2026"
) else if "%opcao%"=="6" (
    echo Executando upload: IPTU 2026...
    npx tsx scripts/upload-documents-supabase.ts --folder "IPTU 2026"
) else if "%opcao%"=="7" (
    echo Executando upload: JURIDICO 2026...
    npx tsx scripts/upload-documents-supabase.ts --folder "JURIDICO 20256"
) else if "%opcao%"=="8" (
    echo Executando upload: RESCISAO 2026...
    npx tsx scripts/upload-documents-supabase.ts --folder "RESCISAO 2026"
) else if "%opcao%"=="9" (
    echo Executando upload: VISTORIAS DE IMOVEIS...
    npx tsx scripts/upload-documents-supabase.ts --folder "VISTORIAS DE IMOVEIS"
) else (
    echo Opcao invalida.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   UPLOAD CONCLUIDO
echo ============================================================
pause
