import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { createLead, recordAnalyticsEvent } from '../lib/analytics/repository';
import {
  getDevices,
  getGeography,
  getPopularPages,
  getRecentLeads,
  getSummary,
  getTimeseries,
  getTrafficSources,
} from '../lib/analytics/dashboard-repository';
import type { ResolvedPeriod } from '../lib/analytics/period';

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

test('lead snapshots current, first-touch and last-attributable-touch in one transaction', async () => {
  const first = await recordAnalyticsEvent({
    eventId: randomUUID(), eventName: 'page_view', path: '/',
    url: 'https://zahidalexbur.com.ua/?utm_source=google&utm_medium=cpc&utm_campaign=search-first',
  }, { now: new Date('2026-09-14T10:00:00Z'), userAgent: 'Mozilla/5.0', ip: null });

  const last = await recordAnalyticsEvent({
    eventId: randomUUID(), eventName: 'page_view', path: '/services',
    url: 'https://zahidalexbur.com.ua/services?utm_source=meta&utm_medium=paid_social&utm_campaign=retarget-last',
  }, { visitorId: first.visitorId, sessionId: first.sessionId, now: new Date('2026-09-14T10:31:00Z'), userAgent: 'Mozilla/5.0', ip: null });

  const result = await createLead({
    name: 'Олександр', phone: '+380 99 111 22 33', location: 'Львів', service: 'Фільтрова свердловина',
    originatingPage: '/services', honeypot: '', startedAtMs: Date.parse('2026-09-14T10:30:50Z'),
  }, { visitorId: first.visitorId, sessionId: last.sessionId, now: new Date('2026-09-14T10:31:10Z'), userAgent: 'Mozilla/5.0', ip: null });

  assert.match(result.id, /^[0-9a-f-]{36}$/);
  const [lead] = await sql<{
    status: string; phone: string; visitor_id: string; session_id: string; originating_page: string;
    source: string; medium: string; campaign: string; first_source: string; first_campaign: string;
    last_source: string; last_campaign: string;
  }[]>`
    select status, phone, visitor_id, session_id, originating_page, source, medium, campaign,
      first_source, first_campaign, last_source, last_campaign
    from leads where id = ${result.id}
  `;
  assert.deepEqual(lead, {
    status: 'new', phone: '+380991112233', visitor_id: first.visitorId, session_id: last.sessionId,
    originating_page: '/services', source: 'meta', medium: 'paid_social', campaign: 'retarget-last',
    first_source: 'google', first_campaign: 'search-first', last_source: 'meta', last_campaign: 'retarget-last',
  });
  const [{ count }] = await sql<{ count: number }[]>`
    select count(*)::int count from analytics_events where event_name = 'lead_submit'
  `;
  assert.equal(count, 1);
});

test('obvious duplicate lead inside suppression window returns existing lead without double insert', async () => {
  const tracked = await recordAnalyticsEvent({ eventId: randomUUID(), eventName: 'page_view', path: '/', url: 'https://zahidalexbur.com.ua/' },
    { now: new Date('2026-09-14T12:00:00Z'), userAgent: 'Mozilla/5.0', ip: null });
  const input = { phone: '+380991234567', originatingPage: '/', honeypot: '', startedAtMs: Date.parse('2026-09-14T11:59:50Z') };
  const first = await createLead(input, { visitorId: tracked.visitorId, sessionId: tracked.sessionId, now: new Date('2026-09-14T12:00:10Z') });
  const second = await createLead(input, { visitorId: tracked.visitorId, sessionId: tracked.sessionId, now: new Date('2026-09-14T12:02:10Z') });
  assert.equal(second.id, first.id);
  assert.equal(second.duplicate, true);
  const [{ count }] = await sql<{ count: number }[]>`select count(*)::int count from leads`;
  assert.equal(count, 1);
});

