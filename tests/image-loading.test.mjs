import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const blogIndex = await readFile(new URL('../app/blog/page.tsx', import.meta.url), 'utf8');
const blogArticle = await readFile(new URL('../app/blog/[slug]/page.tsx', import.meta.url), 'utf8');
const config = await readFile(new URL('../next.config.mjs', import.meta.url), 'utf8');

test('landing uses Next Image for responsive photo delivery', () => {
  assert.match(component, /import Image from ['"]next\/image['"]/);
  assert.match(component, /<Image[\s\S]*?sizes=/);
  assert.doesNotMatch(component, /loading=\{index === 0 \? ['"]eager['"] : ['"]lazy['"]\}/);
});

test('hero image is optimized and receives the only high fetch priority on the landing', () => {
  assert.match(component, /reference-hero__media[\s\S]*?<Image[\s\S]*?fetchPriority=['"]high['"]/);
  assert.equal((component.match(/fetchPriority=['"]high['"]/g) ?? []).length, 1);
});

test('blog listing and article cover use responsive Next Image instead of full-size raw photos', () => {
  assert.match(blogIndex, /import Image from ['"]next\/image['"]/);
  assert.match(blogIndex, /blog-index-card__media[\s\S]*?<Image[\s\S]*?sizes=/);
  assert.match(blogArticle, /import Image from ['"]next\/image['"]/);
  assert.match(blogArticle, /article-page__cover[\s\S]*?<Image[\s\S]*?sizes=/);
});

test('image optimizer uses the production quality and modern responsive formats', () => {
  assert.match(config, /qualities:\s*\[[^\]]*82[^\]]*\]/);
  assert.match(config, /formats:\s*\[[^\]]*['"]image\/avif['"][^\]]*['"]image\/webp['"][^\]]*\]/);
});
