/**
 * Builds a static snapshot of the public site for GitHub Pages.
 *
 * GitHub Pages serves files, not a server: no Node, no SQLite, no Server
 * Actions, no route handlers. So the admin panel and `/api/*` cannot exist
 * there, and everything the page needs must be a plain file.
 *
 * Rather than restructure the app for `output: 'export'` — which would mean
 * cutting out the admin panel that is the whole point of the project — this
 * builds and runs the real server, fetches the rendered page, and copies the
 * assets it references. The server version stays completely intact.
 *
 *   npm run export:static
 *
 * Output lands in `out/`. Set PAGES_BASE_PATH when the site is served from a
 * subdirectory, which is what a project page like /anime_site/ does.
 */

import { spawn, execSync } from 'node:child_process';
import {
  mkdirSync,
  rmSync,
  cpSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'out');

const BASE_PATH = process.env.PAGES_BASE_PATH ?? '';
const MEDIA_BASE = `${BASE_PATH}/media`;
const PORT = Number(process.env.EXPORT_PORT ?? 4123);

const env = {
  ...process.env,
  NODE_ENV: 'production',
  PAGES_BASE_PATH: BASE_PATH,
  NEXT_PUBLIC_MEDIA_BASE: MEDIA_BASE,
  // The snapshot only reads; this satisfies the module-load check.
  SESSION_SECRET:
    process.env.SESSION_SECRET ?? 'static-export-placeholder-secret-value',
  DATA_DIR: process.env.DATA_DIR ?? join(ROOT, 'data'),
} as NodeJS.ProcessEnv;

function run(command: string): void {
  execSync(command, { cwd: ROOT, env, stdio: 'inherit' });
}

async function waitForServer(url: string, timeoutMs = 90_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`server did not become ready at ${url}`);
}

/**
 * Writes every media file the page can ask for, under the names mediaUrl()
 * generates: `<id>.webp` plus `<id>-<width>.webp`, and `<id>.mp4` for loops.
 */
function exportMedia(uploads: string): number {
  const db = new Database(join(env.DATA_DIR as string, 'portfolio.db'), {
    readonly: true,
  });

  const rows = db.prepare('select id, filename, mime from media').all() as {
    id: number;
    filename: string;
    mime: string;
  }[];

  const mediaOut = join(OUT, 'media');
  mkdirSync(mediaOut, { recursive: true });

  let count = 0;
  for (const row of rows) {
    const source = join(uploads, row.filename);
    if (!existsSync(source)) continue;

    const isVideo = row.mime.startsWith('video/');
    const extension = isVideo ? '.mp4' : '.webp';
    copyFileSync(source, join(mediaOut, `${row.id}${extension}`));
    count += 1;

    if (isVideo) continue;

    // Responsive variants, named as mediaUrl() expects.
    const stem = row.filename.slice(0, -extname(row.filename).length);
    for (const width of [960, 1600, 2400]) {
      const variant = join(uploads, `${stem}-${width}.webp`);
      if (!existsSync(variant)) continue;
      copyFileSync(variant, join(mediaOut, `${row.id}-${width}.webp`));
      count += 1;
    }
  }
  return count;
}

async function main(): Promise<void> {
  console.log(`Static export${BASE_PATH ? ` for base path ${BASE_PATH}` : ''}`);

  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  console.log('\n1/5  building');
  run('npx next build');

  console.log('\n2/5  starting the built server');
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    cwd: ROOT,
    env,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });

  try {
    const pageUrl = `http://localhost:${PORT}${BASE_PATH}/`;
    await waitForServer(pageUrl);

    console.log('3/5  capturing the rendered page');
    const html = await (await fetch(pageUrl)).text();
    if (!html.includes('</html>')) {
      throw new Error('captured page looks truncated');
    }
    writeFileSync(join(OUT, 'index.html'), html);
    // Pages has no server-side 404 handling; the story is one page, so send
    // every unknown path to it rather than to GitHub's default 404.
    writeFileSync(join(OUT, '404.html'), html);

    console.log('4/5  copying static assets');
    cpSync(join(ROOT, '.next', 'static'), join(OUT, '_next', 'static'), {
      recursive: true,
    });
    if (existsSync(join(ROOT, 'public'))) {
      cpSync(join(ROOT, 'public'), OUT, { recursive: true });
    }

    console.log('5/5  copying media');
    const uploads = join(env.DATA_DIR as string, 'uploads');
    const mediaCount = exportMedia(uploads);
    console.log(`     ${mediaCount} media files`);

    // Without this, Pages runs Jekyll and drops every _next/ directory.
    writeFileSync(join(OUT, '.nojekyll'), '');

    const size = execSync(
      process.platform === 'win32'
        ? `powershell -Command "'{0:N1}' -f ((Get-ChildItem -Recurse '${OUT}' | Measure-Object -Property Length -Sum).Sum / 1MB)"`
        : `du -sh "${OUT}" | cut -f1`,
      { encoding: 'utf8' },
    ).trim();

    console.log(`\nDone. out/ is ${size}${process.platform === 'win32' ? ' MB' : ''}`);
    console.log('Note: /admin and /api are deliberately absent — a static host cannot run them.');
  } finally {
    server.kill();
    // next start spawns a child on Windows; make sure the port is released.
    if (process.platform === 'win32') {
      try {
        execSync(
          `powershell -Command "Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
          { stdio: 'ignore' },
        );
      } catch {
        /* nothing listening */
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
