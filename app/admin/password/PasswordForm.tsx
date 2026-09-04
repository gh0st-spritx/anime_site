'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { changePassword, type AuthState } from '../auth-actions.ts';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn" data-variant="primary" disabled={pending}>
      {pending ? 'Changing…' : 'Change password'}
    </button>
  );
}

export default function PasswordForm() {
  const [state, action] = useActionState<AuthState, FormData>(changePassword, {});

  return (
    <form action={action}>
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {state.ok && (
        <p className="adm-ok" role="status">
          Password changed. Any other signed-in browser has been signed out.
        </p>
      )}

      <label className="adm-field" htmlFor="pw_current">
        <span>Current password</span>
        <input id="pw_current" name="current" type="password" required autoComplete="current-password" />
      </label>

      <label className="adm-field" htmlFor="pw_next">
        <span>
          New password
          <span className="help">At least 12 characters.</span>
        </span>
        <input id="pw_next" name="next" type="password" required minLength={12} autoComplete="new-password" />
      </label>

      <label className="adm-field" htmlFor="pw_confirm">
        <span>Confirm new password</span>
        <input id="pw_confirm" name="confirm" type="password" required minLength={12} autoComplete="new-password" />
      </label>

      <Submit />
    </form>
  );
}
