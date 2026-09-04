import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('migrations apply to an empty file and seed produces a page-ready profile', async () => {
  process.env.DATA_DIR = mkdtempSync(join(tmpdir(), 'portfolio-'));

  const { db } = await import('../lib/db/index.ts');
  const { runMigrations } = await import('../lib/db/migrate.ts');
  const { seed } = await import('../scripts/seed.ts');
  const schema = await import('../lib/db/schema.ts');

  runMigrations();
  seed();

  const p = db.select().from(schema.profile).all();
  assert.equal(p.length, 1);
  assert.equal(p[0].name, 'Soumik Halder');
  assert.equal(p[0].birthdate, '2006-06-10');

  assert.equal(db.select().from(schema.certifications).all().length, 4);
  assert.equal(db.select().from(schema.storyActs).all().length, 10);
  assert.ok(db.select().from(schema.links).all().length >= 11);
  assert.equal(db.select().from(schema.projects).all().length, 0);

  // Settings is a singleton carrying the section order.
  const s = db.select().from(schema.settings).all();
  assert.equal(s.length, 1);
  assert.equal((s[0].sectionConfig as { key: string }[]).length, 10);

  // The admission-prep year is a real education row, not a gap.
  const edu = db.select().from(schema.education).all();
  assert.equal(edu.length, 3);
  assert.ok(edu.some((e) => e.startYear === '2024' && e.endYear === '2025'));

  // Seeding twice must not duplicate anything.
  seed();
  assert.equal(db.select().from(schema.certifications).all().length, 4);
  assert.equal(db.select().from(schema.profile).all().length, 1);
});
