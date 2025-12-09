#!/bin/bash

# Cores para o terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Limpa a tela
clear

echo -e "${CYAN}${BOLD}"
echo "═══════════════════════════════════════════════════════════"
echo "  🍳 CADERNO DO CHEF - Servidor de Rede Local"
echo "═══════════════════════════════════════════════════════════"
echo -e "${NC}\n"

# Obtém o diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Verifica se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python3 não encontrado!${NC}"
    echo ""
    echo "Por favor, instale o Python 3.7+ em: https://www.python.org/downloads/"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Python3 encontrado${NC}"
echo ""
echo -e "${BLUE}🚀 Iniciando servidor...${NC}"
echo ""

# Torna o script Python executável
chmod +x "$SCRIPT_DIR/start_server.py"

# Executa o script Python
python3 "$SCRIPT_DIR/start_server.py"

# Captura o código de saída
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo -e "${RED}❌ Erro ao iniciar o servidor${NC}"
    echo ""
    exit $EXIT_CODE
fi

echo ""
echo -e "${GREEN}✅ Servidor encerrado com sucesso${NC}"
echo ""
