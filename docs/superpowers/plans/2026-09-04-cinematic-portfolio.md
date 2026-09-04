# Cinematic Anime Scroll-Story Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a scroll-driven anime portfolio for Soumik Halder in which nine animated acts carry every portfolio section, backed by a private admin panel that lets him edit and extend all content without a deploy.

**Architecture:** Next.js 15 App Router. Server Components read SQLite directly through Drizzle, so the public page needs no API layer; admin mutations go through Server Actions. Scroll choreography is GSAP ScrollTrigger over Lenis, with one small React Three Fiber canvas reserved for act-to-act displacement dissolves and particles. Anime art is generated once by a resumable Higgsfield script and committed as static plates.

**Tech Stack:** Next.js 15, TypeScript, Tailwind v4, Drizzle ORM, better-sqlite3, GSAP + ScrollTrigger, Lenis, React Three Fiber, jose, sharp, node:test.

**Spec:** `docs/superpowers/specs/2026-09-04-cinematic-portfolio-design.md`

## Global Constraints

- Node 24+, npm. Windows dev host (`D:\final_portfolio`), Linux production host.
- All persistent state lives under `process.env.DATA_DIR` (default `./data`). Never write to the repo directory at runtime.
- `better-sqlite3` is native: it MUST be listed in `serverExternalPackages` in `next.config.ts`.
- No password, secret, or credential is ever committed. `SESSION_SECRET` comes from env; the admin password is set at first run through the UI.
- Copy must not contradict spec §2 Subject facts. Do not invent family detail — he declined. Do not frame unauthorised access as advice.
- Certifications are four: CompTIA A+, CompTIA ITF+, Google AI Professional, IELTS Band 7.
- Age is never hardcoded. It is computed live from the birthdate `2006-06-10`.
- Every act renders real semantic HTML with real headings underneath the animation. The story must read top to bottom with JavaScript disabled.
- `prefers-reduced-motion` is a real path, not a stub: cross-fades replace scrubbed timelines and the WebGL canvas does not mount.
- Tests use `node:test` and `node --test`. No test framework, no fixtures.

---

## File Structure

| Path | Responsibility |
|---|---|
| `lib/db/schema.ts` | Drizzle table definitions. Single source of truth for shape. |
| `lib/db/index.ts` | Connection singleton, `DATA_DIR` resolution. |
| `lib/db/migrate.ts` | Applies drizzle migrations at boot. |
| `lib/db/queries.ts` | All read queries used by the public page. |
| `lib/auth.ts` | scrypt hash/verify. Pure, no I/O. |
| `lib/session.ts` | JWT sign/read, cookie names. |
| `lib/rate-limit.ts` | In-memory login throttle. |
| `lib/age.ts` | Live age from birthdate. |
| `lib/admin/resources.ts` | Config objects — one per content type. |
| `components/admin/ResourceList.tsx` | Generic list/reorder/delete UI. |
| `components/admin/ResourceForm.tsx` | Generic create/edit form. |
| `app/admin/actions.ts` | Server Actions: save, delete, reorder, upload, auth. |
| `components/scenes/Act*.tsx` | One file per act. Markup + its own choreography. |
| `components/motion/` | Lenis provider, `useSceneTimeline`, WebGL transition, audio. |
| `scripts/generate-assets.ts` | Higgsfield pipeline. Resumable, manifest-backed. |
| `scripts/seed.ts` | Seeds Soumik's real content. |
| `tests/*.test.ts` | The three checks from spec §7. |

---

# Phase 1 — Foundation

Ends with: a deployed-capable site showing all nine acts as plain semantic HTML from the database, and a working admin panel.

---

### Task 1: Scaffold and verification harness

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/(site)/page.tsx`, `app/globals.css`, `tests/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a running `npm run dev`, and `npm test` executing `node --test`.

- [ ] **Step 1: Create the Next.js app**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --no-eslint --use-npm --yes
```

If the directory is non-empty it will refuse; answer by scaffolding into `.tmp-app` and moving files, preserving `docs/` and `.git/`.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm i drizzle-orm better-sqlite3 jose sharp gsap lenis three @react-three/fiber @react-three/drei
npm i -D drizzle-kit @types/better-sqlite3 @types/three tsx
```

- [ ] **Step 3: Configure native module and add test script**

`next.config.ts`:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  images: { formats: ['image/avif', 'image/webp'] },
};

