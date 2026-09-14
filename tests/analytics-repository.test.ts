import test from 'node:test';
import assert from 'node:assert/strict';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for analytics repository tests');

const sql = postgres(databaseUrl, { max: 1 });

test('analytics database exposes required tables', async () => {
  const rows = await sql<{ table_name: string }[]>`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
  `;
  const names = new Set(rows.map((row) => row.table_name));
  for (const name of [
    'visitors',
    'sessions',
    'page_views',
    'analytics_events',
    'leads',
    'admin_users',
    'admin_sessions',
    'analytics_settings',
  ]) {
    assert.equal(names.has(name), true, `missing table ${name}`);
  }
});

test.after(async () => {
  await sql.end({ timeout: 2 });
});
