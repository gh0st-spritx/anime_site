import Link from 'next/link';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '../../lib/admin-guard.ts';
import { db } from '../../lib/db/index.ts';
import { projects, learning } from '../../lib/db/schema.ts';
import { RESOURCES } from '../../lib/admin/resources.ts';
import AdminShell from './AdminShell.tsx';
import { buildNav } from './nav.ts';

export default async function AdminHome() {
  await requireAdmin();

  const projectCount =
    db.select({ n: sql<number>`count(*)` }).from(projects).get()?.n ?? 0;
  const learningCount =
    db.select({ n: sql<number>`count(*)` }).from(learning).get()?.n ?? 0;

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Everything on the public site is editable from here."
      nav={buildNav()}
    >
      {projectCount === 0 && (
        <div className="adm-card" style={{ marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 16 }}>No projects yet</h2>
          <p style={{ margin: '0 0 14px', color: 'var(--muted)' }}>
            The workshop act is designed for this — lit pedestals, waiting. It
            says the shelves are empty because it is early, and it stops saying
            so once you have three. Add the first one whenever it is ready.
          </p>
          <Link className="adm-btn" href="/admin/projects/new">
            Add a project
          </Link>
        </div>
      )}

      <div className="adm-card">
        <h2 style={{ margin: '0 0 6px', fontSize: 16 }}>Keep this fresh</h2>
        <p style={{ margin: '0 0 14px', color: 'var(--muted)' }}>
          You have {learningCount}{' '}
          {learningCount === 1 ? 'item' : 'items'} in “currently learning”. That
          section is what makes the site look alive between project launches —
          updating it takes a minute and is worth doing monthly.
        </p>
        <Link className="adm-btn" href="/admin/learning">
          Update {RESOURCES.learning.label.toLowerCase()}
        </Link>
      </div>
    </AdminShell>
  );
}
