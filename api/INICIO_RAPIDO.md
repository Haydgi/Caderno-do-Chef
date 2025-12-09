# 🚀 Guia Rápido - Servidor de Rede Local

## ⚡ Início Rápido em 3 Passos

### 1️⃣ Configure o Banco de Dados

```bash
# Crie o arquivo .env na pasta backend
cd backend
copy .env.example .env    # Windows
# ou
cp .env.example .env      # Linux/Mac
```

Edite o `.env` e configure:
- `DB_USER`: seu usuário MySQL
- `DB_PASSWORD`: sua senha MySQL
- `DB_NAME`: nome do banco de dados
- `SECRET_JWT`: uma chave secreta forte

### 2️⃣ Execute o Script

**Windows:**
- Duplo clique em `iniciar_servidor.bat`
- Ou execute no PowerShell: `python start_server.py`

**Linux/Mac:**
```bash
chmod +x iniciar_servidor.sh
./iniciar_servidor.sh
```

### 3️⃣ Acesse o Sistema

O script mostrará os endereços de acesso:

**No computador host:**
- `http://localhost:5173`

**Em outros dispositivos:**
- `http://SEU_IP:5173` (ex: `http://192.168.1.100:5173`)

## 🔧 Resolução Rápida de Problemas

### Não consigo acessar de outro dispositivo

1. ✅ Ambos os dispositivos na mesma Wi-Fi?
2. ✅ Firewall permitindo as portas 3001 e 5173?
3. ✅ IP correto? (mostrado ao iniciar o servidor)

### Erro de banco de dados

1. ✅ MySQL/MariaDB está rodando?
2. ✅ Credenciais corretas no `.env`?
3. ✅ Banco de dados criado?

### Erro ao instalar dependências

```bash
# Instale manualmente
cd backend
npm install

cd ../frontend
npm install
```

## 📞 Precisa de Mais Ajuda?

Consulte o guia completo: [SERVIDOR_REDE_LOCAL.md](SERVIDOR_REDE_LOCAL.md)

---

**Pronto! Seu sistema está rodando na rede local! 🎉**
