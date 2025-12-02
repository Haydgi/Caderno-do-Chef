import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Testar conexão ao inicializar
db.getConnection()
  .then(connection => {
    console.log('✅ Conexão com banco de dados estabelecida');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar com banco de dados:', err.message);
    process.exit(1);
  });

// Tratar erros de conexão
db.on('error', (err) => {
  console.error('❌ Erro no pool de conexões:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Conexão com banco perdida. Reconectando...');
  }
});

export default db;