export default nextConfig;
```

Add to `package.json` scripts:

```json
"test": "node --test --experimental-strip-types tests/*.test.ts",
"db:generate": "drizzle-kit generate",
"seed": "tsx scripts/seed.ts",
"assets": "tsx scripts/generate-assets.ts"
```

- [ ] **Step 4: Write the smoke test**

`tests/smoke.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('test harness runs', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS, 1 test.

- [ ] **Step 6: Verify the dev server boots**

Run: `npm run dev`, open `http://localhost:3000`, confirm the default page renders, then stop it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with test harness"
```

---

### Task 2: Database schema, migrations, and seed

**Files:**
- Create: `lib/db/schema.ts`, `lib/db/index.ts`, `lib/db/migrate.ts`, `drizzle.config.ts`, `scripts/seed.ts`, `tests/db.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `db` (Drizzle instance), all table exports from `schema.ts`, `runMigrations(): void`, `seed(): void`.

- [ ] **Step 1: Write the failing test**

`tests/db.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test`
Expected: FAIL — cannot find module `../lib/db/index.ts`.

- [ ] **Step 3: Write the schema**

`lib/db/schema.ts`:

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

const pk = () => integer('id').primaryKey({ autoIncrement: true });
const order = () => integer('sort_order').notNull().default(0);
const visible = () => integer('visible', { mode: 'boolean' }).notNull().default(true);

export const adminUser = sqliteTable('admin_user', {
  id: integer('id').primaryKey(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const media = sqliteTable('media', {
  id: pk(),
  filename: text('filename').notNull(),
  mime: text('mime').notNull(),
  width: integer('width'),
  height: integer('height'),
  bytes: integer('bytes').notNull(),
  alt: text('alt').notNull().default(''),
  createdAt: integer('created_at').notNull(),
});

export const profile = sqliteTable('profile', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  tagline: text('tagline').notNull().default(''),
  birthdate: text('birthdate').notNull(),
  bio: text('bio').notNull().default(''),
  location: text('location').notNull().default(''),
  avatarMediaId: integer('avatar_media_id'),
});

export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey(),
  accentColor: text('accent_color').notNull().default('#6ee7ff'),
  motionIntensity: text('motion_intensity').notNull().default('full'),
  audioDefaultOn: integer('audio_default_on', { mode: 'boolean' }).notNull().default(false),
  sectionConfig: text('section_config', { mode: 'json' }).notNull(),
  seoTitle: text('seo_title').notNull().default(''),
  seoDescription: text('seo_description').notNull().default(''),
  seoImageMediaId: integer('seo_image_media_id'),
  analyticsSnippet: text('analytics_snippet').notNull().default(''),
  maintenanceMode: integer('maintenance_mode', { mode: 'boolean' }).notNull().default(false),
});

export const storyActs = sqliteTable('story_acts', {
  id: pk(),
  key: text('key').notNull().unique(),
  kicker: text('kicker').notNull().default(''),
  title: text('title').notNull().default(''),
  body: text('body').notNull().default(''),
  plateSkyMediaId: integer('plate_sky_media_id'),
  plateMidMediaId: integer('plate_mid_media_id'),
  plateForeMediaId: integer('plate_fore_media_id'),
  loopMediaId: integer('loop_media_id'),
  sortOrder: order(),
  visible: visible(),
});

export const certifications = sqliteTable('certifications', {
  id: pk(),
  name: text('name').notNull(),
  issuer: text('issuer').notNull().default(''),
  issuedOn: text('issued_on').notNull().default(''),
  credentialId: text('credential_id').notNull().default(''),
  credentialUrl: text('credential_url').notNull().default(''),
  mediaId: integer('media_id'),
  sortOrder: order(),
  visible: visible(),
});

export const projects = sqliteTable('projects', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  body: text('body').notNull().default(''),
  tags: text('tags', { mode: 'json' }).notNull().default('[]'),
  repoUrl: text('repo_url').notNull().default(''),
  liveUrl: text('live_url').notNull().default(''),
  coverMediaId: integer('cover_media_id'),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  startedOn: text('started_on').notNull().default(''),
  sortOrder: order(),
  visible: visible(),
});

export const projectImages = sqliteTable('project_images', {
  id: pk(),
  projectId: integer('project_id').notNull(),
  mediaId: integer('media_id').notNull(),
  sortOrder: order(),
});

export const skills = sqliteTable('skills', {
  id: pk(),
  name: text('name').notNull(),
  category: text('category').notNull().default('General'),
  proficiency: integer('proficiency').notNull().default(50),
  note: text('note').notNull().default(''),
  sortOrder: order(),
  visible: visible(),
});

export const education = sqliteTable('education', {
  id: pk(),
  institution: text('institution').notNull(),
  credential: text('credential').notNull().default(''),
  field: text('field').notNull().default(''),
  startYear: text('start_year').notNull().default(''),
  endYear: text('end_year').notNull().default(''),
  note: text('note').notNull().default(''),
  sortOrder: order(),
  visible: visible(),
});

export const links = sqliteTable('links', {
  id: pk(),
  kind: text('kind').notNull(),
  label: text('label').notNull(),
  value: text('value').notNull().default(''),
  icon: text('icon').notNull().default(''),
  sortOrder: order(),
  visible: visible(),
});

export const games = sqliteTable('games', {
  id: pk(),
  title: text('title').notNull(),
  note: text('note').notNull().default(''),
  status: text('status').notNull().default('played'),
  coverMediaId: integer('cover_media_id'),
  sortOrder: order(),
  visible: visible(),
});

export const learning = sqliteTable('learning', {
  id: pk(),
  title: text('title').notNull(),
  provider: text('provider').notNull().default(''),
  url: text('url').notNull().default(''),
  progress: integer('progress').notNull().default(0),
  status: text('status').notNull().default('active'),
  note: text('note').notNull().default(''),
  sortOrder: order(),
  visible: visible(),
});
```

- [ ] **Step 4: Write the connection and migration modules**

`lib/db/index.ts`:

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as schema from './schema.ts';

export const DATA_DIR = resolve(process.env.DATA_DIR ?? './data');
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(join(DATA_DIR, 'uploads'), { recursive: true });

const sqlite = new Database(join(DATA_DIR, 'portfolio.db'));
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export { sqlite };
```

`lib/db/migrate.ts`:

```ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index.ts';

let done = false;

export function runMigrations(): void {
  if (done) return;
  migrate(db, { migrationsFolder: './drizzle' });
  done = true;
}
```

`drizzle.config.ts`:

```ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
} satisfies Config;
```

- [ ] **Step 5: Generate the migration**

