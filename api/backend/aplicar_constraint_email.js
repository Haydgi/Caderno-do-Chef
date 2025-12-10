// ═══════════════════════════════════════════════════════════
// Script: Aplicar constraint UNIQUE no campo Email
// ═══════════════════════════════════════════════════════════

import db from './database/connection.js';

async function aplicarConstraintEmail() {
  try {
    console.log('🔍 Verificando emails duplicados...\n');
    
    // Verificar se existem emails duplicados
    const [duplicados] = await db.query(`
      SELECT Email, COUNT(*) as total
      FROM usuario
      GROUP BY Email
      HAVING COUNT(*) > 1
    `);
    
    if (duplicados.length > 0) {
      console.log('⚠️  ATENÇÃO: Foram encontrados emails duplicados:\n');
      duplicados.forEach(dup => {
        console.log(`   - ${dup.Email} (${dup.total} ocorrências)`);
      });
      console.log('\n❌ Não é possível adicionar a constraint UNIQUE.');
      console.log('   Resolva as duplicatas manualmente antes de prosseguir.\n');
      process.exit(1);
    }
    
    console.log('✅ Nenhum email duplicado encontrado.\n');
    console.log('🔧 Aplicando constraint UNIQUE...\n');
    
    // Adicionar constraint UNIQUE
    await db.query(`
      ALTER TABLE usuario
      ADD CONSTRAINT unique_email UNIQUE (Email)
    `);
    
    console.log('✅ Constraint UNIQUE aplicada com sucesso!\n');
    
    // Verificar se foi aplicada
    const [indexes] = await db.query(`
      SHOW INDEX FROM usuario WHERE Key_name = 'unique_email'
    `);
    
    if (indexes.length > 0) {
      console.log('✅ Verificação: Constraint "unique_email" está ativa.\n');
      console.log('📧 A partir de agora, não será possível cadastrar emails duplicados.\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    if (error.code === 'ER_DUP_KEYNAME') {
      console.log('ℹ️  A constraint UNIQUE já existe no banco de dados.\n');
      process.exit(0);
    }
    
    console.error('❌ Erro ao aplicar constraint:', error.message);
    process.exit(1);
  }
}

aplicarConstraintEmail();
