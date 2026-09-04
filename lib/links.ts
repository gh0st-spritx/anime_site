/** Turns a stored link row into a real, correct href. */
export function hrefFor(kind: string, value: string): string | null {
  const v = value.trim();
  if (!v) return null;

  switch (kind) {
    case 'email':
      return `mailto:${v}`;
    case 'phone':
      // Strip spaces and punctuation the dialler does not want.
      return `tel:${v.replace(/[^\d+]/g, '')}`;
    case 'location':
      // Not a link — the caller renders it as plain text.
      return null;
    default:
      if (/^https?:\/\//i.test(v)) return v;
      // Bare handles and domains are common in a hand-typed admin field.
      return `https://${v.replace(/^\/+/, '')}`;
  }
}

/** Whether a link should open in a new tab. */
export function isExternal(kind: string): boolean {
  return kind !== 'email' && kind !== 'phone' && kind !== 'location';
}
