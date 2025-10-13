import express from 'express';
import db from '../database/connection.js';

const router = express.Router();

router.get('/underused', async (req, res) => {
    const userId = req.query.usuario;
    if (!userId) return res.status(400).json({ error: 'Usuário não informado' });

    try {
        // 1. Ingredientes cadastrados pelo usuário
        const [ingredientes] = await db.execute(`
            SELECT ID_Ingredientes AS ID, Nome_Ingrediente AS name, Categoria AS category
            FROM ingredientes
            WHERE ID_Usuario = ?
        `, [userId]);
        console.log('Ingredientes cadastrados:', ingredientes);

        // 2. Ingredientes utilizados em receitas do usuário (únicos)
        const [ingredientesUsados] = await db.execute(`
            SELECT DISTINCT i.Nome_Ingrediente AS name
            FROM ingredientes_receita ir
            JOIN ingredientes i ON ir.ID_Ingredientes = i.ID_Ingredientes
            JOIN receitas r ON ir.ID_Receita = r.ID_Receita
            WHERE r.ID_Usuario = ?
        `, [userId]);
        console.log('Ingredientes usados em receitas:', ingredientesUsados);

        // 3. Set para nomes dos ingredientes usados
        const nomesUsados = new Set(ingredientesUsados.map(i => i.name));
        console.log('Nomes dos ingredientes usados:', nomesUsados);

        // 4. Buscar todas as receitas com seus ingredientes
        const [receitasRaw] = await db.execute(`
            SELECT r.Nome_Receita AS name, i.Nome_Ingrediente AS ingredientName
            FROM receitas r
            JOIN ingredientes_receita ir ON r.ID_Receita = ir.ID_Receita
            JOIN ingredientes i ON ir.ID_Ingredientes = i.ID_Ingredientes
            WHERE r.ID_Usuario = ?
        `, [userId]);
        console.log('Receitas e ingredientes brutos:', receitasRaw);

        // 5. Mapear receitas com lista de ingredientes
        const receitasMap = {};
        receitasRaw.forEach(({ name, ingredientName }) => {
            if (!receitasMap[name]) receitasMap[name] = [];
            receitasMap[name].push({ name: ingredientName });
        });
        console.log('Receitas mapeadas:', receitasMap);

        const recipes = Object.entries(receitasMap).map(([name, ingredients]) => ({
            name,
            ingredients
        }));
        console.log('Recipes array:', recipes);

        // 6. Resposta com ingredientes cadastrados e receitas com ingredientes
        res.json({
            ingredients: ingredientes,
            recipes
        });

    } catch (err) {
        console.error('Erro ao buscar dados de subutilização:', err);
        res.status(500).json({ error: 'Erro interno do servidor', details: err.message, stack: err.stack });
    }
});

export default router;
