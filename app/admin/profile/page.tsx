import { requireAdmin } from '../../../lib/admin-guard.ts';
import { db } from '../../../lib/db/index.ts';
import { profile } from '../../../lib/db/schema.ts';
import { ageFrom } from '../../../lib/age.ts';
import AdminShell from '../AdminShell.tsx';
import { buildNav } from '../nav.ts';
import ProfileForm from './ProfileForm.tsx';

export default async function ProfilePage() {
  await requireAdmin();
  const row = db.select().from(profile).get();
  if (!row) throw new Error('Profile row missing — the seed did not run.');

  return (
    <AdminShell
      title="Profile"
      subtitle={`The header of the film. Your age renders live from your birthdate — right now it says ${ageFrom(row.birthdate)}.`}
      nav={buildNav()}
    >
      <ProfileForm row={row} />
    </AdminShell>
  );
}
