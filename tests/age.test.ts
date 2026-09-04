import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ageFrom } from '../lib/age.ts';

test('age is correct across the birthday boundary', () => {
  assert.equal(ageFrom('2006-06-10', new Date('2026-06-09T12:00:00Z')), 19);
  assert.equal(ageFrom('2006-06-10', new Date('2026-06-10T00:00:00Z')), 20);
  assert.equal(ageFrom('2006-06-10', new Date('2026-09-04T00:00:00Z')), 20);
  assert.equal(ageFrom('2006-06-10', new Date('2027-01-01T00:00:00Z')), 20);
  assert.equal(ageFrom('2006-06-10', new Date('2027-06-10T00:00:00Z')), 21);
});

test('age handles a leap-day birthdate without going negative', () => {
  assert.equal(ageFrom('2004-02-29', new Date('2025-02-28T00:00:00Z')), 20);
  assert.equal(ageFrom('2004-02-29', new Date('2025-03-01T00:00:00Z')), 21);
});
