import { getSqlClient } from '@/lib/db/client';
import type { GroupBy } from './contracts';
import type { ResolvedPeriod } from './period';

export type MetricValue = {
  current: number;
  previous: number;
  deltaPercent: number | null;
};

export type Summary = {
  visitors: MetricValue;
  sessions: MetricValue;
  pageViews: MetricValue;
  leads: MetricValue;
  conversionRate: MetricValue;
  costPerLead: null;
};

export type TimeseriesPoint = { bucket: string; visitors: number; leads: number };
export type TrafficSourceRow = { name: string; visitors: number; percentage: number };
export type GeographyScope = 'ukraine' | 'world';
export type GeographyRow = {
  key: string;
  name: string;
  countryCode: string | null;
  regionCode: string | null;
  visitors: number;
  sessions: number;
  percentage: number;
};
export type PageRow = { path: string; visits: number; conversions: number; conversionRate: number };
export type DeviceRow = { deviceType: string; visitors: number; percentage: number };
export type RecentLeadRow = {
  id: string;
  name: string | null;
  phone: string;
  location: string | null;
  service: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  originatingPage: string;
  status: string;
  createdAt: string;
  firstSource: string | null;
  firstMedium: string | null;
  firstCampaign: string | null;
  lastSource: string | null;
  lastMedium: string | null;
  lastCampaign: string | null;
};

function numeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function metric(current: number, previous: number): MetricValue {
  return {
    current,
    previous,
    deltaPercent: previous === 0 ? (current === 0 ? 0 : null) : round2(((current - previous) / previous) * 100),
  };
}

export async function getSummary(range: ResolvedPeriod): Promise<Summary> {
  const sql = getSqlClient();
  const [row] = await sql<{
    current_visitors: number; previous_visitors: number;
    current_sessions: number; previous_sessions: number;
    current_page_views: number; previous_page_views: number;
    current_leads: number; previous_leads: number;
  }[]>`
    select
      (select count(distinct visitor_id)::int from page_views where occurred_at >= ${range.from} and occurred_at < ${range.to}) current_visitors,
      (select count(distinct visitor_id)::int from page_views where occurred_at >= ${range.comparisonFrom} and occurred_at < ${range.comparisonTo}) previous_visitors,
      (select count(*)::int from sessions where started_at >= ${range.from} and started_at < ${range.to}) current_sessions,
      (select count(*)::int from sessions where started_at >= ${range.comparisonFrom} and started_at < ${range.comparisonTo}) previous_sessions,
      (select count(*)::int from page_views where occurred_at >= ${range.from} and occurred_at < ${range.to}) current_page_views,
      (select count(*)::int from page_views where occurred_at >= ${range.comparisonFrom} and occurred_at < ${range.comparisonTo}) previous_page_views,
      (select count(*)::int from leads where created_at >= ${range.from} and created_at < ${range.to}) current_leads,
      (select count(*)::int from leads where created_at >= ${range.comparisonFrom} and created_at < ${range.comparisonTo}) previous_leads
  `;

  const currentVisitors = numeric(row?.current_visitors);
  const previousVisitors = numeric(row?.previous_visitors);
  const currentLeads = numeric(row?.current_leads);
  const previousLeads = numeric(row?.previous_leads);
  const currentConversion = currentVisitors > 0 ? round2((currentLeads / currentVisitors) * 100) : 0;
  const previousConversion = previousVisitors > 0 ? round2((previousLeads / previousVisitors) * 100) : 0;

  return {
    visitors: metric(currentVisitors, previousVisitors),
    sessions: metric(numeric(row?.current_sessions), numeric(row?.previous_sessions)),
    pageViews: metric(numeric(row?.current_page_views), numeric(row?.previous_page_views)),
    leads: metric(currentLeads, previousLeads),
    conversionRate: metric(currentConversion, previousConversion),
    costPerLead: null,
  };
}

