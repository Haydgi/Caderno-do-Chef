@echo off
chcp 65001 > nul
title Caderno do Chef - Servidor de Rede Local

echo.
echo ═══════════════════════════════════════════════════════════
echo   🍳 CADERNO DO CHEF - Servidor de Rede Local
echo ═══════════════════════════════════════════════════════════
echo.

REM Verifica se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado!
    echo.
    echo Por favor, instale o Python 3.7+ em: https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo ✅ Python encontrado
echo.
echo 🚀 Iniciando servidor...
echo.

REM Executa o script Python
python "%~dp0start_server.py"

if errorlevel 1 (
    echo.
    echo ❌ Erro ao iniciar o servidor
    echo.
    pause
    exit /b 1
)

pause
