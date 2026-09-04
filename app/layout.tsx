import type { Metadata } from 'next';
import { db } from '../lib/db/index.ts';
import { profile, settings } from '../lib/db/schema.ts';
import './globals.css';
import './world.css';
import './audio.css';

export async function generateMetadata(): Promise<Metadata> {
  const p = db.select().from(profile).get();
  const s = db.select().from(settings).get();

  const title = s?.seoTitle || (p ? `${p.name} — ${p.title}` : 'Portfolio');
  const description = s?.seoDescription || p?.bio || '';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: s?.seoImageMediaId ? [`/api/media/${s.seoImageMediaId}`] : undefined,
    },
    twitter: {
      card: s?.seoImageMediaId ? 'summary_large_image' : 'summary',
      title,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const s = db.select().from(settings).get();

  return (
    <html lang="en">
      <head>
        {s?.accentColor && (
          <style>{`:root{--accent:${s.accentColor};}`}</style>
        )}
        {/* Pasted by the site owner in admin. Only their own code runs here. */}
        {s?.analyticsSnippet && (
          <script dangerouslySetInnerHTML={{ __html: s.analyticsSnippet }} />
        )}
      </head>
      <body data-motion={s?.motionIntensity ?? 'full'}>{children}</body>
    </html>
  );
}