test('dashboard aggregates respect active and comparison periods across all modules', async () => {
  const v1 = randomUUID();
  const v2 = randomUUID();
  const v3 = randomUUID();
  const s1 = randomUUID();
  const s2 = randomUUID();
  const s3 = randomUUID();
  const s4 = randomUUID();

  await sql`
    insert into visitors (id, first_seen_at, last_seen_at, first_source, first_medium, last_source, last_medium)
    values
      (${v1}, '2026-09-02T08:00:00Z', '2026-09-04T08:00:00Z', 'google', 'cpc', 'google', 'cpc'),
      (${v2}, '2026-09-03T08:00:00Z', '2026-09-03T08:00:00Z', 'meta', 'paid_social', 'meta', 'paid_social'),
      (${v3}, '2026-08-28T08:00:00Z', '2026-08-28T08:00:00Z', 'direct', 'none', 'direct', 'none')
  `;
  await sql`
    insert into sessions (
      id, visitor_id, started_at, last_activity_at, landing_page, source, medium, campaign,
      device_type, country_code, country_name, region_code, region_name, city
    ) values
      (${s1}, ${v1}, '2026-09-02T08:00:00Z', '2026-09-02T08:20:00Z', '/', 'google', 'cpc', 'search', 'Mobile', 'UA', 'Ukraine', 'UA-46', 'Lviv Oblast', 'Lviv'),
      (${s2}, ${v2}, '2026-09-03T08:00:00Z', '2026-09-03T08:15:00Z', '/', 'meta', 'paid_social', 'retarget', 'Desktop', 'UA', 'Ukraine', 'UA-32', 'Kyiv Oblast', 'Kyiv'),
      (${s3}, ${v1}, '2026-09-04T08:00:00Z', '2026-09-04T08:10:00Z', '/about', 'direct', 'none', null, 'Mobile', 'UA', 'Ukraine', 'UA-46', 'Lviv Oblast', 'Lviv'),
      (${s4}, ${v3}, '2026-08-28T08:00:00Z', '2026-08-28T08:10:00Z', '/', 'direct', 'none', null, 'Desktop', 'UA', 'Ukraine', 'UA-46', 'Lviv Oblast', 'Lviv')
  `;
  await sql`
    insert into page_views (event_id, visitor_id, session_id, path, occurred_at)
    values
      (${randomUUID()}, ${v1}, ${s1}, '/', '2026-09-02T08:00:00Z'),
      (${randomUUID()}, ${v1}, ${s1}, '/services', '2026-09-02T08:05:00Z'),
      (${randomUUID()}, ${v2}, ${s2}, '/', '2026-09-03T08:00:00Z'),
      (${randomUUID()}, ${v3}, ${s4}, '/', '2026-08-28T08:00:00Z')
  `;
  await sql`
    insert into leads (
      id, name, phone, service, location, status, originating_page, created_at, visitor_id, session_id,
      source, medium, campaign, first_source, first_medium, last_source, last_medium
    ) values
      (${randomUUID()}, 'Lead Current', '+380991111111', 'Filter Well', 'Lviv', 'new', '/services', '2026-09-02T08:15:00Z', ${v1}, ${s1}, 'google', 'cpc', 'search', 'google', 'cpc', 'google', 'cpc'),
      (${randomUUID()}, 'Lead Previous', '+380992222222', 'Artesian', 'Lviv', 'new', '/', '2026-08-28T08:05:00Z', ${v3}, ${s4}, 'direct', 'none', null, 'direct', 'none', 'direct', 'none')
  `;

  const range: ResolvedPeriod = {
    timezone: 'Europe/Kyiv',
    from: new Date('2026-09-01T00:00:00Z'),
    to: new Date('2026-09-08T00:00:00Z'),
    comparisonFrom: new Date('2026-08-25T00:00:00Z'),
    comparisonTo: new Date('2026-09-01T00:00:00Z'),
    currentDurationMs: 7 * 24 * 60 * 60 * 1000,
    comparisonDurationMs: 7 * 24 * 60 * 60 * 1000,
  };

  const summary = await getSummary(range);
  assert.equal(summary.visitors.current, 2);
  assert.equal(summary.visitors.previous, 1);
  assert.equal(summary.sessions.current, 3);
  assert.equal(summary.pageViews.current, 3);
  assert.equal(summary.leads.current, 1);
  assert.equal(summary.conversionRate.current, 50);
  assert.equal(summary.conversionRate.previous, 100);
  assert.equal(summary.costPerLead, null);

  const sources = await getTrafficSources(range);
  assert.deepEqual(sources.map(({ name, visitors, percentage }) => ({ name, visitors, percentage })), [
    { name: 'Google Ads', visitors: 1, percentage: 50 },
    { name: 'Meta Ads', visitors: 1, percentage: 50 },
  ]);

  const geography = await getGeography(range, 'ukraine');
  assert.deepEqual(geography.map(({ key, visitors, sessions, percentage }) => ({ key, visitors, sessions, percentage })), [
    { key: 'UA-46', visitors: 1, sessions: 2, percentage: 50 },
    { key: 'UA-32', visitors: 1, sessions: 1, percentage: 50 },
  ]);

  const pages = await getPopularPages(range);
  assert.deepEqual(pages.map(({ path, visits, conversions, conversionRate }) => ({ path, visits, conversions, conversionRate })), [
    { path: '/', visits: 2, conversions: 0, conversionRate: 0 },
    { path: '/services', visits: 1, conversions: 1, conversionRate: 100 },
  ]);

  const devices = await getDevices(range);
  assert.deepEqual(devices.map(({ deviceType, visitors, percentage }) => ({ deviceType, visitors, percentage })), [
    { deviceType: 'Mobile', visitors: 1, percentage: 50 },
    { deviceType: 'Desktop', visitors: 1, percentage: 50 },
  ]);

  const leads = await getRecentLeads(range, 10);
  assert.equal(leads.length, 1);
  assert.equal(leads[0].name, 'Lead Current');
  assert.equal(leads[0].firstSource, 'google');
  assert.equal(leads[0].lastSource, 'google');

  const series = await getTimeseries(range, 'day');
  assert.equal(series.some((point) => point.visitors === 1 && point.leads === 1), true);
});

test.after(async () => { await sql.end({ timeout: 2 }); });
