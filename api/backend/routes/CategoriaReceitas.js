// routes/CategoriasReceitas.js
import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

router.get('/categorias', async (req, res) => {
  const idUsuario = req.query.usuario;

  if (!idUsuario) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' });
  }

  try {
    const query = `
      SELECT Categoria AS name, COUNT(*) AS value
      FROM receitas
      WHERE ID_Usuario = ?
      GROUP BY Categoria
    `;

    const [results] = await db.query(query, [idUsuario]);
    res.json(results);
  } catch (error) {
    console.error('Erro ao buscar categorias de receitas:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

export default router;
