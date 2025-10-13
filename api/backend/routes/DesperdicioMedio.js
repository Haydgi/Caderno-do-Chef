import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

router.get('/media', async (req, res) => {
  const idUsuario = req.query.usuario;

  console.log('ID usuário:', idUsuario);

  if (!idUsuario) {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' });
  }

  try {
    const [results] = await db.query(
      `SELECT AVG(Indice_de_Desperdicio) AS mediaDesperdicio FROM ingredientes WHERE ID_Usuario = ?`,
      [idUsuario]
    );
    console.log('Query results:', results);

    const media = results[0]?.mediaDesperdicio ?? 0;
    res.json({ media: parseFloat(media.toFixed(1)) });
  } catch (error) {
    console.error('Erro ao calcular desperdício médio:', error);
    res.status(500).json({ error: 'Erro ao calcular desperdício médio' });
  }
});

export default router;
