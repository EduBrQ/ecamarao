@echo off
REM Script para rodar frontend e backend em paralelo (Windows)

REM Caminhos relativos
set FRONTEND_DIR=frontend
set BACKEND_DIR=backend

echo Iniciando frontend e backend em paralelo...
echo.

REM Iniciar frontend em nova janela
start "Frontend" cmd /k "cd %FRONTEND_DIR% && npm run dev"

REM Iniciar backend em nova janela  
start "Backend" cmd /k "cd %BACKEND_DIR% && npm run dev"

echo.
echo Frontend e Backend iniciados em janelas separadas.
echo Feche as janelas para parar os servidores.
pause
