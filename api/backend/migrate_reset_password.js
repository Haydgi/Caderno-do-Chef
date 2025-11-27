import db from './database/connection.js';

async function migrarCamposRecuperacaoSenha() {
  try {
    console.log('🔄 Verificando se as colunas de recuperação de senha já existem...');

    // Verificar se as colunas já existem
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}' 
      AND TABLE_NAME = 'usuario' 
      AND COLUMN_NAME IN ('reset_token', 'reset_token_expiracao')
    `);

    if (columns.length >= 2) {
      console.log('✅ As colunas já existem! Nada a fazer.');
      process.exit(0);
    }

    console.log('📝 Adicionando colunas de recuperação de senha...');

    // Adicionar coluna reset_token se não existir
    if (!columns.some(col => col.COLUMN_NAME === 'reset_token')) {
      await db.query(`
        ALTER TABLE usuario 
        ADD COLUMN reset_token VARCHAR(255) NULL
      `);
      console.log('✅ Coluna reset_token adicionada');
    }

    // Adicionar coluna reset_token_expiracao se não existir
    if (!columns.some(col => col.COLUMN_NAME === 'reset_token_expiracao')) {
      await db.query(`
        ALTER TABLE usuario 
        ADD COLUMN reset_token_expiracao DATETIME NULL
      `);
      console.log('✅ Coluna reset_token_expiracao adicionada');
    }

    // Criar índice
    try {
      await db.query(`CREATE INDEX idx_reset_token ON usuario(reset_token)`);
      console.log('✅ Índice idx_reset_token criado');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Índice idx_reset_token já existe');
      } else {
        throw err;
      }
    }

    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('Agora você pode usar a recuperação de senha.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error);
    process.exit(1);
  }
}

migrarCamposRecuperacaoSenha();
