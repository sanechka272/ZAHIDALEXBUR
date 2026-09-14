import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { recordAnalyticsEvent } from '../lib/analytics/repository';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for analytics repository tests');
const sql = postgres(databaseUrl, { max: 1 });

async function resetAnalytics() {
  await sql`truncate table page_views, analytics_events, leads, sessions, visitors cascade`;
}

test.beforeEach(resetAnalytics);

test('analytics database exposes required tables', async () => {
  const rows = await sql<{ table_name: string }[]>`
    select table_name from information_schema.tables where table_schema = 'public'
  `;
  const names = new Set(rows.map((row) => row.table_name));
  for (const name of ['visitors','sessions','page_views','analytics_events','leads','admin_users','admin_sessions','analytics_settings']) {
    assert.equal(names.has(name), true, `missing table ${name}`);
  }
});

test('first page view creates visitor session and page view with campaign attribution', async () => {
  const eventId = randomUUID();
  const result = await recordAnalyticsEvent({
    eventId,
    eventName: 'page_view',
    path: '/',
    title: 'Home',
    referrer: null,
    url: 'https://zahidalexbur.com.ua/?utm_source=google&utm_medium=cpc&utm_campaign=lviv-search',
  }, { now: new Date('2026-09-14T10:00:00Z'), userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1', ip: null });

  assert.match(result.visitorId, /^[0-9a-f-]{36}$/);
  assert.match(result.sessionId, /^[0-9a-f-]{36}$/);
  assert.equal(result.duplicate, false);
  const [counts] = await sql<{ visitors: number; sessions: number; page_views: number }[]>`
    select
      (select count(*)::int from visitors) visitors,
      (select count(*)::int from sessions) sessions,
      (select count(*)::int from page_views) page_views
  `;
  assert.deepEqual(counts, { visitors: 1, sessions: 1, page_views: 1 });
  const [session] = await sql<{ source: string; medium: string; campaign: string; device_type: string }[]>`
    select source, medium, campaign, device_type from sessions limit 1
  `;
  assert.deepEqual(session, { source: 'google', medium: 'cpc', campaign: 'lviv-search', device_type: 'Mobile' });
});

test('event id is idempotent and an active visitor reuses the same session', async () => {
  const firstId = randomUUID();
  const first = await recordAnalyticsEvent({ eventId: firstId, eventName: 'page_view', path: '/', url: 'https://zahidalexbur.com.ua/' },
    { now: new Date('2026-09-14T10:00:00Z'), userAgent: 'Mozilla/5.0', ip: null });
  const duplicate = await recordAnalyticsEvent({ eventId: firstId, eventName: 'page_view', path: '/', url: 'https://zahidalexbur.com.ua/' },
    { visitorId: first.visitorId, sessionId: first.sessionId, now: new Date('2026-09-14T10:01:00Z'), userAgent: 'Mozilla/5.0', ip: null });
  assert.equal(duplicate.duplicate, true);

  const second = await recordAnalyticsEvent({ eventId: randomUUID(), eventName: 'page_view', path: '/services', url: 'https://zahidalexbur.com.ua/services' },
    { visitorId: first.visitorId, sessionId: first.sessionId, now: new Date('2026-09-14T10:10:00Z'), userAgent: 'Mozilla/5.0', ip: null });
  assert.equal(second.sessionId, first.sessionId);
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int count from page_views`;
  assert.equal(count, 2);
});

test('session expires after 30 minutes and direct return preserves last attributable touch', async () => {
  const first = await recordAnalyticsEvent({
    eventId: randomUUID(), eventName: 'page_view', path: '/',
    url: 'https://zahidalexbur.com.ua/?utm_source=meta&utm_medium=paid_social&utm_campaign=retargeting',
  }, { now: new Date('2026-09-14T10:00:00Z'), userAgent: 'Mozilla/5.0', ip: null });

  const returned = await recordAnalyticsEvent({ eventId: randomUUID(), eventName: 'page_view', path: '/prices', url: 'https://zahidalexbur.com.ua/prices' },
    { visitorId: first.visitorId, sessionId: first.sessionId, now: new Date('2026-09-14T10:31:00Z'), userAgent: 'Mozilla/5.0', ip: null });
  assert.notEqual(returned.sessionId, first.sessionId);
  const [visitor] = await sql<{ first_source: string; last_source: string; last_campaign: string }[]>`
    select first_source, last_source, last_campaign from visitors where id = ${first.visitorId}
  `;
  assert.deepEqual(visitor, { first_source: 'meta', last_source: 'meta', last_campaign: 'retargeting' });
});

test.after(async () => { await sql.end({ timeout: 2 }); });
