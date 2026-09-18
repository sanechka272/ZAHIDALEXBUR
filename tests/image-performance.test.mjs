import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const nextConfig = await readFile(new URL('../next.config.mjs', import.meta.url), 'utf8');
const siteData = await readFile(new URL('../lib/site-data.ts', import.meta.url), 'utf8');
const blogData = await readFile(new URL('../lib/blog-data.ts', import.meta.url), 'utf8');
const landing = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const worker = await readFile(new URL('../cloudflare/worker.ts', import.meta.url), 'utf8');

test('large production photos live under public media for edge resizing', () => {
  assert.doesNotMatch(siteData, /import .*service-card-.*\.webp/);
  assert.doesNotMatch(blogData, /import .*blog-.*\.webp/);
  assert.match(siteData, /\/media\/service-card-bezfiltrova-cross-section\.webp/);
  assert.match(blogData, /\/media\/blog-chomu-voda-mozhe-znyknuty-featured\.webp/);
});

test('responsive images use bounded widths, AVIF and q82', () => {
  assert.match(nextConfig, /qualities:\s*\[82\]/);
  assert.match(nextConfig, /image\/avif/);
  assert.match(nextConfig, /deviceSizes:[^\n]*1920/);
  assert.match(landing, /quality=\{82\}/);
  assert.match(landing, /preload fetchPriority="high"/);
  assert.match(worker, /Math\.max\(78/);
});

test('legacy deleted image is not preloaded', () => {
  assert.doesNotMatch(layout, /6cf70733-a291-4fd2-ae11-f5d510e1d959/);
});
