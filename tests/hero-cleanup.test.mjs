import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('hero promo card and fake video CTA are removed from the rendered layout', () => {
  const layout = read('app/layout.tsx');
  const css = read('app/hero-cleanup.css');

  assert.match(layout, /import '\.\/hero-cleanup\.css';/);
  assert.match(css, /\.glass-info-card[\s\S]*\.video-action[\s\S]*display:\s*none\s*!important/);
});
