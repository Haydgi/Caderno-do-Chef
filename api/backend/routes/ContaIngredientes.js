// routes/IngredientCount.js
import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

router.get('/ContaIngredientes', async (req, res) => {
  const idUsuario = req.query.usuario;

  if (!idUsuario) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' });
  }

  try {
    const query = `
      SELECT COUNT(DISTINCT Nome_Ingrediente) AS count
      FROM ingredientes
      WHERE ID_Usuario = ?
    `;

    const [results] = await db.query(query, [idUsuario]);
    const count = results[0]?.count || 0;

    res.json({ count });
  } catch (error) {
    console.error('Erro ao buscar contagem de ingredientes:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

export default router;
