'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { saveResource, type SaveState } from '../../app/admin/actions.ts';
import type { ClientResource, FieldDef } from '../../lib/admin/resources.ts';
import MediaField from './MediaField.tsx';

type Row = Record<string, unknown> & { id?: number };

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn" data-variant="primary" disabled={pending}>
      {pending ? 'Saving…' : label}
    </button>
  );
}

function Field({ field, row }: { field: FieldDef; row: Row }) {
  const isNew = !row.id;
  const value = isNew && !(field.name in row) ? field.defaultValue : row[field.name];
  const id = `f_${field.name}`;

  const help = field.help && <span className="help">{field.help}</span>;

  if (field.type === 'boolean') {
    return (
      <label className="adm-check">
        <input
          type="checkbox"
          name={field.name}
          defaultChecked={Boolean(value)}
        />
        <span>
          {field.label}
          {help}
        </span>
      </label>
    );
  }

  return (
    <label className="adm-field" htmlFor={id}>
      <span>
        {field.label}
        {field.required && <span aria-hidden="true"> *</span>}
        {help}
      </span>

      {field.type === 'textarea' ? (
        <textarea id={id} name={field.name} defaultValue={String(value ?? '')} />
      ) : field.type === 'select' ? (
        <select id={id} name={field.name} defaultValue={String(value ?? '')}>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === 'media' ? (
        <MediaField
          name={field.name}
          defaultValue={typeof value === 'number' ? value : null}
        />
      ) : field.type === 'range' ? (
        <span className="adm-range">
          <input
            id={id}
            type="range"
            name={field.name}
            min={0}
            max={100}
            step={5}
            defaultValue={Number(value ?? 50)}
            onInput={(e) => {
              const out = e.currentTarget.nextElementSibling;
              if (out) out.textContent = `${e.currentTarget.value}%`;
            }}
          />
          <output>{Number(value ?? 50)}%</output>
        </span>
      ) : field.type === 'tags' ? (
        <input
          id={id}
          type="text"
          name={field.name}
          defaultValue={Array.isArray(value) ? value.join(', ') : ''}
        />
      ) : (
        <input
          id={id}
          type={
            field.type === 'date'
              ? 'date'
              : field.type === 'url'
                ? 'url'
                : field.type === 'email'
                  ? 'email'
                  : field.type === 'tel'
                    ? 'tel'
                    : field.type === 'number'
                      ? 'number'
                      : 'text'
          }
          name={field.name}
          defaultValue={String(value ?? '')}
          required={field.required}
        />
      )}
    </label>
  );
}

export default function ResourceForm({
  resource,
  row,
}: {
  resource: ClientResource;
  row: Row;
}) {
  const isNew = !row.id;
  const [state, action] = useActionState<SaveState, FormData>(
    saveResource.bind(null, resource.key),
    {},
  );

  return (
    <form action={action}>
      {row.id && <input type="hidden" name="id" value={row.id} />}

      {state.error && (
        <p className="adm-error" role="alert">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="adm-ok" role="status">
          Saved. The site is updated.
        </p>
      )}

      <div className="adm-card">
        {resource.fields.map((field) => (
          <Field key={field.name} field={field} row={row} />
        ))}
      </div>

      <p style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <Submit label={isNew ? `Create ${resource.singular.toLowerCase()}` : 'Save changes'} />
        <Link className="adm-btn" href={`/admin/${resource.key}`}>
          Back to {resource.label.toLowerCase()}
        </Link>
      </p>
    </form>
  );
}
