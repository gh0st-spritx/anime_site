/**
 * Asset pipeline: manifest -> download -> transcode -> media rows -> story acts.
 *
 * Generation itself happens through the Higgsfield MCP tools, which only an
 * agent session can call. This script consumes what those produced: every
 * result URL is recorded in scripts/assets.manifest.json, and running this
 * turns them into optimised local files wired to the right act.
 *
 * Re-runnable and resumable. An entry whose act slot is already filled by a
 * media row with its file on disk is skipped, so a failed run continues where
 * it stopped. The manifest itself is never rewritten — it describes the set,
 * and the target database is the record of what has been applied.
 *
 *   npm run assets            apply the manifest
 *   npm run assets -- --force redo every entry
 *   npm run assets -- --dry   report what would happen, change nothing
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { db, UPLOADS_DIR } from '../lib/db/index.ts';
import { media, storyActs } from '../lib/db/schema.ts';
import { runMigrations } from '../lib/db/migrate.ts';
import { seed } from './seed.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(HERE, 'assets.manifest.json');

/** Which plate column an entry fills on its act. */
type Slot = 'sky' | 'mid' | 'fore' | 'loop' | 'connector';

type Entry = {
  id: string;
  act: string;
  slot: Slot;
  /**
   * A repo-relative source file, committed alongside the code. Preferred over
   * `url`: a fresh deploy has an empty volume and no artwork, and the
   * generator's CDN links will not live forever. Committing the sources makes
   * `npm run assets` reproducible offline on any new host.
   */
  file?: string;
  /** Where it originally came from. Kept for provenance. */
  url?: string;
  alt: string;
  /** Credits this generation cost, for the run report. */
  credits?: number;
};

type Manifest = { entries: Entry[] };

const SLOT_COLUMN = {
  sky: 'plateSkyMediaId',
  mid: 'plateMidMediaId',
  fore: 'plateForeMediaId',
  loop: 'loopMediaId',
  connector: 'connectorMediaId',
} as const;

/** Widths emitted for each still. The largest act should stay under ~1.5MB. */
const WIDTHS = [960, 1600, 2400];

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) return { entries: [] };
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
}

function saveManifest(manifest: Manifest): void {
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

const REPO_ROOT = join(HERE, '..');

/** Reads an entry's source: the committed file when there is one, else the URL. */
async function readSource(entry: Entry): Promise<Buffer> {
  if (entry.file) {
    const path = resolve(REPO_ROOT, entry.file);
    if (!path.startsWith(REPO_ROOT)) {
      throw new Error(`manifest file path escapes the repo: ${entry.file}`);
    }
    if (!existsSync(path)) throw new Error(`missing source file ${entry.file}`);
    return readFileSync(path);
  }

  if (!entry.url) throw new Error('entry has neither file nor url');
  const res = await fetch(entry.url);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${entry.url}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Writes AVIF and WebP at several widths, plus the widest WebP as the file the
 * media row points at. Everything else is served by the same route, so a
 * missing derivative degrades to the base file rather than a broken image.
 */
async function transcodeStill(
  buffer: Buffer,
  baseName: string,
): Promise<{ filename: string; width: number; height: number; bytes: number }> {
  const meta = await sharp(buffer).metadata();

  for (const width of WIDTHS) {
    if ((meta.width ?? 0) < width) continue;
    await sharp(buffer)
      .resize({ width })
      .avif({ quality: 55 })
      .toFile(join(UPLOADS_DIR, `${baseName}-${width}.avif`));
    await sharp(buffer)
      .resize({ width })
      .webp({ quality: 78 })
      .toFile(join(UPLOADS_DIR, `${baseName}-${width}.webp`));
  }

  const filename = `${baseName}.webp`;
  const info = await sharp(buffer)
    .resize({ width: Math.min(meta.width ?? 2400, 2400) })
    .webp({ quality: 82 })
    .toFile(join(UPLOADS_DIR, filename));

  return {
    filename,
    width: info.width,
    height: info.height,
    bytes: info.size,
  };
}

/**
 * True when this entry's slot is already filled by a media row whose file is
 * on disk.
 *
 * Deliberately asks the DATABASE rather than a flag in the manifest. Media ids
 * are per-database, so a `done` marker written against one volume would make
 * the pipeline skip work on a fresh deploy, and re-running against the original
 * would insert duplicate rows. Asking the target directly is correct in both.
 */
function isApplied(entry: Entry): boolean {
  const act = db
    .select()
    .from(storyActs)
    .where(eq(storyActs.key, entry.act))
    .get();
  if (!act) return false;

  const mediaId = act[SLOT_COLUMN[entry.slot]];
  if (typeof mediaId !== 'number') return false;

  const row = db.select().from(media).where(eq(media.id, mediaId)).get();
  if (!row) return false;

  return existsSync(join(UPLOADS_DIR, row.filename));
}

async function main(): Promise<void> {
  const force = process.argv.includes('--force');
  const dry = process.argv.includes('--dry');

  mkdirSync(UPLOADS_DIR, { recursive: true });
  runMigrations();
  // The acts must exist before anything can be attached to them. Running the
  // seed here (it is idempotent) means this works on a volume the app has
  // never booted against — otherwise every UPDATE matches zero rows and the
  // run reports success while wiring nothing.
  seed();

  const manifest = loadManifest();
  if (manifest.entries.length === 0) {
    console.log('Manifest is empty — nothing to apply.');
    return;
  }

  let applied = 0;
  let skipped = 0;
  let failed = 0;
  let credits = 0;

  for (const entry of manifest.entries) {
    credits += entry.credits ?? 0;

    if (!force && isApplied(entry)) {
      skipped += 1;
      continue;
    }

    if (dry) {
      console.log(`would apply  ${entry.act}/${entry.slot}  ${entry.id}`);
      applied += 1;
      continue;
    }

    try {
      process.stdout.write(`${entry.act}/${entry.slot} … `);
      const buffer = await readSource(entry);

      const isVideo = entry.slot === 'loop' || entry.slot === 'connector';
      let filename: string;
      let width: number | null = null;
      let height: number | null = null;
      let bytes: number;
      let mime: string;

      if (isVideo) {
        filename = `${entry.id}.mp4`;
        writeFileSync(join(UPLOADS_DIR, filename), buffer);
        bytes = buffer.byteLength;
        mime = 'video/mp4';
      } else {
        const out = await transcodeStill(buffer, entry.id);
        filename = out.filename;
        width = out.width;
        height = out.height;
        bytes = out.bytes;
        mime = 'image/webp';
      }

      const row = db
        .insert(media)
        .values({
          filename,
          mime,
          width,
          height,
          bytes,
          alt: entry.alt,
          createdAt: Date.now(),
        })
        .returning()
        .get();

      const updated = db
        .update(storyActs)
        .set({ [SLOT_COLUMN[entry.slot]]: row.id })
        .where(eq(storyActs.key, entry.act))
        .run();

      // Never let a no-op update pass as success.
      if (updated.changes === 0) {
        throw new Error(
          `no act with key "${entry.act}" — media #${row.id} was stored but is attached to nothing`,
        );
      }

      applied += 1;
      console.log(`ok  #${row.id}  ${(bytes / 1024).toFixed(0)} KB`);
    } catch (error) {
      failed += 1;
      console.log(`FAILED  ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log(
    `\n${applied} applied, ${skipped} already done, ${failed} failed.` +
      `\nCredits recorded in this manifest: ${credits.toFixed(2)}`,
  );
  if (failed > 0) process.exitCode = 1;
}

// tsx transpiles this to CJS, where top-level await is not available.
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
