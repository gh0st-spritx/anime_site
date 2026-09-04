import type { Act } from '../../lib/db/queries.ts';

/**
 * Act 1 — The Pull. The shortest act: the camera pushes into the monitor and
 * the glow blows out to white, which becomes the sky of Act 2. Pure transition,
 * so it carries no content and no heading of its own.
 */
export default function ActPull({ act }: { act: Act }) {
  return (
    <section
      id={act.key}
      className="act act-pull"
      data-act={act.key}
      data-grade="pull"
      aria-hidden="true"
    >
      <span className="pull-bloom" />
    </section>
  );
}
