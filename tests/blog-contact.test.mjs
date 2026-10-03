import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const landing = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const blogSection = await readFile(new URL('../components/BlogSection.tsx', import.meta.url), 'utf8');
const blogData = await readFile(new URL('../lib/blog-data.ts', import.meta.url), 'utf8');
const blogCore = await readFile(new URL('../lib/blog-core.ts', import.meta.url), 'utf8');
const blogWave1 = await readFile(new URL('../lib/blog-wave1.ts', import.meta.url), 'utf8');
const blogWave2Problems = await readFile(new URL('../lib/blog-wave2-problems.ts', import.meta.url), 'utf8');
const blogWave2Water = await readFile(new URL('../lib/blog-wave2-water.ts', import.meta.url), 'utf8');
const blogContent = [blogCore, blogWave1, blogWave2Problems, blogWave2Water].join('\n');
const blogCss = await readFile(new URL('../app/blog-knowledge.css', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');

test('blog knowledge base stays inside the landing flow and links to article routes', () => {
  assert.match(landing, /label: 'Блог', href: '#blog'/);
  assert.match(landing, /<BlogSection onLeadOpen=/);
  assert.match(blogSection, /id="blog"/);
  assert.match(blogSection, /href=\{`\/blog\/\$\{article\.slug\}`\}/);
  assert.match(landing, /className="contact-reference" id="contact"/);
});

test('knowledge base has an expanded routed article library and responsive 3-column grid', () => {
  const slugs = blogContent.match(/slug:\s*'/g) || [];
  assert.ok(slugs.length >= 50, `expected an expanded blog library, found ${slugs.length} articles`);
  assert.match(blogCore, /featured:\s*true/);
  assert.match(blogData, /landingBlogArticles/);
  assert.match(blogCss, /\.blog-kb__grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3/);
  assert.match(blogCss, /@media \(max-width: 900px\)/);
  assert.match(blogCss, /@media \(max-width: 767px\)/);
  assert.match(blogCss, /prefers-reduced-motion/);
  assert.match(layout, /import '\.\/blog-knowledge\.css';/);
});

test('blog keeps filter and search while extra popular, location and final CTA bands stay removed', () => {
  assert.match(blogSection, /УСІ МАТЕРІАЛИ/);
  assert.match(blogSection, /type="search"/);
  assert.match(blogSection, /Пошук статей/);
  assert.doesNotMatch(blogSection, /ПОПУЛЯРНЕ/);
  assert.doesNotMatch(blogSection, /Буріння у вашому районі/);
  assert.doesNotMatch(blogSection, /Розберемо вашу/);
});
