import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pixel = await readFile(new URL('../components/analytics/MetaPixel.tsx', import.meta.url), 'utf8');
const leadForm = await readFile(new URL('../components/LeadForm.tsx', import.meta.url), 'utf8');
const layout = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');

test('Meta Pixel is mounted globally with the configured pixel id', () => {
  assert.match(pixel, /1629168988924211/);
  assert.match(pixel, /fbevents\.js/);
  assert.match(pixel, /fbq\?\.\('init', META_PIXEL_ID\)/);
  assert.match(layout, /<MetaPixel \/>/);
});

test('every successful shared lead form emits the event Meta Pixel listens to', () => {
  assert.match(leadForm, /zab:lead_submit/);
  assert.match(pixel, /addEventListener\('zab:lead_submit'/);
  assert.match(pixel, /fbq\?\.\('track', 'Lead'/);
});
