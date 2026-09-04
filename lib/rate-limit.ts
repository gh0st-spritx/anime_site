// ponytail: in-process counter, resets on restart. Correct for a
// single-instance personal site. If this ever runs multi-instance, move the
// counter to a DB table — the interface here does not change.

const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

/** True when the attempt is allowed. Counts the attempt as a side effect. */
export function checkRate(ip: string): boolean {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  record.count += 1;
  return record.count <= MAX_ATTEMPTS;
}

/** Called after a successful login so a legitimate user is not punished. */
export function clearRate(ip: string): void {
  attempts.delete(ip);
}
