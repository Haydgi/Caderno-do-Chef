import express from 'express';
import jwt from 'jsonwebtoken';
import db from "../database/connection.js";
import multer from 'multer';
import { calculaPrecoReceitaCompleto } from './atualizaReceitas.js';

const router = express.Router();
const upload = multer(); // Para multipart/form-data

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

// Middleware de autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: MSGS.tokenNaoFornecido });
  }

  jwt.verify(token, process.env.SECRET_JWT, async (err, usuario) => {
    if (err) return res.status(403).json({ error: MSGS.tokenInvalido });
    
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
    return res.status(403).json({ error: 'Acesso negado. Apenas proprietários e gerentes podem modificar ingredientes.' });
  }
  next();
}

// POST - Cadastrar ingrediente (protegida - Proprietário e Gerente)
router.post('/', authenticateToken, proprietarioOuGerente, upload.none(), async (req, res) => {
  const {
    nome = null,
    unidadeDeMedida = null,
    custo = null,
    indiceDeDesperdicio = null,
    categoria = null
  } = req.body;

  const ID_Usuario = req.usuario.ID_Usuario;

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
router.get('/', authenticateToken, async (req, res) => {
  const ID_Usuario = req.usuario.ID_Usuario;
  const { page = 1, limit = 10, search = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    let sql = `
      SELECT ID_Ingredientes, Nome_Ingrediente, Unidade_De_Medida, Custo_Ingrediente, Indice_de_Desperdicio, Categoria, Data_Ingrediente
      FROM ingredientes
      WHERE ID_Usuario = ?`;
    const params = [ID_Usuario];

    if (search.trim()) {
      sql += ` AND Nome_Ingrediente LIKE ?`;
      params.push(`%${search.trim()}%`);
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
router.put('/:id', authenticateToken, proprietarioOuGerente, upload.none(), async (req, res) => {
  const {
    nome = null,
    unidadeDeMedida = null,
    custo = null,
    indiceDeDesperdicio = null,
    categoria = null
  } = req.body;

  const { id } = req.params;
  const ID_Usuario = req.usuario.ID_Usuario;

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
    if (rows[0].ID_Usuario !== ID_Usuario) return res.status(403).json({ error: MSGS.naoAutorizado });

    // Busca último histórico
    const [ultimoHistorico] = await db.query(
      `SELECT Preco, Taxa_Desperdicio
       FROM historico_alteracoes
       WHERE ID_Ingrediente = ? AND ID_Usuario = ?
       ORDER BY Data_Alteracoes DESC LIMIT 1`,
      [idNum, ID_Usuario]
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
      await db.query(
        `UPDATE preco
         SET Custo_Unitario = ?, Unidade_Medida = ?, ID_Historico = ?
         WHERE ID_Ingrediente = ? AND ID_Usuario = ?
         ORDER BY ID_Historico DESC
         LIMIT 1`,
        [custo, unidadeDeMedida, historicoResult.insertId, idNum, ID_Usuario]
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
router.delete('/:id', authenticateToken, proprietarioOuGerente, async (req, res) => {
  const { id } = req.params;
  const ID_Usuario = req.usuario.ID_Usuario;

  const idNum = Number(id);
  if (isNaN(idNum)) return res.status(400).json({ error: MSGS.idInvalido });

  try {
    const [rows] = await db.query(
      `SELECT ID_Usuario FROM ingredientes WHERE ID_Ingredientes = ?`,
      [idNum]
    );

    if (rows.length === 0) return res.status(404).json({ error: MSGS.ingredienteNaoEncontrado });
    if (rows[0].ID_Usuario !== ID_Usuario) return res.status(403).json({ error: MSGS.naoAutorizado });

    await db.query(`DELETE FROM preco WHERE ID_Ingrediente = ?`, [idNum]);
    await db.query(`DELETE FROM historico_alteracoes WHERE ID_Ingrediente = ?`, [idNum]);
    await db.query(`DELETE FROM ingredientes WHERE ID_Ingredientes = ?`, [idNum]);

    res.status(200).json({ message: 'Ingrediente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir ingrediente:', error);
    res.status(500).json({ error: MSGS.erroExcluir });
  }
});

export default router;
