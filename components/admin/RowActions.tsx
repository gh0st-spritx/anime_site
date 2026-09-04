'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  deleteResource,
  moveResource,
  setVisibility,
} from '../../app/admin/actions.ts';

export function MoveButtons({
  resourceKey,
  id,
  isFirst,
  isLast,
}: {
  resourceKey: string;
  id: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  const move = (direction: 'up' | 'down') =>
    start(async () => {
      await moveResource(resourceKey, id, direction);
      router.refresh();
    });

  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      <button
        type="button"
        className="adm-icon"
        onClick={() => move('up')}
        disabled={pending || isFirst}
        aria-label="Move up"
        title="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        className="adm-icon"
        onClick={() => move('down')}
        disabled={pending || isLast}
        aria-label="Move down"
        title="Move down"
      >
        ↓
      </button>
    </span>
  );
}

export function VisibilityToggle({
  resourceKey,
  id,
  visible,
  label,
}: {
  resourceKey: string;
  id: number;
  visible: boolean;
  label: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      className="adm-pill"
      data-on={visible ? 'true' : 'false'}
      disabled={pending}
      aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
      onClick={() =>
        start(async () => {
          await setVisibility(resourceKey, id, !visible);
          router.refresh();
        })
      }
    >
      {visible ? 'Visible' : 'Hidden'}
    </button>
  );
}

export function DeleteButton({
  resourceKey,
  id,
  label,
}: {
  resourceKey: string;
  id: number;
  label: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      className="adm-icon"
      data-danger="true"
      disabled={pending}
      aria-label={`Delete ${label}`}
      title={`Delete ${label}`}
      onClick={() => {
        // Deleting content is not undoable — the DB has no soft-delete.
        if (!confirm(`Delete “${label}”? This cannot be undone.`)) return;
        start(async () => {
          await deleteResource(resourceKey, id);
          router.refresh();
        });
      }}
    >
      ✕
    </button>
  );
}
