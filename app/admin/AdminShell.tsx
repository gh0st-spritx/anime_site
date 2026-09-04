import Link from 'next/link';
import { logoutAdmin } from './auth-actions.ts';

export type NavItem = { href: string; label: string; count?: number };

export default function AdminShell({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: { heading: string; items: NavItem[] }[];
  children: React.ReactNode;
}) {
  return (
    <div className="adm-shell">
      <nav className="adm-side" aria-label="Admin sections">
        <div className="adm-brand">
          Soumik Halder
          <small>Site admin</small>
        </div>

        <Link className="adm-nav" href="/admin">
          Dashboard
        </Link>

        {nav.map((group) => (
          <div key={group.heading}>
            <div className="adm-navlabel">{group.heading}</div>
            {group.items.map((item) => (
              <Link className="adm-nav" key={item.href} href={item.href}>
                {item.label}
                {item.count !== undefined && (
                  <span className="count">{item.count}</span>
                )}
              </Link>
            ))}
          </div>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <Link className="adm-nav" href="/" target="_blank">
            View site ↗
          </Link>
          <form action={logoutAdmin}>
            <button className="adm-nav" style={{ width: '100%', textAlign: 'left', background: 'none', border: 0, cursor: 'pointer', font: 'inherit' }}>
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <main className="adm-main">
        <h1 className="adm-h1">{title}</h1>
        {subtitle && <p className="adm-sub">{subtitle}</p>}
        {children}
      </main>
    </div>
  );
}
