@echo off
chcp 65001 >nul
title ERP Açaiteria - Modo Desenvolvimento
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================
echo   ERP Açaiteria - Modo Desenvolvimento
echo ========================================
echo.

REM ------------------------------------------------------------
REM  1) Verificar dependências
REM ------------------------------------------------------------
echo [1/3] Verificando dependencias...
where node >nul 2>&1
if errorlevel 1 (
    echo       ERRO: Node.js nao encontrado.
    pause
    exit /b 1
)
if not exist "node_modules" (
    echo       Dependencias nao encontradas. Execute "install.bat" primeiro.
    pause
    exit /b 1
)
echo       OK

REM ------------------------------------------------------------
REM  2) PostgreSQL (XAMPP ou serviço)
REM ------------------------------------------------------------
echo.
echo [2/3] Iniciando PostgreSQL...
if exist "C:\xampp\xampp_start.exe" (
    start "" /min "C:\xampp\xampp_start.exe"
    echo       OK - XAMPP iniciado
) else if exist "C:\xampp\pgsql\bin\pg_ctl.exe" (
    if exist "C:\xampp\pgsql\data" (
        start "" /min cmd /c ""C:\xampp\pgsql\bin\pg_ctl.exe" -D "C:\xampp\pgsql\data" -l "C:\xampp\pgsql\data\logfile.log" start"
        echo       OK - PostgreSQL iniciado
    ) else (
        echo       Aviso: dados PostgreSQL nao encontrados
    )
) else (
    sc query postgresql-x64-16 >nul 2>&1
    if not errorlevel 1 (
        net start postgresql-x64-16 >nul 2>&1
        echo       OK - Servico PostgreSQL iniciado
    ) else (
        sc query postgresql-x64-15 >nul 2>&1
        if not errorlevel 1 (
            net start postgresql-x64-15 >nul 2>&1
            echo       OK - Servico PostgreSQL iniciado
        ) else (
            echo       Aviso: XAMPP/Servico PostgreSQL nao encontrado.
            echo       Certifique-se de que o PostgreSQL esta rodando.
        )
    )
)
timeout /t 3 /nobreak >nul

REM ------------------------------------------------------------
REM  3) Next.js Dev Server (porta 3000)
REM ------------------------------------------------------------
echo.
echo [3/3] Iniciando Next.js Dev Server...
echo       Acesse: http://localhost:3000
echo       Hot Reload ativado (salve arquivos para recarregar automaticamente.
echo.
echo ========================================
echo   Pressione Ctrl+C duas vezes para parar.
echo ========================================
echo.

call npm run dev

echo.
echo Servidor parado.
pause
endlocal
