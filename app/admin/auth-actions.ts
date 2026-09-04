'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '../../lib/db/index.ts';
import { adminUser } from '../../lib/db/schema.ts';
import { hashPassword, verifyPassword, DUMMY_HASH } from '../../lib/auth.ts';
import {
  createSession,
  sessionFingerprint,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from '../../lib/session.ts';
import { checkRate, clearRate } from '../../lib/rate-limit.ts';
import { requireAdmin, adminExists } from '../../lib/admin-guard.ts';

/**
 * `username` is echoed back so a failed submit does not wipe it — React 19
 * resets the form after an action, and retyping it on every password typo is
 * needless friction. `attempt` increments so the form can remount the field
 * with the new default (React ignores a changed defaultValue on its own).
 */
export type AuthState = {
  error?: string;
  ok?: boolean;
  username?: string;
  attempt?: number;
};

const MIN_PASSWORD = 12;

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
}

async function issueSession(uid: number, passwordHash: string): Promise<void> {
  const token = await createSession(uid, sessionFingerprint(passwordHash));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

/** First run only. Refuses once an account exists, so this cannot be replayed. */
export async function setupAdmin(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  const again = (error: string): AuthState => ({
    error,
    username,
    attempt: (_prev.attempt ?? 0) + 1,
  });

  if (adminExists()) return again('An admin account already exists.');
  if (username.length < 3) return again('Username must be at least 3 characters.');
  if (password.length < MIN_PASSWORD) {
    return again(`Password must be at least ${MIN_PASSWORD} characters.`);
  }
  if (password !== confirm) return again('The two passwords do not match.');

  const passwordHash = await hashPassword(password);
  db.insert(adminUser)
    .values({ id: 1, username, passwordHash, createdAt: Date.now() })
    .run();

  await issueSession(1, passwordHash);
  redirect('/admin');
}

export async function loginAdmin(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get('username') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const again = (error: string): AuthState => ({
    error,
    username,
    attempt: (_prev.attempt ?? 0) + 1,
  });

  const ip = await clientIp();
  if (!checkRate(ip)) {
    return again('Too many attempts. Try again in 15 minutes.');
  }

  const user = db
    .select()
    .from(adminUser)
    .where(eq(adminUser.username, username))
    .get();

  // Always run a real scrypt, even with no matching user, so response timing
  // does not reveal whether the account exists.
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return again('Incorrect username or password.');

  clearRate(ip);
  await issueSession(user.id, user.passwordHash);
  redirect('/admin');
}

export async function logoutAdmin(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/admin/login');
}

export async function changePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const session = await requireAdmin();

  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  const user = db.select().from(adminUser).where(eq(adminUser.id, session.uid)).get();
  if (!user) return { error: 'Account not found.' };

  if (!(await verifyPassword(current, user.passwordHash))) {
    return { error: 'Current password is incorrect.' };
  }
  if (next.length < MIN_PASSWORD) {
    return { error: `New password must be at least ${MIN_PASSWORD} characters.` };
  }
  if (next !== confirm) return { error: 'The two new passwords do not match.' };

  const passwordHash = await hashPassword(next);
  db.update(adminUser)
    .set({ passwordHash })
    .where(eq(adminUser.id, user.id))
    .run();

  // The new hash invalidates every session issued against the old one — which
  // is the point. Re-issue for this browser so the change does not sign the
  // person making it out.
  await issueSession(user.id, passwordHash);

  return { ok: true };
}