export async function getTimeseries(range: ResolvedPeriod, groupBy: GroupBy): Promise<TimeseriesPoint[]> {
  const sql = getSqlClient();
  const rows = await sql<{ bucket: Date | string; visitors: number; leads: number }[]>`
    with visitor_series as (
      select date_trunc(${groupBy}, occurred_at at time zone 'Europe/Kyiv') bucket,
             count(distinct visitor_id)::int visitors
      from page_views
      where occurred_at >= ${range.from} and occurred_at < ${range.to}
      group by 1
    ), lead_series as (
      select date_trunc(${groupBy}, created_at at time zone 'Europe/Kyiv') bucket,
             count(*)::int leads
      from leads
      where created_at >= ${range.from} and created_at < ${range.to}
      group by 1
    ), buckets as (
      select bucket from visitor_series
      union
      select bucket from lead_series
    )
    select b.bucket,
           coalesce(v.visitors, 0)::int visitors,
           coalesce(l.leads, 0)::int leads
    from buckets b
    left join visitor_series v using (bucket)
    left join lead_series l using (bucket)
    order by b.bucket
  `;
  return rows.map((row) => ({
    bucket: row.bucket instanceof Date ? row.bucket.toISOString() : String(row.bucket),
    visitors: numeric(row.visitors),
    leads: numeric(row.leads),
  }));
}

export async function getTrafficSources(range: ResolvedPeriod): Promise<TrafficSourceRow[]> {
  const sql = getSqlClient();
  const rows = await sql<{ name: string; visitors: number; percentage: number | string }[]>`
    with first_sessions as (
      select distinct on (visitor_id) visitor_id, source, medium
      from sessions
      where started_at >= ${range.from} and started_at < ${range.to}
      order by visitor_id, started_at asc
    ), bucketed as (
      select visitor_id,
        case
          when lower(source) = 'google' and lower(medium) in ('cpc','ppc','paid','paid_search') then 'Google Ads'
          when lower(source) in ('meta','facebook','instagram') and lower(medium) in ('paid_social','cpc','paid') then 'Meta Ads'
          when lower(medium) = 'organic' then 'Organic Search'
          when lower(source) = 'direct' or lower(medium) = 'none' then 'Direct Traffic'
          else 'Other'
        end name
      from first_sessions
    ), grouped as (
      select name, count(*)::int visitors from bucketed group by name
    )
    select name, visitors,
      round(visitors::numeric * 100 / nullif(sum(visitors) over (), 0), 2) percentage
    from grouped
    order by visitors desc, name asc
  `;
  return rows.map((row) => ({ name: row.name, visitors: numeric(row.visitors), percentage: numeric(row.percentage) }));
}

export async function getGeography(range: ResolvedPeriod, scope: GeographyScope): Promise<GeographyRow[]> {
  const sql = getSqlClient();
  if (scope === 'ukraine') {
    const rows = await sql<{
      key: string; name: string; country_code: string | null; region_code: string | null;
      visitors: number; sessions: number; percentage: number | string;
    }[]>`
      with first_sessions as (
        select distinct on (visitor_id) visitor_id, country_code, region_code, region_name
        from sessions
        where started_at >= ${range.from} and started_at < ${range.to}
        order by visitor_id, started_at asc
      ), visitors_by_geo as (
        select coalesce(region_code, 'unknown') key,
               coalesce(region_name, 'Unknown') name,
               max(country_code) country_code,
               max(region_code) region_code,
               count(*)::int visitors
        from first_sessions
        where country_code = 'UA'
        group by 1,2
      ), sessions_by_geo as (
        select coalesce(region_code, 'unknown') key, count(*)::int sessions
        from sessions
        where started_at >= ${range.from} and started_at < ${range.to} and country_code = 'UA'
        group by 1
      )
      select v.key, v.name, v.country_code, v.region_code, v.visitors,
             coalesce(s.sessions, 0)::int sessions,
             round(v.visitors::numeric * 100 / nullif(sum(v.visitors) over (), 0), 2) percentage
      from visitors_by_geo v
      left join sessions_by_geo s using (key)
      order by v.visitors desc, sessions desc, v.key asc
    `;
    return rows.map((row) => ({
      key: row.key, name: row.name, countryCode: row.country_code, regionCode: row.region_code,
      visitors: numeric(row.visitors), sessions: numeric(row.sessions), percentage: numeric(row.percentage),
    }));
  }

  const rows = await sql<{
    key: string; name: string; country_code: string | null; visitors: number; sessions: number; percentage: number | string;
  }[]>`
    with first_sessions as (
      select distinct on (visitor_id) visitor_id, country_code, country_name
      from sessions
      where started_at >= ${range.from} and started_at < ${range.to}
      order by visitor_id, started_at asc
    ), visitors_by_geo as (
      select coalesce(country_code, 'unknown') key,
             coalesce(country_name, 'Unknown') name,
             max(country_code) country_code,
             count(*)::int visitors
      from first_sessions
      group by 1,2
    ), sessions_by_geo as (
      select coalesce(country_code, 'unknown') key, count(*)::int sessions
      from sessions
      where started_at >= ${range.from} and started_at < ${range.to}
      group by 1
    )
    select v.key, v.name, v.country_code, v.visitors,
           coalesce(s.sessions, 0)::int sessions,
           round(v.visitors::numeric * 100 / nullif(sum(v.visitors) over (), 0), 2) percentage
    from visitors_by_geo v
    left join sessions_by_geo s using (key)
    order by v.visitors desc, sessions desc, v.key asc
  `;
  return rows.map((row) => ({
    key: row.key, name: row.name, countryCode: row.country_code, regionCode: null,
    visitors: numeric(row.visitors), sessions: numeric(row.sessions), percentage: numeric(row.percentage),
  }));
}

