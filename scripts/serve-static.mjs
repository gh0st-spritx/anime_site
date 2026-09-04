/**
 * Serves `out/` the way GitHub Pages does, so the export can be checked before
 * it is published.
 *
 *   npm run preview:static
 *
 * Honours PAGES_BASE_PATH, because a project page is served from a
 * subdirectory and a base-path mistake only shows up there — at the root
 * everything resolves and the deployed site still 404s on every asset.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');
const BASE = process.env.PAGES_BASE_PATH ?? '';
const PORT = Number(process.env.PREVIEW_PORT ?? 4599);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  let path = decodeURIComponent(req.url.split('?')[0]);

  if (BASE) {
    if (path === BASE) path = '/';
    else if (path.startsWith(`${BASE}/`)) path = path.slice(BASE.length);
    else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end(`Not under base path ${BASE}`);
    }
  }

  if (path.endsWith('/')) path += 'index.html';

  const file = join(ROOT, path);
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Content-Length': info.size,
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(await readFile(join(ROOT, '404.html')).catch(() => 'Not found'));
  }
}).listen(PORT, () => {
  console.log(`Serving out/ at http://localhost:${PORT}${BASE}/`);
});
