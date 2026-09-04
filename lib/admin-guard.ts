import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from './db/index.ts';
import { adminUser } from './db/schema.ts';
import { readSession, sessionFingerprint, SESSION_COOKIE } from './session.ts';

/**
 * The real admin gate. proxy.ts only checks that a cookie exists; this
 * verifies the signature AND that the session still corresponds to a live
 * account with an unchanged password.
 *
 * Every admin page and every mutating Server Action must call this first.
 *
 * Deliberately NOT a 'use server' module — these are internal guards, not
 * client-callable endpoints.
 */
export async function requireAdmin(): Promise<{ uid: number }> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const claims = await readSession(token);
  if (!claims) redirect('/admin/login');

  const user = db
    .select()
    .from(adminUser)
    .where(eq(adminUser.id, claims.uid))
    .get();

  // The account was deleted, or the database was restored from a point before
  // it existed. A validly-signed token must not outlive its account.
  if (!user) redirect('/admin/login');

  // The password changed since this token was issued, so revoke it.
  if (claims.fp !== sessionFingerprint(user.passwordHash)) {
    redirect('/admin/login');
  }

  return { uid: user.id };
}

export function adminExists(): boolean {
  return db.select().from(adminUser).limit(1).all().length > 0;
}
