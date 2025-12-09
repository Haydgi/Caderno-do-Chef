# 🛠️ Comandos Úteis - Caderno do Chef

## 🚀 Inicialização

### Método Recomendado (Script Python)
```bash
# Windows (PowerShell/CMD)
python start_server.py

# Linux/Mac
python3 start_server.py
```

### Atalhos Rápidos
```bash
# Windows - Duplo clique
iniciar_servidor.bat

# Linux/Mac
chmod +x iniciar_servidor.sh
./iniciar_servidor.sh
```

---

## 🧪 Testes e Diagnósticos

### Testar Ambiente
```bash
python test_environment.py
```

### Verificar IP Local
```bash
# Windows (PowerShell)
ipconfig | findstr IPv4

# Linux/Mac
ifconfig | grep "inet " | grep -v 127.0.0.1
# ou
ip addr show | grep "inet " | grep -v 127.0.0.1
```

### Verificar Portas em Uso
```bash
# Windows (PowerShell)
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Linux/Mac
lsof -i :3001
lsof -i :5173
# ou
netstat -an | grep :3001
netstat -an | grep :5173
```

### Verificar Node.js e npm
```bash
node --version
npm --version
```

### Verificar Python
```bash
# Windows
python --version

# Linux/Mac
python3 --version
```

---

## 📦 Gerenciamento de Dependências

### Instalar Dependências - Backend
```bash
cd backend
npm install
```

### Instalar Dependências - Frontend
```bash
cd frontend
npm install
```

### Atualizar Dependências
```bash
# Backend
cd backend
npm update

# Frontend
cd frontend
npm update
```

### Limpar Cache do npm
```bash
npm cache clean --force
```

### Reinstalar Tudo (Fresh Install)
```bash
# Backend
cd backend
rm -rf node_modules
rm package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules
rm package-lock.json
npm install
```

---

## ⚙️ Configuração

### Criar Arquivo .env
```bash
# Windows
cd backend
copy .env.example .env

# Linux/Mac
cd backend
cp .env.example .env
```

### Editar .env (Windows)
```powershell
notepad backend\.env
```

### Editar .env (Linux/Mac)
```bash
nano backend/.env
# ou
vim backend/.env
# ou
code backend/.env  # VS Code
```

### Gerar SECRET_JWT Seguro
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Python
python -c "import secrets; print(secrets.token_hex(64))"
```

---

## 🗄️ Banco de Dados (MySQL/MariaDB)

### Conectar ao MySQL
```bash
mysql -u root -p
```

### Criar Banco de Dados
```sql
CREATE DATABASE caderno_chef CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Listar Bancos de Dados
```sql
SHOW DATABASES;
```

### Usar Banco de Dados
```sql
USE caderno_chef;
```

### Listar Tabelas
```sql
SHOW TABLES;
```

### Backup do Banco de Dados
```bash
# Windows
mysqldump -u root -p caderno_chef > backup_caderno_chef.sql

# Linux/Mac
mysqldump -u root -p caderno_chef > backup_caderno_chef_$(date +%Y%m%d).sql
```

### Restaurar Banco de Dados
```bash
mysql -u root -p caderno_chef < backup_caderno_chef.sql
```

---

## 🔥 Firewall

### Windows (PowerShell como Administrador)

#### Adicionar Regras
```powershell
# Backend
New-NetFirewallRule -DisplayName "Caderno Chef Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Frontend
New-NetFirewallRule -DisplayName "Caderno Chef Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

#### Remover Regras
```powershell
Remove-NetFirewallRule -DisplayName "Caderno Chef Backend"
Remove-NetFirewallRule -DisplayName "Caderno Chef Frontend"
```

#### Listar Regras
```powershell
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Caderno Chef*"}
```

### Linux (UFW)

#### Adicionar Regras
```bash
sudo ufw allow 3001/tcp
sudo ufw allow 5173/tcp
```

#### Remover Regras
```bash
sudo ufw delete allow 3001/tcp
sudo ufw delete allow 5173/tcp
```

#### Ver Status
```bash
sudo ufw status
```

---

## 🔍 Debug e Logs

### Ver Logs do Backend (em tempo real)
```bash
cd backend
npm start
# Logs aparecerão no terminal
```

### Ver Logs do Frontend (em tempo real)
```bash
cd frontend
npm run dev
# Logs aparecerão no terminal
```

### Ver Logs do MySQL (Windows)
```powershell
# Localização comum
type "C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err"
```

### Ver Logs do MySQL (Linux)
```bash
sudo tail -f /var/log/mysql/error.log
```

---

## 🛑 Parar Serviços

### Parar o Script Python
```
Ctrl + C (no terminal onde está rodando)
```

### Matar Processos Manualmente (Windows)
```powershell
# Por porta
netstat -ano | findstr :3001
# Anote o PID e então:
taskkill /F /PID <PID>

