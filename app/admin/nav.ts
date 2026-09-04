import { sql } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { RESOURCES } from '../../lib/admin/resources.ts';
import type { NavItem } from './AdminShell.tsx';

function countOf(key: string): number {
  const r = RESOURCES[key];
  const row = db
    .select({ n: sql<number>`count(*)` })
    .from(r.table)
    .get();
  return row?.n ?? 0;
}

/** The sidebar, built from the resource registry so a new type appears for free. */
export function buildNav(): { heading: string; items: NavItem[] }[] {
  return [
    {
      heading: 'Content',
      items: [
        { href: '/admin/profile', label: 'Profile' },
        ...['projects', 'certifications', 'skills', 'education', 'learning'].map(
          (k) => ({
            href: `/admin/${k}`,
            label: RESOURCES[k].label,
            count: countOf(k),
          }),
        ),
      ],
    },
    {
      heading: 'The film',
      items: ['storyActs', 'games'].map((k) => ({
        href: `/admin/${k}`,
        label: RESOURCES[k].label,
        count: countOf(k),
      })),
    },
    {
      heading: 'Reach',
      items: [
        { href: '/admin/links', label: RESOURCES.links.label, count: countOf('links') },
      ],
    },
    {
      heading: 'System',
      items: [
        { href: '/admin/media', label: 'Media library' },
        { href: '/admin/settings', label: 'Master settings' },
        { href: '/admin/password', label: 'Change password' },
      ],
    },
  ];
}
