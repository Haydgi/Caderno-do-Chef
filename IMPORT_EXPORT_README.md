# 📊 Sistema de Importação e Exportação de Dados

## ✅ Implementação Completa

### 🎯 Funcionalidades:

1. **Exportação de Dados**
   - ✅ Exportar para Excel (.xlsx) com múltiplas abas
   - ✅ Exportar para CSV
   - ✅ Inclui: Receitas, Ingredientes, Despesas e Usuários

2. **Importação de Dados**
   - ✅ Importar de Excel (.xlsx, .xls)
   - ✅ Importar de CSV
   - ✅ Validação e tratamento de erros

### 🎨 Design do Botão:

- **Localização**: Canto superior esquerdo (fixo)
- **Estilo**: Botão circular discreto com ícone de nuvem
- **Cor**: Gradiente roxo (combina com o design)
- **Visibilidade**: Apenas para Proprietários
- **Interação**: Hover com efeito de escala

### 🔐 Segurança:

- ✅ Apenas Proprietários podem acessar
- ✅ Autenticação JWT obrigatória
- ✅ Validação de arquivos
- ✅ Limpeza automática de arquivos temporários

### 📦 Estrutura de Arquivos:

**Backend:**
- `routes/importExport.js` - Rotas de import/export
- `uploads/temp/` - Pasta temporária para uploads

**Frontend:**
- `components/ImportExport/ImportExportButton.jsx` - Componente principal
- `components/ImportExport/ImportExportButton.module.css` - Estilos

### 🚀 Como usar:

1. **Exportar Dados:**
   - Clique no botão roxo no canto superior esquerdo
   - Escolha "Exportar Excel" ou "Exportar CSV"
   - O arquivo será baixado automaticamente

2. **Importar Dados:**
   - Clique no botão roxo
   - Selecione "Importar arquivo"
   - Escolha um arquivo .xlsx, .xls ou .csv
   - Aguarde a confirmação

### 📋 Formato de Importação:

O arquivo Excel/CSV deve conter as seguintes colunas para ingredientes:
- `Nome_Ingrediente`
- `Quantidade_Estoque`
- `Unidade_Medida`
- `Preco_Unitario`

### 🎨 Características Visuais:

- ⚪ Botão circular discreto
- 🌈 Gradiente roxo elegante
- ✨ Animação suave ao abrir menu
- 📱 Responsivo (funciona em mobile)
- 🎯 Posicionamento fixo (não atrapalha navegação)

### 💡 Dependências Adicionadas:

```json
{
  "exceljs": "Para manipulação de arquivos Excel",
  "csv-parser": "Para leitura de arquivos CSV",
  "multer": "Para upload de arquivos"
}
```

### ⚙️ Endpoints da API:

```
GET  /api/exportar-dados?formato=excel|csv
POST /api/importar-dados
```

Pronto para uso! 🎉
