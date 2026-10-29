const mysql = require('mysql2/promise');

/**
 * Single shared connection pool for the whole application.
 * Supports both individual DB_* environment variables and DATABASE_URL connection strings.
 * Supports optional DB_SSL=true for cloud providers (TiDB Cloud, Aiven, Railway, etc.).
 * `dateStrings: true` keeps DATE/TIME/TIMESTAMP values as plain strings
 * so they are never shifted by the Node process timezone.
 */
const sslConfig =
  process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined;

const poolConfig = process.env.DATABASE_URL
  ? {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
      charset: 'utf8mb4',
      ssl: sslConfig,
    }
  : {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'doctor_appointment_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      dateStrings: true,
      charset: 'utf8mb4',
      ssl: sslConfig,
    };

const pool = mysql.createPool(poolConfig);

/** Throws when the database is unreachable — used on server boot. */
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection };
