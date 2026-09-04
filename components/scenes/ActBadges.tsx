import type { Act, PageData } from '../../lib/db/queries.ts';
import Plate from '../site/Plate.tsx';
import ActShell from '../site/ActShell.tsx';

/** Act 6 — The Badges. Certifications, with verify links where they exist. */
export default function ActBadges({
  act,
  certifications,
}: {
  act: Act;
  certifications: PageData['certifications'];
}) {
  return (
    <ActShell act={act} grade="violet" plate={<Plate act={act} />}>
      <ul className="grid-auto badges">
        {certifications.map((c) => (
          <li key={c.id} className="card badge">
            {c.mediaId && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={`/api/media/${c.mediaId}`} alt="" className="badge-art" loading="lazy" />
            )}
            <h3>{c.name}</h3>
            {c.issuer && <p className="badge-issuer">{c.issuer}</p>}
            {c.issuedOn && <p className="eyebrow">{c.issuedOn}</p>}
            {c.credentialUrl && (
              <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer">
                Verify<span className="sr"> {c.name}</span> ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </ActShell>
  );
}
