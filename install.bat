@echo off
chcp 65001 >nul
title ERP Açaiteria - Instalação Inicial
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo ========================================
echo   ERP Açaiteria - Instalação Inicial
echo ========================================
echo.

REM ------------------------------------------------------------
REM  1) Verificar Node.js
REM ------------------------------------------------------------
echo [1/6] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo       ERRO: Node.js nao encontrado no PATH.
    echo       Instale o Node.js 18+ em https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo       OK - Node.js %NODE_VER%

REM ------------------------------------------------------------
REM  2) Verificar .env
REM ------------------------------------------------------------
echo.
echo [2/6] Verificando arquivo .env...
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo       OK - .env criado a partir de .env.example
        echo       Lembre-se de editar o .env com suas configuracoes!
    ) else (
        echo       ATENCAO: .env.example nao encontrado. Crie o .env manualmente.
    )
) else (
    echo       OK - Arquivo .env ja existe
)

REM ------------------------------------------------------------
REM  3) Instalar dependências npm
REM ------------------------------------------------------------
echo.
echo [3/6] Instalando dependencias npm (isso pode demorar)...
call npm install
if errorlevel 1 (
    echo       ERRO: Falha ao instalar dependencias.
    pause
    exit /b 1
)
echo       OK - Dependencias instaladas

REM ------------------------------------------------------------
REM  4) Gerar cliente Prisma
REM ------------------------------------------------------------
echo.
echo [4/6] Gerando cliente Prisma...
call npx prisma generate
if errorlevel 1 (
    echo       ERRO: Falha ao gerar Prisma Client.
    pause
    exit /b 1
)
echo       OK - Prisma Client gerado

REM ------------------------------------------------------------
REM  5) Executar migrações do banco
REM ------------------------------------------------------------
echo.
echo [5/6] Executando migracoes do banco de dados...
echo       (Certifique-se que o PostgreSQL esteja rodando)
echo.
choice /C SN /M "Deseja executar as migracoes agora? (S/N)"
if errorlevel 2 goto SKIP_MIGRATE
call npx prisma migrate deploy
if errorlevel 1 (
    echo       ATENCAO: Migracoes falharam. Verifique o DATABASE_URL no .env.
    echo       Execute manualmente depois: npx prisma migrate deploy
) else (
    echo       OK - Migracoes aplicadas
)
:SKIP_MIGRATE

REM ------------------------------------------------------------
REM  6) Build do projeto Next.js
REM ------------------------------------------------------------
echo.
echo [6/6] Compilando projeto Next.js (isso pode demorar)...
call npm run build
if errorlevel 1 (
    echo       ERRO: Falha no build. Tente resolver e executar: npm run build
    pause
    exit /b 1
)
echo       OK - Build concluido

echo.
echo ========================================
echo   Instalação concluída com sucesso!
echo ========================================
echo.
echo   Proximos passos:
echo   1. Edite o arquivo .env com suas configuracoes
echo   2. Execute "dev.bat" para modo desenvolvimento
echo      ou "start.bat" para modo producao
echo   3. Acesse http://localhost:3000
echo.
echo ========================================
pause
endlocal
