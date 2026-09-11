import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const packageJson = await readFile(new URL('../package.json', import.meta.url), 'utf8');

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

test('motion layer uses progressive enhancement and reduced-motion fallback', () => {
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /motion-ready/);
  assert.match(css, /\.motion-ready\s+\.reveal/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('scroll-linked motion is frame scheduled and capped to a CSS parallax variable', () => {
  assert.match(component, /requestAnimationFrame/);
  assert.match(component, /--hero-parallax/);
  assert.match(css, /var\(--hero-parallax\)/);
});

test('hero uses masked line choreography instead of only generic translate reveals', () => {
  assert.match(component, /hero-line/);
  assert.match(css, /\.hero-line/);
  assert.match(css, /overflow:\s*hidden/);
});

test('motion remains CSS-first without heavyweight animation dependencies', () => {
  assert.doesNotMatch(packageJson, /framer-motion|gsap/);
});
