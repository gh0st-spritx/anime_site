import { NextResponse } from 'next/server';
import { createReadStream, existsSync } from 'node:fs';
import { statSync } from 'node:fs';
import { Readable } from 'node:stream';
import { join, extname, basename } from 'node:path';
import { eq } from 'drizzle-orm';
import { db, UPLOADS_DIR } from '../../../../lib/db/index.ts';
import { media } from '../../../../lib/db/schema.ts';

/** Widths the asset pipeline emits. Anything else is ignored. */
const WIDTHS = new Set([960, 1600, 2400]);

/**
 * Picks the smallest acceptable encoding of this image.
 *
 * The pipeline writes `<base>-<width>.avif` and `.webp` beside the original.
 * Serving them shrinks a full-bleed plate on a phone from megabytes to tens of
 * kilobytes. A missing derivative simply falls back to the stored file, so the
 * image is never broken by a gap in the set.
 */
function resolveVariant(
  filename: string,
  width: number | null,
  accept: string,
): { path: string; mime: string } | null {
  if (!width || !WIDTHS.has(width)) return null;

  const base = basename(filename, extname(filename));
  const candidates: [string, string][] = [];
  if (accept.includes('image/avif')) candidates.push([`${base}-${width}.avif`, 'image/avif']);
  candidates.push([`${base}-${width}.webp`, 'image/webp']);

  for (const [name, mime] of candidates) {
    const path = join(UPLOADS_DIR, name);
    if (existsSync(path)) return { path, mime };
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return new NextResponse('Not found', { status: 404 });
  }

  const row = db.select().from(media).where(eq(media.id, numericId)).get();
  if (!row) return new NextResponse('Not found', { status: 404 });

  const requestedWidth = Number(new URL(request.url).searchParams.get('w'));
  const variant = resolveVariant(
    row.filename,
    Number.isInteger(requestedWidth) ? requestedWidth : null,
    request.headers.get('accept') ?? '',
  );

  // The path comes from the database row, never from the request. A
  // client-supplied path is never joined into a filesystem read.
  const path = variant?.path ?? join(UPLOADS_DIR, row.filename);
  if (!existsSync(path)) return new NextResponse('Not found', { status: 404 });

  const bytes = variant ? statSync(path).size : row.bytes;
  const stream = Readable.toWeb(
    createReadStream(path),
  ) as unknown as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      'Content-Type': variant?.mime ?? row.mime,
      'Content-Length': String(bytes),
      // Content at a given id never changes — a new upload gets a new id.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
      // The same URL can return avif or webp depending on the browser.
      Vary: 'Accept',
    },
  });
}
