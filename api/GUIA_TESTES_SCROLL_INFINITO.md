# 🧪 Guia de Testes - Scroll Infinito em Despesas

## Pré-requisitos
- [ ] Aplicação em execução (`npm run dev`)
- [ ] Backend rodando
- [ ] Token de autenticação ativo
- [ ] Dados de despesas/impostos carregados

## Testes Funcionais

### Teste 1: Carregamento Inicial
**Objetivo**: Verificar se 20 itens carregam inicialmente

**Passos**:
1. Abra a página de Despesas
2. Observe quantos itens aparecem
3. Conte visualmente ou use DevTools

**Resultado Esperado**:
- [ ] Exatamente 20 itens (ou menos se houver menos de 20 no banco)
- [ ] Indicador "Role para carregar mais itens" visível

---

### Teste 2: Scroll Infinito Funcionando
**Objetivo**: Verificar se itens carregam ao rolar

**Passos**:
1. Esteja na página de Despesas
2. Role para baixo lentamente
3. Continue rolando até passar dos 20 itens iniciais
4. Observe o contador de itens

**Resultado Esperado**:
- [ ] Mais 20 itens carregam automaticamente
- [ ] Não há paginação (sem números 1, 2, 3...)
- [ ] Transição suave dos itens

---

### Teste 3: Indicador Visual
**Objetivo**: Verificar se o indicador funciona corretamente

**Passos**:
1. Página de Despesas aberta
2. Observe o indicador visual
3. Role até o final da lista
4. Observe se o indicador desaparece

**Resultado Esperado**:
- [ ] Indicador com seta ⬇️ aparece
- [ ] Texto "Role para carregar mais itens" visível
- [ ] Indicador desaparece ao final da lista
- [ ] Cor é cinza claro (rgba(255, 255, 255, 0.6))

---

### Teste 4: Busca com Scroll
**Objetivo**: Verificar se busca reinicia o scroll infinito

**Passos**:
1. Digite um termo de busca (ex: "internet")
2. Aguarde resultados
3. Role para baixo
4. Verifique carregamento

**Resultado Esperado**:
- [ ] Lista reinicia com novo termo
- [ ] 20 primeiros itens aparecem
- [ ] Scroll infinito funciona com novos resultados
- [ ] Limpar busca retorna lista completa

---

### Teste 5: Filtros com Scroll
**Objetivo**: Verificar se filtros funcionam com scroll infinito

**Passos**:
1. Clique em "Filtrar"
2. Selecione "Apenas Despesas"
3. Role para baixo
4. Tente outro filtro "Apenas Impostos"
5. Role novamente

**Resultado Esperado**:
- [ ] Filtro muda os itens exibidos
- [ ] Scroll infinito funciona após filtrar
- [ ] Indicador aparece corretamente
- [ ] Todos os filtros funcionam

---

### Teste 6: Ordenação com Scroll
**Objetivo**: Verificar se ordenação funciona com scroll infinito

**Passos**:
1. Clique em "Filtrar"
2. Escolha "Nome (A-Z)"
3. Role para baixo
4. Tente outra ordenação "Maior Preço"
5. Role novamente

**Resultado Esperado**:
- [ ] Itens reordenam
- [ ] Scroll infinito se reinicia
- [ ] Carregamento de 20 itens respeitando nova ordem
- [ ] Todas ordenações funcionam

---

### Teste 7: Mobile - Responsividade
**Objetivo**: Verificar funcionamento em dispositivos móveis

**Passos**:
1. Abra DevTools (F12)
2. Ative modo responsivo (Ctrl+Shift+M)
3. Escolha tamanho mobile (ex: iPhone 12)
4. Abra página de Despesas
5. Role para baixo

**Resultado Esperado**:
- [ ] Página se adapta ao mobile
- [ ] Scroll infinito funciona
- [ ] Indicador é legível
- [ ] Sem quebra de layout

---

### Teste 8: Mobile - Tabs
**Objetivo**: Verificar se tabs mobile funcionam com scroll infinito

