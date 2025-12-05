import express from 'express';
import db from '../database/connection.js';
import archiver from 'archiver';
import multer from 'multer';
import unzipper from 'unzipper';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const upload = multer({ dest: 'uploads/temp/' });

function toCSV(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const out = [headers.join(',')];
  for (const r of rows) {
    out.push(headers.map(h => {
      let v = r[h];
      if (v === null || v === undefined) return '';
      if (typeof v === 'string') {
        return '"' + v.replace(/"/g,'""') + '"';
      }
      return v;
    }).join(','));
  }
  return out.join('\n');
}

async function safeQuery(sql) {
  try { const [rows] = await db.query(sql); return rows; } catch { return []; }
}

// GET /backup/export - full system backup (excluding usuarios table)
router.get('/export', async (req, res) => {
  try {
    const [ingredientes] = await db.query('SELECT * FROM ingredientes');
  // Sanitiza receitas removendo referência a imagens (backup não contém arquivos)
  const [receitasRaw] = await db.query('SELECT * FROM receitas');
  const receitas = receitasRaw.map(r => ({ ...r, imagem_URL: '' }));
    const [despesas] = await db.query('SELECT * FROM despesas');
  const impostos = await safeQuery('SELECT * FROM impostos');
  const historicoImpostos = await safeQuery('SELECT * FROM historico_impostos');
    const ingredientesReceita = await safeQuery('SELECT * FROM ingredientes_receita');
    const historicoAlteracoes = await safeQuery('SELECT * FROM historico_alteracoes');

    res.setHeader('Content-Type', 'application/zip');
    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    res.setHeader('Content-Disposition', `attachment; filename=backup_caderno_do_chef_${timestamp}.zip`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', err => { throw err; });
    archive.pipe(res);

    archive.append(toCSV(ingredientes), { name: 'ingredientes.csv' });
  archive.append(toCSV(receitas), { name: 'receitas.csv' }); // imagem_URL removida
    archive.append(toCSV(despesas), { name: 'despesas.csv' });
    if (impostos.length) archive.append(toCSV(impostos), { name: 'impostos.csv' });
  if (ingredientesReceita.length) archive.append(toCSV(ingredientesReceita), { name: 'ingredientes_receita.csv' });
  if (historicoImpostos.length) archive.append(toCSV(historicoImpostos), { name: 'historico_impostos.csv' });
    if (historicoAlteracoes.length) archive.append(toCSV(historicoAlteracoes), { name: 'historico_alteracoes.csv' });

    await archive.finalize();
  } catch (err) {
    console.error('Erro no export backup:', err);
    res.status(500).json({ error: 'Falha ao gerar backup', details: err.message });
  }
});

// POST /backup/import - restore backup; ownership reassigned to importing user
router.post('/import', upload.single('arquivo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' });
  const userId = req.user?.ID_Usuario;
  if (!userId) return res.status(403).json({ error: 'Usuário não autenticado' });

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== '.zip') {
    fs.unlinkSync(filePath);
    return res.status(400).json({ error: 'Formato inválido. Envie um .zip gerado pelo backup.' });
  }

  // Helpers
  const parseCSV = (content) => {
    const lines = content.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,''));
    return lines.slice(1).map(line => {
      const cols = line.match(/\"([^\"]*(?:\"\"[^\"]*)*)\"|[^,]+|(?<=,)(?=,)/g) || [];
      return headers.reduce((obj, h, idx) => {
        let raw = cols[idx] ?? '';
        if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1).replace(/\"\"/g,'"');
        obj[h] = raw;
        return obj;
      }, {});
    });
  };

  const buffers = {};
  try {
    await fs.createReadStream(filePath)
      .pipe(unzipper.Parse())
      .on('entry', async entry => {
        const name = entry.path;
        const type = entry.type; // 'File'
        if (type === 'File' && name.endsWith('.csv')) {
          const chunks = [];
          for await (const chunk of entry) chunks.push(chunk);
          buffers[name] = Buffer.concat(chunks).toString('utf-8');
        } else {
          entry.autodrain();
        }
      })
      .promise();
  } catch (err) {
    fs.unlinkSync(filePath);
    console.error('Erro lendo zip:', err);
    return res.status(500).json({ error: 'Falha ao ler zip', details: err.message });
  }
  fs.unlinkSync(filePath);

  // Parse CSVs
  const dados = Object.fromEntries(Object.entries(buffers).map(([fname, content]) => [fname.replace('.csv',''), parseCSV(content)]));
  console.log('[backup/import] Arquivos encontrados no zip:', Object.keys(dados));
  for (const k of Object.keys(dados)) {
    console.log(`[backup/import] Registros em ${k}:`, dados[k].length);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ==========================
    // Validação básica antes de limpar dados
    // ==========================
  const receitasCSV = dados['receitas'] || [];
  const ingredientesCSV = dados['ingredientes'] || [];
  const impostosCSV = dados['impostos'] || [];
  const historicoImpCSV = dados['historico_impostos'] || [];

    if (receitasCSV.some(r => !r.Nome_Receita)) {
      return res.status(400).json({ error: 'CSV receitas possui linhas sem Nome_Receita.' });
    }
    if (ingredientesCSV.some(i => !i.Nome_Ingrediente)) {
      return res.status(400).json({ error: 'CSV ingredientes possui linhas sem Nome_Ingrediente.' });
    }

    // Validação opcional para impostos/histórico quando presentes no backup
    if (impostosCSV.length && historicoImpCSV.length) {
      const idsImpostosNoCSV = new Set(
        impostosCSV
          .map(i => Number(i.ID_Imposto))
          .filter(n => !Number.isNaN(n))
      );
      const inconsistentes = historicoImpCSV.filter(h => {
        const id = Number(h.ID_Imposto);
        if (Number.isNaN(id)) return true;
        return !idsImpostosNoCSV.has(id);
      });
      if (inconsistentes.length) {
        return res.status(400).json({
          error: 'Inconsistência: historico_impostos referencia IDs de impostos ausentes no backup.',
          detalhes: { inconsistentes: inconsistentes.length }
        });
      }
    }

    // ==========================
    // Limpa dados existentes (ordem referencial)
    // ==========================
    console.log('[backup/import] Limpando dados existentes antes de importar...');
    const tablesOrder = [
      'ingredientes_receita', // depende de receitas + ingredientes
      'historico_alteracoes', // depende de ingredientes
      'preco',                // depende de historico_alteracoes + ingredientes
      'historico_impostos',   // depende de impostos
      'receitas',
      'ingredientes',
      'despesas',
      'impostos'
    ];

    // Desabilita FKs para garantir limpeza (reativa depois)
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    const limpezaFalhas = [];
    for (const t of tablesOrder) {
      let antes = null;
      try {
        const [r] = await conn.query(`SELECT COUNT(*) AS total FROM ${t}`);
        antes = r[0]?.total;
      } catch (e) {
        console.warn(`[backup/import] Não foi possível contar tabela ${t}:`, e.code || e.message);
      }
      try {
        await conn.query(`DELETE FROM ${t}`);
        await conn.query(`ALTER TABLE ${t} AUTO_INCREMENT = 1`);
        const [r2] = await conn.query(`SELECT COUNT(*) AS total FROM ${t}`);
        const depois = r2[0]?.total;
        console.log(`[backup/import] Limpeza ${t}: antes=${antes} depois=${depois}`);
        if (depois !== 0) {
          limpezaFalhas.push({ tabela: t, depois });
        }
      } catch (e) {
        console.warn(`[backup/import] Falha ao limpar tabela ${t}:`, e.code || e.message);
        limpezaFalhas.push({ tabela: t, erro: e.message });
      }
    }
    await conn.query('SET FOREIGN_KEY_CHECKS=1');
    if (limpezaFalhas.length) {
      console.error('[backup/import] Abortando: limpeza incompleta', limpezaFalhas);
      return res.status(500).json({ error: 'Falha ao limpar dados antes do import', detalhes: limpezaFalhas });
    }

  const ingredienteMap = new Map();
    console.log('[backup/import] Iniciando inserção de ingredientes');
    const ingredienteInfoMap = new Map(); // newIngId -> { unidade, custo, indice }
    for (const row of dados['ingredientes'] || []) {
      const { Nome_Ingrediente, Unidade_De_Medida, Custo_Ingrediente, Indice_de_Desperdicio, Categoria } = row;
      if (!Nome_Ingrediente) continue;
      try {
        const custoNum = Number(Custo_Ingrediente)||0;
        const indiceNum = Number(Indice_de_Desperdicio)||0;
        const [result] = await conn.query(
          `INSERT INTO ingredientes (Nome_Ingrediente, Unidade_De_Medida, Custo_Ingrediente, Indice_de_Desperdicio, Categoria, ID_Usuario, Data_Ingrediente)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [Nome_Ingrediente, Unidade_De_Medida || null, custoNum, indiceNum, Categoria||null, userId]
        );
        const newIngId = result.insertId;
        if (row.ID_Ingredientes) ingredienteMap.set(row.ID_Ingredientes, newIngId);
        if (row.ID_Ingrediente) ingredienteMap.set(row.ID_Ingrediente, newIngId);
        ingredienteInfoMap.set(newIngId, { unidade: Unidade_De_Medida || null, custo: custoNum, indice: indiceNum });
      } catch (e) {
        console.error('[backup/import] Erro inserindo ingrediente linha:', row, 'erro:', e.message);
        throw e;
      }
    }

  const receitaMap = new Map();
    console.log('[backup/import] Iniciando inserção de receitas');
    for (const row of dados['receitas'] || []) {
      const { Nome_Receita, Descricao, Tempo_Preparo, Porcentagem_De_Lucro, Categoria, imagem_URL } = row;
      if (!Nome_Receita) continue;
      try {
        // Garantimos que imagem_URL nunca seja null (coluna NOT NULL) -> usar string vazia
        const imagemNormalizada = (imagem_URL === null || imagem_URL === undefined) ? '' : imagem_URL;
        const [result] = await conn.query(
          `INSERT INTO receitas (ID_Usuario, Nome_Receita, Descricao, Tempo_Preparo, Porcentagem_De_Lucro, Categoria, Custo_Total_Ingredientes, imagem_URL, Data_Receita)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [userId, Nome_Receita, Descricao||'', Number(Tempo_Preparo)||0, Number(Porcentagem_De_Lucro)||0, Categoria||'', Number(row.Custo_Total_Ingredientes)||0, imagemNormalizada]
        );
  if (row.ID_Receita) receitaMap.set(row.ID_Receita, result.insertId);
      } catch (e) {
        console.error('[backup/import] Erro inserindo receita linha:', row, 'erro:', e.message);
        throw e;
      }
    }

    console.log('[backup/import] Iniciando inserção de despesas');
    let despesasCount = 0;
    for (const row of dados['despesas'] || []) {
      const { Nome_Despesa, Custo_Mensal, Tempo_Operacional } = row;
      if (!Nome_Despesa) continue;
      try {
        await conn.query(
          `INSERT INTO despesas (Nome_Despesa, Custo_Mensal, Tempo_Operacional, ID_Usuario, Data_Despesa)
           VALUES (?, ?, ?, ?, NOW())`,
          [Nome_Despesa, Number(Custo_Mensal)||0, Number(Tempo_Operacional)||0, userId]
        );
        despesasCount++;
      } catch (e) {
        console.error('[backup/import] Erro inserindo despesa linha:', row, 'erro:', e.message);
        throw e;
      }
    }

    console.log('[backup/import] Iniciando inserção de impostos');
    let impostosCount = 0;
    const impostoMap = new Map(); // oldId -> newId
    for (const row of dados['impostos'] || []) {
      const { Nome_Imposto, Categoria_Imposto, Frequencia, Valor_Medio } = row;
      if (!Nome_Imposto) continue;
      try {
        const [ins] = await conn.query(
          `INSERT INTO impostos (ID_Usuario, Nome_Imposto, Categoria_Imposto, Frequencia, Valor_Medio)
           VALUES (?, ?, ?, ?, ?)`,
          [userId, Nome_Imposto, Categoria_Imposto||null, Frequencia||null, Number(Valor_Medio)||0]
        );
        // Mapeia ID antigo para novo (se presente no CSV)
        const oldId = Number(row.ID_Imposto);
        if (!Number.isNaN(oldId)) impostoMap.set(oldId, ins.insertId);
        impostosCount++;
      } catch (e) {
        console.error('[backup/import] Erro inserindo imposto linha:', row, 'erro:', e.code, e.message);
        throw e;
      }
    }

    // histórico de impostos (opcional) caso esteja no zip
    let historicoImpostosCount = 0;
    if (Array.isArray(dados['historico_impostos']) && dados['historico_impostos'].length) {
      console.log('[backup/import] Iniciando inserção de historico_impostos');
      for (const row of dados['historico_impostos']) {
        const oldImpId = Number(row.ID_Imposto);
        const newImpId = impostoMap.get(oldImpId);
        const valor = Number(row.Valor);
        const data = row.Data_Registro ? new Date(row.Data_Registro) : null;
        if (!newImpId || Number.isNaN(valor)) continue;
        try {
          await conn.query(
            `INSERT INTO historico_impostos (ID_Imposto, Valor, Data_Registro) VALUES (?, ?, ?)`,
            [newImpId, valor, data || new Date()]
          );
          historicoImpostosCount++;
        } catch (e) {
          console.error('[backup/import] Erro inserindo historico_impostos linha:', row, 'erro:', e.message);
          throw e;
        }
      }

      // Atualiza valor médio dos impostos com base no histórico importado
      try {
        await conn.query(
          `UPDATE impostos i
           SET i.Valor_Medio = COALESCE((SELECT AVG(h.Valor) FROM historico_impostos h WHERE h.ID_Imposto = i.ID_Imposto), i.Valor_Medio)`
        );
      } catch (e) {
        console.warn('[backup/import] Aviso ao atualizar Valor_Medio após histórico:', e.message);
      }
    }

    console.log('[backup/import] Iniciando inserção de historico_alteracoes');
    const ultimoHistoricoPorIngrediente = new Map(); // newIngId -> last historico ID
    for (const row of dados['historico_alteracoes'] || []) {
      // CSV pode ter ID_Ingrediente antigo, map para novo
      const novoIngId = ingredienteMap.get(row.ID_Ingrediente) || ingredienteMap.get(row.ID_Ingredientes);
      if (!novoIngId) continue;
      let statusValue = 1;
      if (row.Status !== undefined && row.Status !== null && String(row.Status).trim() !== '') {
        const parsed = Number(row.Status);
        if (!isNaN(parsed)) statusValue = parsed;
      }
      try {
        const precoValor = Number(row.Preco)||ingredienteInfoMap.get(novoIngId)?.custo||0;
        const desperdicioValor = Number(row.Taxa_Desperdicio)||ingredienteInfoMap.get(novoIngId)?.indice||0;
        const [histResult] = await conn.query(
          `INSERT INTO historico_alteracoes (ID_Ingrediente, ID_Usuario, Preco, Taxa_Desperdicio, Data_Alteracoes, Status)
           VALUES (?, ?, ?, ?, NOW(), ?)`,
          [novoIngId, userId, precoValor, desperdicioValor, statusValue]
        );
        ultimoHistoricoPorIngrediente.set(novoIngId, histResult.insertId);
      } catch (e) {
        console.error('[backup/import] Erro historico_alteracoes ingredienteNovo=', novoIngId, 'linhaCSV=', row, 'code=', e.code, 'sqlMessage=', e.sqlMessage);
        throw e;
      }
    }

    // Cria registros de preco para cada ingrediente (necessário para cálculo de receitas)
    console.log('[backup/import] Inserindo registros de preco');
    for (const [ingId, info] of ingredienteInfoMap.entries()) {
      try {
        const historicoId = ultimoHistoricoPorIngrediente.get(ingId);
        // Se não houve histórico importado para este ingrediente, criar um rapidamente
        let histIdRef = historicoId;
        if (!histIdRef) {
          const [histFallback] = await conn.query(
            `INSERT INTO historico_alteracoes (ID_Ingrediente, ID_Usuario, Preco, Taxa_Desperdicio, Data_Alteracoes, Status)
             VALUES (?, ?, ?, ?, NOW(), 1)`,
            [ingId, userId, info.custo||0, info.indice||0]
          );
            histIdRef = histFallback.insertId;
            ultimoHistoricoPorIngrediente.set(ingId, histIdRef);
        }
        // Quantidade_Utilizada padrão 1
        await conn.query(
          `INSERT INTO preco (ID_Ingrediente, ID_Historico, ID_Usuario, Quantidade_Utilizada, Unidade_Medida, Custo_Unitario)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [ingId, histIdRef, userId, 1, info.unidade || null, info.custo || 0]
        );
      } catch (e) {
        console.error('[backup/import] Erro inserindo preco para ingrediente', ingId, e.code, e.message);
        throw e;
      }
    }

    console.log('[backup/import] Iniciando inserção de ingredientes_receita');
    for (const row of dados['ingredientes_receita'] || []) {
      const novoIngId = ingredienteMap.get(row.ID_Ingredientes);
      const novaReceitaId = receitaMap.get(row.ID_Receita);
      if (!novoIngId || !novaReceitaId) continue;
      try {
        await conn.query(
          `INSERT INTO ingredientes_receita (ID_Receita, ID_Ingredientes, Quantidade_Utilizada, Unidade_De_Medida)
           VALUES (?, ?, ?, ?)`,
          [novaReceitaId, novoIngId, Number(row.Quantidade_Utilizada)||0, row.Unidade_De_Medida||null]
        );
      } catch (e) {
        console.error('[backup/import] Erro inserindo ingredientes_receita linha:', row, 'erro:', e.message);
        throw e;
      }
    }

  await conn.commit();
  res.json({
    message: 'Importação concluída',
    receitas: receitaMap.size,
    ingredientes: ingredienteMap.size,
    despesas: despesasCount,
    impostos: impostosCount,
    historicoImpostos: historicoImpostosCount || 0
  });
  } catch (err) {
    await conn.rollback();
    console.error('Erro na importação backup (rollback):', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage,
      stack: err.stack?.split('\n').slice(0,4).join(' | ')
    });
    res.status(500).json({
      error: 'Falha ao importar backup',
      details: err.message,
      code: err.code,
      sqlMessage: err.sqlMessage
    });
  } finally {
    conn.release();
  }
});

export default router;
