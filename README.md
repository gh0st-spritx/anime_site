# Soumik Halder — portfolio

A scroll-driven portfolio that plays as a short anime film. Nine acts and one
interlude carry every portfolio section, and a private admin panel fills the
site in over time without touching the code.

- **Public site:** `/`
- **Admin panel:** `/admin` — unlinked, `noindex`, blocked in `robots.txt`

---

## Running it locally

```bash
npm install
cp .env.example .env.local        # then set SESSION_SECRET
npm run dev                       # http://localhost:3000
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Migrations and the seed run automatically at boot, so a fresh checkout comes up
with all ten acts and Soumik's content already in place.

### First run

Visit `/admin`. With no account yet it shows a one-time setup screen. Pick a
username and a password of at least 12 characters.

There is **no password reset link and no recovery email.** If the password is
lost, the account row has to be deleted from the database by hand:

```bash
node -e "new (require('better-sqlite3'))('./data/portfolio.db').prepare('delete from admin_user').run()"
```

`/admin` will then offer setup again. Nothing else is lost.

---

## What you can edit

Everything on the public page, from `/admin`:

| Section | What it controls |
|---|---|
| Profile | Name, title, tagline, birthdate (age is computed live), bio, location, portrait |
| Projects | The workshop act. Empty by design until the first one exists |
| Certifications | The badges act, with verification links |
| Skills | The terminal act's matrix, with honest proficiency values |
| Education | The classroom act's timeline |
| Currently learning | Keeps the site alive between projects |
| Links & contact | One row per link. Blank or hidden ones never render |
| Gaming corner | The arcade act |
| Story acts | The words and artwork of each act. The choreography is in code |
| Media library | Every image, video and PDF, with alt text |
| Master settings | Accent colour, motion intensity, audio, SEO, section order, maintenance mode |

### Two settings worth understanding

**Motion intensity** can only ever *reduce* motion. A visitor whose system asks
for reduced motion always gets it, whatever this is set to.

**Audio** never starts on its own. Enabling it only makes the speaker control
invite attention; sound still waits for a click.

---

## Deploying

Any Node host with a persistent disk. `DATA_DIR` must point at it — it holds
`portfolio.db` and `uploads/`, and nothing else is written at runtime.

```bash
docker build -t soumik-portfolio .
docker run -d --name portfolio \
  -p 3000:3000 \
  -v portfolio-data:/data \
  -e SESSION_SECRET="<64 hex characters>" \
  soumik-portfolio
```

Required environment:

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Signs admin sessions. At least 32 characters. Changing it signs everyone out |
| `DATA_DIR` | Where the database and uploads live. `/data` in the image |

### Backups

The whole site is one file plus one folder:

```bash
docker run --rm -v portfolio-data:/data -v "$PWD:/backup" \
  busybox tar czf /backup/portfolio-backup.tgz /data
```

Do this before any upgrade. `portfolio.db` is SQLite in WAL mode, so copy
`portfolio.db`, `portfolio.db-wal` and `portfolio.db-shm` together, or stop the
container first.

---

## The artwork

Scene art is generated once through the Higgsfield MCP tools and recorded in
`scripts/assets.manifest.json` with the result URL, alt text and credit cost of
each generation. The pipeline turns that into optimised local files:

```bash
npm run assets            # apply anything not yet applied
npm run assets -- --dry   # report what would happen, change nothing
npm run assets -- --force # redo every entry
```

It is resumable: entries already applied are skipped, so a failed run continues
where it stopped rather than regenerating anything. Generation itself needs an
agent session with the Higgsfield tools — this script only consumes the results.

The current set cost **50.5 credits**. A locked character sheet keeps the same
face across every scene he appears in.

---

## Development

```bash
npm run dev          # dev server
npm test             # node:test — auth, sessions, age, migrations, motion policy
npm run build        # production build
npx tsc --noEmit     # typecheck
npm run db:generate  # regenerate migrations after editing lib/db/schema.ts
```

### Where things are

| Path | Responsibility |
|---|---|
| `app/page.tsx` | Assembles the acts in the order settings define |
| `components/scenes/` | One file per act. Semantic HTML only |
| `components/motion/choreography.ts` | Every act's scroll timeline |
| `components/motion/Scene.tsx` | Attaches choreography without making acts client components |
| `lib/db/schema.ts` | The single source of truth for data shape |
| `lib/admin/resources.ts` | One config per content type; the admin CRUD is generated from these |
| `docs/superpowers/` | The design spec and implementation plan this was built from |

### Two decisions worth knowing before you change things

**Pinning is CSS `position: sticky`, not ScrollTrigger's `pin`.** ScrollTrigger
pins by inserting its own spacer around the element, which moves a React-owned
node and makes React throw on the next reconcile. Sticky keeps the DOM still.

**Every tween animates *from* a visible resting state, never *to* one.** If a
timeline never runs — reduced motion, no JavaScript, a script error — the act is
already in its readable final form. That is what makes the fallbacks real rather
than a degraded copy of the animation.
