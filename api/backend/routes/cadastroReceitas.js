import express from 'express';
import db from '../database/connection.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { gerenteOuAcima, funcionarioOuAcima } from '../middleware/permissions.js';

// Para funcionar com ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const MSGS = {
  camposFaltando: 'Campos obrigatórios faltando',
  erroCadastro: 'Erro ao cadastrar receita',
  erroAtualizar: 'Erro ao atualizar receita',
  erroExcluir: 'Erro ao excluir receita',
  receitaNaoEncontrada: 'Receita não encontrada',
  naoAutorizado: 'Não autorizado a alterar esta receita',
  tokenNaoFornecido: 'Token não fornecido',
  tokenInvalido: 'Token inválido',
  idInvalido: 'ID inválido',
  tempoInvalido: 'Tempo de preparo deve ser um número positivo',
  custoInvalido: 'Custo deve ser um número positivo',
  porcentagemInvalida: 'Porcentagem de lucro deve ser um número positivo',
  arquivoInvalido: 'Apenas imagens JPG, JPEG e PNG são permitidas'
};

// Observação: autenticação e role já são aplicadas em index.js (req.user)

// Configuração multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nomeArquivo = `${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, nomeArquivo);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) cb(null, true);
    else cb(new Error(MSGS.arquivoInvalido));
  }
});

