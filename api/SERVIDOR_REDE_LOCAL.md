# 🍳 Caderno do Chef - Servidor de Rede Local

Este documento explica como iniciar o sistema Caderno do Chef em modo de rede local, permitindo que outros dispositivos na mesma rede acessem o sistema.

## 📋 Pré-requisitos

Antes de iniciar o servidor, certifique-se de ter instalado:

1. **Python 3.7+** - [Download](https://www.python.org/downloads/)
2. **Node.js 16+** - [Download](https://nodejs.org/)
3. **MySQL** ou **MariaDB** - Banco de dados configurado e rodando

## 🚀 Como Usar

### Opção 1: Executar o Script Python (Recomendado)

1. Abra um terminal (PowerShell, CMD, ou Terminal)

2. Navegue até o diretório do projeto:
   ```bash
   cd "c:\Users\Haydgi\Desktop\Nova pasta\Projetos\Caderno-do-Chef\api"
   ```

3. Execute o script Python:
   ```bash
   python start_server.py
   ```

O script irá:
- ✅ Detectar automaticamente o IP local da máquina
- ✅ Verificar e instalar dependências (se necessário)
- ✅ Configurar os arquivos para acesso em rede
- ✅ Iniciar o backend e frontend simultaneamente
- ✅ Exibir os endereços de acesso

### Opção 2: Execução Manual

Se preferir iniciar manualmente:

#### Backend:
```bash
cd backend
npm install
npm start
```

#### Frontend (em outro terminal):
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Acessando o Sistema

### No Computador Host (onde o servidor está rodando):
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### Em Outros Dispositivos na Rede:
- Frontend: `http://SEU_IP_LOCAL:5173`
- Backend API: `http://SEU_IP_LOCAL:3001`

**Exemplo:** Se o IP da máquina host for `192.168.1.100`:
- Acesse: `http://192.168.1.100:5173` em qualquer dispositivo na mesma rede

## 🔧 Configurações

### Portas Padrão
- **Backend:** 3001
- **Frontend:** 5173

Para alterar as portas, edite o arquivo `start_server.py`:
```python
backend_port = 3001  # Altere aqui
frontend_port = 5173  # Altere aqui
```

### Arquivo .env do Backend

O script cria/atualiza automaticamente o arquivo `.env` no diretório `backend/`. Certifique-se de que as seguintes variáveis estejam configuradas corretamente:

```env
# Configurações do Servidor
HOST=0.0.0.0
PORT=3001

# Configurações do Banco de Dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=caderno_chef

# Segurança
SECRET_JWT=sua_chave_secreta_aqui
```

## 🛡️ Firewall e Segurança

### Windows
1. O Windows pode solicitar permissão quando você iniciar o servidor pela primeira vez
2. Clique em "Permitir acesso" para ambas as redes (privada e pública)

### Configuração Manual do Firewall:
Se necessário, adicione regras manualmente:

**PowerShell (como Administrador):**
```powershell
# Permitir porta do backend
New-NetFirewallRule -DisplayName "Caderno Chef Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Permitir porta do frontend
New-NetFirewallRule -DisplayName "Caderno Chef Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

## 📱 Conectando Dispositivos Móveis

1. Certifique-se de que o dispositivo móvel está na mesma rede Wi-Fi
2. Abra o navegador no dispositivo móvel
3. Digite o endereço: `http://IP_DA_MAQUINA:5173`
4. O sistema deve carregar normalmente

## ⚠️ Troubleshooting

### Problema: "Não consigo acessar de outro dispositivo"

**Soluções:**
1. Verifique se ambos os dispositivos estão na mesma rede
2. Desative temporariamente o firewall/antivírus para testar
3. Verifique se o IP está correto (pode mudar se o roteador reiniciar)
4. Tente acessar usando o IP completo, não apenas "localhost"

### Problema: "Erro ao conectar com o backend"

**Soluções:**
1. Verifique se o MySQL/MariaDB está rodando
2. Confirme as credenciais no arquivo `.env`
3. Verifique se o banco de dados existe
4. Confira os logs do backend no terminal

### Problema: "CORS error" ou "Network error"

**Soluções:**
1. Execute o script Python novamente para reconfigurar os arquivos
2. Limpe o cache do navegador
3. Verifique se o arquivo `axios.js` tem a URL correta do backend

### Problema: "Dependências não encontradas"

**Solução:**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

## 🔄 Atualizando Configurações

Se você mudar o IP da máquina ou as portas, basta executar o script Python novamente:
```bash
python start_server.py
```

O script detectará o novo IP e atualizará todos os arquivos automaticamente.

## 🛑 Encerrando o Servidor

Para encerrar o servidor, pressione **Ctrl+C** no terminal onde o script está rodando.

O script encerrará graciosamente tanto o backend quanto o frontend.

## 📝 Notas Importantes

1. **Segurança:** Este modo é para uso em redes locais confiáveis. Não exponha diretamente à internet.

2. **Performance:** O acesso via rede local pode ser ligeiramente mais lento que o acesso local.

3. **IP Dinâmico:** Se o IP da máquina mudar (comum com DHCP), execute o script novamente.

4. **Banco de Dados:** O banco de dados deve estar acessível na máquina host. Dispositivos remotos não precisam ter MySQL instalado.

## 🎯 Casos de Uso

Este modo de rede local é ideal para:
- ✅ Testes em dispositivos móveis
- ✅ Demonstrações para clientes
- ✅ Uso em pequenos estabelecimentos (restaurantes, cafeterias)
- ✅ Desenvolvimento colaborativo em equipe
- ✅ Treinamento de funcionários

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs no terminal
2. Consulte a documentação do projeto
3. Verifique as issues no repositório GitHub

---

**Desenvolvido para facilitar o uso do Caderno do Chef em ambientes de rede local** 🍳
