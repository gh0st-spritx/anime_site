import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;
const SALTLEN = 16;

/**
 * Verified against when no user matches, so a login attempt costs the same
 * whether or not the account exists. It MUST be well-formed — a malformed
 * value short-circuits the length check below and returns without running
 * scrypt, which would leak account existence through response timing.
 *
 * This is the hash of a random string nobody holds. It is not a secret.
 */
export const DUMMY_HASH =
  'scrypt$6223184b35a1a25d35dfcbf28add086d$32fb770c65e2d23bfeebcdd7c226c197ea25e6a269e3471acaf9f7355cdd97e05f1608bea71b51cf5b185528eec2e2d2562dcafef42e6d376179e4425eca1f8e';

/** `scrypt$<salt hex>$<key hex>`. The scheme prefix leaves room to migrate later. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALTLEN);
  const key = await scryptAsync(password, salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

/**
 * Never throws. A malformed or unknown-scheme hash is simply a failed
 * verification — callers pass a dummy hash for missing users so that login
 * timing does not reveal whether an account exists.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, keyHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(keyHex, 'hex');
  // Buffer.from ignores invalid hex rather than throwing, so check the lengths.
  if (salt.length !== SALTLEN || expected.length !== KEYLEN) return false;

  const key = await scryptAsync(password, salt, KEYLEN);
  return timingSafeEqual(key, expected);
}