// POST / - Cadastrar receita (Proprietário e Gerente)
router.post('/', gerenteOuAcima, upload.single('imagem_URL'), async (req, res) => {
  console.log('📥 Recebendo requisição POST para cadastrar receita');
  console.log('Body recebido:', req.body);
  console.log('Arquivo recebido:', req.file);
  console.log('Usuário autenticado:', req.user);
  
  try {
    let {
      Nome_Receita,
      Descricao,
      Tempo_Preparo,
      Custo_Total_Ingredientes,
      Porcentagem_De_Lucro,
      Categoria,
      ingredientes // array esperado de ingredientes [{ID_Ingredientes, Quantidade_Utilizada, Unidade_De_Medida}, ...]
    } = req.body;

  const ID_Usuario = req.user.ID_Usuario;
  console.log('ID_Usuario extraído:', ID_Usuario);

    // Parse ingredientes se vier como string (caso do multipart/form-data)
    if (typeof ingredientes === "string") {
  try {
    ingredientes = JSON.parse(ingredientes);
  } catch (error) {
    console.error("Erro ao fazer parse dos ingredientes:", ingredientes);
    return res.status(400).json({ error: "Erro ao interpretar os ingredientes enviados." });
  }
}

    // Validações (Descrição não é obrigatória)
    if (!Nome_Receita || Tempo_Preparo === undefined ||
      Custo_Total_Ingredientes === undefined || Porcentagem_De_Lucro === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    // Conversões numéricas
    Tempo_Preparo = parseInt(Tempo_Preparo);
    Custo_Total_Ingredientes = parseFloat(Custo_Total_Ingredientes);
    Porcentagem_De_Lucro = parseFloat(Porcentagem_De_Lucro);

    if (isNaN(Tempo_Preparo) || Tempo_Preparo <= 0) return res.status(400).json({ error: "Tempo inválido." });
    if (isNaN(Custo_Total_Ingredientes) || Custo_Total_Ingredientes < 0) return res.status(400).json({ error: "Custo inválido." });
    if (isNaN(Porcentagem_De_Lucro) || Porcentagem_De_Lucro < 0) return res.status(400).json({ error: "Porcentagem inválida." });

    const imagem_URL = req.file ? req.file.filename : '';

    // Inserir receita
    const [result] = await db.query(`
      INSERT INTO receitas (
        ID_Usuario, Nome_Receita, Descricao, Tempo_Preparo,
        Custo_Total_Ingredientes, Porcentagem_De_Lucro, Categoria, imagem_URL, Data_Receita
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      ID_Usuario,
      Nome_Receita,
      Descricao,
      Tempo_Preparo,
      Custo_Total_Ingredientes,
      Porcentagem_De_Lucro,
      Categoria || null,
      imagem_URL
    ]);

    if (result.affectedRows === 1) {
      const idReceita = result.insertId;

      // INSERIR ingredientes na tabela intermediária
      if (Array.isArray(ingredientes) && ingredientes.length > 0) {
        const valores = ingredientes.map(i => [
          idReceita,
          i.ID_Ingredientes,
          parseFloat(i.quantidade || i.Quantidade_Utilizada),
          i.Unidade_De_Medida || null
        ]);
        await db.query(
          'INSERT INTO ingredientes_receita (ID_Receita, ID_Ingredientes, Quantidade_Utilizada, Unidade_De_Medida) VALUES ?',
          [valores]
        );
      }

      return res.status(201).json({
        ID_Receita: idReceita,
        ID_Usuario,
        Nome_Receita,
        Descricao,
        Tempo_Preparo,
        Custo_Total_Ingredientes,
        Porcentagem_De_Lucro,
        Categoria,
        imagem_URL,
        message: 'Receita cadastrada com sucesso'
      });
    }
    return res.status(500).json({ error: MSGS.erroCadastro });
  } catch (error) {
    console.error('Erro ao cadastrar receita:', error);
    return res.status(500).json({ error: MSGS.erroCadastro, details: error.message });
  }
});

// GET /?search= - Buscar receitas do usuário com filtro de pesquisa
// Permitimos o acesso a funcionários (apenas leitura) — middleware garante papel mínimo
router.get('/', funcionarioOuAcima, async (req, res) => {
  const search = req.query.search ? `%${req.query.search.toLowerCase()}%` : null;

  try {
    let query = `
      SELECT ID_Receita, Nome_Receita, Descricao, Tempo_Preparo,
             Custo_Total_Ingredientes, Porcentagem_De_Lucro,
             Categoria, imagem_URL, Data_Receita
      FROM receitas
      WHERE 1=1
    `;
    let params = [];

    if (search) {
      console.log("Aplicando filtro de busca:", search);
      query += ` AND (LOWER(Nome_Receita) LIKE ? OR LOWER(Descricao) LIKE ?)`;
      params.push(search, search);
    } else {
      console.log("Sem filtro de busca, trazendo tudo.");
    }

    console.log("Query final:", query);
    console.log("Parâmetros:", params);

    query += ` ORDER BY Data_Receita DESC`;

    const [rows] = await db.query(query, params);

    const BASE_URL = `${req.protocol}://${req.get("host")}/uploads/`;

    const receitasComPreco = rows.map(receita => ({
      ...receita,
      imagem_URL: receita.imagem_URL ? BASE_URL + receita.imagem_URL : null,
      Preco_Venda: +(
        receita.Custo_Total_Ingredientes *
        (1 + receita.Porcentagem_De_Lucro / 100)
      ).toFixed(2)
    }));

    return res.status(200).json(receitasComPreco);
  } catch (error) {
    console.error('Erro ao buscar receitas:', error);
    return res.status(500).json({ error: 'Erro ao buscar receitas', details: error.message });
  }
});

// GET /:id - Buscar detalhes da receita incluindo ingredientes com unidade
// Permitimos que Funcionários visualizem detalhes — leitura somente
router.get('/:id', funcionarioOuAcima, async (req, res) => {
  const { id } = req.params;
  const idNum = Number(id);
  if (isNaN(idNum) || idNum <= 0) return res.status(400).json({ error: MSGS.idInvalido });

  try {
    const [rows] = await db.query(
      `SELECT ID_Receita, ID_Usuario, Nome_Receita, Descricao, Tempo_Preparo,
              Custo_Total_Ingredientes, Porcentagem_De_Lucro, Categoria, imagem_URL, Data_Receita
       FROM receitas WHERE ID_Receita = ?`,
      [idNum]
    );
    if (rows.length === 0) return res.status(404).json({ error: MSGS.receitaNaoEncontrada });

    const receita = rows[0];

    const [ingredientes] = await db.query(
      `SELECT ir.ID_Ingredientes, ir.Quantidade_Utilizada, ir.Unidade_De_Medida,
              i.Nome_Ingrediente, i.Unidade_De_Medida AS Unidade_Cadastro
       FROM ingredientes_receita ir
       JOIN ingredientes i ON i.ID_Ingredientes = ir.ID_Ingredientes
       WHERE ir.ID_Receita = ?`,
      [idNum]
    );

    const BASE_URL = `${req.protocol}://${req.get('host')}/uploads/`;
    const imagemUrl = receita.imagem_URL ? BASE_URL + receita.imagem_URL : null;

    return res.status(200).json({
      ...receita,
      imagem_URL: imagemUrl,
      ingredientes: ingredientes.map(i => ({
        ID_Ingredientes: i.ID_Ingredientes,
        Nome_Ingrediente: i.Nome_Ingrediente,
        Quantidade_Utilizada: i.Quantidade_Utilizada,
        Unidade_De_Medida: i.Unidade_De_Medida || i.Unidade_Cadastro
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da receita:', error);
    return res.status(500).json({ error: 'Erro ao buscar detalhes da receita', details: error.message });
  }
});

// DELETE /:id - Excluir receita
router.delete('/:id', gerenteOuAcima, async (req, res) => {
  const { id } = req.params;
  const ID_Usuario = req.user.ID_Usuario;
  const userRole = req.user.role;
  const idNum = Number(id);

  if (isNaN(idNum) || idNum <= 0) return res.status(400).json({ error: MSGS.idInvalido });

  try {
    const [rows] = await db.query(`SELECT ID_Usuario, imagem_URL FROM receitas WHERE ID_Receita = ?`, [idNum]);

    if (rows.length === 0) return res.status(404).json({ error: MSGS.receitaNaoEncontrada });
    
    // Proprietário e Gerente podem excluir qualquer receita (sem restrição por criador)

    if (rows[0].imagem_URL) {
      const caminhoImagem = path.join(__dirname, '../uploads', rows[0].imagem_URL);
      try {
        await fs.unlink(caminhoImagem);
        console.log('Imagem excluída:', caminhoImagem);
      } catch (err) {
        console.warn('Falha ao excluir imagem:', err.message);
      }
    }

    const [result] = await db.query(`DELETE FROM receitas WHERE ID_Receita = ?`, [idNum]);

    if (result.affectedRows === 1) {
      return res.status(200).json({ message: 'Receita excluída com sucesso', ID_Receita: idNum });
    }
    return res.status(500).json({ error: MSGS.erroExcluir });
  } catch (error) {
    console.error('Erro ao excluir receita:', error);
    return res.status(500).json({ error: MSGS.erroExcluir, details: error.message });
  }
});

// PUT /:id - Atualizar receita (suporta multipart/form-data para imagem e campos de texto)
router.put('/:id', gerenteOuAcima, upload.single('imagem_URL'), async (req, res) => {
  const { id } = req.params;
  const ID_Usuario = req.user.ID_Usuario;
  const userRole = req.user.role;
  const idNum = Number(id);

  if (isNaN(idNum) || idNum <= 0)
    return res.status(400).json({ error: MSGS.idInvalido });

  // Garante que req.body exista mesmo quando nenhum parser apropriado atuar
  const body = req.body || {};
  let {
    Nome_Receita,
    Descricao,
    Tempo_Preparo,
    Custo_Total_Ingredientes,
    Porcentagem_De_Lucro,
    Categoria,
    ingredientes
  } = body;

  try {
    // Busca imagem atual no banco (se existir)
    const [[existingRow]] = await db.query(
      'SELECT imagem_URL FROM receitas WHERE ID_Receita = ?',
      [idNum]
    );
    const imagemAtual = existingRow ? (existingRow.imagem_URL || '') : '';

<<<<<<< HEAD
    // Parse ingredientes se vier como string (caso de multipart/form-data)
    if (typeof ingredientes === "string") {
      try {
        ingredientes = JSON.parse(ingredientes);
        console.log("Ingredientes (depois do parse):", ingredientes);
      } catch (error) {
        console.error("Erro ao fazer parse de ingredientes:", error.message);
        return res.status(400).json({ error: "JSON malformado nos ingredientes." });
      }
    }

    // Valide o array após o parse
    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      return res.status(400).json({ error: "Nenhum ingrediente recebido para atualizar." });
    }

    // Validações (Descrição não é obrigatória)
    if (!Nome_Receita || Tempo_Preparo === undefined ||
      Custo_Total_Ingredientes === undefined || Porcentagem_De_Lucro === undefined) {
      return res.status(400).json({ error: "Campos obrigatórios faltando." });
    }

    Tempo_Preparo = parseInt(Tempo_Preparo);
    Custo_Total_Ingredientes = parseFloat(Custo_Total_Ingredientes);
    Porcentagem_De_Lucro = parseFloat(Porcentagem_De_Lucro);

    if (isNaN(Tempo_Preparo) || Tempo_Preparo <= 0) return res.status(400).json({ error: "Tempo inválido." });
    if (isNaN(Custo_Total_Ingredientes) || Custo_Total_Ingredientes < 0) return res.status(400).json({ error: "Custo inválido." });
    if (isNaN(Porcentagem_De_Lucro) || Porcentagem_De_Lucro < 0) return res.status(400).json({ error: "Porcentagem inválida." });

    try {
      const [rows] = await db.query(`SELECT ID_Usuario, imagem_URL FROM receitas WHERE ID_Receita = ?`, [idNum]);

      if (rows.length === 0) return res.status(404).json({ error: "Receita não encontrada." });
      
      // Proprietário e Gerente podem editar qualquer receita (sem restrição por criador)


      let imagem_URL = rows[0].imagem_URL || '';

      // Se for para remover a imagem (sem upload novo)
      if (req.body.remover_imagem === 'true' && !req.file) {
        if (imagem_URL) {
          const caminhoImagemAntiga = path.join(__dirname, '../uploads', imagem_URL);
          try {
            await fs.unlink(caminhoImagemAntiga);
          } catch (err) {
            console.warn('Falha ao excluir imagem antiga:', err.message);
          }
        }
        imagem_URL = null;
      } else if (req.file) {
        if (imagem_URL) {
          const caminhoImagemAntiga = path.join(__dirname, '../uploads', imagem_URL);
          try {
            await fs.unlink(caminhoImagemAntiga);
          } catch (err) {
            console.warn('Falha ao excluir imagem antiga:', err.message);
          }
        }
        imagem_URL = req.file.filename;
      }

      // Atualiza dados da receita
      const [result] = await db.query(`
        UPDATE receitas SET 
          Nome_Receita = ?, 
          Descricao = ?, 
          Tempo_Preparo = ?, 
          Custo_Total_Ingredientes = ?, 
          Porcentagem_De_Lucro = ?, 
          Categoria = ?, 
          imagem_URL = ?
        WHERE ID_Receita = ?
      `, [
        Nome_Receita,
        Descricao,
        Tempo_Preparo,
        Custo_Total_Ingredientes,
        Porcentagem_De_Lucro,
        Categoria || null,
        imagem_URL,
        idNum
      ]);

      // Atualiza ingredientes associados:
      if (Array.isArray(ingredientes)) {
        // Apaga os antigos
        await db.query('DELETE FROM ingredientes_receita WHERE ID_Receita = ?', [idNum]);

        if (ingredientes.length > 0) {
          const valores = ingredientes.map(i => [
            idNum,
            i.ID_Ingredientes,
            parseFloat(i.quantidade || i.Quantidade_Utilizada),
            i.Unidade_De_Medida || null
          ]);
          console.log("Valores para INSERT:", valores);

          try {
            await db.query(
              'INSERT INTO ingredientes_receita (ID_Receita, ID_Ingredientes, Quantidade_Utilizada, Unidade_De_Medida) VALUES ?',
              [valores]
            );
          } catch (err) {
            console.error("Erro ao inserir ingredientes:", err.message);
            return res.status(500).json({ error: "Erro ao inserir ingredientes.", sql: err.message });
          }
=======
    // Se vier flag para remover imagem, apaga arquivo físico se existir
    if (body.remover_imagem === 'true' || body.remover_imagem === true) {
      if (imagemAtual) {
        const caminhoArquivo = path.join(__dirname, '../uploads', imagemAtual);
        try {
          await fs.promises.access(caminhoArquivo);
          await fs.promises.unlink(caminhoArquivo);
          console.log('Arquivo de imagem removido do disco:', caminhoArquivo);
        } catch (err) {
          console.warn('Não foi possível remover arquivo (talvez já inexistente):', caminhoArquivo, err.message);
>>>>>>> a10b1a9ff21f35c73b117d21a070c50a41309f67
        }
      }
    }

    // Decide qual será o valor salvo em imagem_URL:
    // - se veio um novo arquivo via upload -> use req.file.filename
    // - se veio remover_imagem -> '' (já apagado acima)
    // - caso contrário mantém a imagem atual
    let imagemParaSalvar = imagemAtual;
    if (req.file && req.file.filename) {
      imagemParaSalvar = req.file.filename;
      // se havia imagem antiga e foi substituída, remova o arquivo antigo
      if (imagemAtual) {
        const antigo = path.join(__dirname, '../uploads', imagemAtual);
        fs.promises.unlink(antigo).catch(() => {});
      }
    } else if (body.remover_imagem === 'true' || body.remover_imagem === true) {
      imagemParaSalvar = '';
    }

    // Constrói query de atualização (inclui imagem_URL)
    const updateQuery = `
      UPDATE receitas SET
        Nome_Receita = ?,
        Descricao = ?,
        Tempo_Preparo = ?,
        Custo_Total_Ingredientes = ?,
        Porcentagem_De_Lucro = ?,
        Categoria = ?,
        imagem_URL = ?
      WHERE ID_Receita = ?
    `;
    await db.query(updateQuery, [
      Nome_Receita || null,
      Descricao || null,
      Tempo_Preparo || 0,
      Custo_Total_Ingredientes || 0,
      Porcentagem_De_Lucro || 0,
      Categoria || null,
      imagemParaSalvar,
      idNum
    ]);

    return res.status(200).json({ message: 'Receita atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar receita:', error);
    return res.status(500).json({ error: MSGS.erroAtualizar, details: error.message });
  }
});

export default router;
