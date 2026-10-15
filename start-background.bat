@echo off
chcp 65001 >nul
title ERP Açaiteria - Executar em Segundo Plano
cd /d "%~dp0"

echo ========================================
echo   ERP Açaiteria - Modo Silencioso
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado.
    pause
    exit /b 1
)

if not exist ".next" (
    echo Build nao encontrado. Execute primeiro: install.bat
    pause
    exit /b 1
)

echo Iniciando Next.js em segundo plano (janela oculta)...
powershell -WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -Command "Set-Location '%~dp0'; Start-Process 'npm' -ArgumentList 'start' -WindowStyle Hidden"

timeout /t 10 /nobreak >nul

echo.
echo Tentando abrir o navegador...
start "" "http://localhost:3000"

echo.
echo ========================================
echo   Sistema iniciado em segundo plano.
echo   Acesse: http://localhost:3000
echo.
echo   Para parar, execute: stop.bat
echo ========================================
echo.
timeout /t 3 /nobreak >nul
