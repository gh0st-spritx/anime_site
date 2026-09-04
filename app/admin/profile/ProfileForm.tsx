'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { saveProfile, type SaveState } from '../settings-actions.ts';
import MediaField from '../../../components/admin/MediaField.tsx';

type Row = {
  name: string;
  title: string;
  tagline: string;
  birthdate: string;
  bio: string;
  location: string;
  avatarMediaId: number | null;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn" data-variant="primary" disabled={pending}>
      {pending ? 'Saving…' : 'Save profile'}
    </button>
  );
}

export default function ProfileForm({ row }: { row: Row }) {
  const [state, action] = useActionState<SaveState, FormData>(saveProfile, {});

  return (
    <form action={action}>
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state.ok && <p className="adm-ok" role="status">Saved. The site is updated.</p>}

      <div className="adm-card">
        <label className="adm-field" htmlFor="p_name">
          <span>Name</span>
          <input id="p_name" name="name" type="text" defaultValue={row.name} required />
        </label>

        <label className="adm-field" htmlFor="p_title">
          <span>
            Title
            <span className="help">The line under your name. Keep it accurate — it is the first thing a recruiter reads.</span>
          </span>
          <input id="p_title" name="title" type="text" defaultValue={row.title} />
        </label>

        <label className="adm-field" htmlFor="p_tagline">
          <span>Tagline</span>
          <input id="p_tagline" name="tagline" type="text" defaultValue={row.tagline} />
        </label>

        <label className="adm-field" htmlFor="p_birthdate">
          <span>
            Birthdate
            <span className="help">Your age is computed from this on every page load, so it never goes stale.</span>
          </span>
          <input id="p_birthdate" name="birthdate" type="date" defaultValue={row.birthdate} required />
        </label>

        <label className="adm-field" htmlFor="p_location">
          <span>Location</span>
          <input id="p_location" name="location" type="text" defaultValue={row.location} />
        </label>

        <label className="adm-field" htmlFor="p_bio">
          <span>Bio</span>
          <textarea id="p_bio" name="bio" defaultValue={row.bio} />
        </label>

        <label className="adm-field">
          <span>Portrait</span>
          <MediaField name="avatarMediaId" defaultValue={row.avatarMediaId} />
        </label>
      </div>

      <p style={{ marginTop: 18 }}>
        <Submit />
      </p>
    </form>
  );
}
