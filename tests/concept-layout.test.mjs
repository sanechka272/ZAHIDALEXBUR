import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('header keeps phone and navigation but no CTA button', () => {
  const header = component.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(header, /desktop-nav/);
  assert.match(header, /header-phone/);
  assert.doesNotMatch(header, /header-cta/);
});

test('landing includes concept sections', () => {
  for (const className of ['approach-section', 'concept-services', 'proof-band', 'conversion-split']) {
    assert.match(component, new RegExp(className));
  }
});

test('motion layer uses reveal states and respects reduced motion', () => {
  assert.match(component, /IntersectionObserver/);
  assert.match(css, /\.reveal/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
