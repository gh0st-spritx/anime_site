import { requireAdmin } from '../../../lib/admin-guard.ts';
import AdminShell from '../AdminShell.tsx';
import { buildNav } from '../nav.ts';
import MediaGrid from '../../../components/admin/MediaGrid.tsx';

export default async function MediaPage() {
  await requireAdmin();

  return (
    <AdminShell
      title="Media library"
      subtitle="Every image, video and PDF on the site. Alt text is written here, and it is what screen readers and search engines read — worth filling in."
      nav={buildNav()}
    >
      <MediaGrid manage />
    </AdminShell>
  );
}
