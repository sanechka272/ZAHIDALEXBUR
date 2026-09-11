import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../app/mobile.css', import.meta.url), 'utf8');
const landing = readFileSync(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');

test('services header has no filter or carousel controls and the title is centered on every breakpoint', () => {
  assert.match(css, /\.services-reference__header\s*\{[^}]*grid-template-columns:\s*1fr(?:\s*!important)?[^}]*justify-items:\s*center[^}]*text-align:\s*center/i);
  assert.match(css, /\.services-reference__title\s*\{[^}]*text-align:\s*center/i);
  assert.doesNotMatch(landing, /service-filter-tabs|service-carousel-controls|Для дому|Для бізнесу|Для промисловості/);
});

test('mobile service cards are a one-column grid instead of a horizontal scroller', () => {
  assert.match(css, /@media\s*\(max-width:767px\)[\s\S]*\.services-reference__grid\s*\{[^}]*display:\s*grid(?:\s*!important)?[^}]*grid-template-columns:\s*1fr(?:\s*!important)?[^}]*overflow(?:-x)?:\s*visible(?:\s*!important)?/i);
  assert.match(css, /@media\s*\(max-width:767px\)[\s\S]*\.service-reference-card\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0(?:\s*!important)?/i);
});

test('mobile drilling process uses one viewport-triggered controlled stage with a fast cycle', () => {
  assert.match(landing, /const \[activeProcess, setActiveProcess\] = useState\(0\)/);
  assert.match(landing, /const \[processInView, setProcessInView\] = useState\(false\)/);
  assert.match(landing, /IntersectionObserver[\s\S]*setProcessInView/);
  assert.match(landing, /window\.setInterval\([\s\S]*?1800\)/);
  assert.match(landing, /MobileProcessFlip/);
  assert.match(css, /\.process-reference__steps\s*\{\s*display:\s*none\s*!important/);
  assert.match(css, /\.mobile-process-flip__stage\s*\{[\s\S]*?transition:/);
  assert.doesNotMatch(css, /@keyframes\s+mobileProcessFlip|animation:\s*mobileProcessFlip/i);
});

test('mobile controlled stage respects reduced motion', () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*\.mobile-process-flip__stage[\s\S]*transition:\s*none\s*!important/i);
});
