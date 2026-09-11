import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/content.css', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');

test('blog and contacts are real landing sections and navigation targets them', () => {
  assert.match(component, /label: 'Блог', href: '#blog'/);
  assert.match(component, /className="blog-reference" id="blog"/);
  assert.match(component, /blogArticles\.map/);
  assert.match(component, /className="contact-reference" id="contact"/);
  assert.match(component, /contact\.phoneDisplay/);
  assert.match(component, /contact\.email/);
  assert.match(component, /contact\.address/);
  assert.match(component, /<LeadForm \/>/);
});

test('blog uses repository-local image assets and production responsive styles', () => {
  assert.doesNotMatch(component, /https?:\/\/[^'\"]+\.(?:png|jpe?g|webp|gif)/i);
  assert.match(component, /image: assets\.services\[0\]/);
  assert.match(component, /image: assets\.hero/);
  assert.match(css, /\.blog-reference-card/);
  assert.match(css, /\.contact-reference/);
  assert.match(css, /@media\(max-width:767px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(layout, /import '\.\/content\.css';/);
});
