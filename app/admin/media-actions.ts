'use server';

import { revalidatePath } from 'next/cache';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { eq } from 'drizzle-orm';
import { db, UPLOADS_DIR } from '../../lib/db/index.ts';
import { media } from '../../lib/db/schema.ts';
import { requireAdmin } from '../../lib/admin-guard.ts';

export type MediaItem = {
  id: number;
  filename: string;
  mime: string;
  width: number | null;
  height: number | null;
  bytes: number;
  alt: string;
};

export async function listMedia(): Promise<MediaItem[]> {
  await requireAdmin();
  return db
    .select({
      id: media.id,
      filename: media.filename,
      mime: media.mime,
      width: media.width,
      height: media.height,
      bytes: media.bytes,
      alt: media.alt,
    })
    .from(media)
    .orderBy(media.id)
    .all()
    .reverse();
}

export async function setAlt(id: number, alt: string): Promise<void> {
  await requireAdmin();
  db.update(media).set({ alt: alt.trim() }).where(eq(media.id, id)).run();
  revalidatePath('/');
  revalidatePath('/admin/media');
}

export async function deleteMedia(id: number): Promise<void> {
  await requireAdmin();

  const row = db.select().from(media).where(eq(media.id, id)).get();
  if (!row) return;

  db.delete(media).where(eq(media.id, id)).run();

  // Best effort: a missing file must not block removing the row.
  try {
    await unlink(join(UPLOADS_DIR, row.filename));
  } catch {
    /* already gone */
  }

  revalidatePath('/');
  revalidatePath('/admin/media');
}
