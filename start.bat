@echo off
chcp 65001 >nul
title ERP Açaiteria - Inicialização Completa
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================
echo   ERP Açaiteria - Iniciando serviços
echo ========================================
echo.

REM ------------------------------------------------------------
REM  1) Iniciar PostgreSQL pelo XAMPP (se disponível)
REM ------------------------------------------------------------
echo [1/3] Iniciando PostgreSQL (XAMPP)...
if exist "C:\xampp\xampp_start.exe" (
    start "" /min "C:\xampp\xampp_start.exe"
    timeout /t 5 /nobreak >nul
    echo       OK - XAMPP iniciado
) else if exist "C:\xampp\pgsql\bin\pg_ctl.exe" (
    if not exist "C:\xampp\pgsql\data" (
        echo       Aviso: diretório de dados PostgreSQL não encontrado
    ) else (
        start "" /min cmd /c ""C:\xampp\pgsql\bin\pg_ctl.exe" -D "C:\xampp\pgsql\data" -l "C:\xampp\pgsql\data\logfile.log" start"
        timeout /t 4 /nobreak >nul
        echo       OK - PostgreSQL iniciado
    )
) else (
    echo       Aviso: XAMPP/PostgreSQL não encontrado em C:\xampp
    echo       Certifique-se de que o PostgreSQL esteja rodando.
)
timeout /t 3 /nobreak >nul

REM ------------------------------------------------------------
REM  2) Iniciar aplicação Next.js (porta 3000)
REM ------------------------------------------------------------
echo.
echo [2/3] Iniciando Next.js (http://localhost:3000)...
start "Next.js - ERP Açaiteria" cmd /k "cd /d ""%~dp0"" && npm start"

timeout /t 8 /nobreak >nul

REM ------------------------------------------------------------
REM  3) Cloudflare Tunnel (se configurado)
REM ------------------------------------------------------------
echo.
echo [3/3] Iniciando Cloudflare Tunnel...

REM Carrega variáveis do .env se existir
set CLOUDFLARE_TUNNEL_ID=
if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if "%%a"=="CLOUDFLARE_TUNNEL_ID" set "CLOUDFLARE_TUNNEL_ID=%%b"
    )
)

if "%CLOUDFLARE_TUNNEL_ID%"=="" (
    echo       Aviso: CLOUDFLARE_TUNNEL_ID não configurado no .env
    echo       Acesse http://localhost:3000 localmente.
) else (
    where cloudflared >nul 2>&1
    if errorlevel 1 (
        echo       Aviso: cloudflared não encontrado no PATH
        echo       Instale o Cloudflare Tunnel e configure o PATH.
    ) else (
        start "Cloudflare Tunnel" cmd /k "cloudflared tunnel run %CLOUDFLARE_TUNNEL_ID%"
        echo       OK - Tunnel iniciado (ID: %CLOUDFLARE_TUNNEL_ID%)
    )
)

echo.
echo ========================================
echo   Pronto!
echo   Aplicação local : http://localhost:3000
echo   Loja online     : https://pedido.empresa.com.br (via tunnel)
echo.
echo   Mantenha esta janela e as janelas filhas abertas.
echo ========================================
echo.
pause
endlocal
