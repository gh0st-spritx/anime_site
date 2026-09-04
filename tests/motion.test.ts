import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveIntensity } from '../lib/motion.ts';

test('a visitor asking for reduced motion always wins over the site setting', () => {
  // The admin cannot escalate past what someone's system asked for.
  assert.equal(resolveIntensity('full', true), 'reduced');
  assert.equal(resolveIntensity('reduced', true), 'reduced');
  assert.equal(resolveIntensity('off', true), 'off');
});

test('without that preference, the site setting applies as-is', () => {
  assert.equal(resolveIntensity('full', false), 'full');
  assert.equal(resolveIntensity('reduced', false), 'reduced');
  assert.equal(resolveIntensity('off', false), 'off');
});

test('the site setting can only ever reduce motion, never increase it', () => {
  const site = ['full', 'reduced', 'off'] as const;
  const rank = { full: 2, reduced: 1, off: 0 };

  for (const s of site) {
    for (const prefersReduced of [true, false]) {
      const result = resolveIntensity(s, prefersReduced);
      assert.ok(
        rank[result] <= rank[s],
        `${s} + prefersReduced=${prefersReduced} produced ${result}, which is more motion than the site asked for`,
      );
      if (prefersReduced) {
        assert.ok(
          rank[result] <= rank.reduced,
          `${s} + prefersReduced produced ${result}, ignoring the visitor`,
        );
      }
    }
  }
});
