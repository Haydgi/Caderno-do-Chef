import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

router.get('/', async (req, res) => {
  // Preferir o ID do usuário vindo do middleware JWT
  const userId = req.user?.ID_Usuario || req.query.usuario;

  if (!userId) {
    return res.status(400).json({ error: 'Usuário não informado' });
  }

  const query = `
    SELECT 
      Nome_Ingrediente AS name,
      Indice_de_Desperdicio AS wasteRate,
      Data_Ingrediente AS createdAt
    FROM ingredientes
    WHERE ID_Usuario = ?
    ORDER BY Data_Ingrediente DESC
  `;

  try {
    const [results] = await db.query(query, [userId]);
    res.json(results);
  } catch (error) {
    console.error('Erro ao buscar dados de desperdício:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de desperdício' });
  }
});

export default router;
