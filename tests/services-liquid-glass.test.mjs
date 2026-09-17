import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const siteData = await readFile(new URL('../lib/site-data.ts', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/services-card-fade.css', import.meta.url), 'utf8');

test('service cards use requested 3→1, 1→2, 2→3 image order', () => {
  const serviceBlock = siteData.slice(siteData.indexOf('export const services = ['), siteData.indexOf('export const processSteps'));
  const imageRefs = [...serviceBlock.matchAll(/image:\s*assets\.services\[(\d)\]/g)].map((match) => Number(match[1]));
  assert.deepEqual(imageRefs, [2, 0, 1]);
});

test('service cards use a real photo-to-copy transparency fade instead of a hard cut', () => {
  assert.match(css, /--service-card-fade-overlap:\s*124px/);
  assert.match(css, /margin-bottom:\s*calc\(var\(--service-card-fade-overlap\) \* -1\)/);
  assert.match(css, /service-reference-card__body[\s\S]*rgba\(23, 21, 19, 0\)[\s\S]*#171513/);
  assert.match(css, /service-reference-card__body::after[\s\S]*backdrop-filter:\s*blur\(2px\)/);
  assert.match(css, /service-reference-card__body::before[\s\S]*display:\s*none\s*!important/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
