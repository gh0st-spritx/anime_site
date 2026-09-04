import type { Act, PageData } from '../../lib/db/queries.ts';
import Plate from '../site/Plate.tsx';
import ActShell from '../site/ActShell.tsx';

/** Act 4 — The Classroom. The education timeline, including the exam year. */
export default function ActClassroom({
  act,
  education,
}: {
  act: Act;
  education: PageData['education'];
}) {
  return (
    <ActShell act={act} grade="lamp" plate={<Plate act={act} />}>
      <ol className="timeline">
        {education.map((e) => (
          <li key={e.id}>
            <span className="timeline-years">
              {e.startYear}
              {e.endYear ? `–${e.endYear}` : e.startYear ? '–present' : ''}
            </span>
            <span className="timeline-main">
              <strong>{e.institution}</strong>
              {(e.credential || e.field) && (
                <span className="timeline-sub">
                  {[e.credential, e.field].filter(Boolean).join(' · ')}
                </span>
              )}
              {e.note && <span className="timeline-note">{e.note}</span>}
            </span>
          </li>
        ))}
      </ol>
    </ActShell>
  );
}
