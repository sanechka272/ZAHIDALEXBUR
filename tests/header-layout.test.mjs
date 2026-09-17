import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const headerCss = await readFile(new URL('../app/header.css', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');

test('desktop header nav is centered to the viewport and uses restrained premium typography', () => {
  const desktopBlock = headerCss.match(/@media\s*\(min-width:\s*901px\)\s*\{[\s\S]*\n\}/)?.[0] ?? '';

  assert.match(layout, /import '\.\/header\.css';/);
  assert.match(desktopBlock, /\.reference-header__inner\s*\{[\s\S]*?position:\s*relative/);
  assert.match(desktopBlock, /\.reference-header \.desktop-nav\s*\{[\s\S]*?position:\s*absolute/);
  assert.match(desktopBlock, /left:\s*50%/);
  assert.match(desktopBlock, /transform:\s*translateX\(-50%\) translateY\(-50%\)/);
  assert.match(desktopBlock, /\.reference-header \.desktop-nav a\s*\{[\s\S]*?font-family:\s*var\(--body\)/);
  assert.match(desktopBlock, /font-size:\s*11px/);
  assert.match(desktopBlock, /font-weight:\s*500/);
  assert.match(desktopBlock, /letter-spacing:\s*\.02em/);
  assert.match(desktopBlock, /\.reference-header \.header-phone strong\s*\{[\s\S]*?font-weight:\s*600/);
  assert.match(desktopBlock, /\.reference-header \.header-callback\s*\{[\s\S]*?font-weight:\s*500/);
});
