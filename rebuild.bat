@echo off
chcp 65001 >nul
title ERP Açaiteria - Rebuild Projeto
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================
echo   ERP Açaiteria - Recompilar Projeto
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Dependencias nao encontradas. Execute: install.bat
    pause
    exit /b 1
)

echo [1/2] Gerando Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERRO no Prisma generate.
    pause
    exit /b 1
)
echo OK.

echo.
echo [2/2] Fazendo build Next.js (pode demorar)...
call npm run build
if errorlevel 1 (
    echo ERRO no build.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build concluido com sucesso!
echo   Para iniciar use: start.bat ou start-production.bat
echo ========================================
echo.
pause
endlocal