export async function getPopularPages(range: ResolvedPeriod, limit = 12): Promise<PageRow[]> {
  const sql = getSqlClient();
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const rows = await sql<{ path: string; visits: number; conversions: number; conversion_rate: number | string }[]>`
    with visits as (
      select path, count(*)::int visits
      from page_views
      where occurred_at >= ${range.from} and occurred_at < ${range.to}
      group by path
    ), conversions as (
      select originating_page path, count(*)::int conversions
      from leads
      where created_at >= ${range.from} and created_at < ${range.to}
      group by originating_page
    )
    select v.path, v.visits, coalesce(c.conversions, 0)::int conversions,
           round(coalesce(c.conversions, 0)::numeric * 100 / nullif(v.visits, 0), 2) conversion_rate
    from visits v
    left join conversions c using (path)
    order by v.visits desc, v.path asc
    limit ${safeLimit}
  `;
  return rows.map((row) => ({
    path: row.path,
    visits: numeric(row.visits),
    conversions: numeric(row.conversions),
    conversionRate: numeric(row.conversion_rate),
  }));
}

export async function getDevices(range: ResolvedPeriod): Promise<DeviceRow[]> {
  const sql = getSqlClient();
  const rows = await sql<{ device_type: string; visitors: number; percentage: number | string }[]>`
    with first_sessions as (
      select distinct on (visitor_id) visitor_id, device_type
      from sessions
      where started_at >= ${range.from} and started_at < ${range.to}
      order by visitor_id, started_at asc
    ), grouped as (
      select coalesce(device_type, 'Unknown') device_type, count(*)::int visitors
      from first_sessions
      group by 1
    )
    select device_type, visitors,
           round(visitors::numeric * 100 / nullif(sum(visitors) over (), 0), 2) percentage
    from grouped
    order by visitors desc, device_type asc
  `;
  return rows.map((row) => ({ deviceType: row.device_type, visitors: numeric(row.visitors), percentage: numeric(row.percentage) }));
}

export async function getRecentLeads(range: ResolvedPeriod, limit = 20): Promise<RecentLeadRow[]> {
  const sql = getSqlClient();
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const rows = await sql<{
    id: string; name: string | null; phone: string; location: string | null; service: string | null;
    source: string | null; medium: string | null; campaign: string | null; originating_page: string;
    status: string; created_at: Date | string; first_source: string | null; first_medium: string | null;
    first_campaign: string | null; last_source: string | null; last_medium: string | null; last_campaign: string | null;
  }[]>`
    select id, name, phone, location, service, source, medium, campaign, originating_page, status, created_at,
           first_source, first_medium, first_campaign, last_source, last_medium, last_campaign
    from leads
    where created_at >= ${range.from} and created_at < ${range.to}
    order by created_at desc
    limit ${safeLimit}
  `;
  return rows.map((row) => ({
    id: row.id, name: row.name, phone: row.phone, location: row.location, service: row.service,
    source: row.source, medium: row.medium, campaign: row.campaign, originatingPage: row.originating_page,
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    firstSource: row.first_source, firstMedium: row.first_medium, firstCampaign: row.first_campaign,
    lastSource: row.last_source, lastMedium: row.last_medium, lastCampaign: row.last_campaign,
  }));
}