Run: `npm run db:generate`
Expected: SQL files appear in `drizzle/`. Commit these — production applies them at boot.

- [ ] **Step 6: Write the seed**

`scripts/seed.ts` inserts, idempotently (skip any table that already has rows):

Profile: name `Soumik Halder`, title `Cybersecurity & AI Enthusiast · CSE @ NSU`, birthdate `2006-06-10`, location `Bangladesh`.

Settings: one row, `sectionConfig` listing the ten act keys in order, all visible.

Story acts, ten rows with these exact keys and sort order: `room`, `pull`, `field`, `signal`, `classroom`, `terminal`, `badges`, `workshop`, `arcade`, `return`. Kicker/title/body text is written in Task 8 — seed them with the copy from that task.

Certifications, four rows: `CompTIA A+` (CompTIA), `CompTIA ITF+` (CompTIA), `Google AI Professional` (Google), `IELTS Band 7` (British Council).

Education, three rows: `Govt. Sundarban College` / Higher Secondary, Science, 2022–2024; `Admission preparation` / self-study year, 2024–2025, note `A year spent studying for university admission exams.`; `North South University` / BSc, Computer Science & Engineering, 2025–present.

Skills: `Python` 70 / Languages; `English (IELTS Band 7)` 80 / Communication; `Linux` 60 / Systems; `Web Development` 55 / Engineering; `Computer Hardware & Support` 75 / Systems; `Networking Fundamentals` 55 / Systems.

Links, twelve rows, all `visible: false` except email — Soumik fills the URLs in from admin: `email` (value `soumikhalder.edu@gmail.com`, visible true), `github`, `linkedin`, `discord`, `x`, `facebook`, `instagram`, `telegram`, `threads`, `phone`, `location`, `resume`.

Games: `Valorant` (note `Most hours, by a distance.`, status `played`), `FC 26`, `GTA V`, `The Last of Us`, `A Plague's Tale`, `Ghost of Tsushima`, `God of War`, and `GTA VI` with status `awaiting`.

Learning, three rows: `TryHackMe` (status `active`), `Python` (status `active`), `Web Development` (status `active`).

Projects: **none.** The empty state is intentional.

- [ ] **Step 7: Run the test**

Run: `npm test`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: database schema, migrations, and seed data"
```

---

### Task 3: Authentication primitives

**Files:**
- Create: `lib/auth.ts`, `lib/session.ts`, `lib/rate-limit.ts`, `lib/age.ts`, `tests/auth.test.ts`, `tests/age.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `hashPassword(pw: string): Promise<string>`, `verifyPassword(pw: string, stored: string): Promise<boolean>`, `createSession(uid: number): Promise<string>`, `readSession(token?: string): Promise<{ uid: number } | null>`, `SESSION_COOKIE: string`, `checkRate(ip: string): boolean`, `ageFrom(birthISO: string, now?: Date): number`.

- [ ] **Step 1: Write the failing tests**

`tests/auth.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../lib/auth.ts';

test('password round-trips and rejects a wrong password', async () => {
  const stored = await hashPassword('correct horse battery staple');
  assert.ok(await verifyPassword('correct horse battery staple', stored));
  assert.equal(await verifyPassword('wrong password', stored), false);
});

test('hashes are salted — the same password hashes differently each time', async () => {
  const a = await hashPassword('same');
  const b = await hashPassword('same');
  assert.notEqual(a, b);
});

test('a malformed stored hash is rejected, not thrown on', async () => {
  assert.equal(await verifyPassword('x', 'garbage'), false);
  assert.equal(await verifyPassword('x', ''), false);
});

test('a tampered session token is rejected', async () => {
  process.env.SESSION_SECRET = 'test-secret-at-least-32-chars-long!!';
  const { createSession, readSession } = await import('../lib/session.ts');
  const token = await createSession(1);
  assert.deepEqual((await readSession(token))?.uid, 1);

  const parts = token.split('.');
  parts[1] = Buffer.from(JSON.stringify({ uid: 99 })).toString('base64url');
  assert.equal(await readSession(parts.join('.')), null);
  assert.equal(await readSession(undefined), null);
  assert.equal(await readSession('not.a.token'), null);
});
```

`tests/age.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageFrom } from '../lib/age.ts';

test('age is correct across the birthday boundary', () => {
  assert.equal(ageFrom('2006-06-10', new Date('2026-06-09T12:00:00Z')), 19);
  assert.equal(ageFrom('2006-06-10', new Date('2026-06-10T00:00:00Z')), 20);
  assert.equal(ageFrom('2006-06-10', new Date('2026-09-04T00:00:00Z')), 20);
  assert.equal(ageFrom('2006-06-10', new Date('2027-01-01T00:00:00Z')), 20);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot find module `../lib/auth.ts`.

- [ ] **Step 3: Implement**

`lib/auth.ts`:

```ts
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  pw: string, salt: Buffer, len: number
) => Promise<Buffer>;

const KEYLEN = 64;

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(pw, salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;
  let expected: Buffer;
  try {
    expected = Buffer.from(keyHex, 'hex');
  } catch {
    return false;
  }
  if (expected.length !== KEYLEN) return false;
  const key = await scryptAsync(pw, Buffer.from(saltHex, 'hex'), KEYLEN);
  return timingSafeEqual(key, expected);
}
```

`lib/session.ts`:

```ts
import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'sh_session';

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET must be set to at least 32 characters');
  }
  return new TextEncoder().encode(s);
}

