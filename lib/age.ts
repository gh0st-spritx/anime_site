/**
 * Whole years elapsed since `birthISO` (YYYY-MM-DD), computed in UTC so the
 * number never flickers with the viewer's timezone.
 */
export function ageFrom(birthISO: string, now: Date = new Date()): number {
  const birth = new Date(`${birthISO}T00:00:00Z`);
  let age = now.getUTCFullYear() - birth.getUTCFullYear();

  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}
