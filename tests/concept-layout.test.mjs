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

test('header and footer use the supplied ZAHIDALEXBUR logo asset', () => {
  assert.match(component, /\/brand\/zahidalexbur-logo-lockup\.webp/);
  const header = component.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(header, /brand-logo/);
  assert.doesNotMatch(header, /<strong>ZAHIDALEXBUR<\/strong>/);
});

test('landing uses generated concept imagery for the main photographic scenes', () => {
  for (const asset of ['hero-drilling.webp', 'approach-geology.webp', 'water-hands.webp']) {
    assert.match(component, new RegExp(`/generated/${asset}`));
  }
});

test('landing keeps one primary three-card well-service section', () => {
  assert.match(component, /id="services"/);
  assert.match(component, /well-package-grid/);
  assert.match(component, /services\.map/);
  assert.doesNotMatch(component, /concept-service-grid/);
});

test('landing includes concept sections', () => {
  for (const className of ['approach-section', 'well-packages', 'proof-band', 'conversion-split']) {
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

test('landing includes three original-service package cards with generated local imagery', () => {
  assert.match(component, /well-packages/);
  assert.match(component, /well-package-card/);
  for (const asset of ['package-private.webp', 'package-filter.webp', 'package-industrial.webp']) {
    assert.match(component, new RegExp(`/generated/${asset}`));
  }
});

test('service package cards render verified inclusions and premium CSS-first motion', () => {
  assert.match(component, /service\.included\.map/);
  assert.match(css, /\.well-package-card::before/);
  assert.match(css, /\.motion-ready\s+\.well-package-card/);
  assert.match(css, /\.well-package-card:hover/);
});
