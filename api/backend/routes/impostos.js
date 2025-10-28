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
      console.error('JWT verify error:', err);
      return res.status(401).json({ error: MSGS.tokenInvalido });
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

// PUT - Atualizar imposto
router.put('/:id', authenticateToken, express.urlencoded({ extended: true }), async (req, res) => {
  const { id } = req.params;
  const { Nome_Imposto, Categoria_Imposto, Frequencia, Valor_Medio } = req.body;
  const ID_Usuario = req.usuario.ID_Usuario;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: MSGS.idInvalido });
  }

  const connection = await db.getConnection();

  try {
    // Confirma existência e pertencimento
    const [rows] = await connection.query('SELECT ID_Imposto, ID_Usuario FROM impostos WHERE ID_Imposto = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: MSGS.impostoNaoEncontrado });
    }
    if (rows[0].ID_Usuario !== ID_Usuario) {
      return res.status(403).json({ error: MSGS.naoAutorizado });
    }

    await connection.beginTransaction();

    let novoValorMedio = null;

    // Se foi enviado um novo valor, registra no histórico e recalcula média
    if (Valor_Medio !== undefined && Valor_Medio !== null && !isNaN(Number(Valor_Medio))) {
      await connection.query(
        'INSERT INTO historico_impostos (ID_Imposto, Valor, Data_Registro) VALUES (?, ?, NOW())',
        [id, Number(Valor_Medio)]
      );

      const [historico] = await connection.query(
        'SELECT AVG(Valor) as media FROM historico_impostos WHERE ID_Imposto = ?',
        [id]
      );
      novoValorMedio = historico[0].media;
    }

    // Atualiza campos disponíveis
    const camposParaAtualizar = [];
    const params = [];

    if (Nome_Imposto !== undefined) {
      camposParaAtualizar.push('Nome_Imposto = ?');
      params.push(Nome_Imposto);
    } else {
      params.push(null);
    }

    if (Categoria_Imposto !== undefined) {
      camposParaAtualizar.push('Categoria_Imposto = ?');
      params.push(Categoria_Imposto);
    } else {
      params.push(null);
    }

    if (Frequencia !== undefined) {
      camposParaAtualizar.push('Frequencia = ?');
      params.push(Frequencia);
    } else {
      params.push(null);
    }

    if (novoValorMedio !== null) {
      camposParaAtualizar.push('Valor_Medio = ?');
      params.push(novoValorMedio);
    }

    if (camposParaAtualizar.length > 0) {
      // Monta query dinamicamente com apenas os campos recebidos
      const sql = `UPDATE impostos SET ${camposParaAtualizar.join(', ')} WHERE ID_Imposto = ?`;
      params.push(id);
      await connection.query(sql, params.filter(p => p !== null));
    }

    await connection.commit();

    // Limpa cache e recalcula receitas/despesas impactadas
    limparCacheDespesas(ID_Usuario);
    await atualizaReceitasPorDespesa(ID_Usuario);

    // Recupera registro atualizado para retornar
    const [atualizado] = await db.query(
      'SELECT ID_Imposto, Nome_Imposto, Categoria_Imposto, Frequencia, Valor_Medio, Data_Atualizacao FROM impostos WHERE ID_Imposto = ?',
      [id]
    );

    res.status(200).json({
      id: atualizado[0].ID_Imposto,
      nome: atualizado[0].Nome_Imposto,
      categoria: atualizado[0].Categoria_Imposto,
      frequencia: atualizado[0].Frequencia,
      valorMedio: atualizado[0].Valor_Medio,
      Data_Atualizacao: atualizado[0].Data_Atualizacao
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao atualizar imposto:', error);
    res.status(500).json({ error: MSGS.erroAtualizar });
  } finally {
    connection.release();
  }
});

// DELETE - Remover imposto
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const ID_Usuario = req.usuario.ID_Usuario;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: MSGS.idInvalido });
  }

  const connection = await db.getConnection();

  try {
    // Verifica existência e propriedade
    const [rows] = await connection.query('SELECT ID_Imposto, ID_Usuario FROM impostos WHERE ID_Imposto = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: MSGS.impostoNaoEncontrado });
    }
    if (rows[0].ID_Usuario !== ID_Usuario) {
      return res.status(403).json({ error: MSGS.naoAutorizado });
    }

    await connection.beginTransaction();

    // Remove histórico e imposto
    await connection.query('DELETE FROM historico_impostos WHERE ID_Imposto = ?', [id]);
    await connection.query('DELETE FROM impostos WHERE ID_Imposto = ?', [id]);

    await connection.commit();

    // Limpa cache e recalcula receitas/despesas impactadas
    limparCacheDespesas(ID_Usuario);
    await atualizaReceitasPorDespesa(ID_Usuario);

    res.status(200).json({ message: 'Imposto excluído com sucesso' });
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao excluir imposto:', error);
    res.status(500).json({ error: MSGS.erroExcluir });
  } finally {
    connection.release();
  }
});

export default router;
