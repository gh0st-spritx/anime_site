import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { requireAdmin } from '../../../../lib/admin-guard.ts';
import { db } from '../../../../lib/db/index.ts';
import { getResource, toClientResource } from '../../../../lib/admin/resources.ts';
import AdminShell from '../../AdminShell.tsx';
import { buildNav } from '../../nav.ts';
import ResourceForm from '../../../../components/admin/ResourceForm.tsx';

export default async function ResourceEdit({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  await requireAdmin();

  const { resource: key, id } = await params;
  const resource = getResource(key);
  if (!resource) notFound();

  const isNew = id === 'new';
  if (isNew && resource.fixedRows) notFound();

  let row: Record<string, unknown> = {};
  if (!isNew) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) notFound();

    const columns = resource.table as never as Record<string, never>;
    const found = db
      .select()
      .from(resource.table as never)
      .where(eq(columns.id, numericId))
      .get();
    if (!found) notFound();
    row = found as Record<string, unknown>;
  }

  return (
    <AdminShell
      title={isNew ? `New ${resource.singular.toLowerCase()}` : `Edit ${resource.singular.toLowerCase()}`}
      nav={buildNav()}
    >
      <ResourceForm resource={toClientResource(resource)} row={row} />
    </AdminShell>
  );
}
