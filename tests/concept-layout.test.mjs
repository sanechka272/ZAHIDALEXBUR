import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const fixes = await readFile(new URL('../app/fixes.css', import.meta.url), 'utf8');
const packageJson = await readFile(new URL('../package.json', import.meta.url), 'utf8');
const siteData = await readFile(new URL('../lib/site-data.ts', import.meta.url), 'utf8');

const productionMedia = [
  '../public/brand/zahidalexbur-logo.webp',
  '../public/generated/hero-drilling.webp',
  '../public/generated/approach-geology.webp',
  '../public/generated/package-private.webp',
  '../public/generated/package-industrial.webp',
  '../public/generated/water-hands.webp',
];

test('header keeps phone and navigation but no CTA button', () => {
  const header = component.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(header, /desktop-nav/);
  assert.match(header, /header-phone/);
  assert.doesNotMatch(header, /header-cta/);
});

test('header and footer use the supplied ZAHIDALEXBUR logo asset', () => {
  assert.match(siteData, /logo:\s*['"]\/brand\/zahidalexbur-logo\.webp['"]/);
  const header = component.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(header, /brand-logo/);
  assert.match(header, /src=\{assets\.logo\}/);
  assert.doesNotMatch(header, /<strong>ZAHIDALEXBUR<\/strong>/);
});

test('all production photographic presets are repository-local and valid WebP files', async () => {
  assert.doesNotMatch(siteData, /https?:\/\/[^'\"]+\.(?:png|jpe?g|webp|gif)/i);
  assert.doesNotMatch(component, /https?:\/\/[^'\"]+\.(?:png|jpe?g|webp|gif)/i);
  assert.doesNotMatch(siteData, /package-filter\.webp/);

  for (const relativePath of productionMedia) {
    const file = await readFile(new URL(relativePath, import.meta.url));
    assert.ok(file.byteLength > 5000, `${relativePath} should not be an empty placeholder`);
    assert.equal(file.subarray(0, 4).toString('ascii'), 'RIFF', `${relativePath} should be a valid WebP RIFF file`);
    assert.equal(file.subarray(8, 12).toString('ascii'), 'WEBP', `${relativePath} should be a valid WebP file`);
  }
});

test('landing uses local concept imagery for the main photographic scenes', () => {
  for (const asset of ['hero-drilling.webp', 'approach-geology.webp', 'water-hands.webp']) {
    assert.match(siteData, new RegExp(`/generated/${asset}`));
  }
  assert.match(component, /assets\.hero/);
  assert.match(component, /assets\.geology/);
  assert.match(component, /assets\.water/);
});

test('landing keeps one primary three-card well-service section', () => {
  assert.match(component, /id="services"/);
  assert.match(component, /well-package-grid/);
  assert.match(component, /services\.map/);
  assert.doesNotMatch(component, /concept-service-grid/);
});

test('site has a real process section instead of pointing Process navigation to the facts band', () => {
  assert.match(component, /className="process-section"/);
  assert.match(component, /processSteps\.map/);
  assert.match(component, /id="process"/);
  assert.doesNotMatch(component, /<section className="proof-band" id="process">/);
});

test('finished landing includes approach, services, process, facts, conversion and FAQ', () => {
  for (const className of ['approach-section', 'well-packages', 'process-section', 'proof-band', 'conversion-split', 'faq-section']) {
    assert.match(component, new RegExp(className));
  }
  assert.match(component, /faqs\.map/);
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

test('landing includes three service cards and each receives a local image', () => {
  assert.match(component, /well-package-card/);
  assert.match(component, /service\.image/);
  assert.match(siteData, /services:\s*\[[\s\S]*package-private\.webp[\s\S]*hero-drilling\.webp[\s\S]*package-industrial\.webp/);
});

test('service package cards render verified inclusions and premium CSS-first motion', () => {
  assert.match(component, /service\.included\.map/);
  assert.match(css, /\.well-package-card::before/);
  assert.match(css, /\.motion-ready\s+\.well-package-card/);
  assert.match(fixes, /\.well-package-card:hover/);
});
