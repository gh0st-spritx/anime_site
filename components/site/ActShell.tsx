import type { Act } from '../../lib/db/queries.ts';

export type Grade =
  | 'night' | 'pull' | 'gold' | 'signal' | 'lamp'
  | 'term' | 'violet' | 'white' | 'neon' | 'dawn';

/** Splits a body field on blank lines into real paragraphs. */
export function Paragraphs({ text }: { text: string }) {
  const parts = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </>
  );
}

/**
 * Every act's scaffolding: the landmark section, its heading, and the grade.
 * Acts differ in content and (later) choreography, never in structure — which
 * is what keeps the no-JS and reduced-motion readings correct by default.
 */
export default function ActShell({
  act,
  grade,
  headingLevel = 2,
  titleOverride,
  children,
  showBody = true,
  plate,
  overlay,
}: {
  act: Act;
  grade: Grade;
  headingLevel?: 1 | 2;
  titleOverride?: React.ReactNode;
  children?: React.ReactNode;
  showBody?: boolean;
  /** Scenery layers rendered behind the content. */
  plate?: React.ReactNode;
  /**
   * Anchored to the act itself rather than the text column. `.act-inner` is
   * position:relative for stacking, so anything absolutely positioned inside it
   * measures from the text block and lands mid-panel instead of at the edge.
   */
  overlay?: React.ReactNode;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const headingId = `act-${act.key}-title`;

  return (
    <section
      id={act.key}
      className="act"
      data-act={act.key}
      data-grade={grade}
      aria-labelledby={headingId}
    >
      {plate}
      <div className="act-inner">
        {act.kicker && <p className="act-kicker">{act.kicker}</p>}

        <Heading className="act-title" id={headingId}>
          {titleOverride ?? act.title}
        </Heading>

        {showBody && act.body && (
          <div className="act-body">
            <Paragraphs text={act.body} />
          </div>
        )}

        {children}
      </div>

      {overlay}
    </section>
  );
}
