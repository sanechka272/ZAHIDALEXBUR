import test from 'node:test';
import assert from 'node:assert/strict';

test('analytics TypeScript test harness is active', () => {
  assert.equal(typeof crypto.randomUUID, 'function');
});
