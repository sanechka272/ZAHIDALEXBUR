import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../app/mobile.css', import.meta.url), 'utf8');
const processCss = readFileSync(new URL('../app/process.css', import.meta.url), 'utf8');
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

test('mobile drilling process is a stable stacked glass card instead of a timed flip', () => {
  assert.match(landing, /className="process-story reveal"/);
  assert.match(landing, /process-story__glass/);
  assert.match(processCss, /@media\s*\(max-width:\s*767px\)[\s\S]*\.process-story__layout\s*\{[^}]*grid-template-columns:\s*1fr/i);
  assert.match(processCss, /@media\s*\(max-width:\s*767px\)[\s\S]*\.process-story__step\s*\{[^}]*grid-template-columns:/i);
  assert.doesNotMatch(landing, /activeProcess|processInView|MobileProcessFlip|setInterval/);
});

test('mobile process story respects reduced motion', () => {
  assert.match(processCss, /prefers-reduced-motion:\s*reduce[\s\S]*\.process-story__step[\s\S]*transition:\s*none\s*!important/i);
});
