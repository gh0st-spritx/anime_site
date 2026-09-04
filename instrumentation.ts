/**
 * Runs once when the server starts, so a fresh deploy against an empty volume
 * comes up ready with no manual step.
 *
 * Seeding is not optional: the ten story acts are fixed rows the film's code
 * looks up by key, and they cannot be created from the admin panel. Without
 * this, a new deployment renders an empty page with no way to recover.
 * seed() is idempotent — it skips any table that already has rows.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { runMigrations } = await import('./lib/db/migrate.ts');
  const { seed } = await import('./scripts/seed.ts');

  runMigrations();
  seed();
}