**Passos**:
1. Em modo mobile
2. Observe se há abas (Despesas | Custo Operacional)
3. Clique em "Despesas"
4. Role para baixo
5. Clique em "Custo Operacional"
6. Volte para "Despesas"

**Resultado Esperado**:
- [ ] Abas aparecem em mobile
- [ ] Scroll infinito funciona na aba "Despesas"
- [ ] Não rola infinito em outras abas
- [ ] Dados se mantêm ao trocar abas

---

### Teste 9: Editar Item
**Objetivo**: Verificar se edição funciona após scroll infinito

**Passos**:
1. Role para carregar vários itens (>20)
2. Clique em um item para editar
3. Faça alterações
4. Salve
5. Verifique se item atualiza
6. Role novamente

**Resultado Esperado**:
- [ ] Modal de edição abre
- [ ] Alterações são salvas
- [ ] Item atualiza na lista
- [ ] Scroll infinito continua funcionando

---

### Teste 10: Deletar Item
**Objetivo**: Verificar se deleção funciona com scroll infinito

**Passos**:
1. Role para carregar vários itens
2. Clique no ícone de lixeira
3. Confirme deleção
4. Verifique se item sai da lista
5. Role novamente

**Resultado Esperado**:
- [ ] Confirmação de deleção aparece
- [ ] Item é removido
- [ ] Lista se atualiza
- [ ] Scroll infinito continua funcionando

---

### Teste 11: Painel Lateral - Desktop
**Objetivo**: Verificar se painel lateral não interfere

**Passos**:
1. Vire DevTools off (modo desktop normal)
2. Abra página de Despesas
3. Observe painel "Custo Operacional Total" à direita
4. Role para baixo

**Resultado Esperado**:
- [ ] Painel lateral visível
- [ ] Scroll funciona nos cards (esquerda)
- [ ] Painel não interfere
- [ ] Indicador não sobrepõe painel

---

### Teste 12: Performance
**Objetivo**: Verificar se não há lag ao carregar itens

**Passos**:
1. Abra DevTools → Console
2. Vá até Despesas
3. Role rapidamente para baixo e para cima
4. Observe Performance (F12 → Performance)
5. Rode por 10 segundos

**Resultado Esperado**:
- [ ] Sem travamentos
- [ ] FPS estável (>30)
- [ ] Memória não cresce excessivamente
- [ ] CPU razoável

---

## Testes de Regressão

### Verificar se outras páginas não foram afetadas

- [ ] Receitas ainda usam paginação
- [ ] Ingredientes ainda usam paginação
- [ ] Outras páginas funcionam normalmente

---

## Dados para Teste

Se precisar de dados de teste, use estes:

**Despesa 1**:
- Nome: Internet
- Custo Mensal: R$ 100
- Tempo/Dia: 24h

**Despesa 2**:
- Nome: Aluguel
- Custo Mensal: R$ 3000
- Tempo/Dia: 24h

**Imposto 1**:
- Nome: DAS
- Valor: R$ 500
- Frequência: Mensal

---

## Problemas Conhecidos e Soluções

| Problema | Sintoma | Solução |
|----------|---------|---------|
| Scroll não funciona | Indicador não aparece ao rolar | Verifique se há mais de 20 itens |
| Indicador piscante | Aparece/desaparece constantemente | Normal se dados estão carregando |
| Paginação ainda visível | Números 1, 2, 3... aparecem | Atualizar página (Ctrl+F5) |
| Itens duplicados | Vê o mesmo item duas vezes | Limpar cache do navegador |

---

## Relatório de Teste

Ao completar testes, preencha:

```
Data: _______________
Testador: _______________
Navegador: _______________
Resolução: _______________

Testes Passados: ___ / 12
Problemas Encontrados: _______________
Observações: _______________

Status Final: 
[ ] APROVADO
[ ] APROVADO COM RESSALVAS
[ ] REPROVADO
```

---

## Contato

Se encontrar problemas, relate:
- Screenshot/vídeo do problema
- Navegador e versão
- Passos para reproduzir
- Console errors (F12 → Console)

