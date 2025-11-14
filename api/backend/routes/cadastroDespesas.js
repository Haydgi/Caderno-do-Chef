import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../database/connection.js';
import multer from 'multer';
import { atualizaReceitasPorDespesa, limparCacheDespesas } from './atualizaReceitas.js'; // ajuste o caminho conforme seu projeto


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

// Middleware de autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: MSGS.tokenNaoFornecido });
  }

  jwt.verify(token, process.env.SECRET_JWT, async (err, usuario) => {
    if (err) {
      return res.status(403).json({ error: MSGS.tokenInvalido });
    }
    
    try {
      // Buscar o papel do usuário no banco
      const [usuarios] = await db.query(
        'SELECT tipo_usuario FROM usuario WHERE ID_Usuario = ?',
        [usuario.ID_Usuario]
      );
      
      if (usuarios.length === 0) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }
      
      req.usuario = {
        ...usuario,
        role: usuarios[0].tipo_usuario
      };
      next();
    } catch (dbError) {
      console.error('Erro ao buscar papel do usuário:', dbError);
      return res.status(500).json({ error: 'Erro ao validar permissões' });
    }
  });
}

// Middleware de permissão: apenas Proprietário ou Gerente podem modificar
function proprietarioOuGerente(req, res, next) {
  if (req.usuario.role !== 'Proprietário' && req.usuario.role !== 'Gerente') {
    return res.status(403).json({ error: 'Acesso negado. Apenas proprietários e gerentes podem modificar despesas.' });
  }
  next();
}

// Função auxiliar de validação
function validarCampos(nome, custoMensal, tempoOperacional) {
  nome = nome?.trim();
  if (!nome || typeof nome !== 'string' || nome.length < 2) return false;
  if (isNaN(custoMensal) || custoMensal <= 0) return false;
  if (isNaN(tempoOperacional) || tempoOperacional <= 0) return false;
  return true;
}

// POST - Cadastrar despesa (Proprietário e Gerente)
router.post('/', authenticateToken, proprietarioOuGerente, upload.none(), async (req, res) => {
  let { nome, custoMensal, tempoOperacional } = req.body;
  const ID_Usuario = req.usuario.ID_Usuario;

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
router.get('/', authenticateToken, proprietarioOuGerente, async (req, res) => {
  const ID_Usuario = req.usuario.ID_Usuario;
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    let sql = `
      SELECT ID_Despesa, Nome_Despesa, Custo_Mensal, Tempo_Operacional, Data_Despesa
      FROM despesas
      WHERE ID_Usuario = ?
    `;
    const params = [ID_Usuario];

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
router.put('/:id', authenticateToken, proprietarioOuGerente, express.urlencoded({ extended: true }), async (req, res) => {
  let { nome, custoMensal, tempoOperacional } = req.body;
  const { id } = req.params;
  const ID_Usuario = req.usuario.ID_Usuario;

  const idNum = Number(id);
  if (isNaN(idNum)) {
    return res.status(400).json({ error: MSGS.idInvalido });
  }

  if (!validarCampos(nome, custoMensal, tempoOperacional)) {
    return res.status(400).json({ error: MSGS.camposFaltando });
  }

  try {
    const [rows] = await db.query(
      `SELECT ID_Usuario FROM despesas WHERE ID_Despesa = ?`,
      [idNum]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: MSGS.despesaNaoEncontrada });
    }

    if (rows[0].ID_Usuario !== ID_Usuario) {
      return res.status(403).json({ error: MSGS.naoAutorizado });
    }

    await db.query(
      `UPDATE despesas
       SET Nome_Despesa = ?, Custo_Mensal = ?, Tempo_Operacional = ?
       WHERE ID_Despesa = ?`,
      [nome.trim(), custoMensal, tempoOperacional, idNum]
    );

    limparCacheDespesas(ID_Usuario); // Limpa o cache antes de recalcular

    console.log(`[PUT] Despesa atualizada para usuário ${ID_Usuario}. Recalculando receitas...`);
    await atualizaReceitasPorDespesa(ID_Usuario);

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
router.delete('/:id', authenticateToken, proprietarioOuGerente, async (req, res) => {
  const { id } = req.params;
  const ID_Usuario = req.usuario.ID_Usuario;

  const idNum = Number(id);
  if (isNaN(idNum)) {
    return res.status(400).json({ error: MSGS.idInvalido });
  }

  try {
    const [rows] = await db.query(
      `SELECT ID_Usuario FROM despesas WHERE ID_Despesa = ?`,
      [idNum]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: MSGS.despesaNaoEncontrada });
    }

    if (rows[0].ID_Usuario !== ID_Usuario) {
      return res.status(403).json({ error: MSGS.naoAutorizado });
    }

    await db.query(`DELETE FROM despesas WHERE ID_Despesa = ?`, [idNum]);

    limparCacheDespesas(ID_Usuario); // Limpa o cache antes de recalcular

    console.log(`[DELETE] Despesa excluída para usuário ${ID_Usuario}. Recalculando receitas...`);
    await atualizaReceitasPorDespesa(ID_Usuario);

    res.status(200).json({ message: 'Despesa excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir despesa:', error);
    res.status(500).json({ error: MSGS.erroExcluir });
  }
});

export default router;
