import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE = 'sh_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error(
      'SESSION_SECRET must be set to at least 32 characters. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return new TextEncoder().encode(value);
}

export async function createSession(uid: number): Promise<string> {
  return new SignJWT({ uid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

/** Returns null for anything not a currently-valid, correctly-signed session. */
export async function readSession(
  token?: string,
): Promise<{ uid: number } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.uid === 'number' ? { uid: payload.uid } : null;
  } catch {
    return null;
  }
}
