@echo off
chcp 65001 >nul
title ERP Açaiteria - Modo Produção
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================
echo   ERP Açaiteria - Modo Produção
echo ========================================
echo.

REM ------------------------------------------------------------
REM  1) Verificar build e dependencias
REM ------------------------------------------------------------
echo [1/4] Verificando instalacao...
where node >nul 2>&1
if errorlevel 1 (
    echo       ERRO: Node.js nao encontrado.
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo       ERRO: Dependencias nao encontradas. Execute install.bat
    pause
    exit /b 1
)
if not exist ".next" (
    echo       Build nao encontrado. Sera executado o build agora.
    call npm run build
    if errorlevel 1 (
        echo       ERRO: Falha no build.
        pause
        exit /b 1
    )
)
echo       OK

REM ------------------------------------------------------------
REM  2) PostgreSQL
REM ------------------------------------------------------------
echo.
echo [2/4] Iniciando PostgreSQL...
if exist "C:\xampp\xampp_start.exe" (
    start "" /min "C:\xampp\xampp_start.exe"
    echo       OK - XAMPP iniciado
) else if exist "C:\xampp\pgsql\bin\pg_ctl.exe" (
    if exist "C:\xampp\pgsql\data" (
        start "" /min cmd /c ""C:\xampp\pgsql\bin\pg_ctl.exe" -D "C:\xampp\pgsql\data" -l "C:\xampp\pgsql\data\logfile.log" start"
        echo       OK - PostgreSQL iniciado
    )
) else (
    sc query postgresql-x64-16 >nul 2>&1
    if not errorlevel 1 (
        net start postgresql-x64-16 >nul 2>&1
        echo       OK - Servico PostgreSQL 16 iniciado
    ) else (
        sc query postgresql-x64-15 >nul 2>&1
        if not errorlevel 1 (
            net start postgresql-x64-15 >nul 2>&1
            echo       OK - Servico PostgreSQL 15 iniciado
        ) else (
            echo       Aviso: XAMPP/PostgreSQL nao encontrado.
            echo       Certifique-se de que o PostgreSQL esta rodando.
        )
    )
)
timeout /t 4 /nobreak >nul

REM ------------------------------------------------------------
REM  3) Aplicar migrações pendentes
REM ------------------------------------------------------------
echo.
echo [3/4] Aplicando migracoes pendentes...
call npx prisma migrate deploy >nul 2>&1
if errorlevel 1 (
    echo       ATENCAO: Migracoes podem ter falhado (verifique conexao com o banco)
) else (
    echo       OK - Migracoes aplicadas
)

REM ------------------------------------------------------------
REM  4) Iniciar Next.js Produção + Cloudflare Tunnel
REM ------------------------------------------------------------
echo.
echo [4/4] Iniciando Next.js Producao (http://localhost:3000)...
start "Next.js - ERP Açaiteria" cmd /k "cd /d ""%~dp0"" && npm start"

timeout /t 10 /nobreak >nul

REM Cloudflare Tunnel
set CLOUDFLARE_TUNNEL_ID=
if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if "%%a"=="CLOUDFLARE_TUNNEL_ID" set "CLOUDFLARE_TUNNEL_ID=%%b"
    )
)

if not "%CLOUDFLARE_TUNNEL_ID%"=="" (
    where cloudflared >nul 2>&1
    if not errorlevel 1 (
        echo       Iniciando Cloudflare Tunnel...
        start "Cloudflare Tunnel" cmd /k "cloudflared tunnel run %CLOUDFLARE_TUNNEL_ID%"
        echo       OK - Tunnel rodando (ID: %CLOUDFLARE_TUNNEL_ID%)
    )
)

echo.
echo ========================================
echo   Sistema Online!
echo ========================================
echo.
echo   Aplicacao local: http://localhost:3000
echo.
echo   Para abrir automaticamente no navegador...
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000"

echo ========================================
echo   Mantenha as janelas abertas.
echo   Para parar use: stop.bat
echo ========================================
echo.
pause
endlocal
