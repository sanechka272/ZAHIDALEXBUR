import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const fixes = await readFile(new URL('../app/fixes.css', import.meta.url), 'utf8');
const finalCss = await readFile(new URL('../app/final.css', import.meta.url), 'utf8');
const mediaCss = await readFile(new URL('../app/media.css', import.meta.url), 'utf8');
const servicesCss = await readFile(new URL('../app/services-editorial.css', import.meta.url), 'utf8');
const processCss = await readFile(new URL('../app/process.css', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const packageJson = await readFile(new URL('../package.json', import.meta.url), 'utf8');
const siteData = await readFile(new URL('../lib/site-data.ts', import.meta.url), 'utf8');

const productionPhotos = [
  '../public/media/hero-drilling-main.png',
  '../425d83c7-3324-483f-bcbf-66bdf21c82cb.webp',
  '../48531249-ec4d-4cb5-bd78-1726bea2bc62.webp',
  '../99b7ae26-44f5-4025-a31b-b47a7ad17b79.webp',
  '../public/media/about-mountain-forest.jpg',
];

function isSupportedImage(buffer) {
  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8
    && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
    && buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a;
  const isWebp = buffer.length >= 12
    && buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return isJpeg || isPng || isWebp;
}

test('header follows approved reference with centered navigation, phone, callback pill and hamburger', () => {
  const header = component.match(/<header[\s\S]*?<\/header>/)?.[0] ?? '';
  assert.match(header, /desktop-nav/);
  assert.match(header, /header-phone/);
  assert.match(header, /Замовити дзвінок/);
  assert.match(header, /menu-button/);
  assert.match(header, /assets\.logo/);
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

test('every production photo is a substantial repository-local supported image', async () => {
  assert.doesNotMatch(siteData, /https?:\/\/[^'\"]+\.(?:png|jpe?g|webp|gif)/i);
  assert.doesNotMatch(component, /https?:\/\/[^'\"]+\.(?:png|jpe?g|webp|gif)/i);
  assert.doesNotMatch(siteData, /\/generated\//);
  for (const relativePath of productionPhotos) {
    const file = await readFile(new URL(relativePath, import.meta.url));
    assert.ok(file.byteLength > 100_000, `${relativePath} should be a real production photo, not a tiny placeholder`);
    assert.ok(isSupportedImage(file), `${relativePath} should be a valid JPEG, PNG or WebP asset`);
  }
});

test('hero, three services and about section use distinct approved local photo assets', () => {
  assert.match(siteData, /hero:\s*['"]\/media\/hero-drilling-main\.png['"]/);
  assert.match(siteData, /about:\s*['"]\/media\/about-mountain-forest\.jpg['"]/);
  assert.match(siteData, /425d83c7-3324-483f-bcbf-66bdf21c82cb\.webp/);
  assert.match(siteData, /48531249-ec4d-4cb5-bd78-1726bea2bc62\.webp/);
  assert.match(siteData, /99b7ae26-44f5-4025-a31b-b47a7ad17b79\.webp/);
  assert.match(siteData, /services:\s*\[[\s\S]*bezfiltrovaServiceImage\.src[\s\S]*filtrovaServiceImage\.src[\s\S]*promyslovaServiceImage\.src/);
  assert.doesNotMatch(siteData, /64ac66b2-80b3-4edb-8c64-a2423104debc|hero-waterwell|service-private-water|service-filter-drilling|service-industrial-rig/);
  assert.match(mediaCss, /url\(['"]?\/media\/about-mountain-forest\.jpg['"]?\)/);
});

test('hero keeps the approved simplified composition without removed promo or video CTAs', () => {
  assert.match(component, /className="hero reference-hero"/);
  assert.match(component, /hero-stat-row/);
  assert.match(component, /hero-process-teaser/);
  assert.doesNotMatch(component, /Дивитися відео/);
  assert.doesNotMatch(component, /GlassInfoCard/);
  assert.doesNotMatch(component, /Вода ближче, ніж ви думаєте/);
});

test('services render as an editorial visual comparison with four verified benefits and no thumbnail gallery', () => {
  assert.match(component, /id="services"/);
  assert.match(component, /Оберіть свій тип свердловини/);
  assert.match(component, /services-reference__intro/);
  assert.match(component, /service-reference-card__category/);
  assert.match(component, /service-reference-card__benefits/);
  assert.match(component, /service\.included\.slice\(0, 4\)\.map/);
  assert.match(component, /ServiceBenefitIcon/);
  assert.match(component, /service-reference-card__details/);
  assert.match(component, /Детальніше/);
  assert.match(component, /serviceImageAlts/);
  assert.doesNotMatch(component, /service-project-thumbs/);
  assert.doesNotMatch(component, /Переглянути.*реалізовані проєкти/);
  assert.doesNotMatch(component, /service-filter-tabs|service-carousel-controls/);
});

test('service comparison keeps image-first hierarchy, aligned grid, responsive columns and reduced-motion fallback', () => {
  assert.match(layout, /import '\.\/services-editorial\.css';/);
  assert.match(servicesCss, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(servicesCss, /aspect-ratio:/);
  assert.match(servicesCss, /object-fit:\s*cover/);
  assert.match(servicesCss, /object-position:/);
  assert.match(servicesCss, /scale\(1\.0[234]\)/);
  assert.match(servicesCss, /service-reference-card__benefits/);
  assert.match(servicesCss, /service-reference-card__details/);
  assert.match(servicesCss, /:focus-visible/);
  assert.match(servicesCss, /@media\s*\(max-width:\s*1100px\)[\s\S]*grid-template-columns:\s*repeat\(2,/);
  assert.match(servicesCss, /@media\s*\(max-width:\s*767px\)[\s\S]*grid-template-columns:\s*1fr/);
  assert.match(servicesCss, /prefers-reduced-motion:\s*reduce/);
});

test('about section keeps the approved dark split after decorative words were removed', () => {
  assert.match(component, /className="about-reference"/);
  assert.match(component, /Локальна компанія/);
  assert.doesNotMatch(component, /Люди|Регіон|Результат/);
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
