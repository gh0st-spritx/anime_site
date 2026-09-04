import type { Act, PageData } from '../../lib/db/queries.ts';
import Plate from '../site/Plate.tsx';
import ActShell from '../site/ActShell.tsx';

/**
 * Act 7 — The Workshop. Designed for an empty shelf rather than patched for it.
 * Once there are three or more projects the empty-state line retires itself.
 */
export default function ActWorkshop({
  act,
  projects,
  learning,
}: {
  act: Act;
  projects: PageData['projects'];
  learning: PageData['learning'];
}) {
  const isEarly = projects.length < 3;

  return (
    <ActShell act={act} grade="white" plate={<Plate act={act} />} showBody={isEarly}>
      {projects.length === 0 ? (
        <ul className="pedestals" aria-label="Projects — none yet">
          {[0, 1, 2].map((i) => (
            <li key={i} className="pedestal" aria-hidden="true">
              <span className="pedestal-glow" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid-auto projects">
          {projects.map((p) => (
            <li key={p.id} className="card project" data-featured={p.featured ? 'true' : undefined}>
              {p.coverMediaId && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={`/api/media/${p.coverMediaId}`} alt="" className="project-cover" loading="lazy" />
              )}
              <h3>{p.title}</h3>
              {p.summary && <p>{p.summary}</p>}
              {p.tags.length > 0 && (
                <ul className="tags">
                  {p.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              <p className="project-links">
                {p.repoUrl && (
                  <a href={p.repoUrl} target="_blank" rel="noopener noreferrer">
                    Code<span className="sr"> for {p.title}</span> ↗
                  </a>
                )}
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noopener noreferrer">
                    Live<span className="sr"> demo of {p.title}</span> ↗
                  </a>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      {learning.length > 0 && (
        <section className="learning" aria-labelledby="learning-title">
          <h3 className="eyebrow" id="learning-title">In progress right now</h3>
          <ul>
            {learning.map((l) => (
              <li key={l.id}>
                {l.url ? (
                  <a href={l.url} target="_blank" rel="noopener noreferrer">{l.title}</a>
                ) : (
                  <span>{l.title}</span>
                )}
                {/* A provider identical to the title just reads as a stutter. */}
                {l.provider && l.provider !== l.title && (
                  <span className="learning-provider">{l.provider}</span>
                )}
                {l.note && <span className="learning-note">{l.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </ActShell>
  );
}
