import type { Act } from '../../lib/db/queries.ts';
import { ageFrom } from '../../lib/age.ts';
import ActShell, { Paragraphs } from '../site/ActShell.tsx';
import Football from '../site/Football.tsx';

/**
 * Act 0 — The Room. Night, the desk, the two machines. The football sits under
 * the desk gathering dust; Act 8 puts it on the desk. That object is the film's
 * whole argument, so it is marked for the choreography to find.
 *
 * The shell's own body is suppressed: this act needs the title line to sit
 * between the name and the prose, so it renders both itself.
 */
export default function ActRoom({
  act,
  name,
  title,
  birthdate,
}: {
  act: Act;
  name: string;
  title: string;
  birthdate: string;
}) {
  const age = ageFrom(birthdate);

  return (
    <ActShell
      act={act}
      grade="night"
      headingLevel={1}
      titleOverride={name}
      showBody={false}
    >
      <p className="room-title">{title}</p>

      {act.body && (
        <div className="act-body room-body">
          <Paragraphs text={act.body} />
        </div>
      )}

      <dl className="room-facts">
        <div>
          <dt>Age</dt>
          <dd data-live-age>{age}</dd>
        </div>
        <div>
          <dt>Reading</dt>
          <dd>CSE, North South University</dd>
        </div>
        <div>
          <dt>Currently</dt>
          <dd>Learning to defend systems</dd>
        </div>
      </dl>

      {/* Dust-covered here; on the desk in Act 8. */}
      <Football state="under-desk" />

      <p className="scroll-cue" aria-hidden="true">
        <span>Scroll</span>
      </p>
    </ActShell>
  );
}
