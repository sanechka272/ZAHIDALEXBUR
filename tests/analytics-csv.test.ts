import test from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../lib/analytics/csv';

test('CSV export is UTF-8 BOM prefixed and RFC-4180 safe for Ukrainian text and quotes', () => {
  const csv = toCsv([
    ['Name', 'Campaign', 'Note'],
    ['Олександр', 'Львів, пошук', 'said "hello"'],
  ]);
  assert.equal(csv.startsWith('\uFEFF'), true);
  assert.match(csv, /"Олександр","Львів, пошук","said ""hello"""/);
  assert.match(csv, /\r\n$/);
});
