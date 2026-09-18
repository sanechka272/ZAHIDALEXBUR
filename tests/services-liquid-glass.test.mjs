import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const siteData = await readFile(new URL('../lib/site-data.ts', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/services-card-fade.css', import.meta.url), 'utf8');

test('service cards use semantic image order for the three well types', () => {
  const serviceBlock = siteData.slice(siteData.indexOf('export const services = ['), siteData.indexOf('export const processSteps'));
  const imageRefs = [...serviceBlock.matchAll(/image:\s*assets\.services\[(\d)\]/g)].map((match) => Number(match[1]));
  assert.deepEqual(imageRefs, [0, 1, 2]);
});

test('service cards use a static full-card cinematic overlay with no separate black body', () => {
  assert.match(css, /service-reference-card__photo\s*\{[\s\S]*position:\s*absolute\s*!important[\s\S]*inset:\s*0\s*!important/);
  assert.match(css, /service-reference-card::after\s*\{[\s\S]*position:\s*absolute[\s\S]*inset:\s*0[\s\S]*pointer-events:\s*none/);
  assert.match(css, /rgba\(15, 13, 11, \.05\) 38%/);
  assert.match(css, /rgba\(15, 13, 11, \.18\) 50%/);
  assert.match(css, /rgba\(15, 13, 11, \.52\) 63%/);
  assert.match(css, /rgba\(15, 13, 11, \.82\) 74%/);
  assert.match(css, /rgba\(15, 13, 11, \.96\) 88%/);
  assert.match(css, /#0f0d0b 100%/);
  assert.match(css, /service-reference-card__body\s*\{[\s\S]*background:\s*transparent\s*!important/);
  assert.match(css, /service-reference-card__body::before,[\s\S]*service-reference-card__body::after[\s\S]*content:\s*none\s*!important/);
  assert.doesNotMatch(css, /backdrop-filter:\s*blur\([1-9]/);
});

test('service hover keeps the overlay fixed and only scales the underlying image', () => {
  assert.match(css, /service-reference-card:hover\s*\{[\s\S]*transform:\s*none\s*!important/);
  assert.match(css, /service-reference-card:hover \.service-reference-card__photo img\s*\{[\s\S]*transform:\s*scale\(1\.03\)/);
  assert.doesNotMatch(css, /service-reference-card:hover::after/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
