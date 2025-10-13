
# 🍽️ Caderno do Chef

Este repositório contém o projeto **Caderno do Chef**, uma aplicação voltada para o controle de receitas e produtos no setor gastronômico. Ela faz parte de um sistema que auxilia pequenos empreendedores a organizarem seus custos, produção e lucros.

## 📌 Visão Geral

A aplicação é composta por:

- **Backend**: Responsável pelo cadastro e gerenciamento de produtos, receitas e usuários.
- **Frontend (React)**: Interface do usuário para interagir com os dados da aplicação.

## 🚀 Tecnologias Utilizadas

### Backend
- Node.js
- MySQL Workbench

### Frontend
- React.js
- Vite (opcional)
- React Router
- CSS Modules
- Bootstrap

## 📁 Estrutura do Projeto

```
Caderno-do-Chef/
├── api/
│   ├── backend/
│   │   └── database/         # Configurações de banco de dados (MongoDB)
│   ├── node_modules/
│   ├── routes/               # Definição das rotas da API
│   ├── .env                  # Variáveis de ambiente
│   ├── app.js                # Configuração da aplicação Express
│   ├── index.js              # Ponto de entrada da API
│   ├── package.json
│   ├── package-lock.json
│   └── yarn.lock
│
├── frontend/
│   ├── node_modules/
│   ├── public/               # Arquivos estáticos
│   └── src/
│       ├── assets/           # Imagens e recursos estáticos
│       ├── components/       # Componentes reutilizáveis
│       ├── features/
│       │   └── Auth/         # Funcionalidades de autenticação
│       ├── pages/            # Páginas da aplicação
│       ├── Styles/           # Estilos globais e locais
│       ├── App.jsx           # Componente principal do React
│       └── main.jsx          # Ponto de entrada do React
```

## ⚙️ Como rodar o projeto localmente

### 1. Clone o repositório

```bash
git clone https://github.com/Haydgi/Caderno-do-Chef.git
```

### 2. Acesse a pasta da API e instale as dependências

```bash
cd Caderno-do-Chef/api
npm install
```

### 3. Configure o ambiente

Crie um arquivo `.env` na raiz da pasta `api/` com o seguinte conteúdo:

```env
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=SUA_SENHA
DB_NAME=crud
```

### 4. Instale e Inicie o servidor da API

```bash
cd ../backend
npm install
node index.js
```

### 5. Para o frontend

```bash
cd ../frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:5173` (ou porta configurada).


## 📄 Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.
