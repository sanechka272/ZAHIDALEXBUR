import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const articlePage = await readFile(new URL('../app/blog/[slug]/page.tsx', import.meta.url), 'utf8');
const indexPage = await readFile(new URL('../app/blog/page.tsx', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../app/sitemap.ts', import.meta.url), 'utf8');
const robots = await readFile(new URL('../app/robots.ts', import.meta.url), 'utf8');
const blogData = await readFile(new URL('../lib/blog-data.ts', import.meta.url), 'utf8');
const blogSection = await readFile(new URL('../components/BlogSection.tsx', import.meta.url), 'utf8');

test('article routes are statically generated and unknown slugs are disabled', () => {
  assert.match(articlePage, /generateStaticParams/);
  assert.match(articlePage, /dynamicParams\s*=\s*false/);
  assert.match(articlePage, /getBlogArticle/);
  assert.match(articlePage, /notFound\(\)/);
});

test('article metadata contains canonical Open Graph and Twitter fields', () => {
  assert.match(articlePage, /generateMetadata/);
  assert.match(articlePage, /alternates:\s*\{ canonical \}/);
  assert.match(articlePage, /openGraph:/);
  assert.match(articlePage, /type:\s*'article'/);
  assert.match(articlePage, /twitter:/);
  assert.match(blogData, /metaTitle:/);
  assert.match(blogData, /metaDescription:/);
  assert.match(blogData, /imageAlt:/);
});

test('article pages use semantic heading hierarchy and structured data', () => {
  assert.equal((articlePage.match(/<h1>/g) || []).length, 1);
  assert.match(articlePage, /<h2>\{section\.heading\}<\/h2>/);
  assert.match(articlePage, /<h3><Link href=\{`\/blog\//);
  assert.match(articlePage, /BlogPosting/);
  assert.match(articlePage, /BreadcrumbList/);
  assert.match(articlePage, /mainEntityOfPage/);
  assert.match(articlePage, /Читайте також/);
});

test('homepage blog section does not introduce a second H1', () => {
  assert.doesNotMatch(blogSection, /<h1/);
  assert.match(blogSection, /<h2 id="blog-kb-title">/);
  assert.match(blogSection, /<h3>/);
});

test('blog index and discovery routes are indexable through sitemap and robots', () => {
  assert.equal((indexPage.match(/<h1/g) || []).length, 1);
  assert.match(indexPage, /alternates:\s*\{ canonical: '\/blog' \}/);
  assert.match(sitemap, /blogArticles\.map/);
  assert.match(sitemap, /\/blog\/\$\{article\.slug\}/);
  assert.match(robots, /sitemap\.xml/);
  assert.doesNotMatch(robots, /disallow:\s*\[[^\]]*\/blog/);
});
