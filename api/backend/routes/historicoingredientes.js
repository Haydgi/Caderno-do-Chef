import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

// Novo: histórico por query ?nome= e usuário do token
router.get('/', async (req, res) => {
  try {
    const nome = req.query.nome;
    const usuarioId = req.user?.ID_Usuario || req.query.usuarioId;

    if (!nome) return res.status(400).json({ error: 'Parâmetro nome é obrigatório.' });
    if (!usuarioId) return res.status(400).json({ error: 'Usuário não informado.' });

    // 1. Buscar o ID do ingrediente baseado no nome e ID do usuário
    const [ingredienteRows] = await db.execute(
      `SELECT ID_Ingredientes 
       FROM ingredientes 
       WHERE Nome_Ingrediente = ? AND ID_Usuario = ?`,
      [nome, usuarioId]
    );

    if (ingredienteRows.length === 0) {
      return res.status(404).json({ error: 'Ingrediente não encontrado para este usuário.' });
    }

    const idIngrediente = ingredienteRows[0].ID_Ingredientes;

    // 2. Buscar o histórico do ingrediente pelo ID encontrado
    const [historicoRows] = await db.execute(
      `SELECT 
         ? AS name,
         h.Preco AS costPerUnit,
         h.Taxa_Desperdicio AS wasteRate,
         h.Data_Alteracoes AS createdAt
       FROM historico_alteracoes h
       WHERE h.ID_Ingrediente = ? AND h.ID_Usuario = ?
       ORDER BY h.Data_Alteracoes ASC`,
      [nome, idIngrediente, usuarioId]
    );

    res.status(200).json(historicoRows);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico do ingrediente.' });
  }
});

// Rota para buscar histórico do ingrediente pelo nome e id do usuário
router.get('/:nome/:usuarioId', async (req, res) => {
  const { nome, usuarioId } = req.params;
  console.log('🔎 Buscando histórico para:', nome, 'do usuário:', usuarioId);

  try {
    // 1. Buscar o ID do ingrediente baseado no nome e ID do usuário
    const [ingredienteRows] = await db.execute(
      `SELECT ID_Ingredientes 
       FROM ingredientes 
       WHERE Nome_Ingrediente = ? AND ID_Usuario = ?`,
      [nome, usuarioId]
    );
    console.log('Resultado da busca do ingrediente:', ingredienteRows);

    if (ingredienteRows.length === 0) {
      return res.status(404).json({ error: 'Ingrediente não encontrado para este usuário.' });
    }

    const idIngrediente = ingredienteRows[0].ID_Ingredientes;

    // 2. Buscar o histórico do ingrediente pelo ID encontrado
    const [historicoRows] = await db.execute(
      `SELECT 
         ? AS name,
         h.Preco AS costPerUnit,
         h.Taxa_Desperdicio AS wasteRate,
         h.Data_Alteracoes AS createdAt
       FROM historico_alteracoes h
       WHERE h.ID_Ingrediente = ? AND h.ID_Usuario = ?
       ORDER BY h.Data_Alteracoes ASC`,
      [nome, idIngrediente, usuarioId]
    );
    console.log('Histórico encontrado:', historicoRows);

    res.status(200).json(historicoRows);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico do ingrediente.' });
  }
});

export default router;
