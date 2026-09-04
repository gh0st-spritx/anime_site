import { NextResponse } from 'next/server';
import { createReadStream, existsSync } from 'node:fs';
import { Readable } from 'node:stream';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { db, UPLOADS_DIR } from '../../../../lib/db/index.ts';
import { media } from '../../../../lib/db/schema.ts';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return new NextResponse('Not found', { status: 404 });
  }

  const row = db.select().from(media).where(eq(media.id, numericId)).get();
  if (!row) return new NextResponse('Not found', { status: 404 });

  // The path comes from the database row, never from the request. A
  // client-supplied path is never joined into a filesystem read.
  const path = join(UPLOADS_DIR, row.filename);
  if (!existsSync(path)) return new NextResponse('Not found', { status: 404 });

  const stream = Readable.toWeb(
    createReadStream(path),
  ) as unknown as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      'Content-Type': row.mime,
      'Content-Length': String(row.bytes),
      // Content at a given id never changes — a new upload gets a new id.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
