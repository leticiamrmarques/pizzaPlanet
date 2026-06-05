// Conexão com MySQL usando mysql2 com pool de conexões

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'pizzaria',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '-03:00', //horário de Brasília. Tomar cuidado com horário de verão.
});

module.exports = pool;
