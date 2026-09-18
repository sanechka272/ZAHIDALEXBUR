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

test('service cards use a subtle seamless glass fade without an opaque fog band', () => {
  assert.match(css, /--service-card-fade-overlap:\s*112px/);
  assert.match(css, /--service-card-glass-height:\s*150px/);
  assert.match(css, /margin-bottom:\s*calc\(var\(--service-card-fade-overlap\) \* -1\)/);
  assert.match(css, /service-reference-card__body[\s\S]*rgba\(23, 21, 19, 0\)[\s\S]*#171513/);
  assert.match(css, /service-reference-card__body::after[\s\S]*background:\s*transparent/);
  assert.match(css, /backdrop-filter:\s*blur\(4px\) saturate\(\.98\)/);
  assert.match(css, /mask-image:\s*linear-gradient/);
  assert.match(css, /service-reference-card__body::before[\s\S]*display:\s*none\s*!important/);
  assert.match(css, /@media\s*\(max-width:\s*767px\)[\s\S]*backdrop-filter:\s*blur\(3px\)/);
});
