import type { PageData } from '../db/queries.ts';
import { ageFrom } from '../age.ts';
import { hrefFor, isExternal } from '../links.ts';
import { mediaUrl } from '../media-url.ts';

/**
 * Turns the database into the scroll-world engine's section config.
 *
 * The film is the world; this is everything laid over it. The engine renders
 * eyebrow/title/body/tags itself and injects `detail` verbatim, so every value
 * that comes from the database is escaped HERE before it becomes markup.
 */

export type WorldSection = {
  id: string;
  label: string;
  still?: string;
  clip?: string;
  accent?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  tags?: string[];
  detail?: string;
  scroll?: number;
  linger?: number;
  cta?: {
    primary?: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
};

/** Escapes a value for insertion into the `detail` HTML. */
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Per-scene accent, so the copy shifts colour with the grade of its footage. */
const ACCENT: Record<string, string> = {
  door: '#6ee7ff',
  room: '#6ee7ff',
  field: '#ffca7a',
  signal: '#7dffa8',
  campus: '#7fd4ff',
  terminal: '#6ee7ff',
  badges: '#a98bff',
  workshop: '#cfe4ff',
  arcade: '#ff8bd6',
  return: '#ffb27a',
};

/** How long the camera dwells in each scene, in viewport heights of scroll. */
const DWELL: Record<string, { scroll: number; linger: number }> = {
  door: { scroll: 1.1, linger: 0.2 },
  room: { scroll: 1.9, linger: 0.5 },
  field: { scroll: 1.7, linger: 0.45 },
  signal: { scroll: 2.4, linger: 0.55 },
  campus: { scroll: 1.7, linger: 0.4 },
  terminal: { scroll: 2.0, linger: 0.5 },
  badges: { scroll: 1.8, linger: 0.45 },
  workshop: { scroll: 1.9, linger: 0.5 },
  arcade: { scroll: 1.6, linger: 0.4 },
  return: { scroll: 2.1, linger: 0.5 },
};

const LABEL: Record<string, string> = {
  door: 'The door',
  room: 'The room',
  field: 'The field',
  signal: 'The signal',
  campus: 'The years',
  terminal: 'What he can do',
  badges: 'On paper',
  workshop: 'The workshop',
  arcade: 'Off the clock',
  return: 'Reach him',
};

function detailFor(key: string, data: PageData): string {
  switch (key) {
    case 'room': {
      const age = ageFrom(data.profile.birthdate);
      return `<dl class="w-facts">
        <div><dt>Age</dt><dd>${esc(age)}</dd></div>
        <div><dt>Reading</dt><dd>CSE, North South University</dd></div>
        <div><dt>Currently</dt><dd>Learning to defend systems</dd></div>
      </dl>`;
    }

    case 'campus':
      if (!data.education.length) return '';
      return `<ol class="w-timeline">${data.education
        .map(
          (e) => `<li>
            <span class="w-timeline__years">${esc(e.startYear)}${
              e.endYear ? `–${esc(e.endYear)}` : e.startYear ? '–present' : ''
            }</span>
            <span class="w-timeline__main">
              <strong>${esc(e.institution)}</strong>
              ${
                e.credential || e.field
                  ? `<span>${esc([e.credential, e.field].filter(Boolean).join(' · '))}</span>`
                  : ''
              }
            </span>
          </li>`,
        )
        .join('')}</ol>`;

    case 'terminal':
      if (!data.skills.length) return '';
      return `<dl class="w-skills">${data.skills
        .map(
          (s) => `<div class="w-skill">
            <dt>${esc(s.name)}${s.note ? `<span>${esc(s.note)}</span>` : ''}</dt>
            <dd>
              <span class="w-skill__bar"><span style="width:${Number(s.proficiency)}%"></span></span>
              <span class="w-skill__value">${Number(s.proficiency)}%</span>
            </dd>
          </div>`,
        )
        .join('')}</dl>`;

    case 'badges':
      if (!data.certifications.length) return '';
      return `<ul class="w-cards">${data.certifications
        .map(
          (c) => `<li>
            <strong>${esc(c.name)}</strong>
            ${c.issuer ? `<span>${esc(c.issuer)}</span>` : ''}
            ${
              c.credentialUrl
                ? `<a href="${esc(c.credentialUrl)}" target="_blank" rel="noopener noreferrer">Verify ↗</a>`
                : ''
            }
          </li>`,
        )
        .join('')}</ul>`;

    case 'workshop': {
      const projects = data.projects.length
        ? `<ul class="w-cards">${data.projects
            .map(
              (p) => `<li>
                <strong>${esc(p.title)}</strong>
                ${p.summary ? `<span>${esc(p.summary)}</span>` : ''}
                ${
                  p.tags.length
                    ? `<span class="w-tags">${p.tags.map((t) => `<i>${esc(t)}</i>`).join('')}</span>`
                    : ''
                }
                ${p.repoUrl ? `<a href="${esc(p.repoUrl)}" target="_blank" rel="noopener noreferrer">Code ↗</a>` : ''}
                ${p.liveUrl ? `<a href="${esc(p.liveUrl)}" target="_blank" rel="noopener noreferrer">Live ↗</a>` : ''}
              </li>`,
            )
            .join('')}</ul>`
        : '';

      const learning = data.learning.length
        ? `<div class="w-learning"><span class="w-learning__label">In progress right now</span>
            <ul>${data.learning
              .map(
                (l) => `<li>${
                  l.url
                    ? `<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.title)}</a>`
                    : `<strong>${esc(l.title)}</strong>`
                }${
                  l.provider && l.provider !== l.title
                    ? `<span>${esc(l.provider)}</span>`
                    : ''
                }</li>`,
              )
              .join('')}</ul></div>`
        : '';

      return projects + learning;
    }

    case 'arcade':
      if (!data.games.length) return '';
      return `<ul class="w-games">${data.games
        .map(
          (g) =>
            `<li data-status="${esc(g.status)}"><strong>${esc(g.title)}</strong>${
              g.note ? `<span>${esc(g.note)}</span>` : ''
            }</li>`,
        )
        .join('')}</ul>`;

    case 'return':
      if (!data.links.length) return '';
      return `<ul class="w-contacts">${data.links
        .map((l) => {
          const href = hrefFor(l.kind, l.value);
          const value = esc(l.value);
          const inner = href
            ? `<a href="${esc(href)}"${
                isExternal(l.kind)
                  ? ' target="_blank" rel="me noopener noreferrer"'
                  : ''
              }>${value}</a>`
            : `<span>${value}</span>`;
          return `<li><span class="w-contacts__label">${esc(l.label)}</span>${inner}</li>`;
        })
        .join('')}</ul>`;

    default:
      return '';
  }
}

/**
 * Builds the ordered scene list. An act with no footage still appears — it
 * falls back to its still, and to plain copy if it has neither, so a missing
 * clip degrades to the previous design rather than a hole in the film.
 */
export function buildSections(
  data: PageData,
  options: { motion?: string } = {},
): WorldSection[] {
  // The admin's motion setting can only ever REDUCE motion. At anything below
  // full the clips are simply not offered and the engine shows each scene's
  // still — the story reads identically, it just does not move. A visitor's own
  // prefers-reduced-motion is handled by the engine on top of this.
  const showClips = (options.motion ?? 'full') === 'full';

  return data.acts.map((act) => {
    const dwell = DWELL[act.key] ?? { scroll: 1.6, linger: 0.4 };

    return {
      id: act.key,
      label: LABEL[act.key] ?? act.key,
      still: act.plateMidMediaId ? mediaUrl(act.plateMidMediaId) : undefined,
      clip:
        showClips && act.loopMediaId
          ? mediaUrl(act.loopMediaId, { kind: 'video' })
          : undefined,
      accent: ACCENT[act.key],
      eyebrow: act.kicker || undefined,
      title: act.title || undefined,
      body: act.body ? act.body.split(/\n\s*\n/)[0] : undefined,
      detail: detailFor(act.key, data),
      scroll: dwell.scroll,
      linger: dwell.linger,
      ...(act.key === 'return'
        ? {
            cta: {
              primary: {
                label: 'Email me',
                href: `mailto:${data.profile.name ? '' : ''}${
                  data.links.find((l) => l.kind === 'email')?.value ?? ''
                }`,
              },
            },
          }
        : {}),
    };
  });
}
