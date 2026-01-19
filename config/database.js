const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool for Supabase
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
  process.exit(-1);
});

// Test connection
pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[DB] Closing connection pool...');
  await pool.end();
  process.exit(0);
});

module.exports = pool;