export async function createSession(uid: number): Promise<string> {
  return new SignJWT({ uid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function readSession(token?: string): Promise<{ uid: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.uid === 'number' ? { uid: payload.uid } : null;
  } catch {
    return null;
  }
}
```

`lib/rate-limit.ts`:

```ts
// ponytail: in-process counter, resets on restart. Fine for a single-instance
// personal site. If this ever runs multi-instance, move to a DB table.
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX = 8;

export function checkRate(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  rec.count += 1;
  return rec.count <= MAX;
}

export function clearRate(ip: string): void {
  attempts.delete(ip);
}
```

`lib/age.ts`:

```ts
export function ageFrom(birthISO: string, now: Date = new Date()): number {
  const b = new Date(`${birthISO}T00:00:00Z`);
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - b.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < b.getUTCDate())) {
    age -= 1;
  }
  return age;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS — all auth, age, db and smoke tests green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scrypt auth, JWT sessions, login throttle, live age"
```

---

### Task 4: Admin gate — first run, login, middleware

**Files:**
- Create: `middleware.ts`, `app/admin/layout.tsx`, `app/admin/login/page.tsx`, `app/admin/setup/page.tsx`, `app/admin/auth-actions.ts`, `app/robots.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `hashPassword`, `verifyPassword`, `createSession`, `readSession`, `SESSION_COOKIE`, `checkRate`, `db`, `adminUser`.
- Produces: `requireAdmin(): Promise<void>` (redirects to `/admin/login` when unauthenticated), Server Actions `setupAdmin(formData)`, `loginAdmin(formData)`, `logoutAdmin()`.

- [ ] **Step 1: Write the middleware**

`middleware.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from './lib/session.ts';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublicAdminRoute =
    pathname === '/admin/login' || pathname === '/admin/setup';
  if (isPublicAdminRoute) return NextResponse.next();

  // Presence check only. Signature verification happens in requireAdmin,
  // because jose cannot run in the Edge middleware bundle here.
  if (!req.cookies.get(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
```

- [ ] **Step 2: Write `requireAdmin` and the auth actions**

`app/admin/auth-actions.ts`:

```ts
'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { adminUser } from '../../lib/db/schema.ts';
import { hashPassword, verifyPassword } from '../../lib/auth.ts';
import { createSession, readSession, SESSION_COOKIE } from '../../lib/session.ts';
import { checkRate, clearRate } from '../../lib/rate-limit.ts';

export async function adminExists(): Promise<boolean> {
  return db.select().from(adminUser).all().length > 0;
}

export async function requireAdmin(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await readSession(token);
  if (!session) redirect('/admin/login');
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
}

async function issueSession(uid: number): Promise<void> {
  const token = await createSession(uid);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function setupAdmin(_prev: unknown, formData: FormData) {
  if (await adminExists()) return { error: 'An admin account already exists.' };
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (username.length < 3) return { error: 'Username must be at least 3 characters.' };
  if (password.length < 12) return { error: 'Password must be at least 12 characters.' };

  db.insert(adminUser)
    .values({ id: 1, username, passwordHash: await hashPassword(password), createdAt: Date.now() })
    .run();
  await issueSession(1);
  redirect('/admin');
}

export async function loginAdmin(_prev: unknown, formData: FormData) {
  const ip = await clientIp();
  if (!checkRate(ip)) return { error: 'Too many attempts. Try again in 15 minutes.' };

  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const user = db.select().from(adminUser).where(eq(adminUser.username, username)).get();

  // Always hash, even with no user, so timing does not reveal existence.
  const stored = user?.passwordHash ?? 'scrypt$00$00';
  const ok = await verifyPassword(password, stored);
  if (!user || !ok) return { error: 'Incorrect username or password.' };

  clearRate(ip);
  await issueSession(user.id);
  redirect('/admin');
}

export async function logoutAdmin() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/admin/login');
}
```

- [ ] **Step 3: Build the setup and login pages**

Both are minimal dark forms using `useActionState`. `/admin/setup` redirects to `/admin/login` if `adminExists()`. `/admin/login` redirects to `/admin/setup` if it does not. Show the returned `error` string above the form.

- [ ] **Step 4: Keep the panel out of search results**

`app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: '/admin' }],
  };
}
```

`app/admin/layout.tsx` exports `export const metadata = { robots: { index: false, follow: false } };` and calls `await requireAdmin()` before rendering its children.

- [ ] **Step 5: Verify by hand**

Run `npm run dev`. Visit `/admin` — expect a redirect to `/admin/setup`. Create an account with a 12+ character password. Expect to land on `/admin`. Log out, log back in. Enter a wrong password nine times and confirm the throttle message appears.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: admin gate with first-run setup, login, and throttling"
```

---

### Task 5: Config-driven resource CRUD engine

**Files:**
- Create: `lib/admin/resources.ts`, `components/admin/ResourceList.tsx`, `components/admin/ResourceForm.tsx`, `app/admin/actions.ts`, `app/admin/page.tsx`, `app/admin/[resource]/page.tsx`, `app/admin/[resource]/[id]/page.tsx`

**Interfaces:**
- Consumes: `db`, all schema tables, `requireAdmin`.
- Produces: `RESOURCES: Record<string, ResourceDef>`, and Server Actions `saveResource(resourceKey: string, formData: FormData)`, `deleteResource(resourceKey: string, id: number)`, `reorderResource(resourceKey: string, ids: number[])`.

**Why generic:** ten content types with near-identical CRUD. One engine plus ten ~15-line configs replaces ten hand-written screens, and a new content type later costs one config object.

- [ ] **Step 1: Define the resource contract**

`lib/admin/resources.ts`:

```ts
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as s from '../db/schema.ts';

export type FieldType =
  | 'text' | 'textarea' | 'number' | 'url' | 'email'
  | 'boolean' | 'media' | 'tags' | 'select' | 'date' | 'range';

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  help?: string;
  required?: boolean;
};

