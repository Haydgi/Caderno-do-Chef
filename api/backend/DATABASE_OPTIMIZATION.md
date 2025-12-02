# Otimizações de Banco de Dados - Índices Recomendados

Este arquivo contém os índices SQL recomendados para otimizar o desempenho do sistema.
Execute estes comandos no seu banco de dados MySQL.

## Tabela: usuario

```sql
-- Índice para buscas por email (usado no login)
CREATE INDEX idx_usuario_email ON usuario(Email);

-- Índice para filtros por tipo de usuário
CREATE INDEX idx_usuario_tipo ON usuario(tipo_usuario);

-- Índice composto para buscas de autenticação
CREATE INDEX idx_usuario_auth ON usuario(Email, Senha);
```

## Tabela: ingredientes

```sql
-- Índice para buscas por nome (usado em autocomplete)
CREATE INDEX idx_ingredientes_nome ON ingredientes(Nome_Ingrediente);

-- Índice para filtros por usuário
CREATE INDEX idx_ingredientes_usuario ON ingredientes(ID_Usuario);

-- Índice para ordenação por data
CREATE INDEX idx_ingredientes_data ON ingredientes(Data_Ingrediente DESC);

-- Índice composto para buscas de ingredientes por usuário
CREATE INDEX idx_ingredientes_usuario_nome ON ingredientes(ID_Usuario, Nome_Ingrediente);

-- Índice para categoria
CREATE INDEX idx_ingredientes_categoria ON ingredientes(Categoria);
```

## Tabela: receitas

```sql
-- Índice para buscas por nome
CREATE INDEX idx_receitas_nome ON receitas(Nome_Receita);

-- Índice para filtros por usuário
CREATE INDEX idx_receitas_usuario ON receitas(ID_Usuario);

-- Índice para filtros por categoria
CREATE INDEX idx_receitas_categoria ON receitas(Categoria);

-- Índice composto para listagem de receitas do usuário
CREATE INDEX idx_receitas_usuario_categoria ON receitas(ID_Usuario, Categoria);

-- Índice para ordenação por custo
CREATE INDEX idx_receitas_custo ON receitas(Custo_Total_Ingredientes);
```

## Tabela: ingredientes_receita

```sql
-- Índice para joins com receitas
CREATE INDEX idx_ing_rec_receita ON ingredientes_receita(ID_Receita);

-- Índice para joins com ingredientes
CREATE INDEX idx_ing_rec_ingrediente ON ingredientes_receita(ID_Ingredientes);

-- Índice composto para queries que buscam ingredientes de uma receita
CREATE INDEX idx_ing_rec_combo ON ingredientes_receita(ID_Receita, ID_Ingredientes);
```

## Tabela: historico_alteracoes

```sql
-- Índice para buscas por ingrediente
CREATE INDEX idx_historico_ingrediente ON historico_alteracoes(ID_Ingrediente);

-- Índice para ordenação por data
CREATE INDEX idx_historico_data ON historico_alteracoes(Data_Alteracoes DESC);

-- Índice composto para histórico de um ingrediente
CREATE INDEX idx_historico_combo ON historico_alteracoes(ID_Ingrediente, Data_Alteracoes DESC);

-- Índice para filtros por status
CREATE INDEX idx_historico_status ON historico_alteracoes(Status);
```

## Tabela: preco

```sql
-- Índice para buscas por ingrediente
CREATE INDEX idx_preco_ingrediente ON preco(ID_Ingrediente);

-- Índice para buscas por histórico
CREATE INDEX idx_preco_historico ON preco(ID_Historico);

-- Índice para filtros por usuário
CREATE INDEX idx_preco_usuario ON preco(ID_Usuario);
```

## Tabela: despesas

```sql
-- Índice para filtros por usuário
CREATE INDEX idx_despesas_usuario ON despesas(ID_Usuario);

-- Índice para filtros por tipo
CREATE INDEX idx_despesas_tipo ON despesas(Tipo_Despesa);

-- Índice para ordenação por data
CREATE INDEX idx_despesas_data ON despesas(Data_Despesa DESC);

-- Índice composto para relatórios
CREATE INDEX idx_despesas_combo ON despesas(ID_Usuario, Tipo_Despesa, Data_Despesa DESC);
```

## Tabela: impostos

```sql
-- Índice para filtros por usuário
CREATE INDEX idx_impostos_usuario ON impostos(ID_Usuario);

-- Índice para buscas por tipo
CREATE INDEX idx_impostos_tipo ON impostos(Tipo_Imposto);
```

## Verificar Índices Existentes

```sql
-- Ver todos os índices de uma tabela
SHOW INDEX FROM usuario;
SHOW INDEX FROM ingredientes;
SHOW INDEX FROM receitas;
SHOW INDEX FROM ingredientes_receita;
SHOW INDEX FROM historico_alteracoes;
SHOW INDEX FROM preco;
SHOW INDEX FROM despesas;
SHOW INDEX FROM impostos;
```

## Análise de Performance

```sql
-- Analisar queries lentas
SHOW FULL PROCESSLIST;

-- Ver tamanho das tabelas
SELECT 
    table_name AS 'Table',
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'seu_database_name'
ORDER BY (data_length + index_length) DESC;

-- Verificar uso de índices
SELECT * FROM sys.schema_unused_indexes;
```

## Manutenção

```sql
-- Otimizar tabelas periodicamente
OPTIMIZE TABLE usuario;
OPTIMIZE TABLE ingredientes;
OPTIMIZE TABLE receitas;
OPTIMIZE TABLE ingredientes_receita;
OPTIMIZE TABLE historico_alteracoes;
OPTIMIZE TABLE preco;
OPTIMIZE TABLE despesas;
OPTIMIZE TABLE impostos;

-- Analisar tabelas para atualizar estatísticas
ANALYZE TABLE usuario;
ANALYZE TABLE ingredientes;
ANALYZE TABLE receitas;
ANALYZE TABLE ingredientes_receita;
```

## Notas Importantes

1. **Backup antes de aplicar**: Sempre faça backup do banco antes de criar índices
2. **Ambiente de teste**: Teste os índices em ambiente de desenvolvimento primeiro
3. **Monitoramento**: Monitore o desempenho após criar os índices
4. **Índices únicos**: Considere usar UNIQUE onde apropriado (ex: email)
5. **Overhead de escrita**: Índices melhoram leitura mas podem deixar escritas mais lentas
6. **Revisão periódica**: Revise e remova índices não utilizados periodicamente

## Comandos Úteis

```sql
-- Criar índice único para email (se ainda não existir)
CREATE UNIQUE INDEX idx_usuario_email_unique ON usuario(Email);

-- Remover índice se necessário
DROP INDEX idx_nome_do_indice ON nome_da_tabela;

-- Ver plano de execução de uma query
EXPLAIN SELECT * FROM receitas WHERE ID_Usuario = 1;
EXPLAIN SELECT * FROM ingredientes WHERE Nome_Ingrediente LIKE '%arroz%';
```
