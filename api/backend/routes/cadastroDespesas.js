import express from 'express';
import db from '../database/connection.js';
import multer from 'multer';
import { atualizaReceitasPorDespesa, limparCacheDespesas, atualizaReceitasTodasDespesas } from './atualizaReceitas.js'; // ajuste o caminho conforme seu projeto
import { gerenteOuAcima } from '../middleware/permissions.js';

const router = express.Router();
const upload = multer();

const MSGS = {
  camposFaltando: 'Campos obrigatórios faltando ou inválidos',
  erroCadastro: 'Erro ao cadastrar despesa',
  erroAtualizar: 'Erro ao atualizar despesa',
  erroExcluir: 'Erro ao excluir despesa',
  erroBuscar: 'Erro ao buscar despesas',
  despesaNaoEncontrada: 'Despesa não encontrada',
  naoAutorizado: 'Não autorizado a alterar esta despesa',
  tokenNaoFornecido: 'Token não fornecido',
  tokenInvalido: 'Token inválido',
  idInvalido: 'ID inválido',
};

// Observação: autenticação e roles (req.user) são aplicadas em index.js

// Função auxiliar de validação
function validarCampos(nome, custoMensal, tempoOperacional) {
  nome = nome?.trim();
  if (!nome || typeof nome !== 'string' || nome.length < 2) return false;
  if (isNaN(custoMensal) || custoMensal <= 0) return false;
  if (isNaN(tempoOperacional) || tempoOperacional <= 0) return false;
  return true;
}

// POST - Cadastrar despesa (Proprietário e Gerente)
router.post('/', gerenteOuAcima, async (req, res) => {
  let { nome, custoMensal, tempoOperacional } = req.body;
  const ID_Usuario = req.user.ID_Usuario;

  if (!validarCampos(nome, custoMensal, tempoOperacional)) {
    return res.status(400).json({ error: MSGS.camposFaltando });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO despesas
       (Nome_Despesa, Custo_Mensal, Tempo_Operacional, ID_Usuario, Data_Despesa)
       VALUES (?, ?, ?, ?, NOW())`,
      [nome.trim(), custoMensal, tempoOperacional, ID_Usuario]
    );

    limparCacheDespesas(ID_Usuario); // Limpa o cache antes de recalcular

    console.log(`[POST] Despesa cadastrada para usuário ${ID_Usuario}. Recalculando receitas...`);
    await atualizaReceitasPorDespesa(ID_Usuario);

    res.status(201).json({
      id: result.insertId,
      nome,
      custoMensal,
      tempoOperacional,
    });
  } catch (error) {
    console.error('Erro ao cadastrar despesa:', error);
    res.status(500).json({ error: MSGS.erroCadastro });
  }
});

// GET - Listar despesas com paginação e filtro de busca (Proprietário e Gerente)
// GET global - listar todas as despesas (sem filtro por usuário) para Gerente ou acima
// GET /calculo - Retorna apenas dados necessários para cálculos (todos os usuários autenticados)
router.get('/calculo', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT Custo_Mensal, Tempo_Operacional FROM despesas ORDER BY Data_Despesa DESC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar despesas para cálculo:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de despesas' });
  }
});

router.get('/', gerenteOuAcima, async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;
  try {
    let sql = `SELECT ID_Despesa, Nome_Despesa, Custo_Mensal, Tempo_Operacional, Data_Despesa, ID_Usuario FROM despesas WHERE 1=1`;
    const params = [];
    if (search.trim()) {
      sql += ` AND Nome_Despesa LIKE ?`;
      params.push(`%${search.trim()}%`);
    }
    sql += ` ORDER BY Data_Despesa DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));
    const [rows] = await db.query(sql, params);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao buscar despesas:', error);
    res.status(500).json({ error: MSGS.erroBuscar });
  }
});

// PUT - Atualizar despesa
router.put('/:id', gerenteOuAcima, async (req, res) => {
  let { nome, custoMensal, tempoOperacional } = req.body;
  const { id } = req.params;
  const ID_Usuario = req.user.ID_Usuario;

  const idNum = Number(id);
  if (isNaN(idNum)) {
    return res.status(400).json({ error: MSGS.idInvalido });
  }

  if (!validarCampos(nome, custoMensal, tempoOperacional)) {
    return res.status(400).json({ error: MSGS.camposFaltando });
  }

  try {
    const [rows] = await db.query(`SELECT ID_Usuario FROM despesas WHERE ID_Despesa = ?`, [idNum]);
    if (rows.length === 0) return res.status(404).json({ error: MSGS.despesaNaoEncontrada });

    await db.query(
      `UPDATE despesas
       SET Nome_Despesa = ?, Custo_Mensal = ?, Tempo_Operacional = ?
       WHERE ID_Despesa = ?`,
      [nome.trim(), custoMensal, tempoOperacional, idNum]
    );

  // Recalcula para todos os usuários (despesas globais)
  console.log(`[PUT] Despesa ${idNum} atualizada. Recalculando receitas globais...`);
  await atualizaReceitasTodasDespesas();

    res.status(200).json({
      id: idNum,
      nome,
      custoMensal,
      tempoOperacional,
      message: 'Despesa atualizada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    res.status(500).json({ error: MSGS.erroAtualizar });
  }
});

// DELETE - Excluir despesa
router.delete('/:id', gerenteOuAcima, async (req, res) => {
  const { id } = req.params;
  const ID_Usuario = req.user.ID_Usuario;

  const idNum = Number(id);
  if (isNaN(idNum)) {
    return res.status(400).json({ error: MSGS.idInvalido });
  }

  try {
    const [rows] = await db.query(`SELECT ID_Usuario FROM despesas WHERE ID_Despesa = ?`, [idNum]);
    if (rows.length === 0) return res.status(404).json({ error: MSGS.despesaNaoEncontrada });

    await db.query(`DELETE FROM despesas WHERE ID_Despesa = ?`, [idNum]);

  console.log(`[DELETE] Despesa ${idNum} excluída. Recalculando receitas globais...`);
  await atualizaReceitasTodasDespesas();

    res.status(200).json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir despesa:', error);
    res.status(500).json({ error: MSGS.erroExcluir });
  }
});

export default router;
