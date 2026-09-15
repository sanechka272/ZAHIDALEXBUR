import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

test('production image uses Next standalone server and healthcheck', () => {
  assert.equal(existsSync(new URL('Dockerfile', root)), true, 'Dockerfile must exist');
  const docker = read('Dockerfile');
  const nextConfig = read('next.config.mjs');
  assert.match(nextConfig, /output:\s*['"]standalone['"]/);
  assert.match(docker, /\.next\/standalone/);
  assert.match(docker, /\/api\/health/);
  assert.match(docker, /NODE_ENV=production/);
  assert.match(docker, /CMD\s*\[\s*["']node["']\s*,\s*["']server\.js["']\s*\]/);
});

test('production environment contract documents analytics secrets without committing values', () => {
  assert.equal(existsSync(new URL('.env.example', root)), true, '.env.example must exist');
  const env = read('.env.example');
  for (const name of ['DATABASE_URL', 'ANALYTICS_SESSION_SECRET', 'GEOIP_CITY_DB_PATH']) assert.match(env, new RegExp(`^${name}=`, 'm'));
  assert.doesNotMatch(env, /postgres:\/\/[^\n]*:[^@\n]+@/i);
  assert.doesNotMatch(env, /ANALYTICS_SESSION_SECRET=\S{16,}/);
});
