import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const landing = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const blogSection = await readFile(new URL('../components/BlogSection.tsx', import.meta.url), 'utf8');
const blogData = await readFile(new URL('../lib/blog-data.ts', import.meta.url), 'utf8');
const blogCss = await readFile(new URL('../app/blog-knowledge.css', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');

test('blog knowledge base stays inside the landing flow and links to article routes', () => {
  assert.match(landing, /label: 'Блог', href: '#blog'/);
  assert.match(landing, /<BlogSection onLeadOpen=/);
  assert.match(blogSection, /id="blog"/);
  assert.match(blogSection, /href=\{`\/blog\/\$\{article\.slug\}`\}/);
  assert.match(landing, /className="contact-reference" id="contact"/);
});

test('knowledge base has seven routed articles and responsive 3-column library grid', () => {
  assert.equal((blogData.match(/slug:\s*'/g) || []).length, 7);
  assert.match(blogData, /featured:\s*true/);
  assert.match(blogData, /landingBlogArticles/);
  assert.match(blogCss, /\.blog-kb__grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3/);
  assert.match(blogCss, /@media \(max-width: 900px\)/);
  assert.match(blogCss, /@media \(max-width: 767px\)/);
  assert.match(blogCss, /prefers-reduced-motion/);
  assert.match(layout, /import '\.\/blog-knowledge\.css';/);
});

test('blog filter, search and location hub are implemented in-page', () => {
  assert.match(blogSection, /УСІ МАТЕРІАЛИ/);
  assert.match(blogSection, /type="search"/);
  assert.match(blogSection, /Пошук статей/);
  assert.match(blogSection, /Буріння у вашому районі/);
  assert.match(blogSection, /Сокільники/);
  assert.match(blogSection, /ПОПУЛЯРНЕ/);
});
