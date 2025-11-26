import db from './database/connection.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

async function testarLogin() {
  try {
    const email = 'andressmota78@gmail.com';
    
    // Buscar usuário
    const [usuarios] = await db.query(
      'SELECT * FROM usuario WHERE Email = ?',
      [email]
    );

    if (usuarios.length === 0) {
      console.log('❌ Usuário não encontrado');
      process.exit(1);
    }

    const usuario = usuarios[0];
    console.log('\n📋 Dados do usuário no banco:');
    console.log('ID:', usuario.ID_Usuario);
    console.log('Nome:', usuario.Nome_Usuario);
    console.log('Email:', usuario.Email);
    console.log('Tipo_Usuario:', usuario.Tipo_Usuario);

    // Gerar token como no login.js
    const token = jwt.sign(
      { 
        ID_Usuario: usuario.ID_Usuario, 
        email: usuario.Email,
        role: usuario.Tipo_Usuario
      },
      process.env.SECRET_JWT,
      { expiresIn: '1h' }
    );

    console.log('\n🔑 Token gerado:', token);

    // Decodificar token para verificar
    const decoded = jwt.verify(token, process.env.SECRET_JWT);
    console.log('\n📦 Payload do token:');
    console.log(JSON.stringify(decoded, null, 2));

    // Simular resposta do backend
    const response = {
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {
        id: usuario.ID_Usuario,
        nome: usuario.Nome_Usuario,
        email: usuario.Email,
        role: usuario.Tipo_Usuario,
        tipo_usuario: usuario.Tipo_Usuario
      }
    };

    console.log('\n📤 Resposta que o backend enviaria:');
    console.log(JSON.stringify(response, null, 2));

    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

testarLogin();
