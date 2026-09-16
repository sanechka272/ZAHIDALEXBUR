import { getSqlClient } from '@/lib/db/client';
import type { GeographyScope } from './dashboard-repository';
import type { ResolvedPeriod } from './period';

export type PageDetailRow = {
  path: string;
  pageViews: number;
  uniqueVisitors: number;
  leads: number;
  conversionRate: number;
};

export type CityGeographyRow = {
  key: string;
  city: string;
  regionName: string | null;
  countryCode: string | null;
  countryName: string | null;
  visitors: number;
  sessions: number;
  percentage: number;
};

function numeric(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getPageDetails(range: ResolvedPeriod, limit = 100): Promise<PageDetailRow[]> {
  const sql = getSqlClient();
  const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
  const rows = await sql<{
    path: string;
    page_views: number;
    unique_visitors: number;
    leads: number;
    conversion_rate: number | string;
  }[]>`
    with page_stats as (
      select path,
             count(*)::int page_views,
             count(distinct visitor_id)::int unique_visitors
      from page_views
      where occurred_at >= ${range.from} and occurred_at < ${range.to}
      group by path
    ), lead_stats as (
      select originating_page path, count(*)::int leads
      from leads
      where created_at >= ${range.from} and created_at < ${range.to}
      group by originating_page
    )
    select p.path,
           p.page_views,
           p.unique_visitors,
           coalesce(l.leads, 0)::int leads,
           round(coalesce(l.leads, 0)::numeric * 100 / nullif(p.unique_visitors, 0), 2) conversion_rate
    from page_stats p
    left join lead_stats l using (path)
    order by p.page_views desc, p.unique_visitors desc, p.path asc
    limit ${safeLimit}
  `;

  return rows.map((row) => ({
    path: row.path,
    pageViews: numeric(row.page_views),
    uniqueVisitors: numeric(row.unique_visitors),
    leads: numeric(row.leads),
    conversionRate: numeric(row.conversion_rate),
  }));
}

export async function getCityGeography(range: ResolvedPeriod, scope: GeographyScope): Promise<CityGeographyRow[]> {
  const sql = getSqlClient();
  const rows = await sql<{
    key: string;
    city: string;
    region_name: string | null;
    country_code: string | null;
    country_name: string | null;
    visitors: number;
    sessions: number;
    percentage: number | string;
  }[]>`
    with scoped_sessions as (
      select *
      from sessions
      where started_at >= ${range.from}
        and started_at < ${range.to}
        and (${scope} = 'world' or country_code = 'UA')
        and city is not null
        and btrim(city) <> ''
    ), first_sessions as (
      select distinct on (visitor_id)
             visitor_id, country_code, country_name, region_code, region_name, city
      from scoped_sessions
      order by visitor_id, started_at asc
    ), visitor_stats as (
      select concat_ws(':', coalesce(country_code, 'unknown'), coalesce(region_code, 'unknown'), lower(city)) key,
             city,
             max(region_name) region_name,
             max(country_code) country_code,
             max(country_name) country_name,
             count(*)::int visitors
      from first_sessions
      group by country_code, region_code, city
    ), session_stats as (
      select concat_ws(':', coalesce(country_code, 'unknown'), coalesce(region_code, 'unknown'), lower(city)) key,
             count(*)::int sessions
      from scoped_sessions
      group by country_code, region_code, city
    )
    select v.key, v.city, v.region_name, v.country_code, v.country_name,
           v.visitors,
           coalesce(s.sessions, 0)::int sessions,
           round(v.visitors::numeric * 100 / nullif(sum(v.visitors) over (), 0), 2) percentage
    from visitor_stats v
    left join session_stats s using (key)
    order by v.visitors desc, sessions desc, v.city asc
    limit 200
  `;

  return rows.map((row) => ({
    key: row.key,
    city: row.city,
    regionName: row.region_name,
    countryCode: row.country_code,
    countryName: row.country_name,
    visitors: numeric(row.visitors),
    sessions: numeric(row.sessions),
    percentage: numeric(row.percentage),
  }));
}
