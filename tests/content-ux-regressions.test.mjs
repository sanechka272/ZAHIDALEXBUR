import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const landing = readFileSync(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const blogSection = readFileSync(new URL('../components/BlogSection.tsx', import.meta.url), 'utf8');
const servicesCss = readFileSync(new URL('../app/services-editorial.css', import.meta.url), 'utf8');
const contentCss = readFileSync(new URL('../app/content.css', import.meta.url), 'utf8');
const processCss = readFileSync(new URL('../app/process.css', import.meta.url), 'utf8');

const blogDataUrl = new URL('../lib/blog-data.ts', import.meta.url);
const blogIndexUrl = new URL('../app/blog/page.tsx', import.meta.url);
const blogArticleUrl = new URL('../app/blog/[slug]/page.tsx', import.meta.url);

test('services header is an editorial comparison without filters or carousel controls', () => {
  assert.doesNotMatch(landing, /serviceFilters|service-filter-tabs|service-carousel-controls/);
  assert.doesNotMatch(landing, /Попередня послуга|Наступна послуга/);
  assert.match(landing, /Оберіть свій тип свердловини/);
  assert.match(landing, /services-reference__intro/);
  assert.match(servicesCss, /\.services-reference__header\s*\{[\s\S]*?text-align:\s*left\s*!important/i);
});

test('blog contains seven internal SEO articles and cards link to their real routes', () => {
  assert.equal(existsSync(blogDataUrl), true, 'lib/blog-data.ts must exist');
  assert.equal(existsSync(blogIndexUrl), true, 'blog index page must exist');
  assert.equal(existsSync(blogArticleUrl), true, 'dynamic blog article page must exist');

  const blogData = readFileSync(blogDataUrl, 'utf8');
  const blogPage = readFileSync(blogArticleUrl, 'utf8');
  const slugCount = (blogData.match(/slug:\s*'/g) || []).length;

  assert.equal(slugCount, 7);
  assert.match(landing, /<BlogSection onLeadOpen=/);
  assert.match(blogSection, /href=\{`\/blog\/\$\{article\.slug\}`\}/);
  assert.doesNotMatch(blogSection, /href="https:\/\/zahidalexbur\.com\.ua\/blog"/);
  assert.match(blogPage, /generateStaticParams/);
  assert.match(blogPage, /dynamicParams\s*=\s*false/);
});

test('process is one responsive glass journey instead of a rotating mobile stage', () => {
  assert.match(landing, /process-story__glass/);
  assert.match(landing, /processSteps\.map/);
  assert.match(processCss, /\.process-story__step/);
  assert.match(processCss, /@media\s*\(max-width:\s*767px\)/);
  assert.doesNotMatch(landing, /activeProcess|processInView|processFlipping|MobileProcessFlip|mobile-process-flip/);
  assert.doesNotMatch(landing, /setInterval[\s\S]*process/i);
});

test('blog animation no longer offsets only the second card with a conflicting transform', () => {
  const secondCardRule = contentCss.match(/\.blog-reference-card:nth-child\(2\)\s*\{[^}]*\}/)?.[0] ?? '';
  assert.ok(secondCardRule, 'second blog card may define layout but must not have a unique motion transform');
  assert.doesNotMatch(secondCardRule, /transform\s*:/i);
  assert.match(contentCss, /\.motion-ready \.blog-reference-card[\s\S]*var\(--delay,0ms\)/i);
});
