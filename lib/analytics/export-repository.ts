import { getSqlClient } from '@/lib/db/client';
import type { ResolvedPeriod } from './period';

export type AcquisitionExportRow = {
  source: string;
  medium: string;
  campaign: string | null;
  visitors: number;
  sessions: number;
  leads: number;
  conversionRate: number;
};

export type LeadExportRow = {
  id: string;
  createdAt: Date;
  name: string | null;
  phone: string;
  location: string | null;
  service: string | null;
  status: string;
  originatingPage: string;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  term: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  firstSource: string | null;
  firstMedium: string | null;
  firstCampaign: string | null;
  firstContent: string | null;
  firstTerm: string | null;
  firstGclid: string | null;
  firstFbclid: string | null;
  firstTtclid: string | null;
  lastSource: string | null;
  lastMedium: string | null;
  lastCampaign: string | null;
  lastContent: string | null;
  lastTerm: string | null;
  lastGclid: string | null;
  lastFbclid: string | null;
  lastTtclid: string | null;
};

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getAcquisitionExport(range: ResolvedPeriod): Promise<AcquisitionExportRow[]> {
  const sql = getSqlClient();
  const rows = await sql<{
    source: string; medium: string; campaign: string | null;
    visitors: number; sessions: number; leads: number; conversion_rate: string | number;
  }[]>`
    with session_stats as (
      select source, medium, campaign,
             count(distinct visitor_id)::int visitors,
             count(*)::int sessions
      from sessions
      where started_at >= ${range.from} and started_at < ${range.to}
      group by source, medium, campaign
    ), lead_stats as (
      select coalesce(source, 'unknown') source,
             coalesce(medium, 'unknown') medium,
             campaign,
             count(*)::int leads
      from leads
      where created_at >= ${range.from} and created_at < ${range.to}
      group by coalesce(source, 'unknown'), coalesce(medium, 'unknown'), campaign
    )
    select s.source, s.medium, s.campaign,
           s.visitors, s.sessions,
           coalesce(l.leads, 0)::int leads,
           round(coalesce(l.leads, 0)::numeric * 100 / nullif(s.visitors, 0), 2) conversion_rate
    from session_stats s
    left join lead_stats l
      on l.source = s.source
     and l.medium = s.medium
     and l.campaign is not distinct from s.campaign
    order by s.visitors desc, s.sessions desc, s.source, s.medium, s.campaign nulls last
  `;
  return rows.map((row) => ({
    source: row.source,
    medium: row.medium,
    campaign: row.campaign,
    visitors: number(row.visitors),
    sessions: number(row.sessions),
    leads: number(row.leads),
    conversionRate: number(row.conversion_rate),
  }));
}

export async function getLeadExport(range: ResolvedPeriod): Promise<LeadExportRow[]> {
  const sql = getSqlClient();
  const rows = await sql<{
    id: string; created_at: Date; name: string | null; phone: string; location: string | null; service: string | null; status: string; originating_page: string;
    source: string | null; medium: string | null; campaign: string | null; content: string | null; term: string | null; gclid: string | null; fbclid: string | null; ttclid: string | null;
    first_source: string | null; first_medium: string | null; first_campaign: string | null; first_content: string | null; first_term: string | null; first_gclid: string | null; first_fbclid: string | null; first_ttclid: string | null;
    last_source: string | null; last_medium: string | null; last_campaign: string | null; last_content: string | null; last_term: string | null; last_gclid: string | null; last_fbclid: string | null; last_ttclid: string | null;
  }[]>`
    select id, created_at, name, phone, location, service, status, originating_page,
           source, medium, campaign, content, term, gclid, fbclid, ttclid,
           first_source, first_medium, first_campaign, first_content, first_term, first_gclid, first_fbclid, first_ttclid,
           last_source, last_medium, last_campaign, last_content, last_term, last_gclid, last_fbclid, last_ttclid
    from leads
    where created_at >= ${range.from} and created_at < ${range.to}
    order by created_at desc
    limit 50000
  `;
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    name: row.name,
    phone: row.phone,
    location: row.location,
    service: row.service,
    status: row.status,
    originatingPage: row.originating_page,
    source: row.source,
    medium: row.medium,
    campaign: row.campaign,
    content: row.content,
    term: row.term,
    gclid: row.gclid,
    fbclid: row.fbclid,
    ttclid: row.ttclid,
    firstSource: row.first_source,
    firstMedium: row.first_medium,
    firstCampaign: row.first_campaign,
    firstContent: row.first_content,
    firstTerm: row.first_term,
    firstGclid: row.first_gclid,
    firstFbclid: row.first_fbclid,
    firstTtclid: row.first_ttclid,
    lastSource: row.last_source,
    lastMedium: row.last_medium,
    lastCampaign: row.last_campaign,
    lastContent: row.last_content,
    lastTerm: row.last_term,
    lastGclid: row.last_gclid,
    lastFbclid: row.last_fbclid,
    lastTtclid: row.last_ttclid,
  }));
}
