# Alterações Implementadas - Scroll Infinito em Despesas

## Resumo das Mudanças

Foi implementado o sistema de **scroll infinito** na página de Despesas, removendo o `react-paginate` e substituindo-o por um carregamento progressivo de 20 itens por vez.

## Arquivos Modificados

### 1. **`src/hooks/useInfiniteScroll.js`** (NOVO)
- Hook customizado que gerencia o scroll infinito
- Carrega 20 itens por vez por padrão
- Detecta quando o usuário chega a 80% do scroll
- Retorna:
  - `displayedItems`: Itens a exibir atualmente
  - `hasMore`: Booleano indicando se há mais itens
  - `scrollContainerRef`: Referência para o container com scroll
  - `isLoading`: Estado de carregamento
  - `loadMore`: Função para carregar mais itens

### 2. **`src/pages/CadastroSistema/Despesas/Despesas.jsx`**
Mudanças principais:
- Importação do hook `useInfiniteScroll`
- Remoção dos dois `useEffect` que ajustavam `itensPorPagina`
- Adição do hook após a definição de `todosOsCustos` (useMemo)
- Simplificação do estado de `isMobile` (mantém apenas um useEffect)
- Passagem de novos props ao `ModelPage`:
  - `displayedItems`: Itens do scroll infinito
  - `hasMore`: Indicador se há mais itens
  - `scrollContainerRef`: Referência do container
  - `useInfiniteScroll`: Flag para ativar o modo infinito
  - `itensPorPagina`: Fixado em 20 itens

### 3. **`src/pages/CadastroSistema/ModelPage.jsx`**
Mudanças principais:
- Adição de novos props na função:
  - `displayedItems`
  - `hasMore`
  - `scrollContainerRef`
  - `useInfiniteScroll`
- Modificação da lógica de `dadosExibidos` para usar `displayedItems` quando scroll infinito ativo
- Adição da referência `ref` ao container de cards quando scroll infinito ativo
- Indicador visual de scroll:
  - Ícone de seta para baixo
  - Texto: "Role para carregar mais itens"
  - Aparece quando `hasMore === true`
  - Estilo: `color: rgba(255, 255, 255, 0.6)` com ícone centralizado
- Remoção da paginação quando `useInfiniteScroll === true`

## Recursos Implementados

✅ **Scroll Infinito**
- Carregamento automático ao chegar a 80% do scroll
- Carregamento de 20 itens por vez

✅ **Indicador Visual**
- Ícone com seta para baixo indicando que há mais itens
- Mensagem: "Role para carregar mais itens"
- Desaparece automaticamente ao atingir o final da lista

✅ **Mantém Compatibilidade**
- Dimensões e layout mantidos iguais
- Estilo da página preservado
- Busca, filtros e ordenação continuam funcionando
- Tabs mobile mantém funcionalidade

✅ **Compatibilidade com ModelPage**
- Mantém funcionalidade de paginação para outras páginas
- Flag `useInfiniteScroll` controla qual modo usar

## Comportamento do Scroll

1. **Carregamento Inicial**: 20 itens carregados automaticamente
2. **Durante Scroll**: Ao chegar a ~80% do height do container, mais 20 itens são carregados
3. **Final da Lista**: Indicador desaparece quando todos os itens foram carregados
4. **Busca/Filtro**: Lista reinicia do início com novos resultados

## Notas Técnicas

- O hook usa `setTimeout` com 200ms para simular delay de carregamento (pode ser ajustado)
- O detector de scroll usa threshold de 20% da altura do container
- O hook respeita a ordem e filtros aplicados (`todosOsCustos`)
- Responsivo: Funciona em mobile, tablet e desktop

## Próximos Passos (Opcional)

1. Aplicar o mesmo padrão em outras páginas (Receitas, Ingredientes, etc.)
2. Adicionar loading spinner durante o carregamento
3. Implementar cache de itens já carregados
4. Adicionar botão "Voltar ao Topo" quando houver scroll significativo
