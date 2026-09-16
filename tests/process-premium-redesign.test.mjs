import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const landing = readFileSync(new URL('../components/LandingPage.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const processCssUrl = new URL('../app/process.css', import.meta.url);

test('how-we-work is a single dark cinematic story section with glass process card', () => {
  assert.match(landing, /className="process-story(?:\s+reveal)?"\s+id="process"/);
  assert.match(landing, /process-story__media/);
  assert.match(landing, /process-story__glass/);
  assert.match(landing, /Від першої[\s\S]*консультації[\s\S]*до чистої води/);
  assert.match(landing, /Прозорий процес\. Надійний результат\./);
  assert.match(landing, /250\+[\s\S]*задоволених клієнтів/);
  assert.match(landing, /5\+[\s\S]*років досвіду/);
  assert.match(landing, /100%[\s\S]*гарантія якості/);
  assert.match(landing, /processSteps\.map/);
  assert.match(landing, /process-story__step/);
});

test('legacy horizontal and mobile flipping process implementations are removed', () => {
  assert.doesNotMatch(landing, /MobileProcessFlip/);
  assert.doesNotMatch(landing, /activeProcess|processInView|processFlipping/);
  assert.doesNotMatch(landing, /process-reference__steps|process-reference-step/);
});

test('process visual layer is isolated, responsive and uses optimized repository-local media', () => {
  assert.equal(existsSync(processCssUrl), true, 'app/process.css must exist');
  const css = readFileSync(processCssUrl, 'utf8');
  assert.match(layout, /import '\.\/process\.css';/);
  assert.match(css, /\.process-story\s*\{[^}]*border-radius:\s*24px/i);
  assert.match(landing, /process-story__media[\s\S]*?<Image[\s\S]*?src=\{assets\.hero\}/i);
  assert.doesNotMatch(css, /hero-waterwell\.jpg/i);
  assert.match(css, /backdrop-filter:\s*blur\(/i);
  assert.match(css, /\.process-story__glass/i);
  assert.match(css, /@media\s*\(max-width:\s*767px\)[\s\S]*\.process-story__layout[\s\S]*grid-template-columns:\s*1fr/i);
  assert.match(css, /\.motion-ready \.process-story__step[\s\S]*var\(--delay/i);
  assert.match(css, /prefers-reduced-motion:\s*reduce/i);
});
