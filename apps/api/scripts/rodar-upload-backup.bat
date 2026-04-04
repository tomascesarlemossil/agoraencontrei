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

REM Verificar se o .env.backup-upload existe
if not exist ".env.backup-upload" (
    echo ERRO: Arquivo .env.backup-upload nao encontrado!
    echo Verifique se o arquivo existe na pasta apps\api
    pause
    exit /b 1
)

REM Carregar variaveis do .env.backup-upload
for /f "usebackq tokens=1,* delims==" %%A in (".env.backup-upload") do (
    if not "%%A"=="" (
        echo %%A | findstr /r "^#" > nul 2>&1
        if errorlevel 1 set "%%A=%%B"
    )
)

REM Verificar se a chave foi configurada
if "%SUPABASE_SERVICE_ROLE_KEY%"=="COLE_AQUI_A_CHAVE_SERVICE_ROLE" (
    echo.
    echo [ERRO] A SUPABASE_SERVICE_ROLE_KEY ainda nao foi configurada!
    echo.
    echo Abra o arquivo: apps\api\.env.backup-upload
    echo Substitua COLE_AQUI_A_CHAVE_SERVICE_ROLE pela chave copiada do Supabase
    echo.
    echo Como obter a chave:
    echo   1. Acesse: https://supabase.com/dashboard/project/oenbzvxcsgyzqjtlovdq/settings/api-keys/legacy
    echo   2. Clique em Copy ao lado de service_role
    echo   3. Cole no arquivo .env.backup-upload
    pause
    exit /b 1
)

echo [OK] SUPABASE_URL: %SUPABASE_URL%
echo [OK] BACKUP_PATH: %BACKUP_PATH%
echo.

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
