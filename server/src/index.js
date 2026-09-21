import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import http from 'http';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';
import { initializePostgres } from './config/postgres.js';

dotenv.config();

try {
  await initializePostgres();
} catch (error) {
  console.warn(`PostgreSQL re-identification storage unavailable: ${error.message}`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const REQUESTED_PORT = Number(process.env.PORT) || 5000;
const MAX_PORT_ATTEMPTS = 5; // requested port + up to 5 fallbacks

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
].filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || String(process.env.CORS_ALLOW_ALL || 'true').toLowerCase() === 'true') {
      callback(null, true);
      return;
    }
    callback(new Error('CORS policy disallows this origin'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '20mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/images', express.static(path.join(__dirname, '..', 'data', 'images')));
app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

/* -------------------------------------------------------------------------
 * Duplicate-instance guard
 *
 * Writes a small lock file (server/data/server.lock) containing the PID of
 * the process currently bound to a port. On startup we check whether that
 * PID is still alive:
 *   - alive  -> a real duplicate instance is already running; refuse to start.
 *   - dead   -> stale lock left behind by a crash/force-kill; safe to ignore.
 * ---------------------------------------------------------------------- */
const LOCK_FILE = path.join(__dirname, '..', 'data', 'server.lock');
const LOCK_STALE_AFTER_MS = 60 * 60 * 1000; // 1 hour

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0); // signal 0 = existence check only, doesn't kill anything
    return true;
  } catch {
    return false;
  }
}

function checkForDuplicateInstance() {
  if (!fs.existsSync(LOCK_FILE)) return;

  try {
    const stat = fs.statSync(LOCK_FILE);
    const ageMs = Date.now() - stat.mtimeMs;

    // A lock file left over from days/hours ago is far more likely to be a
    // stale leftover (or, on Windows, a PID that has since been recycled by
    // an unrelated process) than a genuinely still-running duplicate.
    if (ageMs > LOCK_STALE_AFTER_MS) {
      fs.unlinkSync(LOCK_FILE);
      return;
    }

    const { pid, port } = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
    if (pid && isProcessAlive(pid)) {
      console.error(
        `\n🚫 Another instance of this server appears to already be running (PID ${pid}, port ${port}).\n` +
          `   Stop that process first, or delete ${LOCK_FILE} if you're sure it's stale.\n`
      );
      process.exit(1);
    }
    // Stale lock from a previous crash - safe to remove and continue.
    fs.unlinkSync(LOCK_FILE);
  } catch {
    // Corrupt or unreadable lock file - remove it rather than block startup.
    try {
      fs.unlinkSync(LOCK_FILE);
    } catch {
      /* ignore */
    }
  }
}

function writeLockFile(port) {
  fs.mkdirSync(path.dirname(LOCK_FILE), { recursive: true });
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, port }), 'utf8');
}

function removeLockFile() {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch {
    /* already gone - fine */
  }
}

/* -------------------------------------------------------------------------
 * Startup with automatic fallback ports
 * ---------------------------------------------------------------------- */
checkForDuplicateInstance();

function startServer(port, attempt = 0) {
  const sslKeyPath = process.env.HTTPS_KEY_PATH;
  const sslCertPath = process.env.HTTPS_CERT_PATH;
  const useHttps = Boolean(sslKeyPath && sslCertPath);

  const createServer = () => {
    if (!useHttps) {
      return http.createServer(app);
    }

    try {
      const key = fs.readFileSync(sslKeyPath);
      const cert = fs.readFileSync(sslCertPath);
      return https.createServer({ key, cert }, app);
    } catch (error) {
      console.warn(
        `⚠️ HTTPS certificate files not found or unreadable at ${sslKeyPath} / ${sslCertPath}. Falling back to HTTP on localhost.`
      );
      console.warn(error.message);
      return http.createServer(app);
    }
  };

  const server = createServer();
  const scheme = server instanceof https.Server ? 'https' : 'http';

  server.listen(port, () => {
    if (port !== REQUESTED_PORT) {
      console.warn(`⚠️  Port ${REQUESTED_PORT} was unavailable; started on fallback port ${port} instead.`);
      console.warn(`   Update the client's Vite proxy target (client/vite.config.js) if this becomes permanent.`);
    }
    console.log(`🐾 Stray Dog API listening on ${scheme}://localhost:${port}`);
    writeLockFile(port);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use (another process, not this app, is bound to it).`);

      if (attempt < MAX_PORT_ATTEMPTS) {
        const nextPort = port + 1;
        console.warn(`Trying fallback port ${nextPort}...`);
        startServer(nextPort, attempt + 1);
      } else {
        console.error(
          `\nGave up after trying ports ${REQUESTED_PORT}-${port}. All of them are in use.\n` +
            `Free one of these ports, or set a different PORT in server/.env.\n`
        );
        process.exit(1);
      }
      return;
    }
    throw error;
  });

  // Release the lock file on any form of shutdown so the next start doesn't
  // see a stale "duplicate instance" record.
  const shutdown = () => {
    removeLockFile();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', removeLockFile);
}

startServer(REQUESTED_PORT);
