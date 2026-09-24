// MiredGains desktop host: serves the exported web app from ../dist and
// exposes a local sync API over the LAN. No dependencies — plain Node.
//
//   GET  /api/state   → current merged state ({} if never synced)
//   POST /api/state   → merge posted state into stored state, respond merged
//
// Data is persisted to desktop/sync-data.json next to this file.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeStates, normalizeState } from './syncCore.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const DATA_FILE = path.join(__dirname, 'sync-data.json');
const PORT = Number(process.env.PORT) || 8500;

let state = null;
try {
  state = normalizeState(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
} catch {
  state = null; // first run — no data yet
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function persist() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Failed to persist sync data:', err);
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // ── Sync API ────────────────────────────────────────────────────────────
  if (url.pathname === '/api/state') {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      return res.end();
    }
    if (req.method === 'GET') {
      console.log(`[sync] GET from ${req.socket.remoteAddress} → ${
        state ? `${state.workouts.length} workouts` : 'empty'
      }`);
      return sendJSON(res, 200, state ?? {});
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          const incoming = normalizeState(JSON.parse(body));
          state = state ? mergeStates(state, incoming) : incoming;
          persist();
          console.log(`[sync] POST from ${req.socket.remoteAddress} → merged: ${
            state.workouts.length} workouts, ${state.bodyweights.length} entries, ${
            state.scheduledWorkouts.length} scheduled`);
          sendJSON(res, 200, state);
        } catch (err) {
          sendJSON(res, 400, { error: String(err) });
        }
      });
      return;
    }
    return sendJSON(res, 405, { error: 'method not allowed' });
  }

  if (url.pathname.startsWith('/api/')) {
    return sendJSON(res, 404, { error: 'not found' });
  }

  // ── Static web app ──────────────────────────────────────────────────────
  let filePath = path.normalize(path.join(DIST, url.pathname));
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  if (url.pathname === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST, 'index.html'); // SPA fallback
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=3600',
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`MiredGains desktop server`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Sync API: POST/GET http://<this-machine's-LAN-IP>:${PORT}/api/state`);
  console.log(`  Serving web app from ${DIST}`);
  console.log(`  Sync data file: ${DATA_FILE}`);
});
