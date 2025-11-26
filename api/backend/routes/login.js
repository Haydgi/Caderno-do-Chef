import express from "express";
import db from "../database/connection.js"; // seu pool mysql2/promise
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Rate limit para proteger tentativas de brute force no login
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto (temporariamente reduzido para testes)
  max: 10, // máximo de 10 tentativas por IP nesse período (aumentado para testes)
  skipSuccessfulRequests: true, // não contar logins bem-sucedidos no limite
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Calcula minutos restantes até o reset
    const reset = req.rateLimit?.resetTime;
    let minutos = 1; // padrão para a janela configurada
    if (reset instanceof Date) {
      const diffMs = reset.getTime() - Date.now();
      minutos = Math.max(0, Math.ceil(diffMs / 60000));
    }
    const plural = minutos === 1 ? '' : 's';
    return res.status(429).json({
      mensagem: `Limite de tentativas de login excedido. Tente novamente em ${minutos} minuto${plural}.`,
      detalhes: {
        tentativasPermitidas: 10,
        janelaMinutos: 1,
      },
    });
  },
});

router.post("/login", loginLimiter, async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: "Email e senha são obrigatórios." });
  }

  try {
    // Query usando await e destructuring do resultado
    const [results] = await db.query("SELECT * FROM usuario WHERE Email = ?", [email]);

    if (results.length === 0) {
      return res.status(401).json({ mensagem: "Email ou senha incorretos." });
    }

    const usuario = results[0];

    // Comparação da senha com bcrypt (senha fornecida x hash salvo no banco)
    const senhaCorreta = await bcrypt.compare(senha, usuario.Senha);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: "Email ou senha incorretos." });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        ID_Usuario: usuario.ID_Usuario, 
        email: usuario.Email,
        role: usuario.Tipo_Usuario  // ← CORRIGIDO: Tipo_Usuario com maiúscula
      },
      process.env.SECRET_JWT,
      { expiresIn: '1h' }
    );

    // Evitar logar token/payload em produção

    // Retornar sucesso com token e dados do usuário (inclui papel/tipo_usuario)
    return res.status(200).json({
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {
        id: usuario.ID_Usuario,
        nome: usuario.Nome_Usuario,
        email: usuario.Email,
        role: usuario.Tipo_Usuario, // ex.: Proprietário | Gerente | Funcionário
        tipo_usuario: usuario.Tipo_Usuario // compatibilidade com consumidores que preferem este nome
      }
    });

  } catch (err) {
    console.error("Erro ao consultar o banco de dados:", err);
    return res.status(500).json({ mensagem: "Erro no servidor." });
  }
});

export default router;