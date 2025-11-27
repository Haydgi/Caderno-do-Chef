import express from 'express';
import db from '../database/connection.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { enviarEmailRecuperacao } from '../config/email.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

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

    // Se o usuário existe no sistema, salvar token no banco
    if (usuarios.length > 0) {
      const usuario = usuarios[0];
      
      // Salvar token no banco de dados
      await db.query(
        'UPDATE usuario SET reset_token = ?, reset_token_expiracao = ? WHERE ID_Usuario = ?',
        [token, tokenExpiracao, usuario.ID_Usuario]
      );
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
      
      // Limpar token se o email falhar e o usuário existir
      if (usuarios.length > 0) {
        await db.query(
          'UPDATE usuario SET reset_token = NULL, reset_token_expiracao = NULL WHERE ID_Usuario = ?',
          [usuarios[0].ID_Usuario]
        );
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
    // Buscar usuário com token válido
    const [usuarios] = await db.query(
      'SELECT ID_Usuario, Email FROM usuario WHERE reset_token = ? AND reset_token_expiracao > NOW()',
      [token]
    );

    if (usuarios.length === 0) {
      return res.status(400).json({
        mensagem: 'Token inválido ou expirado.',
      });
    }

    const usuario = usuarios[0];

    // Criptografar nova senha
    const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha e limpar token
    await db.query(
      'UPDATE usuario SET Senha = ?, reset_token = NULL, reset_token_expiracao = NULL WHERE ID_Usuario = ?',
      [senhaCriptografada, usuario.ID_Usuario]
    );

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
    const [usuarios] = await db.query(
      'SELECT ID_Usuario FROM usuario WHERE reset_token = ? AND reset_token_expiracao > NOW()',
      [token]
    );

    if (usuarios.length === 0) {
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
