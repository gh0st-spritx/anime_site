import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: 'Admin — Soumik Halder',
  robots: { index: false, follow: false, nocache: true },
};

// The panel reads and writes the database on every request.
export const dynamic = 'force-dynamic';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="adm">{children}</div>;
}
