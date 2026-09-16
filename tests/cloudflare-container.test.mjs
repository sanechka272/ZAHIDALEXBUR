import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('Cloudflare deployment runs the standalone app in a Container instead of static out assets', () => {
  const config = read('wrangler.jsonc');
  const worker = read('cloudflare/worker.ts');
  const pkg = JSON.parse(read('package.json'));

  assert.doesNotMatch(config, /"directory"\s*:\s*"\.\/out"/);
  assert.match(config, /"main"\s*:\s*"cloudflare\/worker\.ts"/);
  assert.match(config, /"class_name"\s*:\s*"ZahidaContainer"/);
  assert.match(config, /"image"\s*:\s*"\.\/Dockerfile"/);
  assert.match(config, /"max_instances"\s*:\s*1/);
  assert.match(config, /"new_sqlite_classes"/);

  assert.equal(pkg.dependencies['@cloudflare/containers'], '0.3.7');
  assert.equal(pkg.devDependencies.wrangler, '4.131.2');
  assert.equal(pkg.scripts.deploy, 'wrangler deploy');

  assert.match(worker, /class ZahidaContainer extends Container/);
  assert.match(worker, /DATABASE_URL/);
  assert.match(worker, /ANALYTICS_SESSION_SECRET/);
  assert.match(worker, /getContainer\(/);
  assert.match(worker, /x-zab-edge-country/);
  assert.match(worker, /regionCode/);
  assert.match(worker, /city/);
});

test('operations runbook calls out Cloudflare Containers paid-plan requirement', () => {
  const ops = read('docs/analytics-operations.md');
  assert.match(ops, /Cloudflare Containers/i);
  assert.match(ops, /Workers Paid/i);
  assert.match(ops, /wrangler secret put DATABASE_URL/);
  assert.match(ops, /wrangler secret put ANALYTICS_SESSION_SECRET/);
});
