import { redirect } from 'next/navigation';
import { adminExists } from '../../../lib/admin-guard.ts';
import { runMigrations } from '../../../lib/db/migrate.ts';
import SetupForm from './SetupForm.tsx';

export default function SetupPage() {
  runMigrations();
  if (adminExists()) redirect('/admin/login');

  return (
    <main className="adm-auth">
      <div className="adm-card">
        <h1 className="adm-h1">Create your admin account</h1>
        <p className="adm-sub">
          This runs once. No password is stored in the code or in an
          environment variable — you set it here, and it is hashed before it
          touches the database.
        </p>
        <SetupForm />
      </div>
    </main>
  );
}
