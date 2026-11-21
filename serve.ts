// Neon Coast Cover Studio — tiny static server for trying the app locally.
// Serves app/ at http://127.0.0.1:8080 (or $PORT). Nothing is uploaded;
// the photos stay on the machine that opens the page.

import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), 'app');
const PORT = Number(process.env.PORT ?? 8080);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

// Resolve a request path inside app/, or null when it climbs out of it.
function safePath(requestUrl: string): string | null {
  let clean = '/';
  try {
    clean = decodeURIComponent(requestUrl.split('?')[0] ?? '/');
  } catch {
    return null;
  }
  const target = resolve(APP_ROOT, `.${sep}${clean}`);
  if (target !== APP_ROOT && !target.startsWith(`${APP_ROOT}${sep}`)) return null;
  return target;
}

const server = createServer((req, res) => {
  const path = safePath(req.url ?? '/');
  if (path === null) {
    res.writeHead(400, { 'content-type': 'text/plain' });
    res.end('bad path');
    return;
  }
  try {
    let file = path;
    if (statSync(file).isDirectory()) file = join(file, 'index.html');
    const body = readFileSync(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Neon Coast Cover Studio at http://127.0.0.1:${PORT}/`);
});
