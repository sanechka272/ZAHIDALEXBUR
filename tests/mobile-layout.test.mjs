import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../app/mobile.css', import.meta.url), 'utf8');

test('mobile service cards are a one-column grid instead of a horizontal scroller', () => {
  assert.match(css, /@media\s*\(max-width:767px\)[\s\S]*\.services-reference__grid\s*\{[^}]*display:grid[^}]*grid-template-columns:1fr[^}]*overflow(?:-x)?:visible/i);
  assert.match(css, /@media\s*\(max-width:767px\)[\s\S]*\.service-reference-card\s*\{[^}]*width:100%[^}]*min-width:0/i);
});

test('mobile drilling process uses a five-step container text flip style cycle', () => {
  assert.match(css, /@keyframes\s+mobileProcessFlip/);
  assert.match(css, /\.process-reference-step:nth-child\(2\)\s*\{[^}]*animation-delay:\s*3s/i);
  assert.match(css, /\.process-reference-step:nth-child\(3\)\s*\{[^}]*animation-delay:\s*6s/i);
  assert.match(css, /\.process-reference-step:nth-child\(4\)\s*\{[^}]*animation-delay:\s*9s/i);
  assert.match(css, /\.process-reference-step:nth-child\(5\)\s*\{[^}]*animation-delay:\s*12s/i);
  assert.match(css, /\.process-reference__steps\s*\{[^}]*overflow:\s*hidden/i);
});

test('mobile flip respects reduced motion', () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.process-reference-step[\s\S]*animation:\s*none\s*!important/i);
});
