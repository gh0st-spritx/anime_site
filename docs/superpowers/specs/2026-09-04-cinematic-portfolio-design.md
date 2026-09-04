# Cinematic Anime Scroll-Story Portfolio — Design

**Owner:** Soumik Halder
**Date:** 2026-09-04
**Status:** Approved for planning

## 1. What we're building

A single-page, scroll-driven portfolio that plays like a short anime film. The
visitor scrolls; the camera moves through nine scenes that tell one story — a
striker on a field in Khulna becomes a computer engineering student who breaks
into things in order to learn how to defend them. Every portfolio section is
carried by a scene rather than stacked as a slab of content.

Behind it sits a private admin panel. The site ships with almost no projects on
purpose; the panel is how it fills up over the next four years without anyone
touching the code.

### Success criteria

1. A recruiter can learn who Soumik is, what he's certified in and how to reach
   him — without ever needing to know it's an animated site.
2. Soumik can add a project, a certificate, a skill or a link from `/admin` and
   see it live, with no deploy.
3. The scroll holds 60fps on a mid-range laptop and degrades honestly on a phone
   and under `prefers-reduced-motion`.
4. Nothing on the page overclaims. He is a 20-year-old student with four
   certifications and no shipped projects yet, and the site says so with
   confidence rather than padding.

### Non-goals

- No blog or CMS-grade editor. (Explicitly declined.)
- No multi-user accounts, roles or permissions. One admin, one password.
- No i18n, no dark/light toggle — the film has one fixed grade.
- No analytics beyond an optional settings field for a pasted script tag.

## 2. Subject facts

These are load-bearing. Copy must not contradict them.

| Field | Value |
|---|---|
| Name | Soumik Halder |
| Born | 10 June 2006 — age rendered live, currently 20 |
| Title | Cybersecurity & AI Enthusiast · CSE @ NSU |
| Education | Govt. Sundarban College (Science), 2022–2024 · admission-exam year, 2024–2025 · North South University (CSE), Sept 2025–present |
| Certifications | CompTIA A+ · CompTIA ITF+ · Google AI Professional · IELTS Band 7 |
| Skills | English (IELTS 7), general computing, Python, Linux, web development |
| Learning now | TryHackMe, Python, web development |
| Projects | None yet — by design; admin-fed |
| Origin | Had no internet; installed Linux, cracked the neighbour's Wi-Fi, succeeded, and decided to become a hacker |
| Football | Striker |
| Games | Valorant (most hours), FC 26, GTA V, The Last of Us, A Plague's Tale, Ghost of Tsushima, God of War; awaiting GTA 6 |
| Email | soumikhalder.edu@gmail.com |
| Home life | Deliberately out of scope — he declined. Do not invent family detail. |

### Editorial stance on the origin story

The Wi-Fi story is told plainly and then turned: the act closes on the
distinction between doing it because you can and doing it because someone asked
you to. It reads as the beginning of a security career, not as a confession.
No copy anywhere frames unauthorised access as advice.

## 3. The nine acts and one interlude

Each act pins, plays a scrubbed timeline, and releases. Content is DB-driven;
the choreography is code.

| # | Scene | Carries | Grade |
|---|---|---|---|
| 0 | **The Room** — night, desk, PC + laptop, wardrobe, bed, a football under the desk gathering dust | Hero: name, live age, title | Cold monitor blue |
| 1 | **The Pull** — camera pushes into the monitor, light blooms, whiteout | Transition only | Blue → white |
| 2 | **The Field** — golden hour by the river, the striker mid-strike, friends, egrets lifting | About | Warm gold, monsoon green |
| 3 | **The Signal** — night at a window, a router light across the dark, Linux booting, the terminal, then the screen filling with light | Origin — the turn | Deep night → green CRT → cyan |
| 4 | **The Classroom** — provincial college light, then a lamp-lit year of admission prep, dissolving into Dhaka and the NSU campus | Education timeline | Chalk warm → lamp amber → city cyan |
| 5 | **The Terminal** — dark room, packets rendered as travelling light | Skills matrix | Cyan / violet |
| 6 | **The Badges** — four certification cards assembling out of light | Certifications | Violet, holographic |
| 7 | **The Workshop** — lit, waiting pedestals, mostly empty | Projects + Currently-learning tracker | Cool white |
| 7.5 | **The Arcade** — game cards on the room's shelf | Gaming corner | Neon accent |
| 8 | **The Return** — the Act 0 room again, same angle, but dawn; the football now sits on the desk beside the keyboard | Contact + close | Warm and cold, mixed |

The football's journey from under the desk to on the desk is the visual thesis.
It should survive any future edit to the copy.

### The empty-projects state

Act 7 is designed for emptiness, not patched for it. Pedestals stand lit and
waiting under a line that owns the situation — the shelves are empty because
it's early, and the date is the point. Adding a project in admin materialises it
onto a pedestal. At three or more projects the empty-state copy retires itself.

## 4. Architecture

### Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript | Server Components read SQLite directly, so the public page needs no API layer; Server Actions cover admin writes. |
| Scroll | GSAP ScrollTrigger + Lenis | Pinning and scrubbed timelines are exactly this problem; Lenis supplies inertia. |
| Effects | React Three Fiber, one small canvas | Scoped to act-to-act displacement dissolves, particle systems and bloom. Full-WebGL scenes are rejected: heavy on mobile, hostile to a11y, marginal gain over layered plates. |
| Styling | Tailwind v4 | Layout and utility only. |
| Data | SQLite + Drizzle ORM, `better-sqlite3` | One file on the host's persistent disk. Drizzle over Prisma: no engine binary on a small Node box. |
| Auth | `node:crypto` scrypt + `jose` JWT in an httpOnly cookie | Stdlib hashing; no auth dependency to keep patched. |
| Images | `sharp` at build/upload time | AVIF + WebP, several widths. |

