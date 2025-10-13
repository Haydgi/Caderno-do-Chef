// backend/routes/recipes.js
import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

router.get('/Tempomedio', async (req, res) => {
  const idUsuario = req.query.usuario;

  if (!idUsuario) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' });
  }

  try {
    // Consulta para obter média de tempo por categoria para o usuário
    const query = `
      SELECT 
        Categoria AS category,
        ROUND(AVG(Tempo_Preparo), 0) AS avgTime
      FROM receitas
      WHERE ID_Usuario = ?
      GROUP BY Categoria
      ORDER BY avgTime DESC
    `;

    const [results] = await db.query(query, [idUsuario]);
    res.json(results);
  } catch (error) {
    console.error('Erro ao buscar tempo médio por categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

export default router;
