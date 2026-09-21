import pg from 'pg';

const { Pool } = pg;
let postgresPool = null;

export function getPostgresPool() {
  if (!postgresPool && process.env.DATABASE_URL?.trim()) {
    postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL.trim(),
      max: Number(process.env.POSTGRES_POOL_SIZE || 5)
    });
  }
  return postgresPool;
}

export const isPostgresConfigured = () => Boolean(process.env.DATABASE_URL?.trim());

export async function initializePostgres() {
  const pool = getPostgresPool();
  if (!pool) return false;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS dog_embedding_metadata (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      model TEXT NOT NULL,
      preprocessing TEXT NOT NULL,
      embedding_dimension INTEGER NOT NULL CHECK (embedding_dimension > 0)
    );

    CREATE TABLE IF NOT EXISTS dog_embeddings (
      dog_id TEXT PRIMARY KEY,
      image_name TEXT NOT NULL,
      image_hash TEXT NOT NULL UNIQUE CHECK (char_length(image_hash) = 64),
      embedding DOUBLE PRECISION[] NOT NULL,
      embedding_dimension INTEGER NOT NULL CHECK (embedding_dimension > 0),
      model TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  return true;
}