### Hosting

A Node host with a persistent disk (Railway, Render, Fly, or a VPS). `DATA_DIR`
env var points at the volume holding `portfolio.db` and `uploads/`. Nothing in
the app assumes a writable repo directory, so the same build runs locally and in
production.

### Layout

```
app/
  (site)/page.tsx            # the scroll experience, server-rendered
  admin/                     # panel, middleware-gated
  api/admin/upload/route.ts  # the one route that can't be a Server Action
components/
  scenes/Act0Room.tsx ...    # one file per act, choreography colocated
  motion/                    # Lenis provider, GSAP hooks, WebGL transition
  admin/                     # forms, tables, media picker
lib/
  db/schema.ts, queries.ts, migrate.ts
  auth.ts, session.ts
scripts/
  generate-assets.ts         # Higgsfield pipeline, resumable
  seed.ts
```

One file per act. When an act's file grows past comfortable reading it is doing
too much and its sub-scenes split out.

### Data model

Thirteen tables, all admin-editable:

`profile` (singleton) · `story_acts` · `certifications` · `projects` ·
`project_images` · `skills` · `education` · `links` · `games` · `learning` ·
`media` · `settings` (singleton) · `admin_user` (singleton)

`links` is deliberately generic — `kind, label, url, icon, visible, sort_order` —
rather than eleven named columns, so GitHub, LinkedIn, Discord, X, Facebook,
Instagram, Telegram, Threads, Email, Phone, Location and the résumé PDF are all
one row shape and new ones need no migration.

`settings` carries the master switches: per-section visibility and order, motion
intensity, accent colour, audio default, SEO fields, maintenance mode.

### Auth and admin

`/admin` is unlinked from the site, `noindex`, disallowed in `robots.txt`, and
gated in middleware. On first run, with no `admin_user` row, `/admin` serves a
one-time account-creation screen; after that it serves a login. No password ever
exists in the repo or in an env var.

Login is rate-limited per IP in memory — enough for a single-instance personal
site, and the ceiling is documented at the call site. Sessions are signed JWTs
in httpOnly, SameSite=Lax, Secure cookies with a 7-day expiry.

Uploads validate MIME type and size before touching disk, are written under
`DATA_DIR/uploads` with generated names, and are served through a route that
never trusts a client-supplied path.

## 5. Asset pipeline

`scripts/generate-assets.ts` is re-runnable and resumable: it keeps a manifest,
skips work already done, and logs credits spent per call.

1. Higgsfield `character-sheet` workflow produces the protagonist and locks him
   as a reference.
2. **Soul Location** generates each act's environment *in layers* — sky, mid,
   foreground — so parallax has real depth rather than a faked 2.5D.
3. **Soul Cast**, given the character reference, produces the figure shots, so
   the same face appears in every scene.
4. **Kling v3.0** image-to-video produces 5-second seamless loops at three beats
   only: The Room, The Field, The Signal.
5. `sharp` transcodes stills to AVIF/WebP at several widths; loops ship as WebM
   with an MP4 fallback and a still poster.

**Budget gate:** one test generation runs first to measure real credit cost
(600 available, cost not exposed by the API). The measured budget is presented
before the remaining spend is committed. If the full set doesn't fit, layered
plates for Acts 0, 2 and 3 take priority and later acts fall back to fewer
layers — the film survives; only its depth thins.

## 6. Motion, performance, accessibility

- Desktop-first choreography; phones get fewer parallax layers, no video loops,
  and shorter pins.
- `prefers-reduced-motion` swaps scrubbed timelines for simple cross-fades and
  disables the WebGL canvas entirely. The story still reads top to bottom.
- Motion intensity is also a settings toggle, so it can be dialled down without
  a deploy.
- Every act is real semantic HTML with real headings underneath the animation.
  Content is present for screen readers and for search engines whether or not
  JavaScript runs.
- Target: 60fps scroll on mid-range hardware; largest act under 1.5MB of imagery.

## 7. Verification

One runnable check each, on the parts where being wrong actually costs
something — `node:test`, no framework:

- **Auth:** scrypt hash round-trips; a wrong password fails; a tampered session
  token is rejected; an expired one is rejected.
- **Data:** migrations apply to an empty file and the seed produces a page-ready
  profile.
- **Age:** the live age calculation is correct across a birthday boundary.

Trivial rendering is not unit-tested. The scroll choreography is verified by
running the site and watching it.

## 8. Risks

| Risk | Mitigation |
|---|---|
| Higgsfield credits run out mid-pipeline | Measure with one test call first; prioritise Acts 0/2/3; pipeline is resumable so a top-up continues where it stopped. |
| Character consistency drifts across scenes | Character sheet generated once and reused as a locked reference for every figure shot. |
| Scroll animation janks on low-end phones | Layer count and video loops are device-gated, not universal; reduced-motion path is a real path, not a stub. |
| Page weight balloons | AVIF/WebP at several widths, lazy per-act loading, video only at three beats. |
| Admin panel discovered and brute-forced | Unlinked + noindex + rate-limited login + scrypt + httpOnly signed sessions. |
