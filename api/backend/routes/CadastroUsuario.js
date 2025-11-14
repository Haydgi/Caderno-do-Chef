import express from "express";
import db from "../database/connection.js";
import bcrypt from "bcrypt";

const router = express.Router();

// Função chamada após cadastro bem-sucedido
function onCadastroBemSucedido({ nome, email, telefone }) {
  // Aqui você pode adicionar qualquer lógica extra, como logs, envio de e-mail, etc.
  console.log(`[EVENTO] Novo usuário cadastrado: ${nome} (${email}, ${telefone})`);
  // Exemplo: enviarEmailBoasVindas(email, nome);
}

router.post("/cadastrar", async (req, res) => {
  console.log("Requisição recebida:", req.body);

  const { nome, email, telefone, senha, papel } = req.body;

  if (!nome || !email || !telefone || !senha) {
    return res.status(400).json({ mensagem: "Preencha todos os campos." });
  }
  
  try {
    // Verificar se já existe algum usuário no sistema
    const [usuarios] = await db.query('SELECT COUNT(*) as total FROM usuario');
    const totalUsuarios = usuarios[0].total;
    
    // Determinar o papel do usuário
    let papelUsuario;
    
    if (totalUsuarios === 0) {
      // Primeiro usuário do sistema sempre será Proprietário
      papelUsuario = 'Proprietário';
      console.log("Primeiro usuário do sistema - atribuindo papel de Proprietário");
    } else {
      // Para usuários subsequentes, usar o papel fornecido ou padrão 'Funcionário'
      papelUsuario = papel || 'Funcionário';
      console.log(`Atribuindo papel: ${papelUsuario}`);
    }
    
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO usuario (Nome_Usuario, Email, Telefone, Senha, tipo_usuario)
      VALUES (?, ?, ?, ?, ?)
    `;

    // USAR AWAIT COM MYSQL2/PROMISE
    const [result] = await db.query(query, [nome, email, telefone, senhaCriptografada, papelUsuario]);
    
    console.log("Resultado da inserção:", result);
    
    if (result.affectedRows > 0) {
      // Chama a função de cadastro bem-sucedido
      onCadastroBemSucedido({ nome, email, telefone });
      
      // IMPORTANTE: Responder antes do fim do try/catch
      return res.status(201).json({ 
        mensagem: "Usuário cadastrado com sucesso!",
        papel: papelUsuario
      });
    } else {
      return res.status(500).json({ mensagem: "Erro ao inserir usuário." });
    }
    
  } catch (error) {
    console.error("Erro ao processar dados:", error);
    
    // Verificar se é erro de duplicação
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: "Email já cadastrado!" });
    }
    
    return res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
});

export default router;
