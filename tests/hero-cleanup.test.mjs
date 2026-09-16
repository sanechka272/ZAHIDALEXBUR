import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('hero promo card and fake video CTA are removed from markup', () => {
  const landing = read('components/LandingPage.tsx');

  assert.doesNotMatch(landing, /GlassInfoCard/);
  assert.doesNotMatch(landing, /glass-info-card/);
  assert.doesNotMatch(landing, /video-action/);
  assert.doesNotMatch(landing, /Дивитися відео/);
  assert.doesNotMatch(landing, /Вода ближче/);
});
