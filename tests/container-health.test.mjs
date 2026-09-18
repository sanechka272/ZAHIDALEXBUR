import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const health = await readFile(new URL('../app/api/health/route.ts', import.meta.url), 'utf8');
const worker = await readFile(new URL('../cloudflare/worker.ts', import.meta.url), 'utf8');

test('container healthcheck is independent from database availability', () => {
  assert.doesNotMatch(health, /getSqlClient/);
  assert.match(health, /status:\s*'ok'/);
  assert.match(health, /status:\s*200/);
  assert.match(health, /telegramConfigured/);
  assert.match(worker, /pingEndpoint = 'localhost\/api\/health'/);
});

test('fresh container generation is used after runtime secret changes', () => {
  assert.match(worker, /zahidalexbur-production-v5/);
  assert.match(worker, /x-zab-container-generation', 'v5'/);
});
