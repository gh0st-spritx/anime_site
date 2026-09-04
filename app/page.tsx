import { getPageData } from '../lib/db/queries.ts';
import { buildSections } from '../lib/world/sections.ts';
import { mediaUrl } from '../lib/media-url.ts';
import { ageFrom } from '../lib/age.ts';
import { hrefFor, isExternal } from '../lib/links.ts';
import ScrollWorld from '../components/world/ScrollWorld.tsx';
import AudioToggle from '../components/motion/AudioToggle.tsx';

// Reads SQLite on every request. Sub-millisecond, and it keeps admin edits
// instant without cache plumbing.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getPageData();
  const { profile, settings } = data;

  if (settings.maintenanceMode) {
    return (
      <main className="maintenance">
        <h1>{profile.name}</h1>
        <p>This site is being worked on. Back shortly.</p>
      </main>
    );
  }

  const sections = buildSections(data, { motion: settings.motionIntensity });

  // The chain: one connector between each pair of scenes. A missing clip is
  // passed as null — the engine crossfades that seam directly rather than
  // breaking the flight.
  const connectors =
    settings.motionIntensity === 'full'
      ? data.acts
          .slice(0, -1)
          .map((act) =>
            act.connectorMediaId
              ? mediaUrl(act.connectorMediaId, { kind: 'video' })
              : null,
          )
      : [];

  const age = ageFrom(profile.birthdate);

  return (
    <>
      <a className="skip" href="#story">
        Skip to content
      </a>

      <ScrollWorld
        config={{
          brand: { name: profile.name, href: '#top' },
          hint: 'scroll to go in',
          nav: true,
          atmosphere: false,
          crossfade: 0.1,
          sections,
          connectors,
        }}
      />

      <AudioToggle armed={settings.audioDefaultOn} />

      {/*
        The same story as plain HTML, underneath the film. Hidden by CSS only
        once the engine actually mounts, so a visitor without JavaScript — or a
        crawler — gets the whole thing rather than an empty page.
      */}
      <main id="story" className="story-fallback">
        <h1>
          {profile.name} — {profile.title}
        </h1>
        <p>
          {age} years old. {profile.bio}
        </p>

        {data.acts.map((act) => (
          <section key={act.id} id={`s-${act.key}`}>
            {act.kicker && <p>{act.kicker}</p>}
            {act.title && <h2>{act.title}</h2>}
            {act.body
              .split(/\n\s*\n/)
              .filter(Boolean)
              .map((p, i) => (
                <p key={i}>{p.trim()}</p>
              ))}
          </section>
        ))}

        <section id="s-education">
          <h2>Education</h2>
          <ul>
            {data.education.map((e) => (
              <li key={e.id}>
                <strong>{e.institution}</strong> — {e.credential} {e.field} (
                {e.startYear}
                {e.endYear ? `–${e.endYear}` : '–present'})
              </li>
            ))}
          </ul>
        </section>

        <section id="s-skills">
          <h2>Skills</h2>
          <dl>
            {data.skills.map((s) => (
              <div key={s.id}>
                <dt>
                  {s.name}
                  {s.note ? ` (${s.note})` : ''}
                </dt>
                <dd>{s.proficiency}%</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="s-certifications">
          <h2>Certifications</h2>
          <ul>
            {data.certifications.map((c) => (
              <li key={c.id}>
                {c.name}
                {c.issuer ? ` — ${c.issuer}` : ''}
                {c.credentialUrl && (
                  <>
                    {' '}
                    <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer">
                      Verify
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section id="s-projects">
          <h2>Projects</h2>
          {data.projects.length === 0 ? (
            <p>
              Nothing shipped yet — that is a date stamp, not an accident. One
              year into a CSE degree, foundation first.
            </p>
          ) : (
            <ul>
              {data.projects.map((p) => (
                <li key={p.id}>
                  <strong>{p.title}</strong>
                  {p.summary ? ` — ${p.summary}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="s-learning">
          <h2>Currently learning</h2>
          <ul>
            {data.learning.map((l) => (
              <li key={l.id}>{l.title}</li>
            ))}
          </ul>
        </section>

        <section id="s-contact">
          <h2>Contact</h2>
          <ul>
            {data.links.map((l) => {
              const href = hrefFor(l.kind, l.value);
              return (
                <li key={l.id}>
                  {l.label}:{' '}
                  {href ? (
                    <a
                      href={href}
                      {...(isExternal(l.kind)
                        ? { target: '_blank', rel: 'me noopener noreferrer' }
                        : {})}
                    >
                      {l.value}
                    </a>
                  ) : (
                    l.value
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </>
  );
}
