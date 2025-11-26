import db from './database/connection.js';
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetarSenhaManual() {
  console.log('\n🔐 RESETAR SENHA MANUALMENTE\n');

  // Listar usuários
  const [usuarios] = await db.query('SELECT ID_Usuario, Nome_Usuario, Email, tipo_usuario FROM usuario');
  
  console.log('Usuários cadastrados:\n');
  usuarios.forEach(u => {
    console.log(`ID: ${u.ID_Usuario} | ${u.Nome_Usuario} (${u.Email}) - ${u.tipo_usuario}`);
  });

  rl.question('\nDigite o ID do usuário: ', async (id) => {
    rl.question('Digite a nova senha: ', async (novaSenha) => {
      try {
        const senhaCriptografada = await bcrypt.hash(novaSenha, 10);
        
        await db.query(
          'UPDATE usuario SET Senha = ? WHERE ID_Usuario = ?',
          [senhaCriptografada, id]
        );

        console.log('\n✅ Senha alterada com sucesso!');
        console.log('Agora você pode fazer login com a nova senha.\n');
      } catch (error) {
        console.error('❌ Erro ao alterar senha:', error);
      } finally {
        rl.close();
        process.exit(0);
      }
    });
  });
}

resetarSenhaManual();
