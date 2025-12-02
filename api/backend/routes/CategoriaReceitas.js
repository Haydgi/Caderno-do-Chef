// routes/CategoriasReceitas.js
import express from 'express';
import db from '../database/connection.js';
import { proprietarioOuGerente } from '../middleware/permissions.js';

const router = express.Router();

router.get('/categorias', proprietarioOuGerente, async (req, res) => {
  console.log('🔍 CategoriaReceitas - req.query:', req.query);
  console.log('🔍 CategoriaReceitas - req.user:', req.user);
  
  const idUsuario = req.query.usuario;

  if (!idUsuario) {
    console.log('❌ ID do usuário ausente na query string');
    return res.status(400).json({ error: 'ID do usuário é obrigatório' });
  }

  try {
    const query = `
      SELECT Categoria AS name, COUNT(*) AS value
      FROM receitas
      WHERE ID_Usuario = ? AND Categoria IS NOT NULL AND Categoria <> ''
      GROUP BY Categoria
    `;

    const [results] = await db.query(query, [idUsuario]);
    // Se não houver resultados, retorna array vazio com 200 para evitar erro no gráfico
    if (!Array.isArray(results) || results.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(results);
  } catch (error) {
    console.error('Erro ao buscar categorias de receitas:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

export default router;
