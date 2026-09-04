'use client';

import { useEffect, useRef, useState } from 'react';
import MediaGrid from './MediaGrid.tsx';

/**
 * Picks a media row by id. The value contract is a hidden input carrying the
 * media id, or empty for none.
 */
export default function MediaField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: number | null;
}) {
  const [value, setValue] = useState<number | null>(defaultValue);
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <div className="adm-media">
      <input type="hidden" name={name} value={value ?? ''} />

      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="adm-media-thumb"
          src={`/api/media/${value}`}
          alt=""
          width={72}
          height={72}
        />
      ) : (
        <span className="adm-media-empty">No image</span>
      )}

      <button type="button" className="adm-btn" onClick={() => setOpen(true)}>
        {value ? 'Change' : 'Choose or upload'}
      </button>

      {value && (
        <button
          type="button"
          className="adm-btn"
          onClick={() => setValue(null)}
        >
          Remove
        </button>
      )}

      {/* <dialog> gives focus trapping and Escape-to-close for free. */}
      <dialog
        ref={dialogRef}
        className="adm-dialog"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setOpen(false);
        }}
      >
        <div className="adm-dialog-inner">
          <div className="adm-dialog-head">
            <h2>Media library</h2>
            <button
              type="button"
              className="adm-btn"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          {open && (
            <MediaGrid
              onPick={(id) => {
                setValue(id);
                setOpen(false);
              }}
            />
          )}
        </div>
      </dialog>
    </div>
  );
}
