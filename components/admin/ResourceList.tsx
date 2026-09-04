import Link from 'next/link';
import { db } from '../../lib/db/index.ts';
import type { ResourceDef } from '../../lib/admin/resources.ts';
import { MoveButtons, VisibilityToggle, DeleteButton } from './RowActions.tsx';

type Row = Record<string, unknown> & { id: number };

function cell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  return String(value);
}

function labelFor(row: Row, resource: ResourceDef): string {
  const first = resource.listColumns[0];
  return String(row[first] ?? `#${row.id}`);
}

export default function ResourceList({ resource }: { resource: ResourceDef }) {
  const columns = resource.table as never as Record<string, never>;
  const rows = db
    .select()
    .from(resource.table as never)
    .orderBy(columns.sortOrder, columns.id)
    .all() as Row[];

  const hasVisible = resource.fields.some((f) => f.name === 'visible');

  return (
    <>
      {resource.blurb && <p className="adm-sub">{resource.blurb}</p>}

      {!resource.fixedRows && (
        <p style={{ marginBottom: 16 }}>
          <Link
            className="adm-btn"
            data-variant="primary"
            href={`/admin/${resource.key}/new`}
          >
            Add {resource.singular.toLowerCase()}
          </Link>
        </p>
      )}

      {rows.length === 0 ? (
        <div className="adm-card">
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Nothing here yet. Add the first {resource.singular.toLowerCase()} and
            it appears on the site straight away.
          </p>
        </div>
      ) : (
        <div className="adm-card" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="adm-table">
            <thead>
              <tr>
                {resource.sortable && <th scope="col">Order</th>}
                {resource.listColumns.map((c) => (
                  <th scope="col" key={c}>
                    {resource.fields.find((f) => f.name === c)?.label ?? c}
                  </th>
                ))}
                <th scope="col">
                  <span className="adm-sr">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id}>
                  {resource.sortable && (
                    <td>
                      <MoveButtons
                        resourceKey={resource.key}
                        id={row.id}
                        isFirst={i === 0}
                        isLast={i === rows.length - 1}
                      />
                    </td>
                  )}

                  {resource.listColumns.map((c) => (
                    <td key={c}>
                      {c === 'visible' && hasVisible ? (
                        <VisibilityToggle
                          resourceKey={resource.key}
                          id={row.id}
                          visible={Boolean(row.visible)}
                          label={labelFor(row, resource)}
                        />
                      ) : c === resource.listColumns[0] ? (
                        <Link href={`/admin/${resource.key}/${row.id}`}>
                          {cell(row[c])}
                        </Link>
                      ) : (
                        cell(row[c])
                      )}
                    </td>
                  ))}

                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link
                      className="adm-icon"
                      href={`/admin/${resource.key}/${row.id}`}
                      aria-label={`Edit ${labelFor(row, resource)}`}
                      title="Edit"
                    >
                      ✎
                    </Link>
                    {!resource.fixedRows && (
                      <DeleteButton
                        resourceKey={resource.key}
                        id={row.id}
                        label={labelFor(row, resource)}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