export type ResourceDef = {
  key: string;
  label: string;
  singular: string;
  table: SQLiteTable;
  fields: FieldDef[];
  listColumns: string[];
  sortable: boolean;
};

export const RESOURCES: Record<string, ResourceDef> = {
  certifications: {
    key: 'certifications',
    label: 'Certifications',
    singular: 'Certification',
    table: s.certifications,
    sortable: true,
    listColumns: ['name', 'issuer', 'issuedOn', 'visible'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'issuer', label: 'Issuer', type: 'text' },
      { name: 'issuedOn', label: 'Issued', type: 'date' },
      { name: 'credentialId', label: 'Credential ID', type: 'text' },
      { name: 'credentialUrl', label: 'Verify URL', type: 'url' },
      { name: 'mediaId', label: 'Badge image', type: 'media' },
      { name: 'visible', label: 'Visible on site', type: 'boolean' },
    ],
  },
  // projects, skills, education, links, games, learning, storyActs follow the
  // same shape. Field lists mirror the columns defined in lib/db/schema.ts,
  // omitting `id` and `sortOrder` (the list UI owns ordering).
};
```

Write all ten configs. Field types map as: text columns → `text` except `body`/`note`/`bio`/`summary` → `textarea`; `*MediaId` → `media`; boolean columns → `boolean`; `proficiency`/`progress` → `range` (0–100); `tags` → `tags`; `status` → `select` with the values from the seed.

- [ ] **Step 2: Write the Server Actions**

`app/admin/actions.ts` — one `saveResource` that reads the `ResourceDef`, coerces each field by its declared type (`boolean` from `'on'`, `number`/`range` via `Number`, `tags` by splitting on commas, `media` to a nullable integer), then inserts or updates by `id`. `deleteResource` deletes by id. `reorderResource` writes `sortOrder` from array position in one transaction. Every action calls `await requireAdmin()` first and `revalidatePath('/')` last.

Coercion is the security boundary here: never spread `Object.fromEntries(formData)` into the table. Build the values object field-by-field from the config, so a crafted extra form field cannot write a column the config does not list.

- [ ] **Step 3: Build the two generic components**

`ResourceList` renders `listColumns` as a table with edit/delete buttons, a "New" button, and drag-to-reorder when `sortable`. `ResourceForm` renders `fields` by type — `media` opens the picker from Task 6, `range` is a slider showing its value, `tags` is a comma-separated input.

- [ ] **Step 4: Build the routes**

`/admin` is a dashboard listing every resource with its row count plus links to Profile, Settings and Media. `/admin/[resource]` renders `ResourceList`. `/admin/[resource]/[id]` renders `ResourceForm`, where the literal id `new` means create. Unknown resource keys call `notFound()`.

- [ ] **Step 5: Verify by hand**

Run `npm run dev`. For each of the ten resources: create a row, edit it, reorder two rows, delete one. Confirm a hidden row disappears from the public page after `revalidatePath`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: config-driven admin CRUD for all ten content types"
```

---

### Task 6: Media library and uploads

**Files:**
- Create: `app/api/admin/upload/route.ts`, `app/api/media/[id]/route.ts`, `app/admin/media/page.tsx`, `components/admin/MediaPicker.tsx`

**Interfaces:**
- Consumes: `db`, `media`, `readSession`, `DATA_DIR`.
- Produces: `POST /api/admin/upload` returning `{ id, url, width, height }`; `GET /api/media/[id]` streaming a stored file; `<MediaPicker value={number|null} onChange={(id)=>void} />`.

- [ ] **Step 1: Write the upload route**

Validate before touching disk, in this order: session valid → `Content-Length` under 25 MB → MIME in `['image/png','image/jpeg','image/webp','image/avif','video/mp4','video/webm','application/pdf']`. Generate the stored filename yourself as `${randomUUID()}${extFromMime}`; never use any part of the client-supplied filename in the path. Write under `join(DATA_DIR, 'uploads')`. For images, read dimensions with `sharp` and additionally write a WebP derivative. Insert a `media` row and return it.

- [ ] **Step 2: Write the serving route**

`GET /api/media/[id]` looks the row up by numeric id, reads from `DATA_DIR/uploads`, and streams it with `Content-Type` from the row and `Cache-Control: public, max-age=31536000, immutable`. It resolves the path from the database row only — a client-supplied path is never joined into the filesystem read.

- [ ] **Step 3: Build the library and picker**

`/admin/media` shows a grid with upload, alt-text editing, and delete. `MediaPicker` is a modal wrapping that grid, returning an id.

- [ ] **Step 4: Verify by hand**

