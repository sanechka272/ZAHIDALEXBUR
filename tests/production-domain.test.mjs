import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const article = await readFile(new URL('../app/blog/[slug]/page.tsx', import.meta.url), 'utf8');
const sitemap = await readFile(new URL('../app/sitemap.ts', import.meta.url), 'utf8');
const robots = await readFile(new URL('../app/robots.ts', import.meta.url), 'utf8');

test('production SEO URLs match the connected .com domain', () => {
  for (const source of [layout, article, sitemap, robots]) {
    assert.match(source, /https:\/\/zahidalexbur\.com/);
    assert.doesNotMatch(source, /zahidalexbur\.com\.ua/);
  }
});
