// routes/CategoriasReceitas.js
import express from 'express';
import db from '../database/connection.js';
import { proprietarioOuGerente } from '../middleware/permissions.js';
import { ALLOWED_RECIPE_CATEGORIES } from '../utils/constants.js';

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
    // Mapeia apenas categorias permitidas e inclui zero para ausentes
    const countsMap = new Map();
    if (Array.isArray(results)) {
      for (const row of results) {
        const name = String(row.name || '').trim();
        const value = Number(row.value) || 0;
        if (ALLOWED_RECIPE_CATEGORIES.includes(name)) {
          countsMap.set(name, value);
        }
      }
    }
    const payload = ALLOWED_RECIPE_CATEGORIES.map(cat => ({
      name: cat,
      value: countsMap.get(cat) || 0
    }));
    return res.status(200).json(payload);
  } catch (error) {
    console.error('Erro ao buscar categorias de receitas:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

// Endpoint auxiliar: lista de categorias permitidas (sem contagem)
router.get('/categorias/permitidas', proprietarioOuGerente, (req, res) => {
  return res.status(200).json(ALLOWED_RECIPE_CATEGORIES);
});

export default router;
