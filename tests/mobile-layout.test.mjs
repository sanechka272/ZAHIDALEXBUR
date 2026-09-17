import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mobileCss = readFileSync(new URL('../app/mobile.css', import.meta.url), 'utf8');
const servicesCss = readFileSync(new URL('../app/services-editorial.css', import.meta.url), 'utf8');
const processCss = readFileSync(new URL('../app/process.css', import.meta.url), 'utf8');
const landing = readFileSync(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');

test('services header is left-aligned editorial copy without filter or carousel controls', () => {
  assert.match(servicesCss, /\.services-reference__header\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1\.45fr\)[\s\S]*?text-align:\s*left\s*!important/i);
  assert.match(servicesCss, /\.services-reference__title\s*\{[\s\S]*?text-align:\s*left\s*!important/i);
  assert.match(landing, /serviceTags\s*=\s*\['Для приватних будинків',\s*'Для будинків та котеджів',\s*'Для бізнесу та великих обʼєктів'\]/);
  assert.doesNotMatch(landing, /service-filter-tabs|service-carousel-controls|Попередня послуга|Наступна послуга/);
});

test('service comparison becomes two columns on tablet and one column on mobile', () => {
  assert.match(servicesCss, /@media\s*\(max-width:\s*1100px\)[\s\S]*?\.services-reference__grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/i);
  assert.match(servicesCss, /@media\s*\(max-width:\s*767px\)[\s\S]*?\.services-reference__grid\s*\{[^}]*grid-template-columns:\s*1fr/i);
  assert.match(servicesCss, /@media\s*\(max-width:\s*767px\)[\s\S]*?\.service-reference-card\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0\s*!important/i);
  assert.match(mobileCss, /@media\s*\(max-width:767px\)[\s\S]*\.services-reference__grid/);
});

test('mobile service imagery stays dominant and aspect-ratio driven', () => {
  assert.match(servicesCss, /\.service-reference-card__photo\s*\{[\s\S]*?aspect-ratio:/i);
  assert.match(servicesCss, /@media\s*\(max-width:\s*767px\)[\s\S]*?\.service-reference-card__photo\s*\{[^}]*height:\s*auto\s*!important[^}]*aspect-ratio:/i);
  assert.match(servicesCss, /\.service-reference-card__photo img\s*\{[\s\S]*?object-fit:\s*cover/i);
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
