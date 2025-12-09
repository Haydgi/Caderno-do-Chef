@echo off
chcp 65001 > nul
title Diagnóstico - Caderno do Chef

echo.
echo ═══════════════════════════════════════════════════════════
echo   🔍 DIAGNÓSTICO DO SISTEMA
echo ═══════════════════════════════════════════════════════════
echo.

echo ✅ Testando banco de dados...
echo.
cd backend
node test_database.js

if errorlevel 1 (
    echo.
    echo ═══════════════════════════════════════════════════════════
    echo   ❌ FALHA NO TESTE DE BANCO DE DADOS
    echo ═══════════════════════════════════════════════════════════
    echo.
    echo 📝 Possíveis soluções:
    echo.
    echo 1. Inicie o MySQL/MariaDB
    echo 2. Verifique as credenciais no arquivo backend\.env
    echo 3. Crie o banco de dados 'crud' se não existir:
    echo    mysql -u root -p -e "CREATE DATABASE crud;"
    echo 4. Execute o script de estrutura:
    echo    mysql -u root -p crud ^< backend\script_estrutura.sql
    echo.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════
echo   ✅ DIAGNÓSTICO CONCLUÍDO COM SUCESSO!
echo ═══════════════════════════════════════════════════════════
echo.
echo O sistema está pronto para iniciar!
echo.
echo Execute: python start_server.py
echo.
pause
