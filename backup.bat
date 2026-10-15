@echo off
chcp 65001 >nul
title Backup do Banco - ERP Açaiteria
cd /d "%~dp0"

echo ========================================
echo   Backup do Banco de Dados
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado no PATH.
    echo Instale o Node.js 18+ e tente novamente.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Dependencias nao instaladas. Execute: npm install
    pause
    exit /b 1
)

call node scripts\backup.js

echo.
echo ========================================
echo   Concluido.
echo   Arquivos salvos em: %~dp0backups\
echo ========================================
echo.
pause
