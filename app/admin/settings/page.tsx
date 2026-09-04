import { requireAdmin } from '../../../lib/admin-guard.ts';
import { db } from '../../../lib/db/index.ts';
import { settings, storyActs } from '../../../lib/db/schema.ts';
import AdminShell from '../AdminShell.tsx';
import { buildNav } from '../nav.ts';
import SettingsForm, { type Section } from './SettingsForm.tsx';

export default async function SettingsPage() {
  await requireAdmin();

  const row = db.select().from(settings).get();
  if (!row) throw new Error('Settings row missing — the seed did not run.');

  const acts = db.select().from(storyActs).orderBy(storyActs.sortOrder).all();
  const titles = new Map(acts.map((a) => [a.key, a.title]));

  // Reconcile stored config against the acts that actually exist, so an act
  // added or renamed later cannot silently disappear from this screen.
  const stored = row.sectionConfig ?? [];
  const seen = new Set<string>();
  const sections: Section[] = [];

  for (const entry of stored) {
    if (!titles.has(entry.key) || seen.has(entry.key)) continue;
    seen.add(entry.key);
    sections.push({
      key: entry.key,
      visible: entry.visible,
      title: titles.get(entry.key) ?? '',
    });
  }
  for (const act of acts) {
    if (seen.has(act.key)) continue;
    sections.push({ key: act.key, visible: act.visible, title: act.title });
  }

  return (
    <AdminShell
      title="Master settings"
      subtitle="The switches that change the whole site."
      nav={buildNav()}
    >
      <SettingsForm row={row} sections={sections} />
    </AdminShell>
  );
}
