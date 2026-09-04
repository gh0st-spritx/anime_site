'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  listMedia,
  deleteMedia,
  setAlt,
  type MediaItem,
} from '../../app/admin/media-actions.ts';
import { humanBytes, isImage } from '../../lib/media.ts';

export function useMediaLibrary() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const reload = () => listMedia().then(setItems).catch(() => setError('Could not load the library.'));

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Upload failed.');
        return null;
      }
      await reload();
      return json.id as number;
    } catch {
      setError('Upload failed.');
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { items, error, uploading, upload, reload, setError };
}

export default function MediaGrid({
  onPick,
  manage = false,
}: {
  onPick?: (id: number) => void;
  manage?: boolean;
}) {
  const { items, error, uploading, upload, reload } = useMediaLibrary();
  const fileRef = useRef<HTMLInputElement>(null);
  const [, start] = useTransition();

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/mp4,video/webm,application/pdf"
          style={{ display: 'none' }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const id = await upload(file);
            e.target.value = '';
            if (id && onPick) onPick(id);
          }}
        />
        <button
          type="button"
          className="adm-btn"
          data-variant="primary"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Upload a file'}
        </button>
        <span style={{ color: 'var(--muted)' }}>
          Images, MP4/WebM video, or PDF. Up to 25 MB.
        </span>
      </div>

      {error && (
        <p className="adm-error" role="alert">
          {error}
        </p>
      )}

      {items === null ? (
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      ) : items.length === 0 ? (
        <div className="adm-card">
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Nothing uploaded yet.
          </p>
        </div>
      ) : (
        <ul className="adm-grid">
          {items.map((m) => (
            <li key={m.id} className="adm-tile">
              {isImage(m.mime) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/media/${m.id}`} alt={m.alt} loading="lazy" />
              ) : (
                <div className="adm-tile-file">{m.mime.split('/')[1]}</div>
              )}

              <div className="adm-tile-meta">
                <span>
                  #{m.id} · {humanBytes(m.bytes)}
                  {m.width ? ` · ${m.width}×${m.height}` : ''}
                </span>

                {manage ? (
                  <>
                    <input
                      type="text"
                      defaultValue={m.alt}
                      placeholder="Alt text (describe the image)"
                      onBlur={(e) =>
                        start(async () => {
                          await setAlt(m.id, e.target.value);
                        })
                      }
                    />
                    <button
                      type="button"
                      className="adm-btn"
                      data-variant="danger"
                      onClick={() => {
                        if (!confirm(`Delete media #${m.id}? Anything using it will lose its image.`)) return;
                        start(async () => {
                          await deleteMedia(m.id);
                          await reload();
                        });
                      }}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="adm-btn"
                    onClick={() => onPick?.(m.id)}
                  >
                    Use this
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