# Por nome
taskkill /F /IM node.exe
```

### Matar Processos Manualmente (Linux/Mac)
```bash
# Por porta
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# Por nome
pkill node
```

---

## 🧹 Limpeza

### Limpar Arquivos Temporários
```bash
# Backend
cd backend
rm -rf uploads/temp/*

# Frontend
cd frontend
rm -rf dist/
```

### Limpar node_modules (Economizar Espaço)
```bash
# Backend
cd backend
rm -rf node_modules

# Frontend
cd frontend
rm -rf node_modules
```

### Limpar Cache (Tudo)
```bash
# npm cache
npm cache clean --force

# Browser cache (manual)
# Chrome: Ctrl+Shift+Del
# Firefox: Ctrl+Shift+Del
```

---

## 📊 Monitoramento

### Ver Uso de Porta
```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# Linux/Mac
netstat -an | grep :3001
netstat -an | grep :5173
```

### Ver Processos Node
```bash
# Windows
tasklist | findstr node.exe

# Linux/Mac
ps aux | grep node
```

### Ver Uso de Memória
```bash
# Windows (PowerShell)
Get-Process node | Format-Table -Property Name, Id, @{Name="Memory(MB)";Expression={[math]::Round($_.WS/1MB,2)}}

# Linux/Mac
ps aux | grep node | awk '{print $2, $4, $11}'
```

---

## 🌐 Rede

### Testar Conectividade
```bash
# Testar se o servidor está acessível
# Windows
curl http://localhost:3001
curl http://localhost:5173

# Linux/Mac
curl http://localhost:3001
curl http://localhost:5173
```

### Testar de Outro Dispositivo
```bash
# Substitua IP_DO_SERVIDOR pelo IP real
curl http://IP_DO_SERVIDOR:3001
curl http://IP_DO_SERVIDOR:5173
```

### Ping para Testar Rede
```bash
ping IP_DO_SERVIDOR
```

### Ver Dispositivos na Rede (Windows)
```powershell
arp -a
```

### Ver Dispositivos na Rede (Linux/Mac)
```bash
arp -a
# ou
sudo nmap -sn 192.168.1.0/24
```

---

## 🔧 Manutenção

### Atualizar Pacotes Globais
```bash
npm update -g npm
```

### Verificar Vulnerabilidades
```bash
# Backend
cd backend
npm audit

# Frontend
cd frontend
npm audit
```

### Corrigir Vulnerabilidades (Automático)
```bash
npm audit fix
```

### Build de Produção (Frontend)
```bash
cd frontend
npm run build
```

---

## 📝 Git (Controle de Versão)

### Status
```bash
git status
```

### Adicionar Arquivos
```bash
git add .
```

### Commit
```bash
git commit -m "Mensagem do commit"
```

### Push
```bash
git push origin main
```

### Pull (Atualizar)
```bash
git pull origin main
```

### Ver Histórico
```bash
git log --oneline
```

---

## 🔐 Segurança

### Verificar Permissões de Arquivos (Linux/Mac)
```bash
ls -la backend/.env
```

### Proteger Arquivo .env (Linux/Mac)
```bash
chmod 600 backend/.env
```

### Ver Conexões Ativas
```bash
# Windows
netstat -ano | findstr ESTABLISHED

# Linux/Mac
netstat -an | grep ESTABLISHED
```

---

## 🆘 Comandos de Emergência

### Reset Completo
```bash
# 1. Parar todos os processos Node
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill node

# 2. Limpar node_modules
cd backend
rm -rf node_modules
cd ../frontend
rm -rf node_modules

# 3. Reinstalar
cd ../backend
npm install
cd ../frontend
npm install

# 4. Reiniciar
cd ..
python start_server.py
```

### Resetar Banco de Dados (CUIDADO!)
```sql
DROP DATABASE caderno_chef;
CREATE DATABASE caderno_chef CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- Execute o script de estrutura novamente
```

### Resetar Configurações
```bash
cd backend
rm .env
copy .env.example .env  # Windows
# ou
cp .env.example .env    # Linux/Mac
# Configure novamente
```

---

## 📖 Comandos de Ajuda

### Help do npm
```bash
npm help
npm help install
npm help start
```

### Help do Node
```bash
node --help
```

### Help do Python
```bash
python --help
```

### Man Pages (Linux/Mac)
```bash
man mysql
man node
man npm
```

---

## 💡 Dicas Rápidas

### Abrir VS Code no Diretório Atual
```bash
code .
```

### Abrir Explorador no Diretório Atual
```bash
# Windows
explorer .

# Linux
xdg-open .

# Mac
open .
```

### Limpar Terminal
```bash
# Windows
cls

# Linux/Mac
clear
```

### Histórico de Comandos
```bash
# Pressione seta para cima ↑
# ou
history  # Linux/Mac
```

---

## 🎯 Comandos Mais Usados (Top 5)

1. **Iniciar Servidor**
   ```bash
   python start_server.py
   ```

2. **Parar Servidor**
   ```
   Ctrl + C
   ```

3. **Ver IP Local**
   ```bash
   ipconfig  # Windows
   ifconfig  # Linux/Mac
   ```

4. **Instalar Dependências**
   ```bash
   npm install
   ```

5. **Editar Configuração**
   ```bash
   notepad backend\.env  # Windows
   nano backend/.env     # Linux/Mac
   ```

---

**Salve este arquivo nos seus favoritos para referência rápida!** 📚

🍳 **Bons comandos!**
