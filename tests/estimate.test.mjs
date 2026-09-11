import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateByLocation } from '../lib/estimate.js';

test('returns a known range for Sokolnyky', () => {
  const result = estimateByLocation('Сокільники');
  assert.equal(result.label, 'Сокільники');
  assert.equal(result.depth, '40–70 м');
  assert.equal(result.kind, 'known');
});

test('matches known locations case-insensitively', () => {
  const result = estimateByLocation('винники');
  assert.equal(result.label, 'Винники');
  assert.equal(result.kind, 'known');
});

test('returns a consultation fallback for an unknown settlement', () => {
  const result = estimateByLocation('Трускавець');
  assert.equal(result.label, 'Трускавець');
  assert.equal(result.depth, 'потрібна оцінка');
  assert.equal(result.kind, 'custom');
});

test('uses a neutral fallback for an empty value', () => {
  const result = estimateByLocation('   ');
  assert.equal(result.label, 'Ваш населений пункт');
  assert.equal(result.kind, 'empty');
});
