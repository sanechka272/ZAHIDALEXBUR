import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const config = await readFile(new URL('../next.config.mjs', import.meta.url), 'utf8');

test('landing uses Next Image for responsive photo delivery', () => {
  assert.match(component, /import Image from ['"]next\/image['"]/);
  assert.match(component, /<Image[\s\S]*?sizes=/);
  assert.doesNotMatch(component, /loading=\{index === 0 \? ['"]eager['"] : ['"]lazy['"]\}/);
});

test('hero image is optimized and receives the only high fetch priority', () => {
  assert.match(component, /reference-hero__media[\s\S]*?<Image[\s\S]*?fetchPriority=['"]high['"]/);
  assert.equal((component.match(/fetchPriority=['"]high['"]/g) ?? []).length, 1);
});

test('image optimizer keeps high visual fidelity while generating smaller responsive variants', () => {
  assert.match(config, /qualities:\s*\[[^\]]*90[^\]]*\]/);
  assert.match(config, /formats:\s*\[[^\]]*image\/avif[^\]]*image\/webp[^\]]*\]/);
});
