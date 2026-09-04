import { asc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import * as s from './schema.ts';

export type PageData = Awaited<ReturnType<typeof getPageData>>;
export type Act = PageData['acts'][number];
export type Project = PageData['projects'][number];
export type SkillRow = PageData['skills'][number];
export type LinkRow = PageData['links'][number];

/**
 * Everything the public page needs, in one call.
 *
 * These are direct SQLite reads inside a Server Component — no network hop, no
 * API layer. Each collection is filtered to visible rows and ordered by
 * sortOrder, so the admin panel's ordering is the page's ordering.
 */
export async function getPageData() {
  const profile = db.select().from(s.profile).get();
  const settings = db.select().from(s.settings).get();

  if (!profile || !settings) {
    throw new Error(
      'Profile or settings row is missing. The boot seed did not run — check instrumentation.ts.',
    );
  }

  const acts = db
    .select()
    .from(s.storyActs)
    .where(eq(s.storyActs.visible, true))
    .orderBy(asc(s.storyActs.sortOrder))
    .all();

  // Section config is the master ordering; acts not listed there fall in after.
  const configured = settings.sectionConfig ?? [];
  const rank = new Map(configured.map((c, i) => [c.key, i]));
  const hidden = new Set(
    configured.filter((c) => !c.visible).map((c) => c.key),
  );

  const orderedActs = acts
    .filter((a) => !hidden.has(a.key))
    .sort(
      (a, b) =>
        (rank.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
        (rank.get(b.key) ?? Number.MAX_SAFE_INTEGER),
    );

  const visible = <T extends { visible: boolean; sortOrder: number }>(
    rows: T[],
  ) => rows.filter((r) => r.visible).sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    profile,
    settings,
    acts: orderedActs,
    certifications: visible(db.select().from(s.certifications).all()),
    projects: visible(db.select().from(s.projects).all()),
    skills: visible(db.select().from(s.skills).all()),
    education: visible(db.select().from(s.education).all()),
    links: visible(db.select().from(s.links).all()).filter((l) => l.value),
    games: visible(db.select().from(s.games).all()),
    learning: visible(db.select().from(s.learning).all()),
  };
}

/** Acts keyed for lookup, so a component can ask for its own copy. */
export function actMap(acts: Act[]): Map<string, Act> {
  return new Map(acts.map((a) => [a.key, a]));
}
