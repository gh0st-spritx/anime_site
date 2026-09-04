'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveSettings, type SaveState } from '../settings-actions.ts';
import MediaField from '../../../components/admin/MediaField.tsx';

export type Section = { key: string; visible: boolean; title: string };

type Row = {
  accentColor: string;
  motionIntensity: string;
  audioDefaultOn: boolean;
  seoTitle: string;
  seoDescription: string;
  seoImageMediaId: number | null;
  analyticsSnippet: string;
  maintenanceMode: boolean;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn" data-variant="primary" disabled={pending}>
      {pending ? 'Saving…' : 'Save settings'}
    </button>
  );
}

export default function SettingsForm({
  row,
  sections: initial,
}: {
  row: Row;
  sections: Section[];
}) {
  const [state, action] = useActionState<SaveState, FormData>(saveSettings, {});
  const [sections, setSections] = useState(initial);

  const move = (index: number, delta: number) => {
    const next = [...sections];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  };

  const toggle = (index: number) =>
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, visible: !s.visible } : s)),
    );

  return (
    <form action={action}>
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state.ok && <p className="adm-ok" role="status">Saved. The site is updated.</p>}

      <h2 className="adm-h2">The film</h2>
      <div className="adm-card">
        <label className="adm-field" htmlFor="s_accent">
          <span>
            Accent colour
            <span className="help">Drives highlights, focus rings, and the terminal glow.</span>
          </span>
          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              id="s_accent"
              name="accentColor"
              type="color"
              defaultValue={row.accentColor}
              style={{ width: 52, height: 38, padding: 2 }}
            />
            <code style={{ color: 'var(--muted)' }}>{row.accentColor}</code>
          </span>
        </label>

        <label className="adm-field" htmlFor="s_motion">
          <span>
            Motion intensity
            <span className="help">
              A visitor who asks their system for reduced motion always gets it,
              whatever this is set to. This can only reduce motion further.
            </span>
          </span>
          <select id="s_motion" name="motionIntensity" defaultValue={row.motionIntensity}>
            <option value="full">Full — the whole film</option>
            <option value="reduced">Reduced — cross-fades, no pinning</option>
            <option value="off">Off — a still page</option>
          </select>
        </label>

        <label className="adm-check">
          <input type="checkbox" name="audioDefaultOn" defaultChecked={row.audioDefaultOn} />
          <span>
            Arm the ambient score
            <span className="help">
              Sound never starts on its own — browsers block it and it would
              ambush people. This only pre-arms the speaker toggle.
            </span>
          </span>
        </label>
      </div>

      <h2 className="adm-h2">Sections</h2>
      <p className="adm-sub">
        The order the story plays in, and what appears at all. Turning one off
        removes it entirely — the acts either side join up.
      </p>
      <div className="adm-card" style={{ padding: 0 }}>
        <ul className="adm-sections">
          {sections.map((s, i) => (
            <li key={s.key}>
              <input type="hidden" name="sectionOrder" value={s.key} />
              {s.visible && (
                <input type="hidden" name="sectionVisible" value={s.key} />
              )}

              <span className="adm-sections-n">{i + 1}</span>
              <span className="adm-sections-title">
                {s.title || s.key}
                <code>{s.key}</code>
              </span>

              <button
                type="button"
                className="adm-pill"
                data-on={s.visible ? 'true' : 'false'}
                onClick={() => toggle(i)}
                aria-label={`${s.visible ? 'Hide' : 'Show'} ${s.title || s.key}`}
              >
                {s.visible ? 'Visible' : 'Hidden'}
              </button>

              <span style={{ display: 'inline-flex', gap: 2 }}>
                <button
                  type="button"
                  className="adm-icon"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${s.title || s.key} earlier`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="adm-icon"
                  onClick={() => move(i, 1)}
                  disabled={i === sections.length - 1}
                  aria-label={`Move ${s.title || s.key} later`}
                >
                  ↓
                </button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <h2 className="adm-h2">Search & sharing</h2>
      <div className="adm-card">
        <label className="adm-field" htmlFor="s_seotitle">
          <span>SEO title</span>
          <input id="s_seotitle" name="seoTitle" type="text" defaultValue={row.seoTitle} />
        </label>

        <label className="adm-field" htmlFor="s_seodesc">
          <span>
            SEO description
            <span className="help">Around 155 characters is what Google shows.</span>
          </span>
          <textarea id="s_seodesc" name="seoDescription" defaultValue={row.seoDescription} />
        </label>

        <label className="adm-field">
          <span>
            Share image
            <span className="help">Shown when the link is pasted into a chat. 1200×630 works everywhere.</span>
          </span>
          <MediaField name="seoImageMediaId" defaultValue={row.seoImageMediaId} />
        </label>

        <label className="adm-field" htmlFor="s_analytics">
          <span>
            Analytics snippet
            <span className="help">
              Pasted into the page head as-is. Only paste code you trust — it
              runs on your visitors&rsquo; browsers.
            </span>
          </span>
          <textarea id="s_analytics" name="analyticsSnippet" defaultValue={row.analyticsSnippet} />
        </label>
      </div>

      <h2 className="adm-h2">Danger</h2>
      <div className="adm-card">
        <label className="adm-check">
          <input type="checkbox" name="maintenanceMode" defaultChecked={row.maintenanceMode} />
          <span>
            Maintenance mode
            <span className="help">
              Visitors see a holding screen. This admin panel keeps working, so
              you can always switch it back.
            </span>
          </span>
        </label>
      </div>

      <p style={{ marginTop: 18 }}>
        <Submit />
      </p>
    </form>
  );
}
