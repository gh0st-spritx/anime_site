import type { Act, PageData } from '../../lib/db/queries.ts';
import ActShell from '../site/ActShell.tsx';

/**
 * Act 5 — The Terminal. The skills matrix.
 *
 * Values render as real numbers in a <dl>, not just bar widths, so the honest
 * figure is available to a screen reader and to anyone with JS disabled.
 */
export default function ActTerminal({
  act,
  skills,
}: {
  act: Act;
  skills: PageData['skills'];
}) {
  const categories = [...new Set(skills.map((s) => s.category))];

  return (
    <ActShell act={act} grade="term">
      <div className="skills">
        {categories.map((category) => (
          <section key={category} className="skills-group" aria-label={category}>
            <h3 className="eyebrow">{category}</h3>
            <dl>
              {skills
                .filter((s) => s.category === category)
                .map((s) => (
                  <div key={s.id} className="skill">
                    <dt>
                      {s.name}
                      {s.note && <span className="skill-note">{s.note}</span>}
                    </dt>
                    <dd>
                      <span className="skill-bar" aria-hidden="true">
                        <span style={{ width: `${s.proficiency}%` }} />
                      </span>
                      <span className="skill-value">{s.proficiency}%</span>
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}
      </div>
    </ActShell>
  );
}
