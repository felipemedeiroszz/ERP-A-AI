@echo off
chcp 65001 >nul
title ERP Açaiteria - Prisma Studio
cd /d "%~dp0"

echo ========================================
echo   ERP Açaiteria - Prisma Studio
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo ERRO: Dependencias nao encontradas. Execute install.bat
    pause
    exit /b 1
)

echo Abrindo Prisma Studio em http://localhost:5555
echo (gerencia visual do banco de dados
echo.
echo Pressione Ctrl+C para sair.
echo ========================================
echo.

call npx prisma studio

pause
