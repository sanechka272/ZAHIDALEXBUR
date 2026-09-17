import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const siteData = await readFile(new URL('../lib/site-data.ts', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/services-editorial.css', import.meta.url), 'utf8');

test('service cards use requested 3→1, 1→2, 2→3 image order', () => {
  const serviceBlock = siteData.slice(siteData.indexOf('export const services = ['), siteData.indexOf('export const processSteps'));
  const imageRefs = [...serviceBlock.matchAll(/image:\s*assets\.services\[(\d)\]/g)].map((match) => Number(match[1]));
  assert.deepEqual(imageRefs, [2, 0, 1]);
});

test('service copy reveals with a liquid-glass fading treatment and respects reduced motion', () => {
  assert.match(css, /@keyframes\s+service-liquid-glass-sweep/);
  assert.match(css, /\.service-reference-card__body::before/);
  assert.match(css, /\.motion-ready\s+\.service-reference-card:not\(\.is-visible\)[\s\S]*filter:\s*blur\(/);
  assert.match(css, /\.motion-ready\s+\.service-reference-card\.is-visible[\s\S]*service-reference-card__body::before[\s\S]*animation:/);
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*service-reference-card__body::before[\s\S]*animation:\s*none\s*!important/);
});
