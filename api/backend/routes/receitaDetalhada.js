import express from 'express';
import db from '../database/connection.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware de autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, process.env.SECRET_JWT, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });

    if (!decoded?.ID_Usuario)
      return res.status(403).json({ error: 'Token malformado - ID_Usuario não encontrado' });

    req.usuario = { ID_Usuario: decoded.ID_Usuario };
    next();
  });
}

// GET /:id - Buscar receita com ingredientes detalhados
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const ID_Usuario = req.usuario.ID_Usuario;
  const idNum = Number(id);

  if (isNaN(idNum) || idNum <= 0) {
    return res.status(400).json({ error: "ID inválido." });
  }

  try {
    // Buscar dados da receita - todos os usuários autenticados podem visualizar
    const [receitaRows] = await db.query(
      `SELECT * FROM receitas WHERE ID_Receita = ?`,
      [idNum]
    );

    if (receitaRows.length === 0) {
      return res.status(404).json({ error: "Receita não encontrada." });
    }

    const receita = receitaRows[0];

    // Buscar ingredientes associados à receita
    const [ingredientesRows] = await db.query(
      `SELECT ir.ID_Ingredientes, ir.Quantidade_Utilizada, ir.Unidade_De_Medida, 
              i.Nome_Ingrediente, i.Custo_Ingrediente, i.Indice_de_Desperdicio
         FROM ingredientes_receita ir
         JOIN ingredientes i ON ir.ID_Ingredientes = i.ID_Ingredientes
        WHERE ir.ID_Receita = ?`,
      [idNum]
    );

    // Enviar receita com ingredientes
    return res.status(200).json({
      ...receita,
      ingredientes: ingredientesRows
    });
  } catch (error) {
    console.error('Erro ao buscar receita detalhada:', error);
    return res.status(500).json({ error: "Erro ao buscar receita detalhada", details: error.message });
  }
});

// PUT /:id/ingredientes - Atualizar ingredientes da receita
router.put('/:id/ingredientes', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const ID_Usuario = req.usuario.ID_Usuario;
  const idReceita = Number(id);

  if (isNaN(idReceita) || idReceita <= 0) {
    return res.status(400).json({ error: "ID da receita inválido." });
  }

  let { ingredientes } = req.body;

  if (!Array.isArray(ingredientes)) {
    return res.status(400).json({ error: "Array de ingredientes é obrigatório." });
  }

  try {
    // Verificar se a receita pertence ao usuário
    const [receitaRows] = await db.query(
      `SELECT ID_Usuario FROM receitas WHERE ID_Receita = ?`,
      [idReceita]
    );

    if (receitaRows.length === 0) {
      return res.status(404).json({ error: "Receita não encontrada." });
    }
    if (receitaRows[0].ID_Usuario !== ID_Usuario) {
      return res.status(403).json({ error: "Não autorizado a alterar esta receita." });
    }

    // Atualizar cada ingrediente
    await Promise.all(
      ingredientes.map(async (ingrediente) => {
        let { ID_Ingredientes, Quantidade_Utilizada, Unidade_De_Medida } = ingrediente;

        if (!ID_Ingredientes || isNaN(ID_Ingredientes)) {
          throw new Error("ID_Ingredientes inválido.");
        }

        if (!Quantidade_Utilizada || isNaN(Quantidade_Utilizada)) {
          throw new Error("Quantidade_Utilizada inválida.");
        }

        await db.query(
          `UPDATE ingredientes_receita 
           SET Quantidade_Utilizada = ?, Unidade_De_Medida = ? 
           WHERE ID_Receita = ? AND ID_Ingredientes = ?`,
          [Quantidade_Utilizada, Unidade_De_Medida || null, idReceita, ID_Ingredientes]
        );
      })
    );

    return res.status(200).json({ message: "Ingredientes atualizados com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar ingredientes:", error);
    return res.status(500).json({ error: "Erro ao atualizar ingredientes.", details: error.message });
  }
});

export default router;
