import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('Cloudflare deployment keeps the standalone backend container while moving public assets to the edge', () => {
  const config = read('wrangler.jsonc');
  const worker = read('cloudflare/worker.ts');
  const pkg = JSON.parse(read('package.json'));

  assert.doesNotMatch(config, /"directory"\s*:\s*"\.\/out"/);
  assert.match(config, /"main"\s*:\s*"cloudflare\/worker\.ts"/);
  assert.match(config, /"class_name"\s*:\s*"ZahidaContainer"/);
  assert.match(config, /"image"\s*:\s*"\.\/Dockerfile"/);
  assert.match(config, /"max_instances"\s*:\s*1/);
  assert.match(config, /"new_sqlite_classes"/);
  assert.match(config, /"assets"\s*:\s*\{[\s\S]*"directory"\s*:\s*"\.\/public"[\s\S]*"binding"\s*:\s*"ASSETS"/);
  assert.match(config, /"version_metadata"\s*:\s*\{[\s\S]*"binding"\s*:\s*"CF_VERSION_METADATA"/);

  assert.equal(pkg.dependencies['@cloudflare/containers'], '0.3.7');
  assert.equal(pkg.devDependencies.wrangler, '4.131.2');
  assert.equal(pkg.scripts.deploy, 'wrangler deploy');

  assert.match(worker, /class ZahidaContainer extends Container/);
  assert.match(worker, /sleepAfter\s*=\s*['"]2h['"]/);
  assert.match(worker, /DATABASE_URL/);
  assert.match(worker, /ANALYTICS_SESSION_SECRET/);
  assert.match(worker, /getContainer\(/);
  assert.match(worker, /x-zab-edge-country/);
  assert.match(worker, /regionCode/);
  assert.match(worker, /city/);
});

test('public documents and static responses are cached at the Worker edge instead of repeatedly waking the container', () => {
  const worker = read('cloudflare/worker.ts');
  assert.match(worker, /caches\s+as\s+any/);
  assert.match(worker, /\.default/);
  assert.match(worker, /CF_VERSION_METADATA/);
  assert.match(worker, /x-zab-edge-cache/);
  assert.match(worker, /\/api\//);
  assert.match(worker, /\/analytics/);
  assert.match(worker, /waitUntil\(/);
});

test('Next image requests are transformed at Cloudflare edge before the container fallback', () => {
  const worker = read('cloudflare/worker.ts');

  assert.match(worker, /transformNextImageAtEdge/);
  assert.match(worker, /url\.pathname !== '\/_next\/image'/);
  assert.match(worker, /value\.startsWith\('\/media\/'\)/);
  assert.match(worker, /cf:\s*\{\s*image\s*\}/);
  assert.match(worker, /x-zab-image-edge/);
  assert.match(worker, /image-resizing/i);
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/);

  const transformPosition = worker.indexOf('const edgeImage = await transformNextImageAtEdge');
  const containerPosition = worker.indexOf('const container = getContainer');
  assert.ok(transformPosition >= 0 && containerPosition > transformPosition, 'edge image transform must run before container fallback');
});

test('missing analytics secrets do not crash the public Worker runtime', () => {
  const worker = read('cloudflare/worker.ts');
  assert.doesNotMatch(worker, /function required\(/);
  assert.doesNotMatch(worker, /throw new Error\(`\$\{name\} Worker secret is required`\)/);
  assert.match(worker, /if \(env\.DATABASE_URL\)/);
  assert.match(worker, /if \(env\.ANALYTICS_SESSION_SECRET\)/);
});

test('operations runbook calls out Cloudflare Containers paid-plan requirement', () => {
  const ops = read('docs/analytics-operations.md');
  assert.match(ops, /Cloudflare Containers/i);
  assert.match(ops, /Workers Paid/i);
  assert.match(ops, /wrangler secret put DATABASE_URL/);
  assert.match(ops, /wrangler secret put ANALYTICS_SESSION_SECRET/);
});
