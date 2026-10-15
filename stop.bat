@echo off
chcp 65001 >nul
title ERP Açaiteria - Parar Serviços
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================
echo   ERP Açaiteria - Parando Serviços
echo ========================================
echo.

REM ------------------------------------------------------------
REM  1) Parar processos Node.js / Next.js
REM ------------------------------------------------------------
echo [1/3] Parando Next.js / Node.js...
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if errorlevel 1 (
    echo       Nenhum processo Node.js encontrado
) else (
    taskkill /F /IM node.exe >nul 2>&1
    if errorlevel 1 (
        echo       Aviso: Nao foi possivel parar alguns processos
    ) else (
        echo       OK - Processos Node.js finalizados
    )
)

REM ------------------------------------------------------------
REM  2) Parar Cloudflared (se rodando)
REM ------------------------------------------------------------
echo.
echo [2/3] Parando Cloudflare Tunnel...
tasklist /fi "imagename eq cloudflared.exe" 2>nul | find /i "cloudflared.exe" >nul
if errorlevel 1 (
    echo       Nenhum tunnel encontrado
) else (
    taskkill /F /IM cloudflared.exe >nul 2>&1
    echo       OK - Cloudflared parado
)

REM ------------------------------------------------------------
REM  3) Parar PostgreSQL (XAMPP opcional)
REM ------------------------------------------------------------
echo.
echo [3/3] PostgreSQL...
choice /C SN /M "Deseja parar o PostgreSQL tambem? (S/N)"
if errorlevel 2 goto END_PG

if exist "C:\xampp\xampp_stop.exe" (
    start "" /min "C:\xampp\xampp_stop.exe"
    echo       OK - XAMPP parado
) else if exist "C:\xampp\pgsql\bin\pg_ctl.exe" (
    if exist "C:\xampp\pgsql\data" (
        "C:\xampp\pgsql\bin\pg_ctl.exe" -D "C:\xampp\pgsql\data" stop >nul 2>&1
        echo       OK - PostgreSQL XAMPP parado
    )
) else (
    sc query postgresql-x64-16 >nul 2>&1
    if not errorlevel 1 (
        net stop postgresql-x64-16 >nul 2>&1
        echo       OK - Servico PostgreSQL 16 parado
    ) else (
        sc query postgresql-x64-15 >nul 2>&1
        if not errorlevel 1 (
            net stop postgresql-x64-15 >nul 2>&1
            echo       OK - Servico PostgreSQL 15 parado
        ) else (
            echo       Nenhum servico PostgreSQL encontrado.
        )
    )
)
:END_PG

echo.
echo ========================================
echo   Servicos parados com sucesso.
echo ========================================
echo.
timeout /t 3 /nobreak >nul
endlocal
