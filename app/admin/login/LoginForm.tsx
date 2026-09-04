'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { loginAdmin, type AuthState } from '../auth-actions.ts';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button className="adm-btn" data-variant="primary" disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useActionState<AuthState, FormData>(loginAdmin, {});

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
          defaultValue={state.username ?? ''}
          autoComplete="username"
          autoFocus
        />
      </label>

      <label className="adm-field">
        <span>Password</span>
        <input name="password" type="password" required autoComplete="current-password" />
      </label>

      <Submit />
    </form>
  );
}
