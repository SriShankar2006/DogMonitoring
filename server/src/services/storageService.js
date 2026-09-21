import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_ROOT = path.join(__dirname, '..', 'data', 'images');

function resolveBaseUrl() {
  return (
    process.env.SERVER_BASE_URL ||
    (process.env.HTTPS_KEY_PATH && process.env.HTTPS_CERT_PATH
      ? 'https://localhost:5000'
      : 'http://localhost:5000')
  ).replace(/\/$/, '');
}

/**
 * Save every uploaded dog image in a dedicated server folder inside the server
 * project. This gives the app a single canonical image store for both
 * re-identification and front-end display, while keeping all client uploads on
 * the client/server flow only.
 */
export async function uploadSightingImage({ buffer, mimeType, dogId, sightingId }) {
  const ext = mimeType === 'image/png' ? 'png' : 'jpg';
  const fileName = `${sightingId}.${ext}`;
  const dogFolder = String(dogId || 'unknown');
  const imagesDir = path.join(IMAGES_ROOT, dogFolder);

  await fs.mkdir(imagesDir, { recursive: true });
  const filePath = path.join(imagesDir, fileName);
  await fs.writeFile(filePath, buffer);

  const baseUrl = resolveBaseUrl();
  return `${baseUrl}/images/${encodeURIComponent(dogFolder)}/${fileName}`;
}

/**
 * Removes every stored image for a dog. This is intentionally best-effort.
 */
export async function deleteDogImages(dogId) {
  const dogFolder = path.join(IMAGES_ROOT, String(dogId || 'unknown'));

  try {
    await fs.rm(dogFolder, { recursive: true, force: true });
  } catch (err) {
    console.error(`Failed to remove local images for ${dogId}:`, err);
  }
}
