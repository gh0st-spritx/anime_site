/**
 * Asset pipeline: manifest -> download -> transcode -> media rows -> story acts.
 *
 * Generation itself happens through the Higgsfield MCP tools, which only an
 * agent session can call. This script consumes what those produced: every
 * result URL is recorded in scripts/assets.manifest.json, and running this
 * turns them into optimised local files wired to the right act.
 *
 * Re-runnable and resumable. An entry already marked `done` with its file
 * present on disk is skipped, so a failed run continues where it stopped
 * rather than regenerating or re-downloading anything.
 *
 *   npm run assets            apply the manifest
 *   npm run assets -- --force redo every entry
 *   npm run assets -- --dry   report what would happen, change nothing
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { db, UPLOADS_DIR } from '../lib/db/index.ts';
import { media, storyActs } from '../lib/db/schema.ts';
import { runMigrations } from '../lib/db/migrate.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = join(HERE, 'assets.manifest.json');

/** Which plate column an entry fills on its act. */
type Slot = 'sky' | 'mid' | 'fore' | 'loop';

type Entry = {
  id: string;
  act: string;
  slot: Slot;
  url: string;
  alt: string;
  /** Credits this generation cost, for the run report. */
  credits?: number;
  done?: boolean;
  mediaId?: number;
};

type Manifest = { entries: Entry[] };

const SLOT_COLUMN = {
  sky: 'plateSkyMediaId',
  mid: 'plateMidMediaId',
  fore: 'plateForeMediaId',
  loop: 'loopMediaId',
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

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
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

async function main(): Promise<void> {
  const force = process.argv.includes('--force');
  const dry = process.argv.includes('--dry');

  mkdirSync(UPLOADS_DIR, { recursive: true });
  runMigrations();

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

    const alreadyDone =
      entry.done &&
      entry.mediaId &&
      db.select().from(media).where(eq(media.id, entry.mediaId)).get();

    if (alreadyDone && !force) {
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
      const buffer = await download(entry.url);

      const isVideo = entry.slot === 'loop';
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

      db.update(storyActs)
        .set({ [SLOT_COLUMN[entry.slot]]: row.id })
        .where(eq(storyActs.key, entry.act))
        .run();

      entry.done = true;
      entry.mediaId = row.id;
      saveManifest(manifest);

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
