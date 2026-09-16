import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePeriod } from '../lib/analytics/period';

test('last 7 days uses Europe/Kyiv calendar boundaries and equal comparison window', () => {
  const range = resolvePeriod({ preset: 'last7' }, new Date('2026-09-14T18:00:00.000Z'));
  assert.equal(range.timezone, 'Europe/Kyiv');
  assert.equal(range.from.toISOString(), '2026-09-07T21:00:00.000Z');
  assert.equal(range.to.toISOString(), '2026-09-14T21:00:00.000Z');
  assert.equal(range.comparisonTo.getTime(), range.from.getTime());
  assert.equal(range.comparisonTo.getTime() - range.comparisonFrom.getTime(), range.to.getTime() - range.from.getTime());
});

test('today resolves from Kyiv midnight even across UTC date boundary', () => {
  const range = resolvePeriod({ preset: 'today' }, new Date('2026-01-15T22:30:00.000Z'));
  assert.equal(range.from.toISOString(), '2026-01-15T22:00:00.000Z');
  assert.equal(range.to.toISOString(), '2026-01-16T22:00:00.000Z');
});

test('current and previous month use calendar month boundaries', () => {
  const now = new Date('2026-09-14T18:00:00.000Z');
  const current = resolvePeriod({ preset: 'currentMonth' }, now);
  assert.equal(current.from.toISOString(), '2026-08-31T21:00:00.000Z');
  assert.equal(current.to.toISOString(), '2026-09-30T21:00:00.000Z');

  const previous = resolvePeriod({ preset: 'previousMonth' }, now);
  assert.equal(previous.from.toISOString(), '2026-07-31T21:00:00.000Z');
  assert.equal(previous.to.toISOString(), '2026-08-31T21:00:00.000Z');
});

test('custom period validates and uses an equal immediately preceding comparison period', () => {
  const range = resolvePeriod({ preset: 'custom', from: '2026-09-01', to: '2026-09-10' }, new Date('2026-09-14T18:00:00.000Z'));
  assert.equal(range.from.toISOString(), '2026-08-31T21:00:00.000Z');
  assert.equal(range.to.toISOString(), '2026-09-10T21:00:00.000Z');
  assert.equal(range.comparisonTo.toISOString(), range.from.toISOString());
});
