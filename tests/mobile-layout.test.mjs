import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../app/mobile.css', import.meta.url), 'utf8');

test('services header has no filter or carousel controls and the title is centered', () => {
  assert.match(css, /\.services-reference__header\s*\{[^}]*grid-template-columns:\s*1fr(?:\s*!important)?[^}]*justify-items:\s*center[^}]*text-align:\s*center/i);
  assert.match(css, /\.services-reference__title\s*\{[^}]*text-align:\s*center/i);
  assert.match(css, /\.services-reference__tools\s*\{[^}]*display:\s*none\s*!important/i);
});

test('mobile service cards are a one-column grid instead of a horizontal scroller', () => {
  assert.match(css, /@media\s*\(max-width:767px\)[\s\S]*\.services-reference__grid\s*\{[^}]*display:\s*grid(?:\s*!important)?[^}]*grid-template-columns:\s*1fr(?:\s*!important)?[^}]*overflow(?:-x)?:\s*visible(?:\s*!important)?/i);
  assert.match(css, /@media\s*\(max-width:767px\)[\s\S]*\.service-reference-card\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0(?:\s*!important)?/i);
});

test('mobile drilling process uses a five-step viewport-triggered container text flip cycle', () => {
  assert.match(css, /@keyframes\s+mobileProcessFlip/);
  assert.match(css, /\.process-reference-step:nth-child\(2\)\s*\{[^}]*--flip-delay:\s*3s/i);
  assert.match(css, /\.process-reference-step:nth-child\(3\)\s*\{[^}]*--flip-delay:\s*6s/i);
  assert.match(css, /\.process-reference-step:nth-child\(4\)\s*\{[^}]*--flip-delay:\s*9s/i);
  assert.match(css, /\.process-reference-step:nth-child\(5\)\s*\{[^}]*--flip-delay:\s*12s/i);
  assert.match(css, /animation:\s*mobileProcessFlip\s+15s[^;]*var\(--flip-delay,\s*0s\)/i);
  assert.match(css, /animation-play-state:\s*paused/i);
  assert.match(css, /\.process-reference-step\.is-visible[\s\S]*animation-play-state:\s*running/i);
  assert.match(css, /\.process-reference__steps\s*\{[^}]*overflow:\s*hidden(?:\s*!important)?/i);
});

test('mobile flip respects reduced motion', () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.process-reference-step[\s\S]*animation:\s*none\s*!important/i);
});
