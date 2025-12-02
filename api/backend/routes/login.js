import express from "express";
import db from "../database/connection.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { validate } from '../utils/validators.js';
import logger from '../utils/logger.js';

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
  try {
    const { email, senha } = req.body;

    // Validação usando sistema centralizado
    const validation = validate({
      email: 'required|string|email|max:255',
      senha: 'required|string|min:6|max:100'
    }, { email, senha });

    if (!validation.isValid) {
      return res.status(400).json({
        mensagem: 'Erro de validação',
        errors: validation.errors
      });
    }

    // Query usando await e destructuring do resultado
    const [results] = await db.query("SELECT * FROM usuario WHERE Email = ?", [email]);

    if (results.length === 0) {
      logger.warn('Tentativa de login com email não encontrado', { email });
      return res.status(401).json({ mensagem: "Email ou senha incorretos." });
    }

    const usuario = results[0];

    // Comparação da senha com bcrypt
    const senhaCorreta = await bcrypt.compare(senha, usuario.Senha);
    if (!senhaCorreta) {
      logger.warn('Tentativa de login com senha incorreta', { userId: usuario.ID_Usuario });
      return res.status(401).json({ mensagem: "Email ou senha incorretos." });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        ID_Usuario: usuario.ID_Usuario, 
        email: usuario.Email,
        role: usuario.tipo_usuario
      },
      process.env.SECRET_JWT,
      { expiresIn: '8h' }
    );

    logger.success('Login realizado com sucesso', { 
      userId: usuario.ID_Usuario, 
      email: usuario.Email 
    });

    // Retornar sucesso com token e dados do usuário (formato compatível com frontend)
    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.ID_Usuario,
        nome: usuario.Nome_Usuario,
        email: usuario.Email,
        role: usuario.tipo_usuario,
        tipo_usuario: usuario.tipo_usuario
      }
    });

  } catch (err) {
    logger.error('Erro ao processar login', { error: err.message, stack: err.stack });
    return res.status(500).json({ 
      mensagem: 'Erro ao processar login',
      ...(process.env.NODE_ENV !== 'production' && { error: err.message })
    });
  }
});

export default router;