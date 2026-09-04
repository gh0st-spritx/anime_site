'use client';

import { useState } from 'react';

/**
 * Picks a media row by id. Task 6 replaces the browse button's internals with
 * the real library modal; the value contract (a hidden input carrying the
 * media id, or empty for none) does not change.
 */
export default function MediaField({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: number | null;
}) {
  const [value, setValue] = useState<number | null>(defaultValue);

  return (
    <div className="adm-media">
      <input type="hidden" name={name} value={value ?? ''} />

      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="adm-media-thumb"
            src={`/api/media/${value}`}
            alt=""
            width={72}
            height={72}
          />
          <span className="adm-media-id">#{value}</span>
          <button
            type="button"
            className="adm-btn"
            onClick={() => setValue(null)}
          >
            Remove
          </button>
        </>
      ) : (
        <>
          <span className="adm-media-empty">No image</span>
          <input
            type="number"
            min={1}
            placeholder="Media id"
            style={{ maxWidth: 140 }}
            onChange={(e) => {
              const n = Number(e.target.value);
              setValue(Number.isInteger(n) && n > 0 ? n : null);
            }}
          />
        </>
      )}
    </div>
  );
}
