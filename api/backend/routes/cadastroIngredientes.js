import express from 'express';
import db from "../database/connection.js";
import multer from 'multer';
import { calculaPrecoReceitaCompleto } from './atualizaReceitas.js';

const router = express.Router();
const upload = multer(); // Para multipart/form-data
import { funcionarioOuAcima, gerenteOuAcima, Roles } from "../middleware/permissions.js";

const MSGS = {
  camposFaltando: 'Campos obrigatórios faltando',
  erroCadastro: 'Erro ao cadastrar ingrediente',
  erroAtualizar: 'Erro ao atualizar ingrediente',
  erroExcluir: 'Erro ao excluir ingrediente',
  ingredienteNaoEncontrado: 'Ingrediente não encontrado',
  naoAutorizado: 'Não autorizado a alterar este ingrediente',
  tokenNaoFornecido: 'Token não fornecido',
  tokenInvalido: 'Token inválido',
  idInvalido: 'ID inválido',
};

// Observação: autenticação (req.user) já está aplicada em index.js

// POST - Cadastrar ingrediente (protegida - Proprietário e Gerente)
// Funcionário ou acima pode cadastrar
router.post('/', funcionarioOuAcima, upload.none(), async (req, res) => {
  const {
    nome = null,
    unidadeDeMedida = null,
    custo = null,
    indiceDeDesperdicio = null,
    categoria = null
  } = req.body;

  const ID_Usuario = req.user.ID_Usuario;

  if (!nome || !unidadeDeMedida || custo === null || custo === undefined) {
    return res.status(400).json({ error: MSGS.camposFaltando });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO ingredientes
       (Nome_Ingrediente, Unidade_De_Medida, Custo_Ingrediente, Indice_de_Desperdicio, Categoria, ID_Usuario, Data_Ingrediente)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [nome, unidadeDeMedida, custo, indiceDeDesperdicio, categoria, ID_Usuario]
    );

    if (result.affectedRows === 1) {
      const ingredienteId = result.insertId;

      // Histórico
      const [historicoResult] = await db.query(
        `INSERT INTO historico_alteracoes
          (ID_Ingrediente, ID_Usuario, Preco, Taxa_Desperdicio, Data_Alteracoes, Status)
         VALUES (?, ?, ?, ?, NOW(), 1)`,
        [ingredienteId, ID_Usuario, custo, indiceDeDesperdicio]
      );

      // Preço atual
      await db.query(
        `INSERT INTO preco
          (ID_Ingrediente, ID_Historico, ID_Usuario, Quantidade_Utilizada, Unidade_Medida, Custo_Unitario)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [ingredienteId, historicoResult.insertId, ID_Usuario, 1, unidadeDeMedida, custo]
      );

      res.status(201).json({ id: ingredienteId, nome, unidadeDeMedida, custo, indiceDeDesperdicio, categoria });
    } else {
      res.status(500).json({ error: MSGS.erroCadastro });
    }
  } catch (error) {
    console.error('Erro ao cadastrar ingrediente:', error);
    res.status(500).json({ error: MSGS.erroCadastro });
  }
});

// GET - Listar ingredientes com paginação e busca (protegida)
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, search = '', obsoleteOnly = '0' } = req.query;
  const offset = (page - 1) * limit;

  try {
    let sql = `
      SELECT i.ID_Ingredientes, i.Nome_Ingrediente, i.Unidade_De_Medida, i.Custo_Ingrediente, i.Indice_de_Desperdicio, i.Categoria, i.Data_Ingrediente
      FROM ingredientes i
      WHERE 1=1`;
    const params = [];

    if (search.trim()) {
      sql += ` AND i.Nome_Ingrediente LIKE ?`;
      params.push(`%${search.trim()}%`);
    }

    if (obsoleteOnly === '1' || obsoleteOnly === 'true') {
      sql += ` AND NOT EXISTS (
        SELECT 1 FROM ingredientes_receita ir WHERE ir.ID_Ingredientes = i.ID_Ingredientes
      )`;
    }

    sql += ` ORDER BY Data_Ingrediente DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await db.query(sql, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar ingredientes:', error);
    res.status(500).json({ error: 'Erro ao buscar ingredientes' });
  }
});

// Função utilitária para atualizar o custo das receitas que usam um ingrediente
async function atualizaReceitasPorIngrediente(idIngrediente) {
  const [receitas] = await db.query(
    `SELECT DISTINCT ir.ID_Receita, r.ID_Usuario, r.Porcentagem_De_Lucro, r.Tempo_Preparo
     FROM ingredientes_receita ir
     JOIN receitas r ON ir.ID_Receita = r.ID_Receita
     WHERE ir.ID_Ingredientes = ?`,
    [idIngrediente]
  );

  for (const receita of receitas) {
    // Chama o cálculo centralizado
    const resultado = await calculaPrecoReceitaCompleto(
      receita.ID_Receita,
      receita.ID_Usuario,
      receita.Porcentagem_Lucro,
      receita.Tempo_Preparo
    );

    // Atualiza os campos necessários na tabela receitas
    const porcentagemLucro = Number(receita.Porcentagem_De_Lucro) || 0;
    const precoFinalComLucro = resultado.custoTotal * (1 + (porcentagemLucro / 100));

    await db.query(
      `UPDATE receitas
       SET Custo_Total_Ingredientes = ?
       WHERE ID_Receita = ?`,
      [
        precoFinalComLucro,
        receita.ID_Receita
      ]
    );
  }
}

// PUT - Atualizar ingrediente (atualiza preco e cria novo histórico)
// PUT - Atualizar ingrediente (protegida)
// Funcionário ou acima pode editar
router.put('/:id', funcionarioOuAcima, upload.none(), async (req, res) => {
  const {
    nome = null,
    unidadeDeMedida = null,
    custo = null,
    indiceDeDesperdicio = null,
    categoria = null
  } = req.body;

  const { id } = req.params;
  const ID_Usuario = req.user.ID_Usuario;

  const idNum = Number(id);
  if (isNaN(idNum)) return res.status(400).json({ error: MSGS.idInvalido });

  if (!nome || !unidadeDeMedida || custo === null || custo === undefined) {
    return res.status(400).json({ error: MSGS.camposFaltando });
  }

  try {
    // Verifica se o ingrediente existe e pertence ao usuário
    const [rows] = await db.query(
      `SELECT ID_Usuario FROM ingredientes WHERE ID_Ingredientes = ?`,
      [idNum]
    );

    if (rows.length === 0) return res.status(404).json({ error: MSGS.ingredienteNaoEncontrado });
    // Removida a restrição de propriedade: qualquer usuário com papel permitido pode editar

    // Busca último histórico
    const [ultimoHistorico] = await db.query(
      `SELECT Preco, Taxa_Desperdicio
       FROM historico_alteracoes
       WHERE ID_Ingrediente = ?
       ORDER BY Data_Alteracoes DESC LIMIT 1`,
      [idNum]
    );

    const precoAtual = parseFloat(custo);
    const desperdicioAtual = parseFloat(indiceDeDesperdicio || 0);

    let deveCriarHistorico = true;

    if (ultimoHistorico.length > 0) {
      const { Preco, Taxa_Desperdicio } = ultimoHistorico[0];
      const precoBanco = parseFloat(Preco);
      const desperdicioBanco = parseFloat(Taxa_Desperdicio || 0);

      if (
        precoAtual.toFixed(2) === precoBanco.toFixed(2) &&
        desperdicioAtual.toFixed(2) === desperdicioBanco.toFixed(2)
      ) {
        deveCriarHistorico = false;
      }
    }

    // Atualiza o ingrediente
    await db.query(
      `UPDATE ingredientes
       SET Nome_Ingrediente = ?, Unidade_De_Medida = ?, Custo_Ingrediente = ?, Indice_de_Desperdicio = ?, Categoria = ?
       WHERE ID_Ingredientes = ?`,
      [nome, unidadeDeMedida, custo, indiceDeDesperdicio, categoria, idNum]
    );

    if (deveCriarHistorico) {
      // Novo histórico
      const [historicoResult] = await db.query(
        `INSERT INTO historico_alteracoes
          (ID_Ingrediente, ID_Usuario, Preco, Taxa_Desperdicio, Data_Alteracoes, Status)
         VALUES (?, ?, ?, ?, NOW(), 1)`,
        [idNum, ID_Usuario, custo, indiceDeDesperdicio]
      );

      // Atualiza o último preço
      // Atualiza o último registro de preço do ingrediente (independente do usuário)
      await db.query(
        `UPDATE preco
         SET Custo_Unitario = ?, Unidade_Medida = ?, ID_Historico = ?
         WHERE ID_Ingrediente = ?
         ORDER BY ID_Historico DESC
         LIMIT 1`,
        [custo, unidadeDeMedida, historicoResult.insertId, idNum]
      );
    }

    // Atualiza o custo das receitas que usam este ingrediente
    await atualizaReceitasPorIngrediente(idNum);

    res.status(200).json({ message: 'Ingrediente e receitas atualizados com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar ingrediente:', error);
    res.status(500).json({ error: MSGS.erroAtualizar });
  }
});


// DELETE - Excluir ingrediente e dependências
// Somente gerente ou acima podem excluir
// Lista receitas que utilizam o ingrediente
router.get('/:id/relacoes', async (req, res) => {
  const { id } = req.params;
  const idNum = Number(id);
  if (isNaN(idNum)) return res.status(400).json({ error: MSGS.idInvalido });

  try {
    const [relacoes] = await db.query(
      `SELECT r.ID_Receita, r.Nome_Receita, r.ID_Usuario, r.Porcentagem_De_Lucro, r.Tempo_Preparo
       FROM ingredientes_receita ir
       JOIN receitas r ON r.ID_Receita = ir.ID_Receita
       WHERE ir.ID_Ingredientes = ?`,
      [idNum]
    );
    res.status(200).json({ receitas: relacoes, total: relacoes.length });
  } catch (error) {
    console.error('Erro ao buscar relações do ingrediente:', error);
    res.status(500).json({ error: 'Erro ao buscar relações do ingrediente' });
  }
});

router.delete('/:id', funcionarioOuAcima, async (req, res) => {
  const { id } = req.params;
  const ID_Usuario = req.user.ID_Usuario;
  const role = req.user.role;

  const idNum = Number(id);
  if (isNaN(idNum)) return res.status(400).json({ error: MSGS.idInvalido });

  try {
    const [rows] = await db.query(
      `SELECT ID_Usuario FROM ingredientes WHERE ID_Ingredientes = ?`,
      [idNum]
    );

    if (rows.length === 0) return res.status(404).json({ error: MSGS.ingredienteNaoEncontrado });

    // Busca receitas que usam o ingrediente
    const [relacoes] = await db.query(
      `SELECT r.ID_Receita, r.Nome_Receita, r.ID_Usuario
       FROM ingredientes_receita ir
       JOIN receitas r ON r.ID_Receita = ir.ID_Receita
       WHERE ir.ID_Ingredientes = ?`,
      [idNum]
    );

    if (role === Roles.FUNCIONARIO && relacoes.length > 0) {
      return res.status(403).json({
        error: 'Ingrediente em uso por receitas. Funcionário só pode excluir ingredientes obsoletos (sem receitas).',
        receitas: relacoes,
        total: relacoes.length
      });
    }

    // Remove relações com receitas
    await db.query(`DELETE FROM ingredientes_receita WHERE ID_Ingredientes = ?`, [idNum]);

    // Remove dados associados
    await db.query(`DELETE FROM preco WHERE ID_Ingrediente = ?`, [idNum]);
    await db.query(`DELETE FROM historico_alteracoes WHERE ID_Ingrediente = ?`, [idNum]);
    await db.query(`DELETE FROM ingredientes WHERE ID_Ingredientes = ?`, [idNum]);

    // Recalcula custo das receitas afetadas após remoção do ingrediente
    for (const r of relacoes) {
      try {
        await calculaPrecoReceitaCompleto(
          r.ID_Receita,
          r.ID_Usuario,
          r.Porcentagem_De_Lucro || 0,
          r.Tempo_Preparo || 0
        );
      } catch (e) {
        console.warn('Falha ao recalcular receita', r.ID_Receita, e.message);
      }
    }

    res.status(200).json({ message: 'Ingrediente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir ingrediente:', error);
    res.status(500).json({ error: MSGS.erroExcluir });
  }
});

export default router;
