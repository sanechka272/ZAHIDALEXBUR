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

test('service cards use a seamless glass fade that spans photo and copy', () => {
  assert.match(css, /--service-card-fade-overlap:\s*156px/);
  assert.match(css, /--service-card-glass-height:\s*260px/);
  assert.match(css, /margin-bottom:\s*calc\(var\(--service-card-fade-overlap\) \* -1\)/);
  assert.match(css, /service-reference-card__body[\s\S]*rgba\(23, 21, 19, 0\)[\s\S]*#171513/);
  assert.match(css, /service-reference-card__body::after[\s\S]*top:\s*calc\(var\(--service-card-fade-overlap\) \* -\.72\)/);
  assert.match(css, /backdrop-filter:\s*blur\(12px\) saturate\(\.96\)/);
  assert.match(css, /mask-image:\s*linear-gradient/);
  assert.match(css, /service-reference-card__body::before[\s\S]*display:\s*none\s*!important/);
  assert.match(css, /@media\s*\(max-width:\s*767px\)[\s\S]*backdrop-filter:\s*blur\(10px\)/);
});
