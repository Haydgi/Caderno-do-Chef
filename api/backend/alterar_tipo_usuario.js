import db from './database/connection.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function alterarTipoUsuario() {
  console.log('\n👤 ALTERAR TIPO DE USUÁRIO\n');

  // Listar usuários
  const [usuarios] = await db.query('SELECT ID_Usuario, Nome_Usuario, Email, tipo_usuario FROM usuario');
  
  console.log('Usuários cadastrados:\n');
  usuarios.forEach(u => {
    console.log(`ID: ${u.ID_Usuario} | ${u.Nome_Usuario} (${u.Email}) - Tipo atual: ${u.tipo_usuario}`);
  });

  console.log('\nTipos disponíveis:');
  console.log('1 - Proprietário');
  console.log('2 - Gerente');
  console.log('3 - Funcionário\n');

  rl.question('Digite o ID do usuário: ', async (id) => {
    rl.question('Digite o número do novo tipo (1, 2 ou 3): ', async (tipo) => {
      try {
        let novoTipo;
        switch(tipo) {
          case '1':
            novoTipo = 'Proprietário';
            break;
          case '2':
            novoTipo = 'Gerente';
            break;
          case '3':
            novoTipo = 'Funcionário';
            break;
          default:
            console.log('❌ Tipo inválido!');
            rl.close();
            process.exit(1);
        }
        
        await db.query(
          'UPDATE usuario SET tipo_usuario = ? WHERE ID_Usuario = ?',
          [novoTipo, id]
        );

        console.log(`\n✅ Tipo de usuário alterado para: ${novoTipo}`);
        console.log('Faça login novamente para aplicar as mudanças.\n');
      } catch (error) {
        console.error('❌ Erro ao alterar tipo:', error);
      } finally {
        rl.close();
        process.exit(0);
      }
    });
  });
}

alterarTipoUsuario();
