import express from 'express';
import db from '../database/connection.js';
import PDFDocument from 'pdfkit-table';

const router = express.Router();

// Helper: format date
function formatDate(dateIso) {
  if (!dateIso) return '-';
  try {
    const d = new Date(dateIso);
    return d.toLocaleDateString('pt-BR');
  } catch (_) {
    return dateIso;
  }
}

router.post('/export-dashboard', async (req, res) => {
  try {
    const { ingredientes, userId } = req.body; // userId opcional agora, usado só como fallback

    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      return res.status(400).json({ error: 'Nenhum ingrediente selecionado' });
    }
    // Relatório deve incluir dados do sistema inteiro, independente do usuário.

    // Build sections similar to previous implementation
    const sections = [];
    for (const rawName of ingredientes) {
      const nome = typeof rawName === 'string' ? rawName.trim() : '';
      if (!nome) continue;
      try {
        // Primeira tentativa: buscar ingrediente globalmente
        let [ingredientRows] = await db.execute(
          `SELECT * FROM ingredientes WHERE LOWER(TRIM(Nome_Ingrediente)) = LOWER(TRIM(?)) LIMIT 1`,
          [nome]
        );
        // Fallback: se não encontrou global e veio userId, tenta por usuário
        if (ingredientRows.length === 0 && userId) {
          [ingredientRows] = await db.execute(
            `SELECT * FROM ingredientes WHERE LOWER(TRIM(Nome_Ingrediente)) = LOWER(TRIM(?)) AND ID_Usuario = ? LIMIT 1`,
            [nome, userId]
          );
        }
        if (ingredientRows.length === 0) {
          sections.push({ nome, historico: [], message: 'Ingrediente não encontrado.' });
          continue;
        }
        const ingRow = ingredientRows[0];
        const idIngrediente = ingRow.ID_Ingredientes;
        // Detecta unidade de medida considerando variações de coluna
        const unidadeMedida = (
          ingRow.Unidade_De_Medida ??
          ingRow.unidade_de_medida ??
          ingRow.Unidade_Medida ??
          ingRow.unidade_medida ??
          ingRow.Unidade ??
          ingRow.unidade ??
          ingRow.UnidadeMedida ??
          ingRow.unidadeMedida ??
          ingRow.Tipo_Medida ??
          ingRow.tipo_medida ??
          ingRow.Medida ??
          ingRow.medida ??
          '-'
        );
        const [historicoRows] = await db.execute(
          `SELECT h.Preco AS costPerUnit, h.Taxa_Desperdicio AS wasteRate, h.Data_Alteracoes AS createdAt
           FROM historico_alteracoes h
           WHERE h.ID_Ingrediente = ?
           ORDER BY h.Data_Alteracoes ASC`,
          [idIngrediente]
        );
        sections.push({
          nome,
            unidade: unidadeMedida,
            historico: historicoRows.map(row => ({
            createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : row.createdAt,
            costPerUnit: row.costPerUnit !== null ? Number(row.costPerUnit) : null,
            // wasteRate removido do relatório conforme pedido
          }))
        });
      } catch (e) {
        console.error('Erro ao processar ingrediente', nome, e);
        sections.push({ nome, historico: [], message: 'Erro interno ao processar ingrediente.' });
      }
    }

    if (sections.length === 0) {
      return res.status(400).json({ error: 'Nenhum ingrediente válido para exportar.' });
    }

  // Create PDF
  const doc = new PDFDocument({ margin: 40 });
    const filename = `relatorio_ingredientes_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  // Pipe before writing content
  doc.pipe(res);

    // Stream errors
    doc.on('error', (err) => {
      console.error('Erro no PDF stream:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Falha ao gerar PDF' });
      }
    });

  doc.fontSize(18).fillColor('#4B0082').text('Relatório de Ingredientes', { align: 'center' });
    doc.moveDown(0.5);
    // Linha com Total (esquerda) e Data (direita)
    doc.fontSize(10).fillColor('black');
  const summaryLeft = `Total de ingredientes: ${sections.length}`;
  const summaryRight = `Gerado em: ${formatDate(new Date().toISOString())}`;
  const y = doc.y;
  const leftX = doc.page.margins.left;
  const rightX = doc.page.width - doc.page.margins.right - doc.widthOfString(summaryRight);
  doc.text(summaryLeft, leftX, y);
  doc.text(summaryRight, rightX, y);
  doc.moveDown();
  // Reset cursor to left margin so following content starts aligned left
  doc.x = doc.page.margins.left;

    for (let idx = 0; idx < sections.length; idx++) {
      const section = sections[idx];
      doc.fontSize(14).fillColor('#4B0082').text(section.nome);
      if (section.message && section.historico.length === 0) {
        doc.fontSize(10).fillColor('red').text(section.message);
      }
      if (section.historico.length === 0) {
        doc.moveDown();
        continue;
      }

      // Render table with pdfkit-table
      const rows = section.historico.length > 0
        ? section.historico.map(row => [
            formatDate(row.createdAt),
            row.costPerUnit !== null ? row.costPerUnit.toFixed(2) : '-',
            section.unidade || '-'
          ])
        : [['-', '-', section.unidade || '-']];

      const table = {
        headers: ['Data', 'Custo (R$)', 'Unidade'],
        rows
      };
      await doc.table(table, {
        x: doc.page.margins.left,
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right
      });

      if (idx < sections.length - 1) {
        doc.moveDown();
      }
    }

  doc.end();
  } catch (err) {
    console.error('Export error:', err);
    return res.status(500).json({ error: 'Erro interno: ' + err.message });
  }
});

export default router;