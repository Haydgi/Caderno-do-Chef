import db from './database/connection.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabase() {
  console.log('\n🔍 Testando conexão com banco de dados...\n');
  
  console.log('📋 Configurações:');
  console.log(`   DB_HOST: ${process.env.DB_HOST}`);
  console.log(`   DB_USER: ${process.env.DB_USER}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME}`);
  console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : '(vazio)'}`);
  console.log('');
  
  try {
    // Testa conexão
    const connection = await db.getConnection();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Testa query simples
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('✅ Query de teste executada:', rows[0]);
    console.log('');
    
    // Lista bancos de dados
    const [databases] = await connection.query('SHOW DATABASES');
    console.log('📊 Bancos de dados disponíveis:');
    databases.forEach(db => console.log(`   - ${db.Database}`));
    console.log('');
    
    // Verifica se o banco existe
    const dbExists = databases.some(d => d.Database === process.env.DB_NAME);
    if (dbExists) {
      console.log(`✅ Banco '${process.env.DB_NAME}' encontrado!`);
      
      // Lista tabelas
      const [tables] = await connection.query(`SHOW TABLES FROM ${process.env.DB_NAME}`);
      console.log(`\n📋 Tabelas no banco '${process.env.DB_NAME}':`);
      if (tables.length === 0) {
        console.log('   ⚠️  Nenhuma tabela encontrada! Execute o script SQL de estrutura.');
      } else {
        tables.forEach(table => {
          const tableName = Object.values(table)[0];
          console.log(`   - ${tableName}`);
        });
      }
    } else {
      console.log(`❌ Banco '${process.env.DB_NAME}' NÃO encontrado!`);
      console.log(`\n💡 Crie o banco com o comando:`);
      console.log(`   CREATE DATABASE ${process.env.DB_NAME};`);
    }
    
    connection.release();
    console.log('\n✅ Teste concluído com sucesso!\n');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erro ao testar banco de dados:');
    console.error(`   ${error.message}`);
    console.error('\n📝 Possíveis causas:');
    console.error('   1. MySQL/MariaDB não está rodando');
    console.error('   2. Credenciais incorretas no .env');
    console.error('   3. Banco de dados não existe');
    console.error('   4. Permissões do usuário insuficientes');
    console.error('\n💡 Soluções:');
    console.error('   1. Inicie o MySQL/MariaDB');
    console.error('   2. Verifique DB_USER e DB_PASSWORD no .env');
    console.error(`   3. Execute: CREATE DATABASE ${process.env.DB_NAME};`);
    console.error('   4. Dê permissões ao usuário no MySQL\n');
    process.exit(1);
  }
}

testDatabase();
