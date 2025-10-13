import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

router.get('/ContaReceita', async (req, res) => {
  const idUsuario = req.query.usuario;

  if (!idUsuario) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' });
  }

  try {
    const query = `
      SELECT COUNT(DISTINCT Nome_Receita) AS totalReceitas
      FROM receitas
      WHERE ID_Usuario = ?
    `;

    const [results] = await db.query(query, [idUsuario]);

    const total = results[0]?.totalReceitas || 0;

    res.json({ total });
  } catch (error) {
    console.error('Erro ao buscar contagem de receitas:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

export default router;
