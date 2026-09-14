import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const nextConfig = readFileSync(new URL('../next.config.mjs', import.meta.url), 'utf8');
const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const tailwindUrl = new URL('../tailwind.analytics.config.ts', import.meta.url);
const analyticsCssUrl = new URL('../app/analytics.css', import.meta.url);

test('analytics runtime is server-capable and isolated from public CSS', () => {
  assert.doesNotMatch(nextConfig, /output:\s*['"]export['"]/);
  assert.equal(existsSync(tailwindUrl), true, 'analytics Tailwind config must exist');
  assert.equal(existsSync(analyticsCssUrl), true, 'analytics CSS entry must exist');

  const tailwindConfig = readFileSync(tailwindUrl, 'utf8');
  assert.match(tailwindConfig, /prefix:\s*['"]tw-['"]/);
  assert.match(tailwindConfig, /preflight:\s*false/);
  assert.match(ci, /feature\/first-party-analytics-dashboard/);
});
