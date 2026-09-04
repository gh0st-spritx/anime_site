'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { profile, settings, storyActs } from '../../lib/db/schema.ts';
import type { SectionConfig } from '../../lib/db/schema.ts';
import { requireAdmin } from '../../lib/admin-guard.ts';

export type SaveState = { error?: string; ok?: boolean };

const MOTION = ['full', 'reduced', 'off'] as const;

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

export async function saveProfile(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin();

  const name = str(formData, 'name');
  const birthdate = str(formData, 'birthdate');

  if (!name) return { error: 'Name is required.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    return { error: 'Birthdate must be a real date — the site computes your age from it.' };
  }
  if (Number.isNaN(Date.parse(`${birthdate}T00:00:00Z`))) {
    return { error: 'That birthdate is not a valid date.' };
  }

  const mediaId = Number(str(formData, 'avatarMediaId'));

  db.update(profile)
    .set({
      name,
      title: str(formData, 'title'),
      tagline: str(formData, 'tagline'),
      birthdate,
      bio: String(formData.get('bio') ?? ''),
      location: str(formData, 'location'),
      avatarMediaId: Number.isInteger(mediaId) && mediaId > 0 ? mediaId : null,
    })
    .where(eq(profile.id, 1))
    .run();

  revalidatePath('/');
  return { ok: true };
}

export async function saveSettings(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin();

  const accent = str(formData, 'accentColor');
  if (!/^#[0-9a-fA-F]{6}$/.test(accent)) {
    return { error: 'Accent colour must be a hex value like #6ee7ff.' };
  }

  const motion = str(formData, 'motionIntensity');
  if (!MOTION.includes(motion as (typeof MOTION)[number])) {
    return { error: 'Unknown motion setting.' };
  }

  // Section order and visibility come back as a list of act keys plus a
  // checkbox per key. Only keys that actually exist are accepted.
  const known = new Set(
    db.select({ key: storyActs.key }).from(storyActs).all().map((r) => r.key),
  );
  const order = formData.getAll('sectionOrder').map(String).filter((k) => known.has(k));
  const shown = new Set(formData.getAll('sectionVisible').map(String));
  const sectionConfig: SectionConfig = order.map((key) => ({
    key,
    visible: shown.has(key),
  }));

  if (sectionConfig.length === 0) {
    return { error: 'The section list came back empty — nothing was saved.' };
  }

  const seoImageId = Number(str(formData, 'seoImageMediaId'));

  db.update(settings)
    .set({
      accentColor: accent,
      motionIntensity: motion,
      audioDefaultOn: formData.get('audioDefaultOn') === 'on',
      sectionConfig,
      seoTitle: str(formData, 'seoTitle'),
      seoDescription: str(formData, 'seoDescription'),
      seoImageMediaId:
        Number.isInteger(seoImageId) && seoImageId > 0 ? seoImageId : null,
      analyticsSnippet: String(formData.get('analyticsSnippet') ?? ''),
      maintenanceMode: formData.get('maintenanceMode') === 'on',
    })
    .where(eq(settings.id, 1))
    .run();

  revalidatePath('/');
  return { ok: true };
}
