'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { requireAdmin } from '../../lib/admin-guard.ts';
import { getResource, type FieldDef } from '../../lib/admin/resources.ts';

export type SaveState = { error?: string; ok?: boolean };

/**
 * Coerces one form value according to its DECLARED type.
 *
 * This is the security boundary for the whole panel. Values are read
 * field-by-field from the resource config — never by spreading
 * Object.fromEntries(formData) — so an injected extra form field cannot write
 * a column the config does not list (`id`, `sortOrder`, or anything else).
 */
function coerce(field: FieldDef, formData: FormData): unknown {
  const raw = formData.get(field.name);

  switch (field.type) {
    case 'boolean':
      // An unchecked checkbox submits nothing at all.
      return raw === 'on' || raw === 'true';

    case 'number':
    case 'range': {
      const n = Number(raw ?? 0);
      if (!Number.isFinite(n)) return 0;
      if (field.type === 'range') return Math.min(100, Math.max(0, Math.round(n)));
      return Math.round(n);
    }

    case 'media': {
      const s = String(raw ?? '').trim();
      if (!s) return null;
      const n = Number(s);
      return Number.isInteger(n) && n > 0 ? n : null;
    }

    case 'tags':
      return String(raw ?? '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

    case 'select': {
      const s = String(raw ?? '').trim();
      // Never trust a submitted option; it must be one the config declares.
      return field.options?.includes(s) ? s : (field.options?.[0] ?? '');
    }

    default:
      return String(raw ?? '').trim();
  }
}

function buildValues(
  fields: FieldDef[],
  formData: FormData,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) values[field.name] = coerce(field, formData);
  return values;
}

export async function saveResource(
  resourceKey: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin();

  const resource = getResource(resourceKey);
  if (!resource) return { error: 'Unknown section.' };

  for (const field of resource.fields) {
    if (!field.required) continue;
    if (!String(formData.get(field.name) ?? '').trim()) {
      return { error: `${field.label} is required.` };
    }
  }

  const values = buildValues(resource.fields, formData);
  const rawId = String(formData.get('id') ?? '').trim();
  const id = Number(rawId);
  const table = resource.table as never;

  try {
    if (rawId && Number.isInteger(id) && id > 0) {
      db.update(table)
        .set(values as never)
        .where(eq((resource.table as never as Record<string, never>).id, id))
        .run();
    } else {
      db.insert(table)
        .values(values as never)
        .run();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE')) {
      return { error: 'That value must be unique — something already uses it.' };
    }
    return { error: message };
  }

  revalidatePath('/');
  revalidatePath(`/admin/${resourceKey}`);
  return { ok: true };
}

export async function deleteResource(
  resourceKey: string,
  id: number,
): Promise<void> {
  await requireAdmin();

  const resource = getResource(resourceKey);
  if (!resource || resource.fixedRows) return;

  db.delete(resource.table as never)
    .where(eq((resource.table as never as Record<string, never>).id, id))
    .run();

  revalidatePath('/');
  revalidatePath(`/admin/${resourceKey}`);
}

/** Writes sortOrder from array position, in one transaction. */
export async function reorderResource(
  resourceKey: string,
  ids: number[],
): Promise<void> {
  await requireAdmin();

  const resource = getResource(resourceKey);
  if (!resource?.sortable) return;

  const columns = resource.table as never as Record<string, never>;

  db.transaction((tx) => {
    ids.forEach((id, index) => {
      tx.update(resource.table as never)
        .set({ sortOrder: index } as never)
        .where(eq(columns.id, id))
        .run();
    });
  });

  revalidatePath('/');
  revalidatePath(`/admin/${resourceKey}`);
}

/**
 * Moves one row up or down.
 *
 * Up/down buttons rather than drag-and-drop: no dependency, reachable by
 * keyboard, and it works on a phone. Reordering ten rows is not worth a
 * drag library.
 */
export async function moveResource(
  resourceKey: string,
  id: number,
  direction: 'up' | 'down',
): Promise<void> {
  await requireAdmin();

  const resource = getResource(resourceKey);
  if (!resource?.sortable) return;

  const columns = resource.table as never as Record<string, never>;
  const rows = db
    .select()
    .from(resource.table as never)
    .orderBy(columns.sortOrder, columns.id)
    .all() as { id: number }[];

  const index = rows.findIndex((r) => r.id === id);
  if (index < 0) return;

  const target = direction === 'up' ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return;

  [rows[index], rows[target]] = [rows[target], rows[index]];

  db.transaction((tx) => {
    rows.forEach((row, position) => {
      tx.update(resource.table as never)
        .set({ sortOrder: position } as never)
        .where(eq(columns.id, row.id))
        .run();
    });
  });

  revalidatePath('/');
  revalidatePath(`/admin/${resourceKey}`);
}

export async function setVisibility(
  resourceKey: string,
  id: number,
  visible: boolean,
): Promise<void> {
  await requireAdmin();

  const resource = getResource(resourceKey);
  if (!resource) return;

  db.update(resource.table as never)
    .set({ visible } as never)
    .where(eq((resource.table as never as Record<string, never>).id, id))
    .run();

  revalidatePath('/');
  revalidatePath(`/admin/${resourceKey}`);
}