Upload a PNG, a PDF and a 30 MB file. Expect the first two to succeed and the third to be rejected with a clear message. Attempt an upload with the session cookie deleted and expect 401. Confirm an uploaded image renders through `/api/media/[id]`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: media library with validated uploads and safe serving"
```

---

### Task 7: Profile and master settings editors

**Files:**
- Create: `app/admin/profile/page.tsx`, `app/admin/settings/page.tsx`, `app/admin/password/page.tsx`
- Modify: `app/admin/actions.ts`

**Interfaces:**
- Consumes: `db`, `profile`, `settings`, `requireAdmin`, `hashPassword`, `verifyPassword`.
- Produces: Server Actions `saveProfile(formData)`, `saveSettings(formData)`, `changePassword(formData)`.

- [ ] **Step 1: Build the profile editor**

Singleton form over the `profile` row: name, title, tagline, birthdate (a `date` input — the site computes age from it), bio, location, avatar.

- [ ] **Step 2: Build the settings editor**

Accent colour picker; motion intensity select (`full` / `reduced` / `off`); audio-default toggle; SEO title, description and share image; analytics snippet textarea; maintenance-mode toggle. Plus **section control**: a reorderable list of the ten act keys, each with a visibility toggle, persisted to `sectionConfig`.

- [ ] **Step 3: Build password change**

Requires the current password, verifies it, and enforces the same 12-character minimum as setup.

- [ ] **Step 4: Verify by hand**

Change the accent colour and confirm the public page picks it up. Toggle an act off and confirm it stops rendering. Enable maintenance mode and confirm the public page shows the holding screen while `/admin` still works. Change the password, log out, and log in with the new one.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: profile, master settings, and password change"
```

---

### Task 8: Public page v1 — nine acts as semantic HTML

**Files:**
- Create: `lib/db/queries.ts`, `app/(site)/page.tsx`, `components/scenes/Act0Room.tsx` … `components/scenes/Act8Return.tsx`, `components/site/ActShell.tsx`
- Modify: `scripts/seed.ts` (fill in the real act copy)

**Interfaces:**
- Consumes: everything from Tasks 2–7.
- Produces: `getPageData(): Promise<PageData>` returning profile, settings, and every visible content collection in one call; each `Act*` component accepting its slice of `PageData`.

**This task ends Phase 1 with working, deployable software.** No animation yet — every act is a plain, correctly-structured section. Getting the content and semantics right *before* the choreography means the reduced-motion and no-JS paths are the foundation rather than an afterthought.

- [ ] **Step 1: Write the query layer**

`getPageData()` runs one query per table, filtered to `visible`, ordered by `sortOrder`, and returns a single typed object. The page is a Server Component, so this is a direct synchronous SQLite read with no network hop.

- [ ] **Step 2: Write the act copy into the seed**

Draft the real copy now, against spec §2. The load-bearing lines:

- **Act 0 (room):** kicker `Dhaka, 2:14 AM`. Title is his name. Body introduces the title and live age.
- **Act 2 (field):** he played striker. The job of a striker is to be the one who finishes. Keep it about wanting to score, because that is the same appetite that shows up later.
- **Act 3 (signal):** tell it plainly. He had no internet. His neighbour did. He installed Linux, learned enough to get in, and it worked. Then turn it: the interesting part was never the getting in, it was that a thing everyone treated as solid turned out to have a seam. The act closes on the difference between doing it because you can and doing it because someone asked you to. **No step-by-step method, ever.**
- **Act 4 (classroom):** three beats — Sundarban College 2022–2024, a year of admission exams 2024–2025, NSU from September 2025.
- **Act 7 (workshop):** own the emptiness. The shelves are empty because it is early, and the date is the point.
- **Act 8 (return):** the same room at dawn. The football is on the desk now.

- [ ] **Step 3: Build `ActShell`**

A shared wrapper giving every act its `<section id={key}>`, `aria-labelledby`, heading level, layered-plate container, and content column. Acts differ in content and choreography, not in scaffolding.

- [ ] **Step 4: Build the ten act components**

Each reads its slice and renders real HTML: Act 5 renders the skills as a `<dl>` with numeric values, Act 6 renders certifications as a list with verify links, Act 7 renders projects or the empty state, Act 7.5 renders games, Act 8 renders visible links as real `mailto:` / `tel:` / `https:` anchors.

- [ ] **Step 5: Verify**

Run `npm run dev`. Read the whole page top to bottom. Then disable JavaScript in the browser and read it again — it must still be complete and coherent. Run Lighthouse and confirm accessibility ≥ 95.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: public page with all nine acts as semantic HTML"
```

---

# Phase 2 — The film

Ends with: the same content, choreographed.

---

### Task 9: Motion foundation

**Files:**
- Create: `components/motion/SmoothScroll.tsx`, `components/motion/useSceneTimeline.ts`, `components/motion/MotionContext.tsx`
- Modify: `app/(site)/page.tsx`

**Interfaces:**
- Consumes: `settings.motionIntensity`.
- Produces: `<SmoothScroll intensity={Intensity}>`, `useSceneTimeline(ref, build, opts)`, `useMotionIntensity(): 'full' | 'reduced' | 'off'`.

- [ ] **Step 1: Build the intensity resolver**

Effective intensity is the **more conservative** of the site setting and the user's `prefers-reduced-motion`. A visitor asking for reduced motion always wins over the site setting; the site setting can only reduce further, never escalate.

- [ ] **Step 2: Build the Lenis provider**

Mount Lenis only at `full`. Drive `ScrollTrigger.update` from Lenis's scroll event and `gsap.ticker` from Lenis's raf, and register `ScrollTrigger` once. At `reduced` and `off`, render children with native scrolling and no Lenis instance.

- [ ] **Step 3: Build the timeline hook**

```ts
useSceneTimeline(
  ref: RefObject<HTMLElement>,
  build: (tl: gsap.core.Timeline) => void,
  opts?: { pin?: boolean; scrub?: number | boolean; start?: string; end?: string }
): void
```

It wraps `gsap.context(..., ref)` so every tween is scoped and reverted on unmount. At `reduced` it ignores `build` entirely and applies a single opacity fade-in via `ScrollTrigger` with no pinning. At `off` it does nothing at all and the act stays in its final visual state.

- [ ] **Step 4: Verify**

Apply the hook to one act. Confirm smooth scrolling at `full`; set the OS to reduce motion and confirm no pinning, no scrub, and no horizontal drift; set intensity to `off` in admin and confirm a completely static page.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: motion foundation with honest reduced-motion path"
```

