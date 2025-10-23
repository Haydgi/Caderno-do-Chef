import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../database/connection.js';
import { atualizaReceitasPorDespesa, limparCacheDespesas } from './atualizaReceitas.js';

const router = express.Router();

const MSGS = {
  camposFaltando: 'Campos obrigatórios faltando ou inválidos',
  erroCadastro: 'Erro ao cadastrar imposto',
  erroBuscar: 'Erro ao buscar impostos',
  erroExcluir: 'Erro ao excluir imposto',
  erroAtualizar: 'Erro ao atualizar imposto',
  impostoNaoEncontrado: 'Imposto não encontrado',
  naoAutorizado: 'Não autorizado',
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

  jwt.verify(token, process.env.SECRET_JWT, (err, usuario) => {
    if (err) {
      return res.status(403).json({ error: MSGS.tokenInvalido });
    }
    req.usuario = usuario;
    next();
  });
}

// POST - Cadastrar ou atualizar imposto
router.post('/', authenticateToken, express.json(), async (req, res) => {
  const { nome, categoria, frequencia, valor } = req.body;
  const ID_Usuario = req.usuario.ID_Usuario;

  if (!nome || !frequencia || !valor || valor <= 0) {
    return res.status(400).json({ error: MSGS.camposFaltando });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Verifica se o imposto já existe para o usuário
    let [imposto] = await connection.query(
      'SELECT ID_Imposto FROM impostos WHERE Nome_Imposto = ? AND ID_Usuario = ?',
      [nome, ID_Usuario]
    );

    let impostoId;

    if (imposto.length > 0) {
      // Imposto já existe, usa o ID existente
      impostoId = imposto[0].ID_Imposto;
    } else {
      // Imposto não existe, cria um novo
      const [result] = await connection.query(
        'INSERT INTO impostos (ID_Usuario, Nome_Imposto, Categoria_Imposto, Frequencia, Valor_Medio) VALUES (?, ?, ?, ?, ?)',
        [ID_Usuario, nome, categoria, frequencia, valor]
      );
      impostoId = result.insertId;
    }

    // Adiciona o novo valor ao histórico
    await connection.query(
      'INSERT INTO historico_impostos (ID_Imposto, Valor, Data_Registro) VALUES (?, ?, NOW())',
      [impostoId, valor]
    );

    // Recalcula a média dos valores
    const [historico] = await connection.query(
      'SELECT AVG(Valor) as media FROM historico_impostos WHERE ID_Imposto = ?',
      [impostoId]
    );
    const novaMedia = historico[0].media;

    // Atualiza o valor médio na tabela de impostos
    await connection.query(
      'UPDATE impostos SET Valor_Medio = ? WHERE ID_Imposto = ?',
      [novaMedia, impostoId]
    );

    await connection.commit();

    // Recalcula o custo das receitas (similar às despesas)
    limparCacheDespesas(ID_Usuario);
    await atualizaReceitasPorDespesa(ID_Usuario);

    res.status(201).json({
      id: impostoId,
      nome,
      categoria,
      frequencia,
      valor,
      valorMedio: novaMedia,
      message: 'Imposto cadastrado/atualizado com sucesso!',
    });

  } catch (error) {
    await connection.rollback();
    console.error('Erro ao cadastrar imposto:', error);
    res.status(500).json({ error: MSGS.erroCadastro });
  } finally {
    connection.release();
  }
});

// GET - Listar nomes dos impostos para autocomplete
router.get('/nomes', authenticateToken, async (req, res) => {
    const ID_Usuario = req.usuario.ID_Usuario;
    try {
        const [nomes] = await db.query(
            'SELECT DISTINCT Nome_Imposto FROM impostos WHERE ID_Usuario = ? ORDER BY Nome_Imposto ASC',
            [ID_Usuario]
        );
        res.status(200).json(nomes.map(i => i.Nome_Imposto));
    } catch (error) {
        console.error('Erro ao buscar nomes de impostos:', error);
        res.status(500).json({ error: MSGS.erroBuscar });
    }
});

// GET - Listar todos os impostos do usuário
router.get('/', authenticateToken, async (req, res) => {
    const ID_Usuario = req.usuario.ID_Usuario;
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        let sql = `
            SELECT ID_Imposto, Nome_Imposto, Categoria_Imposto, Frequencia, Valor_Medio, Data_Atualizacao
            FROM impostos
            WHERE ID_Usuario = ?
        `;
        const params = [ID_Usuario];

        if (search.trim()) {
            sql += ` AND Nome_Imposto LIKE ?`;
            params.push(`%${search.trim()}%`);
        }

        sql += ` ORDER BY Data_Atualizacao DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), Number(offset));

        const [rows] = await db.query(sql, params);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erro ao buscar impostos:', error);
        res.status(500).json({ error: MSGS.erroBuscar });
    }
});

export default router;
