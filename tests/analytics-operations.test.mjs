import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const retentionUrl = new URL('../scripts/analytics-retention.ts', import.meta.url);
const opsUrl = new URL('../docs/analytics-operations.md', import.meta.url);

test('analytics operations include bounded 13-month raw-data retention without deleting leads', () => {
  assert.equal(existsSync(retentionUrl), true, 'retention script must exist');
  assert.equal(packageJson.scripts['analytics:retention'], 'tsx scripts/analytics-retention.ts');
  const retention = readFileSync(retentionUrl, 'utf8');
  assert.match(retention, /13\s*months|13-month|months:\s*13/i);
  assert.match(retention, /page_views/);
  assert.match(retention, /analytics_events/);
  assert.doesNotMatch(retention, /delete\s+from\s+leads/i);
  assert.match(retention, /limit|batch/i);
});

test('analytics operations document same-site Node and PostgreSQL production requirements', () => {
  assert.equal(existsSync(opsUrl), true, 'analytics operations document must exist');
  const ops = readFileSync(opsUrl, 'utf8');
  for (const value of ['DATABASE_URL', 'ANALYTICS_SESSION_SECRET', 'GEOIP_CITY_DB_PATH', 'npm run db:migrate', 'analytics:create-admin', 'npm run build', 'npm start']) {
    assert.match(ops, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(ops, /same deployment|same site|same host/i);
  assert.match(ops, /feature\/first-party-analytics-dashboard/);
});
