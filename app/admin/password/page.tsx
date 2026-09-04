import { requireAdmin } from '../../../lib/admin-guard.ts';
import AdminShell from '../AdminShell.tsx';
import { buildNav } from '../nav.ts';
import PasswordForm from './PasswordForm.tsx';

export default async function PasswordPage() {
  await requireAdmin();

  return (
    <AdminShell
      title="Change password"
      subtitle="Changing this signs out every other browser you are signed in on. This one stays signed in."
      nav={buildNav()}
    >
      <div className="adm-card" style={{ maxWidth: 460 }}>
        <PasswordForm />
      </div>
    </AdminShell>
  );
}
