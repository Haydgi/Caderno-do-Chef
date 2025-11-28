import express from 'express';
import db from '../database/connection.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { enviarEmailRecuperacao } from '../config/email.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Cache em memória para tokens de recuperação (substitui colunas no banco)
// Estrutura: { token: { email, expiracao } }
const resetTokens = new Map();

// Rate limit para solicitação de recuperação (prevenir spam)
const recuperacaoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // máximo de 3 tentativas por IP
  skipSuccessfulRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      mensagem: 'Muitas tentativas de recuperação. Tente novamente mais tarde.',
    });
  },
});

/**
 * POST /recuperar-senha
 * Solicita a recuperação de senha
 */
router.post('/recuperar-senha', recuperacaoLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ mensagem: 'Email é obrigatório.' });
  }

  try {
    // Buscar usuário pelo email
    const [usuarios] = await db.query(
      'SELECT ID_Usuario, Nome_Usuario, Email FROM usuario WHERE Email = ?',
      [email]
    );

    // Gerar token único e seguro
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiracao = new Date(Date.now() + 3600000); // 1 hora

    // Se o usuário existe no sistema, salvar token em memória
    if (usuarios.length > 0) {
      const usuario = usuarios[0];
      
      // Salvar token em memória (cache)
      resetTokens.set(token, {
        email: usuario.Email,
        expiracao: tokenExpiracao,
        userId: usuario.ID_Usuario
      });
    }

    // Enviar email para qualquer endereço (esteja ou não cadastrado)
    try {
      const nomeDestinatario = usuarios.length > 0 ? usuarios[0].Nome_Usuario : 'Usuário';
      await enviarEmailRecuperacao(email, nomeDestinatario, token);
      
      return res.status(200).json({
        mensagem: 'Email de recuperação enviado com sucesso!',
      });
    } catch (emailError) {
      console.error('❌ Erro ao enviar email:', emailError);
      console.error('Detalhes do erro:', emailError.message);
      console.error('Stack:', emailError.stack);
      
      // Limpar token do cache se o email falhar e o usuário existir
      if (usuarios.length > 0) {
        resetTokens.delete(token);
      }
      
      return res.status(500).json({
        mensagem: 'Erro ao enviar email de recuperação. Tente novamente mais tarde.',
        erro: emailError.message
      });
    }
  } catch (error) {
    console.error('❌ Erro ao processar recuperação de senha:', error);
    console.error('Detalhes:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      mensagem: 'Erro no servidor. Tente novamente mais tarde.',
      erro: error.message
    });
  }
});

/**
 * POST /resetar-senha
 * Redefine a senha usando o token
 */
router.post('/resetar-senha', async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    return res.status(400).json({
      mensagem: 'Token e nova senha são obrigatórios.',
    });
  }

  // Validar senha (mínimo 6 caracteres)
  if (novaSenha.length < 6) {
    return res.status(400).json({
      mensagem: 'A senha deve ter no mínimo 6 caracteres.',
    });
  }

  try {
    // Buscar token no cache em memória
    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return res.status(400).json({
        mensagem: 'Token inválido ou expirado.',
      });
    }

    // Verificar se o token expirou
    if (new Date() > tokenData.expiracao) {
      resetTokens.delete(token); // Limpar token expirado
      return res.status(400).json({
        mensagem: 'Token inválido ou expirado.',
      });
    }

    // Buscar usuário pelo email armazenado no token
    const [usuarios] = await db.query(
      'SELECT ID_Usuario, Email FROM usuario WHERE Email = ?',
      [tokenData.email]
    );

    if (usuarios.length === 0) {
      resetTokens.delete(token);
      return res.status(400).json({
        mensagem: 'Usuário não encontrado.',
      });
    }

    const usuario = usuarios[0];

    // Criptografar nova senha
    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha (sem limpar colunas que não existem)
    await db.query(
      'UPDATE usuario SET Senha = ? WHERE ID_Usuario = ?',
      [senhaCriptografada, usuario.ID_Usuario]
    );

    // Limpar token do cache
    resetTokens.delete(token);

    return res.status(200).json({
      mensagem: 'Senha redefinida com sucesso! Você já pode fazer login.',
    });
  } catch (error) {
    console.error('Erro ao resetar senha:', error);
    return res.status(500).json({
      mensagem: 'Erro no servidor. Tente novamente mais tarde.',
    });
  }
});

/**
 * GET /validar-token/:token
 * Valida se um token de recuperação é válido
 */
router.get('/validar-token/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Verificar token no cache
    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return res.status(400).json({
        valido: false,
        mensagem: 'Token inválido ou expirado.',
      });
    }

    // Verificar se expirou
    if (new Date() > tokenData.expiracao) {
      resetTokens.delete(token);
      return res.status(400).json({
        valido: false,
        mensagem: 'Token inválido ou expirado.',
      });
    }

    return res.status(200).json({
      valido: true,
      mensagem: 'Token válido.',
    });
  } catch (error) {
    console.error('Erro ao validar token:', error);
    return res.status(500).json({
      valido: false,
      mensagem: 'Erro no servidor.',
    });
  }
});

export default router;
