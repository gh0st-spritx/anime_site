import { db } from '../lib/db/index.ts';
import * as s from '../lib/db/schema.ts';
import { runMigrations } from '../lib/db/migrate.ts';
import type { SectionConfig } from '../lib/db/schema.ts';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';

/**
 * Seeds Soumik's real content. Idempotent: any table that already has rows is
 * left alone, so this is safe to run against a live database.
 *
 * Facts here are load-bearing — see spec §2. Do not invent biographical
 * detail; he declined to share family/home material.
 */

const ACTS: {
  key: string;
  kicker: string;
  title: string;
  body: string;
}[] = [
  {
    key: 'door',
    kicker: 'Come in',
    title: 'Soumik Halder',
    body: 'Two in the morning, and the light is still on under the door. Scroll, and it opens.',
  },
  {
    key: 'room',
    kicker: '02:14',
    title: 'This is where it happens now',
    body: 'A desk, two machines, and the particular quiet of a room where everyone else is asleep. Keep going — it did not start here.',
  },
  {
    key: 'field',
    kicker: 'Before',
    title: 'He played striker',
    body: 'Which is a particular job. You are not there to pass it around or keep the shape. You are there at the end of the move, with one touch and no second chance, to finish it. Everything that happens later in this story is that same appetite, pointed somewhere else.',
  },
  {
    key: 'signal',
    kicker: 'The turn',
    title: 'I did not have internet. My neighbour did.',
    body: 'So he installed Linux, and read until he understood enough to get onto their network. It worked.\n\nBut the part that stayed with him was not the getting in. It was the discovery that a thing everyone around him treated as solid — as simply how it is — had a seam in it. That systems are built by people, and people leave edges.\n\nHe has spent the years since learning the difference between doing that because you can and doing it because someone asked you to. That difference has a name, and it turned out to be a career.',
  },
  {
    key: 'campus',
    kicker: 'The years',
    title: 'Sundarban to Dhaka',
    body: 'Science at Govt. Sundarban College. Then a year at a desk with admission papers, which is its own kind of grind and does not photograph well. Then North South University, Computer Science and Engineering, from September 2025.',
  },
  {
    key: 'terminal',
    kicker: 'Now',
    title: 'What he can actually do',
    body: 'Listed honestly, including the parts still in progress. Nothing here is padding.',
  },
  {
    key: 'badges',
    kicker: 'On paper',
    title: 'Certifications',
    body: 'Four so far. The CompTIA pair covers the hardware and the fundamentals; the Google certificate covers the AI side; the IELTS band is the one that makes the rest portable.',
  },
  {
    key: 'workshop',
    kicker: 'The shelves',
    title: 'Nothing shipped yet',
    body: 'The shelves are empty, and that is not an accident — it is a date stamp. One year into a CSE degree, foundation first, portfolio second. Check back. This page fills itself in.',
  },
  {
    key: 'arcade',
    kicker: 'Off the clock',
    title: 'Still a striker, mostly',
    body: 'The competitive instinct did not go anywhere. It just changed venue.',
  },
  {
    key: 'return',
    kicker: '05:51',
    title: 'Same room, morning',
    body: 'The football is on the desk now, next to the keyboard. Both of them belong here. If you have something worth building or breaking, this is how to reach him.',
  },
];

const SECTION_CONFIG: SectionConfig = ACTS.map((a) => ({
  key: a.key,
  visible: true,
}));

/** True when a table has no rows — the idempotency guard for every block below. */
function empty(table: SQLiteTable): boolean {
  return db.select().from(table).limit(1).all().length === 0;
}

