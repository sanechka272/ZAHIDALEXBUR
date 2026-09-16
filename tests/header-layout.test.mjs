import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const headerCss = await readFile(new URL('../app/header.css', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');

test('desktop header nav is centered to the viewport and uses restrained premium typography', () => {
  const innerRule = headerCss.match(/\.reference-header__inner\s*\{[\s\S]*?\}/)?.[0] ?? '';
  const navRule = headerCss.match(/\.reference-header \.desktop-nav\s*\{[\s\S]*?\}/)?.[0] ?? '';
  const linkRule = headerCss.match(/\.reference-header \.desktop-nav a\s*\{[\s\S]*?\}/)?.[0] ?? '';
  const phoneRule = headerCss.match(/\.reference-header \.header-phone strong\s*\{[\s\S]*?\}/)?.[0] ?? '';
  const callbackRule = headerCss.match(/\.reference-header \.header-callback\s*\{[\s\S]*?\}/)?.[0] ?? '';

  assert.match(layout, /import '\.\/header\.css';/);
  assert.match(headerCss, /@media\s*\(min-width:\s*901px\)/);
  assert.match(innerRule, /position:\s*relative/);
  assert.match(navRule, /position:\s*absolute/);
  assert.match(navRule, /left:\s*50%/);
  assert.match(navRule, /transform:\s*translateX\(-50%\)/);
  assert.match(linkRule, /font-family:\s*var\(--body\)/);
  assert.match(linkRule, /font-size:\s*11px/);
  assert.match(linkRule, /font-weight:\s*500/);
  assert.match(linkRule, /letter-spacing:\s*\.02em/);
  assert.match(phoneRule, /font-weight:\s*600/);
  assert.match(callbackRule, /font-weight:\s*500/);
});
