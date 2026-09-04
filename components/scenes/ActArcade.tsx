import type { Act, PageData } from '../../lib/db/queries.ts';
import Plate from '../site/Plate.tsx';
import ActShell from '../site/ActShell.tsx';
import { mediaUrl } from '../../lib/media-url.ts';

/** Act 7.5 — The Arcade. The competitive instinct, changed venue. */
export default function ActArcade({
  act,
  games,
}: {
  act: Act;
  games: PageData['games'];
}) {
  return (
    <ActShell act={act} grade="neon" plate={<Plate act={act} />}>
      <ul className="grid-auto games">
        {games.map((g) => (
          <li key={g.id} className="card game" data-status={g.status}>
            {g.coverMediaId && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={mediaUrl(g.coverMediaId)} alt="" className="game-cover" loading="lazy" />
            )}
            <h3>{g.title}</h3>
            {g.note && <p>{g.note}</p>}
            {g.status === 'awaiting' && <p className="eyebrow game-awaiting">Waiting</p>}
            {g.status === 'current' && <p className="eyebrow">Playing now</p>}
          </li>
        ))}
      </ul>
    </ActShell>
  );
}
