/**
 * Where a media file lives.
 *
 * Normally media is served by `/api/media/[id]`, which reads the row from the
 * database and picks the best encoding. A static export has no server, so the
 * build writes plain files instead and sets NEXT_PUBLIC_MEDIA_BASE — the same
 * components then emit those paths without knowing anything about it.
 */
const BASE = process.env.NEXT_PUBLIC_MEDIA_BASE ?? '';

/** Widths the asset pipeline emits. Keep in sync with generate-assets.ts. */
export const MEDIA_WIDTHS = [960, 1600, 2400] as const;

export function isStaticMedia(): boolean {
  return BASE.length > 0;
}

export function mediaUrl(
  id: number,
  options: { width?: number; kind?: 'image' | 'video' } = {},
): string {
  const { width, kind = 'image' } = options;

  if (!BASE) {
    return width ? `/api/media/${id}?w=${width}` : `/api/media/${id}`;
  }

  const extension = kind === 'video' ? 'mp4' : 'webp';
  return width
    ? `${BASE}/${id}-${width}.${extension}`
    : `${BASE}/${id}.${extension}`;
}

/** The srcset a full-bleed plate uses, in whichever mode is active. */
export function mediaSrcSet(id: number): string {
  return MEDIA_WIDTHS.map((w) => `${mediaUrl(id, { width: w })} ${w}w`).join(', ');
}
