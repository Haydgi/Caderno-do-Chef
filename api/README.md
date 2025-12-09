# 📖 Caderno do Chef

> Sistema completo de gerenciamento para restaurantes e estabelecimentos gastronômicos

## 📋 Sobre o Projeto

O **Caderno do Chef** é uma aplicação web desenvolvida para auxiliar chefs, restaurantes e estabelecimentos gastronômicos no auxilio de tomada de decisões em suas operações. O sistema oferece controle detalhado de receitas, ingredientes, custos operacionais, despesas e análise de rentabilidade.

### ✨ Principais Funcionalidades

- 🍽️ **Gerenciamento de Receitas**: Cadastro completo com ingredientes, modo de preparo, tempo de produção e custos
- 📦 **Controle de Ingredientes**: Custos, unidade de medida e taxa de desperdício
- 💰 **Gestão Financeira**: Controle de despesas operacionais, impostos e custos fixos/variáveis
- 📊 **Relatórios e Análises**: 
  - Lucro por receita
  - Índice de desperdício
  - Tempo médio de preparo
  - Custo operacional detalhado
- 👥 **Gerenciamento de Usuários**: Sistema com três níveis de permissão (Proprietario, Gerente e Funcionário)
- 📤 **Importação/Exportação**: Backup completo dos dados, além de exportação de dados no formato Excel ou PDF
- 🔐 **Autenticação e Segurança**: Sistema de login seguro com JWT e recuperação de senha via e-mail

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React** 18.3.1 - Biblioteca JavaScript para interfaces
- **Vite** - Build tool e dev server
- **React Router DOM** 7.5.0 - Roteamento
- **Axios** 1.9.0 - Requisições HTTP
- **React Toastify** 11.0.5 - Notificações
- **SweetAlert2** 11.6.13 - Modais e alertas
- **Recharts** 2.15.3 - Gráficos e visualizações
- **React Icons** 5.5.0 - Biblioteca de ícones
- **Bootstrap** 5.3.5 - Framework CSS
- **React Quill** 2.0.0 - Editor de texto
- **React Select** 5.10.2 - Seleção avançada
- **React DatePicker** 8.4.0 - Seletor de datas

### Backend
- **Node.js** com **Express** 5.1.0 - Framework web
- **MySQL2** 3.14.1 - Banco de dados relacional
- **JWT** (jsonwebtoken 9.0.2) - Autenticação
- **Bcrypt** 6.0.0 - Hash de senhas
- **Nodemailer** 7.0.11 - Envio de e-mails
- **Multer** 2.0.2 - Upload de arquivos
- **ExcelJS** 4.4.0 - Geração de planilhas
- **PDFKit** 0.15.0 - Geração de PDFs
- **Helmet** 8.1.0 - Segurança HTTP
- **CORS** 2.8.5 - Controle de acesso
- **Express Rate Limit** 8.1.0 - Proteção contra abuso
- **Compression** 1.8.1 - Compressão de respostas
- **Archiver** 6.0.1 - Compactação de arquivos
- **CSV Parser** 3.2.0 - Processamento de CSV

### Ferramentas de Desenvolvimento
- **Nodemon** 3.1.10 - Auto-reload do servidor
- **ESLint** 9.9.0 - Linting
- **Autoprefixer** 10.4.21 - Prefixos CSS

## 📦 Dependências e Instalação

### Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **MySQL** (versão 8 ou superior)
- **npm** 
- **Python** (opcional, facilita iniciar o servidor)


### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Haydgi/Caderno-do-Chef.git
cd Caderno-do-Chef/api
```

2. **Instale as dependências do Backend**
```bash
cd backend
npm install
```

3. **Instale as dependências do Frontend**
```bash
cd ../frontend
npm install
```

4. **Configure o Banco de Dados**

Execute o script SQL para criar a estrutura do banco:
```bash
mysql -u seu_usuario -p < backend/script_estrutura.sql
```

5. **Configure as variáveis de ambiente**

Crie um arquivo `.env` na pasta `backend` com as seguintes variáveis:

```env
# Banco de Dados
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_DATABASE=caderno_chef
DB_PORT=3306

# JWT
JWT_SECRET=sua_chave_secreta_jwt

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_app

# Servidor
PORT=3000
NODE_ENV=development
```

## 🚀 Como Rodar o Projeto

1. **Inicie o Backend**
```bash
cd backend
npm start
```
O servidor estará rodando em `http://localhost:3000`

2. **Inicie o Frontend** (em outro terminal)
```bash
cd frontend
npm run dev
```
### Alternativamente, use o script Python!
```bash

```

A aplicação estará disponível em `http://localhost:5173`


## 📁 Estrutura do Projeto

```
Caderno-do-Chef/
├── api/
│   ├── backend/
│   │   ├── config/           # Configurações (email, etc)
│   │   ├── database/         # Conexão com banco de dados
│   │   ├── middleware/       # Auth, permissions
│   │   ├── routes/           # Rotas da API
│   │   ├── utils/            # Utilitários (logger, validators)
│   │   ├── uploads/          # Arquivos temporários
│   │   ├── index.js          # Servidor Express
│   │   └── script_estrutura.sql  # Script do banco
│   │
│   └── frontend/
│       ├── public/           # Arquivos estáticos
│       ├── src/
│       │   ├── api/          # Chamadas à API
│       │   ├── assets/       # Imagens, fontes
│       │   ├── components/   # Componentes reutilizáveis
│       │   ├── config/       # Configurações (axios)
│       │   ├── features/     # Auth, RoleGuard
│       │   ├── hooks/        # Custom hooks
│       │   ├── pages/        # Páginas da aplicação
│       │   ├── Styles/       # CSS global
│       │   ├── utils/        # Funções auxiliares
│       │   ├── App.jsx       # Componente principal
│       │   └── main.jsx      # Entry point
│       └── vite.config.js    # Configuração Vite
└── README.md
```

## 🔐 Níveis de Acesso

O sistema possui três níveis de permissão:

1. **Proprietario**: Acesso total ao sistema
2. **Gerente**: Gerenciamento de receitas, ingredientes e visualização de relatórios
3. **Funcionário**: Acesso limitado a visualização de receitas

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/minhaFeature`)
3. Commit suas mudanças (`git commit -m 'adição da minha Feature'`)
4. Push para a branch (`git push origin feature/minha Feature`)
5. Abrir um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

---
