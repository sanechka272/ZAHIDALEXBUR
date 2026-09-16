import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const fixes = await readFile(new URL('../app/fixes.css', import.meta.url), 'utf8');
const finalCss = await readFile(new URL('../app/final.css', import.meta.url), 'utf8');
const mediaCss = await readFile(new URL('../app/media.css', import.meta.url), 'utf8');
const processCss = await readFile(new URL('../app/process.css', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const packageJson = await readFile(new URL('../package.json', import.meta.url), 'utf8');
const siteData = await readFile(new URL('../lib/site-data.ts', import.meta.url), 'utf8');

const productionPhotos = [
  '../public/media/hero-waterwell.jpg',
  '../public/media/service-private-water.jpg',
  '../public/media/service-filter-drilling.jpg',
  '../public/media/service-industrial-rig.jpg',
  '../public/media/about-mountain-forest.jpg',
];

function jpegDimensions(buffer) {
  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue; }
    const length = buffer.readUInt16BE(offset + 2);
    if (sofMarkers.has(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    if (length < 2) break;
    offset += 2 + length;
  }
  throw new Error('JPEG dimensions not found');
}

test('header follows approved reference with centered navigation, phone, callback pill and hamburger', () => {
  const header = component.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(header, /desktop-nav/);
  assert.match(header, /header-phone/);
  assert.match(header, /Замовити дзвінок/);
  assert.match(header, /menu-button/);
  assert.match(header, /assets\.logo/);
});

test('desktop header nav is centered to the viewport and uses restrained premium typography', () => {
  const innerRule = finalCss.match(/\.reference-header__inner\s*\{[\s\S]*?\}/)?.[0] ?? '';
  const navRule = finalCss.match(/\.reference-header \.desktop-nav\s*\{[\s\S]*?\}/)?.[0] ?? '';
  const linkRule = finalCss.match(/\.reference-header \.desktop-nav a\s*\{[\s\S]*?\}/)?.[0] ?? '';
  const phoneRule = finalCss.match(/\.reference-header \.header-phone strong\s*\{[\s\S]*?\}/)?.[0] ?? '';
  const callbackRule = finalCss.match(/\.reference-header \.header-callback\s*\{[\s\S]*?\}/)?.[0] ?? '';

  assert.match(innerRule, /position:\s*relative/);
  assert.match(navRule, /position:\s*absolute/);
  assert.match(navRule, /left:\s*50%/);
  assert.match(navRule, /transform:\s*translateX\(-50%\)/);
  assert.match(linkRule, /font-family:\s*var\(--body\)/);
  assert.match(linkRule, /font-size:\s*11(?:\.5)?px/);
  assert.match(linkRule, /font-weight:\s*500/);
  assert.match(linkRule, /letter-spacing:\s*\.0[12]em/);
  assert.match(phoneRule, /font-weight:\s*600/);
  assert.match(callbackRule, /font-weight:\s*(?:500|600)/);
});

test('brand uses a repository-local SVG logo and effective CSS never crops it with negative offsets', async () => {
  assert.match(siteData, /logo:\s*['"]\/brand\/zahidalexbur-logo\.svg['"]/);
  const svg = await readFile(new URL('../public/brand/zahidalexbur-logo.svg', import.meta.url), 'utf8');
  assert.match(svg, /<svg[\s>]/);
  assert.match(svg, /viewBox=/);
  assert.doesNotMatch(svg, /<image\b/i);
  assert.match(layout, /import '\.\/media\.css';/);
  const logoRule = mediaCss.match(/\.reference-header \.brand-logo,[\s\S]*?\}/)?.[0] ?? '';
  assert.doesNotMatch(logoRule, /(?:left|top):\s*-/);
  assert.match(logoRule, /position:\s*static/);
});

test('every production photo is a large high-resolution repository-local JPEG', async () => {
  assert.doesNotMatch(siteData, /https?:\/\/[^'\"]+\.(?:png|jpe?g|webp|gif)/i);
  assert.doesNotMatch(component, /https?:\/\/[^'\"]+\.(?:png|jpe?g|webp|gif)/i);
  assert.doesNotMatch(siteData, /\/generated\//);
  for (const relativePath of productionPhotos) {
    const file = await readFile(new URL(relativePath, import.meta.url));
    assert.ok(file.byteLength > 100_000, `${relativePath} should be a real high-resolution photo, not a tiny placeholder`);
    assert.equal(file[0], 0xff);
    assert.equal(file[1], 0xd8);
    assert.equal(file[2], 0xff);
    const { width, height } = jpegDimensions(file);
    assert.ok(width >= 1600, `${relativePath} width should be at least 1600px, got ${width}px`);
    assert.ok(height >= 1200, `${relativePath} height should be at least 1200px, got ${height}px`);
  }
});

test('hero, three services and about section use distinct local photo assets', () => {
  assert.match(siteData, /hero:\s*['"]\/media\/64ac66b2-80b3-4edb-8c64-a2423104debc\.png['"]/);
  assert.match(siteData, /about:\s*['"]\/media\/about-mountain-forest\.jpg['"]/);
  assert.match(siteData, /services:\s*\[[\s\S]*service-private-water\.jpg[\s\S]*service-filter-drilling\.jpg[\s\S]*service-industrial-rig\.jpg/);
  assert.doesNotMatch(siteData, /services:\s*\[[\s\S]*hero-waterwell\.jpg/);
  assert.match(mediaCss, /url\(['"]?\/media\/about-mountain-forest\.jpg['"]?\)/);
});

test('hero matches approved composition with video action, stats, process teaser and glass info card', () => {
  assert.match(component, /className="hero reference-hero"/);
  assert.match(component, /Дивитися відео/);
  assert.match(component, /hero-stat-row/);
  assert.match(component, /hero-process-teaser/);
  assert.match(component, /GlassInfoCard/);
  assert.match(component, /Вода ближче, ніж ви думаєте/);
});

test('services render exactly three large reference cards without need filters or carousel controls', () => {
  assert.match(component, /id="services"/);
  assert.doesNotMatch(component, /service-filter-tabs/);
  assert.doesNotMatch(component, /service-carousel-controls/);
  assert.doesNotMatch(component, /Для дому|Для бізнесу|Для промисловості/);
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

test('process section is the approved dark cinematic glass journey on all breakpoints', () => {
  assert.match(component, /className="process-story reveal"/);
  assert.match(component, /processSteps\.map/);
  assert.match(component, /ProcessStoryStep/);
  assert.match(component, /process-story__glass/);
  assert.match(component, /Від першої[\s\S]*консультації[\s\S]*до чистої води/);
  assert.match(component, /Залишити заявку/);
  assert.doesNotMatch(component, /MobileProcessFlip|process-reference-step/);
});

test('reference visual layer includes robust image fitting, glass cards, serif headings and responsive collapse', () => {
  assert.match(mediaCss, /\.reference-page img/);
  assert.match(mediaCss, /object-fit:\s*cover/);
  assert.match(mediaCss, /\.service-reference-card__photo img/);
  assert.match(finalCss, /\.glass-info-card/);
  assert.match(finalCss, /\.services-reference__title/);
  assert.match(finalCss, /\.service-reference-card/);
  assert.match(finalCss, /\.about-reference/);
  assert.match(processCss, /\.process-story__glass/);
  assert.match(processCss, /@media\s*\(max-width:\s*767px\)/);
});

test('motion layer uses progressive enhancement, frame-scheduled parallax and reduced-motion fallback', () => {
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /requestAnimationFrame/);
  assert.match(component, /--hero-parallax/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(finalCss, /\.motion-ready/);
  assert.match(processCss, /prefers-reduced-motion:\s*reduce/);
});

test('motion remains CSS-first without heavyweight animation dependencies', () => {
  assert.doesNotMatch(packageJson, /framer-motion|gsap/);
});

test('existing premium bugfix layer remains loaded for global accessibility and image handling', () => {
  assert.match(fixes, /brand-logo/);
  assert.match(css, /focus-visible/);
});
