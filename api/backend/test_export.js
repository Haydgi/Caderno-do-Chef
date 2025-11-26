import db from './database/connection.js';
import dotenv from 'dotenv';

dotenv.config();

async function testarExportacao() {
  try {
    console.log('\n🔍 Testando queries de exportação...\n');

    // Testar cada tabela
    console.log('1️⃣ Testando tabela receitas...');
    const [receitas] = await db.query('SELECT * FROM receitas');
    console.log(`✅ Receitas: ${receitas.length} registros`);

    console.log('\n2️⃣ Testando tabela ingredientes...');
    const [ingredientes] = await db.query('SELECT * FROM ingredientes');
    console.log(`✅ Ingredientes: ${ingredientes.length} registros`);

    console.log('\n3️⃣ Testando tabela despesas...');
    const [despesas] = await db.query('SELECT * FROM despesas');
    console.log(`✅ Despesas: ${despesas.length} registros`);

    console.log('\n4️⃣ Testando tabela usuario...');
    const [usuarios] = await db.query('SELECT ID_Usuario, Nome_Usuario, Email, Telefone, Tipo_Usuario FROM usuario');
    console.log(`✅ Usuários: ${usuarios.length} registros`);

    console.log('\n✅ Todas as queries funcionaram!\n');

    // Mostrar amostra dos dados
    if (receitas.length > 0) {
      console.log('📋 Exemplo de receita:', receitas[0]);
    }

  } catch (error) {
    console.error('\n❌ Erro ao testar exportação:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

testarExportacao();
