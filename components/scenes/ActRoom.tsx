import type { Act } from '../../lib/db/queries.ts';
import { ageFrom } from '../../lib/age.ts';
import Plate from '../site/Plate.tsx';
import ActShell, { Paragraphs } from '../site/ActShell.tsx';

/**
 * Act 0 — The Room. Night, the desk, the two machines. The football sits under
 * the desk gathering dust; Act 8 puts it on the desk. That object is the film's
 * whole argument, and it lives in the generated plate itself rather than as an
 * overlay — one painted ball, lit by the scene it is in.
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
      grade="night" plate={<Plate act={act} />}
      headingLevel={1}
      titleOverride={name}
      showBody={false}
      overlay={
        <p className="scroll-cue" aria-hidden="true">
          <span>Scroll</span>
        </p>
      }
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
    </ActShell>
  );
}
