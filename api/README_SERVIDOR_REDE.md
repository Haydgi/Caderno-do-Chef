# 🍳 Caderno do Chef - Sistema de Gestão para Restaurantes

Sistema completo de gestão para restaurantes com suporte para hospedagem em rede local.

## 📚 Documentação

- **[🚀 Início Rápido](INICIO_RAPIDO.md)** - Comece aqui! Guia de 3 passos
- **[🌐 Servidor de Rede Local](SERVIDOR_REDE_LOCAL.md)** - Guia completo de configuração
- **[📋 Quick Start Original](QUICK_START.md)** - Guia de início original

## 🎯 Características do Servidor de Rede Local

✅ **Acesso Multiplataforma**: Acesse de qualquer dispositivo na rede  
✅ **Configuração Automática**: Script Python configura tudo automaticamente  
✅ **Fácil de Usar**: Duplo clique para iniciar (Windows) ou comando simples (Linux/Mac)  
✅ **Multi-dispositivo**: Vários usuários podem acessar simultaneamente  
✅ **Atualização Automática**: Detecta mudanças de IP e reconfigura os arquivos  

## 🚀 Como Iniciar

### Método 1: Script Python (Recomendado)

**Windows:**
```bash
# Duplo clique em iniciar_servidor.bat
# ou
python start_server.py
```

**Linux/Mac:**
```bash
chmod +x iniciar_servidor.sh
./iniciar_servidor.sh
```

### Método 2: Manual

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## 📋 Pré-requisitos

- **Python 3.7+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **MySQL/MariaDB** - Banco de dados

## 🔧 Configuração Inicial

1. **Configure o banco de dados:**
   ```bash
   cd backend
   copy .env.example .env  # Windows
   # ou
   cp .env.example .env    # Linux/Mac
   ```

2. **Edite o arquivo `.env`** com suas credenciais do MySQL

3. **Execute o servidor:**
   ```bash
   python start_server.py
   ```

## 🌐 Acessando o Sistema

### No Computador Host:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### Em Outros Dispositivos na Rede:
- Frontend: `http://SEU_IP:5173`
- Exemplo: `http://192.168.1.100:5173`

## 📁 Estrutura do Projeto

```
api/
├── backend/               # Servidor Node.js + Express
│   ├── routes/           # Rotas da API
│   ├── middleware/       # Middlewares de autenticação
│   ├── config/           # Configurações
│   └── index.js          # Entrada do backend
├── frontend/             # React + Vite
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas
│   │   └── config/      # Configuração Axios
│   └── vite.config.js   # Configuração do Vite
├── start_server.py      # Script de inicialização
├── iniciar_servidor.bat # Atalho Windows
└── iniciar_servidor.sh  # Atalho Linux/Mac
```

## 🛡️ Segurança

### Firewall (Windows)

O Windows pode solicitar permissão na primeira execução. Clique em "Permitir".

**Configuração manual:**
```powershell
# Execute como Administrador
New-NetFirewallRule -DisplayName "Caderno Chef Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Caderno Chef Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Firewall (Linux)
```bash
sudo ufw allow 3001/tcp
sudo ufw allow 5173/tcp
```

## 🔍 Troubleshooting

### Não consigo acessar de outro dispositivo
1. ✅ Verifique se ambos estão na mesma rede Wi-Fi
2. ✅ Desative temporariamente o firewall para testar
3. ✅ Verifique o IP (pode mudar se o roteador reiniciar)
4. ✅ Use o IP mostrado pelo script, não "localhost"

### Erro de banco de dados
1. ✅ MySQL/MariaDB está rodando?
2. ✅ Credenciais corretas no `.env`?
3. ✅ Banco de dados criado?

### Erro ao instalar dependências
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### CORS Error
Execute o script Python novamente para reconfigurar:
```bash
python start_server.py
```

## 📱 Uso em Dispositivos Móveis

1. Conecte o dispositivo móvel na mesma rede Wi-Fi
2. Abra o navegador
3. Digite: `http://IP_DA_MAQUINA:5173`
4. Use o sistema normalmente!

## 🎯 Casos de Uso

Este modo de rede local é ideal para:
- ✅ Testes em dispositivos móveis
- ✅ Demonstrações para clientes
- ✅ Uso em pequenos estabelecimentos
- ✅ Desenvolvimento colaborativo
- ✅ Treinamento de equipe

## ⚠️ Notas Importantes

1. **Rede Local**: Apenas para redes confiáveis. Não exponha à internet diretamente.
2. **IP Dinâmico**: Se o IP mudar, execute o script novamente.
3. **Performance**: Acesso via rede pode ser ligeiramente mais lento.
4. **Banco de Dados**: Deve estar na máquina host.

## 🛑 Encerrando o Servidor

Pressione **Ctrl+C** no terminal onde o script está rodando.

## 📚 Documentação Adicional

- [Implementação Scroll Infinito](IMPLEMENTACAO_SCROLL_INFINITO.md)
- [Guia de Testes](GUIA_TESTES_SCROLL_INFINITO.md)
- [Checklist de Deploy](backend/DEPLOY_CHECKLIST.md)
- [Otimização de Banco de Dados](backend/DATABASE_OPTIMIZATION.md)

## 🤝 Contribuindo

Para contribuir com o projeto, por favor:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença especificada no arquivo LICENSE.

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs no terminal
2. Consulte a documentação
3. Abra uma issue no GitHub

---

**Desenvolvido com ❤️ para facilitar a gestão de restaurantes**

🍳 **Bom apetite e bons códigos!**
