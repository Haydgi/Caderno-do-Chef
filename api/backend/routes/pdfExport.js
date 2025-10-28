import express from 'express';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../database/connection.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10 MB

router.post('/export-dashboard', async (req, res) => {
  try {
    const { ingredientes, userId } = req.body;

    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      return res.status(400).json({ error: 'Nenhum ingrediente selecionado' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Usuário não informado' });
    }

    console.log('PDF Export requested for ingredients:', ingredientes);
    console.log('User ID:', userId);

    const sections = [];

    for (const rawName of ingredientes) {
      const nome = typeof rawName === 'string' ? rawName.trim() : '';

      if (!nome) {
        continue;
      }

      try {
        const [ingredientRows] = await db.execute(
          `SELECT ID_Ingredientes 
           FROM ingredientes 
           WHERE Nome_Ingrediente = ? AND ID_Usuario = ?`,
          [nome, userId]
        );

        if (ingredientRows.length === 0) {
          sections.push({
            nome,
            historico: [],
            message: 'Ingrediente não encontrado para este usuário.'
          });
          continue;
        }

        const idIngrediente = ingredientRows[0].ID_Ingredientes;

        const [historicoRows] = await db.execute(
          `SELECT 
             h.Preco AS costPerUnit,
             h.Taxa_Desperdicio AS wasteRate,
             h.Data_Alteracoes AS createdAt
           FROM historico_alteracoes h
           WHERE h.ID_Ingrediente = ? AND h.ID_Usuario = ?
           ORDER BY h.Data_Alteracoes ASC`,
          [idIngrediente, userId]
        );

        sections.push({
          nome,
          historico: historicoRows.map((row) => ({
            createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
            costPerUnit: row.costPerUnit !== null ? Number(row.costPerUnit) : null,
            wasteRate: row.wasteRate !== null ? Number(row.wasteRate) : null
          }))
        });
      } catch (dbError) {
        console.error(`Erro ao consultar dados para ${nome}:`, dbError);
        sections.push({
          nome,
          historico: [],
          message: 'Erro ao buscar dados deste ingrediente.'
        });
      }
    }

    if (sections.length === 0) {
      return res.status(400).json({ error: 'Nenhum ingrediente válido para exportar.' });
    }

    const tempDir = path.resolve(__dirname, '../../temp');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      sections
    };

    const payloadPath = path.resolve(tempDir, `payload_${Date.now()}.json`);
    fs.writeFileSync(payloadPath, JSON.stringify(payload), 'utf8');

    const phpScriptPath = path.resolve(__dirname, '../../phpapi/export-dashboard.php');
    console.log(`Executing PHP export script with payload: ${payloadPath}`);

    exec(`php "${phpScriptPath}" "${payloadPath}"`, { encoding: 'binary', maxBuffer: MAX_BUFFER_SIZE }, (error, stdout, stderr) => {
      if (fs.existsSync(payloadPath)) {
        fs.unlinkSync(payloadPath);
      }

      if (error) {
        console.error('PHP execution error:', error);
        const message = stderr && stderr.trim() ? stderr.trim() : error.message;
        return res.status(500).json({ error: `Erro ao gerar PDF: ${message}` });
      }

      if (stderr && stderr.trim()) {
        console.error('PHP stderr:', stderr);
        return res.status(500).json({ error: `Erro na geração do PDF: ${stderr.trim()}` });
      }

      if (!stdout || stdout.length < 100) {
        console.error('Empty or small PDF output. Length:', stdout ? stdout.length : 0);
        return res.status(500).json({ error: 'PDF output is empty or invalid' });
      }

      console.log('PDF generated successfully. Size:', stdout.length, 'bytes');

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio_ingredientes_${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', Buffer.byteLength(stdout, 'binary'));
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

      return res.end(Buffer.from(stdout, 'binary'));
    });
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
});

export default router;