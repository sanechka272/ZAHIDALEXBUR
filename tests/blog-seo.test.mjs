import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const articlePage = await readFile(new URL('../app/blog/[slug]/page.tsx', import.meta.url), 'utf8');
const indexPage = await readFile(new URL('../app/blog/page.tsx', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../app/sitemap.ts', import.meta.url), 'utf8');
const robots = await readFile(new URL('../app/robots.ts', import.meta.url), 'utf8');
const blogData = await readFile(new URL('../lib/blog-data.ts', import.meta.url), 'utf8');
const blogSection = await readFile(new URL('../components/BlogSection.tsx', import.meta.url), 'utf8');
const articleCss = await readFile(new URL('../app/blog-seo.css', import.meta.url), 'utf8');
const blogIndexHeroCss = await readFile(new URL('../app/blog-index-hero.css', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const articleInteractions = await readFile(new URL('../components/ArticleInteractions.tsx', import.meta.url), 'utf8');

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
  assert.match(articlePage, /datePublished/);
  assert.match(blogData, /metaTitle:/);
  assert.match(blogData, /metaDescription:/);
  assert.match(blogData, /imageAlt:/);
});

test('article pages use semantic heading hierarchy and structured data', () => {
  assert.equal((articlePage.match(/<h1>/g) || []).length, 1);
  assert.match(articlePage, /<h2>\{section\.heading\}<\/h2>/);
  assert.match(articlePage, /<h3><Link href=\{`\/blog\//);
  assert.match(articlePage, /<time dateTime=/);
  assert.match(articlePage, /BlogPosting/);
  assert.match(articlePage, /BreadcrumbList/);
  assert.match(articlePage, /mainEntityOfPage/);
  assert.match(articlePage, /Читайте також/);
});

test('article pages keep the reference editorial reading structure', () => {
  assert.match(articlePage, /article-page__hero-grid/);
  assert.match(articlePage, /article-page__reading-grid/);
  assert.match(articlePage, /className="article-page__sidebar"/);
  assert.match(articlePage, /className="article-toc" open/);
  assert.match(articlePage, /article-consultation/);
  assert.match(articlePage, /article-info-card/);
  assert.match(articlePage, /article-page__article-nav/);
  assert.match(articlePage, /article-final-cta/);
  assert.match(articleInteractions, /navigator\.share/);
  assert.match(articleInteractions, /<LeadForm \/>/);
  assert.match(articleCss, /grid-template-columns:\s*260px\s+minmax\(0,\s*880px\)/);
  assert.match(articleCss, /position:\s*sticky/);
  assert.match(articleCss, /\.article-related__grid\s*\{[\s\S]*repeat\(3/);
});

test('blog index hero uses the dedicated repository image in a responsive split layout', () => {
  assert.match(indexPage, /blog-index-hero-drilling\.webp/);
  assert.match(indexPage, /blog-page__hero-grid/);
  assert.match(indexPage, /blog-page__hero-media/);
  assert.match(indexPage, /fetchPriority="high"/);
  assert.match(layout, /import '\.\/blog-index-hero\.css';/);
  assert.match(blogIndexHeroCss, /\.blog-page__hero-grid\s*\{[\s\S]*grid-template-columns:/);
  assert.match(blogIndexHeroCss, /@media \(max-width: 820px\)[\s\S]*\.blog-page__hero-grid\s*\{[^}]*grid-template-columns:\s*1fr/);
});

test('water-location article has the six text-first sections from the reference', () => {
  assert.match(blogData, /Геологічні карти і регіональні дані/);
  assert.match(blogData, /Дані сусідніх свердловин/);
  assert.match(blogData, /Що потрібно перед виїздом техніки/);
  assert.match(blogData, /Додаткові методи оцінки/);
  assert.match(blogData, /Обмеження та реалістичні очікування/);
  assert.match(blogData, /heading:\s*'Висновок'/);
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


test('water-disappears article uses its dedicated repository image everywhere', () => {
  assert.match(blogSection, /blog-chomu-voda-mozhe-znyknuty-featured\.webp/);
  assert.match(indexPage, /blog-chomu-voda-mozhe-znyknuty-featured\.webp/);
  assert.match(articlePage, /blog-chomu-voda-mozhe-znyknuty-featured\.webp/);
});


test('turnkey-well article uses its dedicated repository image everywhere', () => {
  assert.match(blogSection, /blog-yak-oblashtuvaty-sverdlovynu-pid-kliuch-featured\.webp/);
  assert.match(indexPage, /blog-yak-oblashtuvaty-sverdlovynu-pid-kliuch-featured\.webp/);
  assert.match(articlePage, /blog-yak-oblashtuvaty-sverdlovynu-pid-kliuch-featured\.webp/);
});
