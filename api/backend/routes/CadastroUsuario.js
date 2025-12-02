import express from "express";
import db from "../database/connection.js";
import bcrypt from "bcrypt";
import { validate } from '../utils/validators.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.post("/cadastrar", async (req, res) => {
  try {
    const { nome, email, telefone, senha, papel } = req.body;

    // Validação usando sistema centralizado
    const validation = validate({
      nome: 'required|string|min:2|max:100',
      email: 'required|string|email|max:255',
      telefone: 'required|string',
      senha: 'required|string|min:6|max:100',
      papel: `enum:Proprietário,Gerente,Funcionário`
    }, { nome, email, telefone, senha, papel: papel || 'Funcionário' });

    if (!validation.isValid) {
      return res.status(400).json({
        mensagem: 'Erro de validação',
        errors: validation.errors
      });
    }
    
    // Verificar se já existe algum usuário no sistema
    const [usuarios] = await db.query('SELECT COUNT(*) as total FROM usuario');
    const totalUsuarios = usuarios[0].total;
    
    // Determinar o papel do usuário
    let papelUsuario;
    
    if (totalUsuarios === 0) {
      papelUsuario = 'Proprietário';
      logger.info('Primeiro usuário do sistema - atribuindo papel de Proprietário');
    } else {
      papelUsuario = papel || 'Funcionário';
      logger.info(`Novo usuário com papel: ${papelUsuario}`);
    }
    
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const query = `
      INSERT INTO usuario (Nome_Usuario, Email, Telefone, Senha, tipo_usuario)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(query, [nome, email, telefone, senhaCriptografada, papelUsuario]);
    
    if (result.affectedRows > 0) {
      logger.success('Usuário cadastrado com sucesso', { 
        userId: result.insertId,
        nome, 
        email, 
        papel: papelUsuario 
      });
      
      return res.status(201).json({ 
        mensagem: 'Usuário cadastrado com sucesso!',
        id: result.insertId,
        nome,
        email,
        papel: papelUsuario
      });
    } else {
      return res.status(500).json({ mensagem: 'Erro ao inserir usuário' });
    }
    
  } catch (error) {
    logger.error('Erro ao processar cadastro', { error: error.message, stack: error.stack });
    
    // Verificar se é erro de duplicação
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: 'Email já cadastrado!' });
    }
    
    return res.status(500).json({ 
      mensagem: 'Erro ao processar cadastro',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

export default router;
