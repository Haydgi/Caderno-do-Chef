import express from 'express';
import ExcelJS from 'exceljs';
import db from '../database/connection.js';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do multer para upload de arquivos
const upload = multer({ dest: 'uploads/temp/' });

/**
 * GET /exportar-dados
 * Exporta todos os dados do sistema em Excel ou CSV
 */
router.get('/exportar-dados', async (req, res) => {
  const { formato = 'excel' } = req.query; // 'excel' ou 'csv'

  try {
    // Buscar dados de todas as tabelas principais
    const [receitas] = await db.query('SELECT * FROM receitas');
    const [ingredientes] = await db.query('SELECT * FROM ingredientes');
    const [despesas] = await db.query('SELECT * FROM despesas');
  const [usuarios] = await db.query('SELECT ID_Usuario, Nome_Usuario, Email, Telefone, tipo_usuario FROM usuario');

    if (formato === 'csv') {
      // Exportar como CSV (apenas uma tabela por vez - receitas)
      const csv = convertToCSV(receitas);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=receitas_export.csv');
      return res.send(csv);
    } else {
      // Exportar como Excel (múltiplas abas)
      const workbook = new ExcelJS.Workbook();
      
      // Aba de Receitas
      const wsReceitas = workbook.addWorksheet('Receitas');
      if (receitas.length > 0) {
        wsReceitas.columns = Object.keys(receitas[0]).map(key => ({
          header: key,
          key: key,
          width: 20
        }));
        wsReceitas.addRows(receitas);
        styleWorksheet(wsReceitas);
      }

      // Aba de Ingredientes
      const wsIngredientes = workbook.addWorksheet('Ingredientes');
      if (ingredientes.length > 0) {
        wsIngredientes.columns = Object.keys(ingredientes[0]).map(key => ({
          header: key,
          key: key,
          width: 20
        }));
        wsIngredientes.addRows(ingredientes);
        styleWorksheet(wsIngredientes);
      }

      // Aba de Despesas
      const wsDespesas = workbook.addWorksheet('Despesas');
      if (despesas.length > 0) {
        wsDespesas.columns = Object.keys(despesas[0]).map(key => ({
          header: key,
          key: key,
          width: 20
        }));
        wsDespesas.addRows(despesas);
        styleWorksheet(wsDespesas);
      }

      // Aba de Usuários
      const wsUsuarios = workbook.addWorksheet('Usuários');
      if (usuarios.length > 0) {
        wsUsuarios.columns = Object.keys(usuarios[0]).map(key => ({
          header: key,
          key: key,
          width: 20
        }));
        wsUsuarios.addRows(usuarios);
        styleWorksheet(wsUsuarios);
      }

      // Enviar arquivo
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=caderno_do_chef_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      await workbook.xlsx.write(res);
      res.end();
    }
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({ mensagem: 'Erro ao exportar dados', erro: error.message });
  }
});

/**
 * POST /importar-dados
 * Importa dados de um arquivo Excel ou CSV
 */
router.post('/importar-dados', upload.single('arquivo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ mensagem: 'Nenhum arquivo enviado' });
  }

  const filePath = req.file.path;
  const fileExtension = path.extname(req.file.originalname).toLowerCase();

  try {
    let dados = [];

    if (fileExtension === '.csv') {
      // Ler arquivo CSV
      dados = await readCSV(filePath);
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Ler arquivo Excel
      dados = await readExcel(filePath);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ mensagem: 'Formato de arquivo não suportado. Use .xlsx, .xls ou .csv' });
    }

    // Processar importação (exemplo com ingredientes)
    let importados = 0;
    let erros = 0;

    for (const item of dados) {
      try {
        // Exemplo: importar ingredientes
        if (item.Nome_Ingrediente) {
          await db.query(
            'INSERT INTO ingredientes (Nome_Ingrediente, Quantidade_Estoque, Unidade_Medida, Preco_Unitario) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE Quantidade_Estoque = ?, Preco_Unitario = ?',
            [
              item.Nome_Ingrediente,
              item.Quantidade_Estoque || 0,
              item.Unidade_Medida || 'Un',
              item.Preco_Unitario || 0,
              item.Quantidade_Estoque || 0,
              item.Preco_Unitario || 0
            ]
          );
          importados++;
        }
      } catch (err) {
        console.error('Erro ao importar item:', err);
        erros++;
      }
    }

    // Remover arquivo temporário
    fs.unlinkSync(filePath);

    res.json({
      mensagem: 'Importação concluída',
      importados,
      erros,
      total: dados.length
    });
  } catch (error) {
    // Limpar arquivo em caso de erro
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    console.error('Erro ao importar dados:', error);
    res.status(500).json({ mensagem: 'Erro ao importar dados', erro: error.message });
  }
});

// Funções auxiliares
function styleWorksheet(worksheet) {
  // Estilizar cabeçalho
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
}

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [];
  
  // Adicionar cabeçalhos
  csvRows.push(headers.join(','));
  
  // Adicionar dados
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function readCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function readExcel(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.worksheets[0]; // Primeira aba
  const data = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Pular cabeçalho
    
    const rowData = {};
    row.eachCell((cell, colNumber) => {
      const header = worksheet.getRow(1).getCell(colNumber).value;
      rowData[header] = cell.value;
    });
    data.push(rowData);
  });
  
  return data;
}

export default router;