---

### Task 10: Acts 0–3 choreography

**Files:**
- Modify: `components/scenes/Act0Room.tsx`, `Act1Pull.tsx`, `Act2Field.tsx`, `Act3Signal.tsx`

- [ ] **Step 1: Act 0 — The Room**

Pinned. Three plates (sky/window, mid/room, fore/desk) parallax at different rates as the camera pushes toward the monitor. Name and title rise and settle. The football sits under the desk, tagged `data-football` — Act 8 needs to find it.

- [ ] **Step 2: Act 1 — The Pull**

The shortest act. Monitor glow scales past the viewport, bloom blows to white, and the white carries into Act 2's sky. Pure transition; no content.

- [ ] **Step 3: Act 2 — The Field**

Whiteout resolves to golden hour. Slow lateral camera drift across the field. The About copy enters on the drift, not on a separate trigger, so text and camera feel like one movement.

- [ ] **Step 4: Act 3 — The Signal**

The centrepiece, in three scrubbed beats: the dark window with one router light across the way; a terminal typing on scroll (characters revealed by scroll position, **never** a fake typing animation on a timer); then the screen filling with light as the copy turns. Reduced motion shows the finished terminal text immediately.

- [ ] **Step 5: Verify**

Scroll acts 0–3 slowly and fast. Confirm no layout shift, no flash of unstyled plates, and 60fps in DevTools performance. Repeat with reduced motion.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: choreograph acts 0-3"
```

---

### Task 11: Acts 4–8 choreography

**Files:**
- Modify: `Act4Classroom.tsx`, `Act5Terminal.tsx`, `Act6Badges.tsx`, `Act7Workshop.tsx`, `Act7Arcade.tsx`, `Act8Return.tsx`

- [ ] **Step 1: Act 4 — The Classroom**

A horizontal timeline scrubbed by vertical scroll. Three stops: Sundarban College, the admission-exam year, NSU. The grade warms at the lamp-lit middle stop, then cools into the city.

- [ ] **Step 2: Act 5 — The Terminal**

Skill bars fill on scrub, each labelled with its real number. Packets of light travel between categories. Bars are `<meter>`-equivalent semantics underneath.

- [ ] **Step 3: Act 6 — The Badges**

Four certification cards assemble from scattered fragments into a row, with a subtle pointer-driven 3D tilt (disabled at `reduced`). Each links to its verify URL when one exists.

- [ ] **Step 4: Act 7 — The Workshop**

Pedestals light in sequence. With zero projects, the empty-state line holds the frame. Each project added in admin materialises onto a pedestal. At three or more, the empty-state copy stops rendering.

- [ ] **Step 5: Act 7.5 — The Arcade**

Game cards deal onto the shelf. `GTA VI` renders in its `awaiting` state, visually distinct from the played titles.

- [ ] **Step 6: Act 8 — The Return**

Reuses Act 0's plates at the same camera angle, re-graded to dawn and cross-faded on scrub. The football is now on the desk. Contact links resolve last. This is the payoff — the transition from Act 7.5 into it must be the smoothest on the page.

- [ ] **Step 7: Verify**

Full-page scroll, top to bottom, at three speeds. Confirm every act enters and exits cleanly and nothing overlaps at act boundaries.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: choreograph acts 4-8"
```

---

### Task 12: WebGL transition layer

**Files:**
- Create: `components/motion/TransitionCanvas.tsx`, `components/motion/shaders/dissolve.glsl.ts`, `components/motion/Particles.tsx`

- [ ] **Step 1: Build the dissolve shader**

A fragment shader mixing two act plates through a noise displacement map, with `uProgress` driven by ScrollTrigger. Used at the three hard cuts: Act 1→2, Act 3→4, Act 7.5→8.

- [ ] **Step 2: Build the particle system**

One instanced points system whose behaviour is set per act: dust motes in the room, pollen on the field, rain at the window, packet-light in the terminal. One system, four parameter sets — not four systems.

- [ ] **Step 3: Gate it**

The canvas does not mount at `reduced` or `off`, does not mount below 768px, and does not mount when `navigator.hardwareConcurrency <= 4`. CSS cross-fades cover every case where it is absent.

- [ ] **Step 4: Verify**

Confirm the three transitions are visibly smoother with the canvas than without. Throttle the CPU 6× in DevTools and confirm the fallback path stays smooth.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: WebGL dissolve transitions and per-act particles"
```

---

### Task 13: Ambient audio

**Files:**
- Create: `components/motion/AudioProvider.tsx`, `components/site/AudioToggle.tsx`

- [ ] **Step 1: Build the provider**

Muted by default regardless of the setting, because browsers block autoplay and ambushing a visitor is worse than a silent first second. The `audioDefaultOn` setting only pre-arms the toggle; sound still starts on the first user gesture. Per-act beds cross-fade on act enter. Honour the Page Visibility API — pause when the tab is hidden.

- [ ] **Step 2: Build the toggle**

A small fixed speaker control, keyboard-reachable, with a real accessible label. State persists in `localStorage`.

- [ ] **Step 3: Verify**

Load the page and confirm silence. Enable audio and scroll through every act, confirming clean cross-fades and no clipping. Switch tabs and confirm it pauses.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: opt-in ambient audio with per-act crossfades"
```

