import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const headerCss = await readFile(new URL('../app/header.css', import.meta.url), 'utf8');
const landing = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');

test('full nav stays available until the mobile breakpoint', () => {
  assert.match(landing, /className="desktop-nav"/);
  assert.match(headerCss, /@media \(min-width: 768px\) and \(max-width: 900px\)[\s\S]*\.reference-header \.desktop-nav\s*\{[\s\S]*display:\s*flex/);
});

test('burger is hidden by default and only enabled on small screens', () => {
  assert.match(headerCss, /\.reference-header \.menu-button\s*\{\s*display:\s*none;/);
  assert.match(headerCss, /@media \(max-width: 767px\)[\s\S]*\.reference-header \.desktop-nav\s*\{\s*display:\s*none;/);
  assert.match(headerCss, /@media \(max-width: 767px\)[\s\S]*\.reference-header \.menu-button\s*\{\s*display:\s*grid;/);
});