export function seed(): void {
  runMigrations();

  if (empty(s.profile)) {
    db.insert(s.profile)
      .values({
        id: 1,
        name: 'Soumik Halder',
        title: 'Cybersecurity & AI Enthusiast · CSE @ NSU',
        tagline: 'I break things to learn how they are built.',
        birthdate: '2006-06-10',
        location: 'Bangladesh',
        bio: 'Computer Science and Engineering student at North South University. CompTIA A+ and ITF+ certified, Google AI Professional, IELTS Band 7. Interested in offensive security, Python, and how systems fail.',
      })
      .run();
  }

  if (empty(s.settings)) {
    db.insert(s.settings)
      .values({
        id: 1,
        accentColor: '#6ee7ff',
        motionIntensity: 'full',
        audioDefaultOn: false,
        sectionConfig: SECTION_CONFIG,
        seoTitle: 'Soumik Halder — Cybersecurity & AI Enthusiast',
        seoDescription:
          'CSE student at North South University. CompTIA A+, ITF+, Google AI Professional, IELTS Band 7.',
      })
      .run();
  }

  if (empty(s.storyActs)) {
    db.insert(s.storyActs)
      .values(ACTS.map((a, i) => ({ ...a, sortOrder: i, visible: true })))
      .run();
  }

  if (empty(s.certifications)) {
    db.insert(s.certifications)
      .values([
        { name: 'CompTIA A+', issuer: 'CompTIA', sortOrder: 0 },
        { name: 'CompTIA ITF+', issuer: 'CompTIA', sortOrder: 1 },
        { name: 'Google AI Professional', issuer: 'Google', sortOrder: 2 },
        {
          name: 'IELTS — Band 7',
          issuer: 'British Council',
          sortOrder: 3,
          credentialId: '',
        },
      ])
      .run();
  }

  if (empty(s.education)) {
    db.insert(s.education)
      .values([
        {
          institution: 'North South University',
          credential: 'BSc',
          field: 'Computer Science & Engineering',
          startYear: '2025',
          endYear: '',
          note: 'Dhaka. Started September 2025.',
          sortOrder: 0,
        },
        {
          institution: 'University admission preparation',
          credential: 'Self-study',
          field: 'Admission examinations',
          startYear: '2024',
          endYear: '2025',
          note: 'A year spent preparing for university admission exams.',
          sortOrder: 1,
        },
        {
          institution: 'Govt. Sundarban College',
          credential: 'Higher Secondary',
          field: 'Science',
          startYear: '2022',
          endYear: '2024',
          sortOrder: 2,
        },
      ])
      .run();
  }

  if (empty(s.skills)) {
    db.insert(s.skills)
      .values([
        {
          name: 'English',
          category: 'Communication',
          proficiency: 80,
          note: 'IELTS Band 7',
          sortOrder: 0,
        },
        {
          name: 'Computer Hardware & Support',
          category: 'Systems',
          proficiency: 75,
          note: 'CompTIA A+',
          sortOrder: 1,
        },
        {
          name: 'Python',
          category: 'Languages',
          proficiency: 70,
          note: 'Primary language',
          sortOrder: 2,
        },
        {
          name: 'Linux',
          category: 'Systems',
          proficiency: 60,
          note: 'Where it started',
          sortOrder: 3,
        },
        {
          name: 'Networking Fundamentals',
          category: 'Systems',
          proficiency: 55,
          note: '',
          sortOrder: 4,
        },
        {
          name: 'Web Development',
          category: 'Engineering',
          proficiency: 55,
          note: 'In progress',
          sortOrder: 5,
        },
      ])
      .run();
  }

  if (empty(s.links)) {
    db.insert(s.links)
      .values([
        {
          kind: 'email',
          label: 'Email',
          value: 'soumikhalder.edu@gmail.com',
          icon: 'mail',
          sortOrder: 0,
          visible: true,
        },
        { kind: 'github', label: 'GitHub', icon: 'github', sortOrder: 1, visible: false },
        { kind: 'linkedin', label: 'LinkedIn', icon: 'linkedin', sortOrder: 2, visible: false },
        { kind: 'resume', label: 'Résumé', icon: 'file', sortOrder: 3, visible: false },
        { kind: 'discord', label: 'Discord', icon: 'discord', sortOrder: 4, visible: false },
        { kind: 'x', label: 'X', icon: 'x', sortOrder: 5, visible: false },
        { kind: 'facebook', label: 'Facebook', icon: 'facebook', sortOrder: 6, visible: false },
        { kind: 'instagram', label: 'Instagram', icon: 'instagram', sortOrder: 7, visible: false },
        { kind: 'telegram', label: 'Telegram', icon: 'telegram', sortOrder: 8, visible: false },
        { kind: 'threads', label: 'Threads', icon: 'threads', sortOrder: 9, visible: false },
        { kind: 'phone', label: 'Phone', icon: 'phone', sortOrder: 10, visible: false },
        { kind: 'location', label: 'Location', icon: 'pin', sortOrder: 11, visible: false },
      ])
      .run();
  }

  if (empty(s.games)) {
    db.insert(s.games)
      .values([
        { title: 'Valorant', note: 'Most hours, by a distance.', status: 'played', sortOrder: 0 },
        { title: 'EA Sports FC 26', note: 'The pitch, indoors.', status: 'played', sortOrder: 1 },
        { title: 'Grand Theft Auto V', note: '', status: 'played', sortOrder: 2 },
        { title: 'The Last of Us', note: '', status: 'played', sortOrder: 3 },
        { title: "A Plague Tale", note: '', status: 'played', sortOrder: 4 },
        { title: 'Ghost of Tsushima', note: '', status: 'played', sortOrder: 5 },
        { title: 'God of War', note: '', status: 'played', sortOrder: 6 },
        { title: 'Grand Theft Auto VI', note: 'Counting down.', status: 'awaiting', sortOrder: 7 },
      ])
      .run();
  }

  if (empty(s.learning)) {
    db.insert(s.learning)
      .values([
        {
          title: 'TryHackMe',
          provider: 'TryHackMe',
          url: 'https://tryhackme.com',
          progress: 0,
          status: 'active',
          note: 'Offensive security practice.',
          sortOrder: 0,
        },
        {
          title: 'Python',
          provider: 'Self-directed',
          progress: 0,
          status: 'active',
          note: '',
          sortOrder: 1,
        },
        {
          title: 'Web Development',
          provider: 'Self-directed',
          progress: 0,
          status: 'active',
          note: '',
          sortOrder: 2,
        },
      ])
      .run();
  }

  // Projects are deliberately empty. The workshop scene is designed for it.

  ensureActs();
}

/**
 * Reconciles story_acts with the scenes the film actually has.
 *
 * The rebuild replaced the `pull` interlude with real connector footage and
 * added `door` in front, so a database seeded before that carries an act with
 * no scene and is missing the opening one. Inserting what is missing and
 * retiring what no longer exists keeps an existing install working instead of
 * requiring a wipe.
 */
function ensureActs(): void {
  const wanted = ACTS.map((a) => a.key);
  const existing = db.select().from(s.storyActs).all();
  const have = new Set(existing.map((a) => a.key));

  ACTS.forEach((act, index) => {
    if (have.has(act.key)) {
      db.update(s.storyActs)
        .set({ sortOrder: index })
        .where(eq(s.storyActs.key, act.key))
        .run();
      return;
    }
    db.insert(s.storyActs)
      .values({ ...act, sortOrder: index, visible: true })
      .run();
  });

  for (const act of existing) {
    if (!wanted.includes(act.key)) {
      db.delete(s.storyActs).where(eq(s.storyActs.key, act.key)).run();
    }
  }
}

// Allow `npm run seed`.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  seed();
  console.log('Seeded.');
}
