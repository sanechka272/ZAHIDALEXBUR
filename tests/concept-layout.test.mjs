import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const fixes = await readFile(new URL('../app/fixes.css', import.meta.url), 'utf8');
const finalCss = await readFile(new URL('../app/final.css', import.meta.url), 'utf8');
const packageJson = await readFile(new URL('../package.json', import.meta.url), 'utf8');
const siteData = await readFile(new URL('../lib/site-data.ts', import.meta.url), 'utf8');

const productionPhotos = [
  '../public/media/hero-waterwell.jpg',
  '../public/media/service-private-water.jpg',
  '../public/media/service-filter-drilling.jpg',
  '../public/media/service-industrial-rig.jpg',
  '../public/media/about-mountain-forest.jpg',
];

test('header follows approved reference with centered navigation, phone, callback pill and hamburger', () => {
  const header = component.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(header, /desktop-nav/);
  assert.match(header, /header-phone/);
  assert.match(header, /Замовити дзвінок/);
  assert.match(header, /menu-button/);
  assert.match(header, /assets\.logo/);
});

test('brand uses a repository-local SVG logo and never crops it with negative offsets', async () => {
  assert.match(siteData, /logo:\s*['"]\/brand\/zahidalexbur-logo\.svg['"]/);
  const svg = await readFile(new URL('../public/brand/zahidalexbur-logo.svg', import.meta.url), 'utf8');
  assert.match(svg, /<svg[\s>]/);
  assert.match(svg, /viewBox=/);
  assert.doesNotMatch(svg, /<image\b/i);

  const logoRule = finalCss.match(/\.reference-header \.brand-logo\s*\{[\s\S]*?\}/)?.[0] ?? '';
  assert.doesNotMatch(logoRule, /(?:left|top):\s*-/);
});

test('every production photo is a large repository-local JPEG instead of a tiny placeholder', async () => {
  assert.doesNotMatch(siteData, /https?:\/\/[^'\"]+\.(?:png|jpe?g|webp|gif)/i);
  assert.doesNotMatch(component, /https?:\/\/[^'\"]+\.(?:png|jpe?g|webp|gif)/i);

  for (const relativePath of productionPhotos) {
    const file = await readFile(new URL(relativePath, import.meta.url));
    assert.ok(file.byteLength > 100_000, `${relativePath} should be a real high-resolution photo, not a tiny placeholder`);
    assert.equal(file[0], 0xff, `${relativePath} should be a JPEG`);
    assert.equal(file[1], 0xd8, `${relativePath} should be a JPEG`);
    assert.equal(file[2], 0xff, `${relativePath} should be a JPEG`);
  }
});

test('hero, three services and about section use distinct local photo assets', () => {
  assert.match(siteData, /hero:\s*['"]\/media\/hero-waterwell\.jpg['"]/);
  assert.match(siteData, /about:\s*['"]\/media\/about-mountain-forest\.jpg['"]/);
  assert.match(siteData, /services:\s*\[[\s\S]*service-private-water\.jpg[\s\S]*service-filter-drilling\.jpg[\s\S]*service-industrial-rig\.jpg/);
  assert.doesNotMatch(siteData, /services:\s*\[[\s\S]*hero-waterwell\.jpg/);
  assert.match(component, /assets\.about/);
});

test('hero matches approved composition with video action, stats, process teaser and glass info card', () => {
  assert.match(component, /className="hero reference-hero"/);
  assert.match(component, /Дивитися відео/);
  assert.match(component, /hero-stat-row/);
  assert.match(component, /hero-process-teaser/);
  assert.match(component, /GlassInfoCard/);
  assert.match(component, /Вода ближче, ніж ви думаєте/);
});

test('services render exactly three large reference cards with tabs controls checklists and project thumbnails', () => {
  assert.match(component, /id="services"/);
  assert.match(component, /service-filter-tabs/);
  assert.match(component, /service-carousel-controls/);
  assert.match(component, /services\.map/);
  assert.match(component, /ServiceCard/);
  assert.match(component, /service\.included\.map/);
  assert.match(component, /service-project-thumbs/);
  assert.match(component, /Переглянути.*реалізовані проєкти/);
});

test('about section is the approved dark split with regional story stats and testimonial', () => {
  assert.match(component, /className="about-reference"/);
  assert.match(component, /Локальна компанія/);
  assert.match(component, /Люди/);
  assert.match(component, /Регіон/);
  assert.match(component, /Результат/);
  assert.match(component, /TestimonialQuote/);
  assert.match(component, /Олександр Герман/);
});

test('process section renders the approved five-step horizontal journey', () => {
  assert.match(component, /className="process-reference"/);
  assert.match(component, /processSteps\.map/);
  assert.match(component, /ProcessStep/);
  assert.match(component, /Від першої консультації/);
  assert.match(component, /Залишити заявку/);
});

test('reference visual layer includes robust image fitting, glass cards, serif headings and responsive collapse', () => {
  assert.match(finalCss, /\.reference-page img/);
  assert.match(finalCss, /object-fit:\s*cover/);
  assert.match(finalCss, /\.glass-info-card/);
  assert.match(finalCss, /\.services-reference__title/);
  assert.match(finalCss, /\.service-reference-card/);
  assert.match(finalCss, /\.about-reference/);
  assert.match(finalCss, /\.process-reference/);
  assert.match(finalCss, /@media\s*\(max-width:\s*767px\)/);
});

test('motion layer uses progressive enhancement, frame-scheduled parallax and reduced-motion fallback', () => {
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /requestAnimationFrame/);
  assert.match(component, /--hero-parallax/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(finalCss, /\.motion-ready/);
});

test('motion remains CSS-first without heavyweight animation dependencies', () => {
  assert.doesNotMatch(packageJson, /framer-motion|gsap/);
});

test('existing premium bugfix layer remains loaded for global accessibility and image handling', () => {
  assert.match(fixes, /brand-logo/);
  assert.match(css, /focus-visible/);
});
