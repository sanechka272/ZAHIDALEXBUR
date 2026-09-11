import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const landing = readFileSync(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const mobileCss = readFileSync(new URL('../app/mobile.css', import.meta.url), 'utf8');
const contentCss = readFileSync(new URL('../app/content.css', import.meta.url), 'utf8');

const blogDataUrl = new URL('../lib/blog-data.ts', import.meta.url);
const blogIndexUrl = new URL('../app/blog/page.tsx', import.meta.url);
const blogArticleUrl = new URL('../app/blog/[slug]/page.tsx', import.meta.url);

test('services header has no need filters or carousel arrows in rendered JSX', () => {
  assert.doesNotMatch(landing, /serviceFilters|service-filter-tabs|service-carousel-controls/);
  assert.doesNotMatch(landing, /Попередня послуга|Наступна послуга|Для дому|Для бізнесу|Для промисловості/);
  assert.match(mobileCss, /\.services-reference__header\s*\{[\s\S]*?text-align:\s*center/i);
});

test('blog contains five internal articles and cards link to their real routes', () => {
  assert.equal(existsSync(blogDataUrl), true, 'lib/blog-data.ts must exist');
  assert.equal(existsSync(blogIndexUrl), true, 'blog index page must exist');
  assert.equal(existsSync(blogArticleUrl), true, 'dynamic blog article page must exist');

  const blogData = readFileSync(blogDataUrl, 'utf8');
  const blogPage = readFileSync(blogArticleUrl, 'utf8');
  const slugCount = (blogData.match(/slug:\s*'/g) || []).length;

  assert.equal(slugCount, 5);
  assert.match(landing, /href=\{`\/blog\/\$\{article\.slug\}`\}/);
  assert.doesNotMatch(landing, /href="https:\/\/zahidalexbur\.com\.ua\/blog"/);
  assert.match(blogPage, /generateStaticParams/);
});

test('mobile process uses one controlled active stage and a faster smooth transition', () => {
  assert.match(landing, /activeProcess/);
  assert.match(landing, /processInView/);
  assert.match(landing, /setInterval[\s\S]*?1[6789]00|setInterval[\s\S]*?2000/);
  assert.match(landing, /mobile-process-flip/);
  assert.doesNotMatch(mobileCss, /animation:\s*mobileProcessFlip\s+15s/i);
  assert.match(mobileCss, /\.mobile-process-flip__stage[\s\S]*transition:/i);
});

test('blog animation no longer offsets a single card with conflicting nth-child transforms', () => {
  assert.doesNotMatch(contentCss, /blog-reference-card:nth-child\(2\).*transform:/);
  assert.match(contentCss, /blog-reference-card[\s\S]*--delay/i);
});
