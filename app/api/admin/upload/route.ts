import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { db, UPLOADS_DIR } from '../../../../lib/db/index.ts';
import { media } from '../../../../lib/db/schema.ts';
import { getAdmin } from '../../../../lib/admin-guard.ts';
import {
  ALLOWED_MIME,
  MAX_UPLOAD_BYTES,
  isImage,
} from '../../../../lib/media.ts';

export async function POST(request: Request) {
  if (!(await getAdmin())) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file received.' }, { status: 400 });
  }

  const extension = ALLOWED_MIME[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: `That file type (${file.type || 'unknown'}) is not allowed.` },
      { status: 415 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: 'That file is larger than 25 MB.' },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // The stored name is generated here. No part of the client-supplied filename
  // ever reaches the filesystem path.
  const filename = `${randomUUID()}${extension}`;

  let width: number | null = null;
  let height: number | null = null;

  if (isImage(file.type)) {
    try {
      const meta = await sharp(buffer).metadata();
      width = meta.width ?? null;
      height = meta.height ?? null;
    } catch {
      return NextResponse.json(
        { error: 'That file claims to be an image but could not be read.' },
        { status: 400 },
      );
    }
  }

  await writeFile(join(UPLOADS_DIR, filename), buffer);

  const row = db
    .insert(media)
    .values({
      filename,
      mime: file.type,
      width,
      height,
      bytes: file.size,
      alt: '',
      createdAt: Date.now(),
    })
    .returning()
    .get();

  return NextResponse.json({
    id: row.id,
    url: `/api/media/${row.id}`,
    width: row.width,
    height: row.height,
  });
}
