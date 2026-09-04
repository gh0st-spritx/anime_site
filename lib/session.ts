import { SignJWT, jwtVerify } from 'jose';
import { createHash } from 'node:crypto';

export const SESSION_COOKIE = 'sh_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionClaims = { uid: number; fp: string };

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      'SESSION_SECRET must be set to at least 32 characters. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return new TextEncoder().encode(value);
}

/**
 * A short digest of the stored password hash, embedded in the session and
 * re-checked on every request.
 *
 * Without it a signed token stays valid for its full lifetime no matter what
 * happens to the account: changing the password would not log out a stolen
 * session, and deleting the user (or restoring an older database) would leave
 * old tokens working. Because the password hash is salted, any password change
 * changes this value and every existing session dies with it.
 */
export function sessionFingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
}

export async function createSession(
  uid: number,
  fingerprint: string,
): Promise<string> {
  return new SignJWT({ uid, fp: fingerprint })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

/** Returns null for anything not a currently-valid, correctly-signed session. */
export async function readSession(
  token?: string,
): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.uid !== 'number' || typeof payload.fp !== 'string') {
      return null;
    }
    return { uid: payload.uid, fp: payload.fp };
  } catch {
    return null;
  }
}
