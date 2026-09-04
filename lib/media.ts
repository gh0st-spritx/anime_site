/** Upload policy, shared by the route handler and the admin UI. */

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/avif': '.avif',
  // SVG is deliberately excluded. It can carry scripts, and a stored SVG
  // opened directly in a tab executes on this site's origin. Nothing here
  // needs vector uploads; add it back only behind a sanitizer.
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'application/pdf': '.pdf',
};

export function isImage(mime: string): boolean {
  return mime.startsWith('image/');
}

export function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
