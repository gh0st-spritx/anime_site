import type { Act, PageData } from '../../lib/db/queries.ts';
import { hrefFor, isExternal } from '../../lib/links.ts';
import Plate from '../site/Plate.tsx';
import ActShell from '../site/ActShell.tsx';

/**
 * Act 8 — The Return. The Act 0 room at dawn. The football is on the desk now.
 * Contact resolves last.
 */
export default function ActReturn({
  act,
  links,
  name,
}: {
  act: Act;
  links: PageData['links'];
  name: string;
}) {
  return (
    <ActShell act={act} grade="dawn" plate={<Plate act={act} />}>
      <ul className="contacts">
        {links.map((l) => {
          const href = hrefFor(l.kind, l.value);
          return (
            <li key={l.id} className="contact" data-kind={l.kind}>
              <span className="eyebrow">{l.label}</span>
              {href ? (
                <a
                  href={href}
                  {...(isExternal(l.kind)
                    ? { target: '_blank', rel: 'me noopener noreferrer' }
                    : {})}
                >
                  {l.value}
                </a>
              ) : (
                <span>{l.value}</span>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="site-footer">
        <p>
          © {new Date().getFullYear()} {name}. Built from scratch — the story,
          the code, and the room.
        </p>
      </footer>
    </ActShell>
  );
}
