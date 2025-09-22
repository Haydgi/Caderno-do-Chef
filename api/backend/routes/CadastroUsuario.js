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
  console.log("Requisição recebida:", req.body); // <- AJUDA MUITO

  const { nome, email, telefone, senha } = req.body;

  if (!nome || !email || !telefone || !senha) {
    return res.status(400).json({ mensagem: "Preencha todos os campos." });
  }

  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO usuario (Nome_Usuario, Email, Telefone, Senha)
      VALUES (?, ?, ?, ?)
    `;

    db.query(query, [nome, email, telefone, senhaCriptografada], (err, result) => {
      if (err) {
        console.error("Erro ao inserir no banco:", err);
        return res.status(500).json({ mensagem: "Erro no servidor ao cadastrar usuário." });
      }

      // Chama a função de cadastro bem-sucedido
      onCadastroBemSucedido({ nome, email, telefone });

      return res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
    });
  } catch (error) {
    console.error("Erro ao processar dados:", error); // <- ESSENCIAL
    return res.status(500).json({ mensagem: "Erro interno no servidor." });
  }
});

export default router;
