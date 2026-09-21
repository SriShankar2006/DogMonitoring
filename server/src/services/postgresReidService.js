import crypto from 'crypto';
import { getPostgresPool } from '../config/postgres.js';

export const POSTGRES_REID_PREPROCESSING = 'server-embedding-v1';

export function hashImageBuffer(imageBuffer) {
  return crypto.createHash('sha256').update(imageBuffer).digest('hex');
}

function normalizeEmbedding(embedding) {
  const values = Array.isArray(embedding) ? embedding.map(Number) : [];
  if (!values.length || values.some((value) => !Number.isFinite(value))) return [];
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return norm > 0 ? values.map((value) => value / norm) : values;
}

function cosineSimilarity(left, right) {
  if (left.length !== right.length || !left.length) return 0;
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

export async function listPostgresReidCandidates(embedding) {
  const postgresPool = getPostgresPool();
  if (!postgresPool) return [];
  const queryEmbedding = normalizeEmbedding(embedding);
  if (!queryEmbedding.length) return [];

  const { rows } = await postgresPool.query(
    'SELECT dog_id, image_name, embedding, created_at FROM dog_embeddings WHERE embedding_dimension = $1',
    [queryEmbedding.length]
  );

  return rows
    .map((row) => ({
      dog_id: row.dog_id,
      image_name: row.image_name,
      created_at: row.created_at,
      visual_similarity: cosineSimilarity(queryEmbedding, normalizeEmbedding(row.embedding))
    }))
    .sort((left, right) => right.visual_similarity - left.visual_similarity);
}

export async function findPostgresImageByHash(imageHash) {
  const postgresPool = getPostgresPool();
  if (!postgresPool || !imageHash) return null;

  const { rows } = await postgresPool.query(
    'SELECT dog_id, image_name FROM dog_embeddings WHERE image_hash = $1 LIMIT 1',
    [imageHash]
  );
  return rows[0] || null;
}

export async function savePostgresEmbedding({ dogId, imageName, imageBuffer, embedding, modelName }) {
  const postgresPool = getPostgresPool();
  if (!postgresPool) return false;
  const normalized = normalizeEmbedding(embedding);
  if (!normalized.length || !dogId) return false;

  const imageHash = hashImageBuffer(imageBuffer);
  const model = modelName || 'server-embedding';

  await postgresPool.query(
    `INSERT INTO dog_embedding_metadata (id, model, preprocessing, embedding_dimension)
     VALUES (1, $1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET model = EXCLUDED.model,
       preprocessing = EXCLUDED.preprocessing,
       embedding_dimension = EXCLUDED.embedding_dimension`,
    [model, POSTGRES_REID_PREPROCESSING, normalized.length]
  );
  await postgresPool.query(
    `INSERT INTO dog_embeddings
       (dog_id, image_name, image_hash, embedding, embedding_dimension, model)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (dog_id) DO UPDATE SET image_name = EXCLUDED.image_name,
       image_hash = EXCLUDED.image_hash, embedding = EXCLUDED.embedding,
       embedding_dimension = EXCLUDED.embedding_dimension, model = EXCLUDED.model`,
    [dogId, imageName, imageHash, normalized, normalized.length, model]
  );
  return true;
}