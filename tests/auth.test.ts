import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, DUMMY_HASH } from '../lib/auth.ts';

test('password round-trips and rejects a wrong password', async () => {
  const stored = await hashPassword('correct horse battery staple');
  assert.ok(await verifyPassword('correct horse battery staple', stored));
  assert.equal(await verifyPassword('wrong password', stored), false);
});

test('hashes are salted — the same password hashes differently each time', async () => {
  const a = await hashPassword('same');
  const b = await hashPassword('same');
  assert.notEqual(a, b);
  // Both must still verify.
  assert.ok(await verifyPassword('same', a));
  assert.ok(await verifyPassword('same', b));
});

test('a malformed stored hash is rejected, not thrown on', async () => {
  assert.equal(await verifyPassword('x', 'garbage'), false);
  assert.equal(await verifyPassword('x', ''), false);
  assert.equal(await verifyPassword('x', 'scrypt$zz$zz'), false);
  assert.equal(await verifyPassword('x', 'bcrypt$00$00'), false);
});

test('DUMMY_HASH is well-formed, so a missing user still costs a real scrypt', async () => {
  // A malformed dummy would short-circuit on the length check and return in
  // ~0ms, leaking account existence through login response timing.
  const [scheme, saltHex, keyHex] = DUMMY_HASH.split('$');
  assert.equal(scheme, 'scrypt');
  assert.equal(saltHex.length, 32, 'salt must be 16 bytes of hex');
  assert.equal(keyHex.length, 128, 'key must be 64 bytes of hex');

  // And it must never match anything.
  assert.equal(await verifyPassword('', DUMMY_HASH), false);
  assert.equal(await verifyPassword('password', DUMMY_HASH), false);

  // Verifying against it must cost real work, comparable to a real hash.
  const real = await hashPassword('a-real-password');
  const t0 = performance.now();
  await verifyPassword('guess', DUMMY_HASH);
  const dummyMs = performance.now() - t0;
  const t1 = performance.now();
  await verifyPassword('guess', real);
  const realMs = performance.now() - t1;

  assert.ok(
    dummyMs > realMs / 4,
    `dummy verify (${dummyMs.toFixed(1)}ms) must not short-circuit vs real (${realMs.toFixed(1)}ms)`,
  );
});

test('a tampered session token is rejected', async () => {
  process.env.SESSION_SECRET = 'test-secret-at-least-32-chars-long!!';
  const { createSession, readSession } = await import('../lib/session.ts');

  const token = await createSession(1);
  assert.equal((await readSession(token))?.uid, 1);

  const parts = token.split('.');
  parts[1] = Buffer.from(JSON.stringify({ uid: 99 })).toString('base64url');
  assert.equal(await readSession(parts.join('.')), null);

  assert.equal(await readSession(undefined), null);
  assert.equal(await readSession('not.a.token'), null);
  assert.equal(await readSession(''), null);
});

test('a session signed with a different secret is rejected', async () => {
  process.env.SESSION_SECRET = 'secret-number-one-padded-to-32-chars';
  const one = await import('../lib/session.ts');
  const token = await one.createSession(1);

  // Same module, different secret at verify time.
  process.env.SESSION_SECRET = 'secret-number-two-padded-to-32-chars';
  assert.equal(await one.readSession(token), null);
});

test('login throttle opens, closes, and can be cleared', async () => {
  const { checkRate, clearRate } = await import('../lib/rate-limit.ts');
  const ip = '203.0.113.7';
  for (let i = 0; i < 8; i++) {
    assert.ok(checkRate(ip), `attempt ${i + 1} should be allowed`);
  }
  assert.equal(checkRate(ip), false, '9th attempt must be blocked');

  clearRate(ip);
  assert.ok(checkRate(ip), 'a successful login clears the counter');
});