---

# Phase 3 — The art

---

### Task 14: Asset pipeline and budget calibration

**Files:**
- Create: `scripts/generate-assets.ts`, `scripts/assets.manifest.json`

**Interfaces:**
- Produces: a CLI — `npm run assets -- --scene=room --layer=sky`, `--dry-run`, `--report`.

**Hard rule: this task stops for approval before bulk spending.** 600 Higgsfield credits exist and the API does not expose per-call cost.

- [ ] **Step 1: Build the manifest-backed runner**

Every generation is an entry keyed by `scene.layer`. The script skips entries already marked `done`, records the returned media URL and observed credit delta, and can resume after any failure. Nothing is regenerated implicitly.

- [ ] **Step 2: Generate the character sheet**

Call `get_workflow_instructions({ workflow: 'character-sheet' })` and follow it exactly. Produce the protagonist once: a 20-year-old Bangladeshi student, Shinkai-adjacent rendering. Save the returned reference id to the manifest — every later figure shot uses it, and that reference is the only thing keeping his face consistent across nine scenes.

- [ ] **Step 3: Calibrate the budget**

Read `balance`. Generate exactly one plate. Read `balance` again. Compute cost-per-image, multiply by the ~30 planned plates, add the 3 video loops, and **present the projection before continuing.** If the full set will not fit, degrade in this order: drop Act 4/6/7 to single plates, then drop the Act 3 video loop, and keep layered depth for Acts 0 and 2 to the end.

- [ ] **Step 4: Commit the runner**

```bash
git add scripts/ && git commit -m "feat: resumable Higgsfield asset pipeline with budget gate"
```

---

### Task 15: Generate and integrate the art

- [ ] **Step 1: Generate environment plates**

Soul Location, per act, in sky/mid/fore layers. Grade per spec §4: cold blue → gold → night/green → amber → cyan/violet → dawn.

- [ ] **Step 2: Generate figure shots**

Soul Cast with the locked character reference: the striker mid-strike, the boy at the window, the student on campus.

- [ ] **Step 3: Generate the three loops**

Kling v3.0 image-to-video, 5s, `sound: off`, seamless, at The Room, The Field and The Signal only.

- [ ] **Step 4: Transcode and wire up**

`sharp` to AVIF/WebP at 640/1280/1920/2560. Video to WebM + MP4 with a poster. Insert `media` rows and point each `story_acts` plate column at them. Art then flows through the same admin fields Soumik can override later.

- [ ] **Step 5: Verify**

Full scroll on desktop and phone. Confirm the character reads as the same person in every scene, and that no act exceeds 1.5 MB of imagery.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: generated anime art integrated into all acts"
```

---

### Task 16: Performance, accessibility, and deployment

- [ ] **Step 1: Performance pass**

Lazy-load acts below the fold. Preload only Act 0's plates. Confirm LCP < 2.5s on a throttled connection.

- [ ] **Step 2: Accessibility pass**

Keyboard-traverse the whole page. Confirm focus order matches reading order, every image has real alt text from the `media` table, and the reduced-motion path is complete. Target Lighthouse a11y ≥ 95.

- [ ] **Step 3: Deployment config**

`Dockerfile` (Node 24 slim, `output: 'standalone'`), a `DATA_DIR` volume mount, `SESSION_SECRET` from env, migrations applied at boot. Write `README.md` covering local dev, the first-run admin flow, backing up `portfolio.db`, and re-running the asset script.

- [ ] **Step 4: Final verification**

Run `npm test` — all green. Build production, run it against an empty `DATA_DIR`, complete first-run setup, add one project through admin, and confirm it appears on a pedestal in Act 7.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: performance, accessibility, and deployment config"
```

---

## Self-Review

**Spec coverage:** §1 goals → Tasks 8/15. §2 facts → Task 2 seed, Task 8 copy. §3 ten acts → Tasks 8/10/11. §3 empty-projects state → Tasks 8 and 11 step 4. §4 stack → Task 1. §4 hosting/DATA_DIR → Tasks 2 and 16. §4 data model, thirteen tables → Task 2 (`admin_user` in Task 3/4). §4 generic links → Task 2 seed. §4 auth → Tasks 3/4. §4 uploads → Task 6. §5 pipeline and budget gate → Tasks 14/15. §6 motion/a11y → Tasks 9/12/16. §7 three checks → Tasks 2 (db), 3 (auth, age). §8 risks → mitigations in Tasks 12, 14, 15, 16. **No gaps.**

**Placeholder scan:** Task 5 step 1 abbreviates nine of ten resource configs and Task 2 step 6 describes seed rows in prose rather than code. Both are deliberate: the shapes are fully determined by `lib/db/schema.ts`, which is written out in full, and the field-type mapping rule is stated explicitly. No "TBD", no "similar to Task N", no "add error handling".

**Type consistency:** `runMigrations`, `seed`, `hashPassword`, `verifyPassword`, `createSession`, `readSession`, `SESSION_COOKIE`, `checkRate`/`clearRate`, `ageFrom`, `requireAdmin`, `RESOURCES`, `ResourceDef`, `FieldDef`, `saveResource`/`deleteResource`/`reorderResource`, `getPageData`, `useSceneTimeline`, `useMotionIntensity` — each defined once and referenced under the same name throughout.

