import express from 'express';
import db from "../database/connection.js";
import { proprietarioOuGerente } from '../middleware/permissions.js';

const router = express.Router();

router.get('/lucros', proprietarioOuGerente, async (req, res) => {
  const idUsuario = req.query.usuario;

  if (!idUsuario) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' });
  }

  const query = `
    SELECT 
      ID_Receita,
      Nome_Receita,
      Custo_Total_Ingredientes,
      Porcentagem_De_Lucro,
      ROUND(Custo_Total_Ingredientes * (1 + Porcentagem_De_Lucro / 100), 2) AS Preco_Venda_Estimado
    FROM receitas
    WHERE ID_Usuario = ?
  `;

  try {
    const [results] = await db.query(query, [idUsuario]);
    res.json(results);
  } catch (error) {
    console.error('Erro ao buscar lucros das receitas:', error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

export default router;
