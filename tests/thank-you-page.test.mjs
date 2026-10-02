import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../app/thank-you-page/page.tsx', import.meta.url), 'utf8');

test('thank-you page is a dedicated non-indexable conversion route', () => {
  assert.match(page, /Дякуємо/);
  assert.match(page, /index:\s*false/);
  assert.match(page, /follow:\s*false/);
  assert.match(page, /Повернутися на головну/);
});
