'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { setupAdmin, type AuthState } from '../auth-actions.ts';

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn" data-variant="primary" disabled={pending}>
      {pending ? 'Working…' : label}
    </button>
  );
}

export default function SetupForm() {
  const [state, action] = useActionState<AuthState, FormData>(setupAdmin, {});

  return (
    <form action={action}>
      {state.error && (
        <p className="adm-error" role="alert">
          {state.error}
        </p>
      )}

      <label className="adm-field">
        <span>Username</span>
        <input
          key={`u${state.attempt ?? 0}`}
          name="username"
          type="text"
          required
          minLength={3}
          defaultValue={state.username ?? ''}
          autoComplete="username"
          autoFocus
        />
      </label>

      <label className="adm-field">
        <span>
          Password
          <span className="help">At least 12 characters. Use a passphrase you will not forget — there is no reset link.</span>
        </span>
        <input name="password" type="password" required minLength={12} autoComplete="new-password" />
      </label>

      <label className="adm-field">
        <span>Confirm password</span>
        <input name="confirm" type="password" required minLength={12} autoComplete="new-password" />
      </label>

      <Submit label="Create account" />
    </form>
  );
}
