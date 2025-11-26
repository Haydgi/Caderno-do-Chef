import db from './database/connection.js';

async function verificarColunas() {
  try {
    const [colunas] = await db.query('DESCRIBE usuario');
    console.log('\n📋 Colunas da tabela usuario:');
    colunas.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
    });

    const [usuarios] = await db.query(
      'SELECT * FROM usuario WHERE Email = ?',
      ['andressmota78@gmail.com']
    );

    if (usuarios.length > 0) {
      console.log('\n👤 Dados completos do usuário:');
      console.log(JSON.stringify(usuarios[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    process.exit(0);
  }
}

verificarColunas();
