import type { Act } from '../../lib/db/queries.ts';
import ActShell from '../site/ActShell.tsx';

/** Act 2 — The Field. Golden hour, the striker. About. */
export default function ActField({ act }: { act: Act }) {
  return (
    <ActShell act={act} grade="gold">
      <p className="pull-quote">
        The job of a striker is to be the one who finishes.
      </p>
    </ActShell>
  );
}
