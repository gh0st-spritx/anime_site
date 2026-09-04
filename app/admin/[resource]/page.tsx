import { notFound } from 'next/navigation';
import { requireAdmin } from '../../../lib/admin-guard.ts';
import { getResource } from '../../../lib/admin/resources.ts';
import AdminShell from '../AdminShell.tsx';
import { buildNav } from '../nav.ts';
import ResourceList from '../../../components/admin/ResourceList.tsx';

export default async function ResourceIndex({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  await requireAdmin();

  const { resource: key } = await params;
  const resource = getResource(key);
  if (!resource) notFound();

  return (
    <AdminShell title={resource.label} nav={buildNav()}>
      <ResourceList resource={resource} />
    </AdminShell>
  );
}
