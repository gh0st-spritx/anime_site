import { redirect } from 'next/navigation';
import { adminExists } from '../../../lib/admin-guard.ts';
import { runMigrations } from '../../../lib/db/migrate.ts';
import LoginForm from './LoginForm.tsx';

export default function LoginPage() {
  runMigrations();
  if (!adminExists()) redirect('/admin/setup');

  return (
    <main className="adm-auth">
      <div className="adm-card">
        <h1 className="adm-h1">Admin</h1>
        <p className="adm-sub">Sign in to edit the site.</p>
        <LoginForm />
      </div>
    </main>
  );
}
