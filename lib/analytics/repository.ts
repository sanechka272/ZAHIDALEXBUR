import { randomUUID } from 'node:crypto';
import type { CreateLeadInput, TrackEventInput } from './contracts';
import { parseAttribution } from './attribution';
import { classifyDevice } from './device';
import { resolveGeo } from './geo';
import { getSqlClient } from '@/lib/db/client';

const SESSION_TTL_MS = 30 * 60 * 1000;
const LEAD_SUPPRESSION_MS = 10 * 60 * 1000;

export type AnalyticsContext = {
  visitorId?: string | null;
  sessionId?: string | null;
  now?: Date;
  userAgent?: string | null;
  ip?: string | null;
};

export type AnalyticsRecordResult = {
  visitorId: string;
  sessionId: string;
  duplicate: boolean;
};

export type CreateLeadResult = {
  id: string;
  createdAt: Date;
  duplicate: boolean;
  visitorId: string;
  sessionId: string;
};

type VisitorAttributionRow = {
  id: string;
  first_source: string | null;
  first_medium: string | null;
  first_campaign: string | null;
  first_content: string | null;
  first_term: string | null;
  first_gclid: string | null;
  first_fbclid: string | null;
  first_ttclid: string | null;
  last_source: string | null;
  last_medium: string | null;
  last_campaign: string | null;
  last_content: string | null;
  last_term: string | null;
  last_gclid: string | null;
  last_fbclid: string | null;
  last_ttclid: string | null;
};

type SessionAttributionRow = {
  id: string;
  visitor_id: string;
  last_activity_at: Date;
  source: string;
  medium: string;
  campaign: string | null;
  content: string | null;
  term: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
};

function safeQuery(urlString: string) {
  const url = new URL(urlString);
  const allowed = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'ttclid']);
  const sanitized = new URLSearchParams();
  for (const [key, value] of url.searchParams.entries()) {
    if (allowed.has(key)) sanitized.set(key, value.slice(0, 512));
  }
  const result = sanitized.toString();
  return result ? `?${result}` : null;
}

export function normalizeLeadPhone(rawPhone: string) {
  const trimmed = rawPhone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) throw new Error('invalid_phone');
  if (digits.length === 10 && digits.startsWith('0')) return `+38${digits}`;
  if (digits.startsWith('380')) return `+${digits}`;
  if (trimmed.startsWith('+')) return `+${digits}`;
  return digits;
}

export async function recordAnalyticsEvent(input: TrackEventInput, context: AnalyticsContext = {}): Promise<AnalyticsRecordResult> {
  const sql = getSqlClient();
  const now = context.now ?? new Date();
  const attribution = parseAttribution(input.url, input.referrer ?? null);
  const device = classifyDevice(context.userAgent ?? '');
  const geo = await resolveGeo(context.ip ?? null);

  return sql.begin(async (tx) => {
    const duplicateRows = input.eventName === 'page_view'
      ? await tx<{ visitor_id: string; session_id: string }[]>`
          select visitor_id, session_id from page_views where event_id = ${input.eventId} limit 1
        `
      : await tx<{ visitor_id: string | null; session_id: string | null }[]>`
          select visitor_id, session_id from analytics_events where event_id = ${input.eventId} limit 1
        `;

    const duplicate = duplicateRows[0];
    if (duplicate?.visitor_id && duplicate?.session_id) {
      return { visitorId: duplicate.visitor_id, sessionId: duplicate.session_id, duplicate: true };
    }

    let visitor: VisitorAttributionRow | undefined;
    if (context.visitorId) {
      [visitor] = await tx<VisitorAttributionRow[]>`
        select id,
          first_source, first_medium, first_campaign, first_content, first_term, first_gclid, first_fbclid, first_ttclid,
          last_source, last_medium, last_campaign, last_content, last_term, last_gclid, last_fbclid, last_ttclid
        from visitors where id = ${context.visitorId} limit 1 for update
      `;
    }

    let visitorId = visitor?.id;
    if (!visitorId) {
      visitorId = randomUUID();
      await tx`
        insert into visitors (
          id, created_at, first_seen_at, last_seen_at,
          first_landing_page, first_referrer, first_source, first_medium, first_campaign, first_content, first_term, first_gclid, first_fbclid, first_ttclid,
          last_landing_page, last_referrer, last_source, last_medium, last_campaign, last_content, last_term, last_gclid, last_fbclid, last_ttclid
        ) values (
          ${visitorId}, ${now}, ${now}, ${now},
          ${attribution.landingPage}, ${attribution.referrer}, ${attribution.source}, ${attribution.medium}, ${attribution.campaign}, ${attribution.content}, ${attribution.term}, ${attribution.gclid}, ${attribution.fbclid}, ${attribution.ttclid},
          ${attribution.landingPage}, ${attribution.referrer}, ${attribution.source}, ${attribution.medium}, ${attribution.campaign}, ${attribution.content}, ${attribution.term}, ${attribution.gclid}, ${attribution.fbclid}, ${attribution.ttclid}
        )
      `;
    } else if (attribution.attributable) {
      await tx`
        update visitors set
          last_seen_at = ${now},
          last_landing_page = ${attribution.landingPage},
          last_referrer = ${attribution.referrer},
          last_source = ${attribution.source},
          last_medium = ${attribution.medium},
          last_campaign = ${attribution.campaign},
          last_content = ${attribution.content},
          last_term = ${attribution.term},
          last_gclid = ${attribution.gclid},
          last_fbclid = ${attribution.fbclid},
          last_ttclid = ${attribution.ttclid}
        where id = ${visitorId}
      `;
    } else {
      await tx`update visitors set last_seen_at = ${now} where id = ${visitorId}`;
    }

    let sessionId: string | undefined;
    if (context.sessionId) {
      const [session] = await tx<{ id: string; visitor_id: string; last_activity_at: Date }[]>`
        select id, visitor_id, last_activity_at
        from sessions
        where id = ${context.sessionId} and visitor_id = ${visitorId}
        limit 1 for update
      `;
      if (session && now.getTime() - new Date(session.last_activity_at).getTime() <= SESSION_TTL_MS) {
        sessionId = session.id;
        await tx`update sessions set last_activity_at = ${now} where id = ${sessionId}`;
      }
    }

    if (!sessionId) {
      sessionId = randomUUID();
      await tx`
        insert into sessions (
          id, visitor_id, started_at, last_activity_at, landing_page, referrer,
          source, medium, campaign, content, term, gclid, fbclid, ttclid,
          device_type, browser_family, os_family,
          country_code, country_name, region_code, region_name, city
        ) values (
          ${sessionId}, ${visitorId}, ${now}, ${now}, ${attribution.landingPage}, ${attribution.referrer},
          ${attribution.source}, ${attribution.medium}, ${attribution.campaign}, ${attribution.content}, ${attribution.term}, ${attribution.gclid}, ${attribution.fbclid}, ${attribution.ttclid},
          ${device.deviceType}, ${device.browserFamily}, ${device.osFamily},
          ${geo.countryCode}, ${geo.countryName}, ${geo.regionCode}, ${geo.regionName}, ${geo.city}
        )
      `;
    }

    if (input.eventName === 'page_view') {
      await tx`
        insert into page_views (event_id, visitor_id, session_id, path, query_without_sensitive_values, page_title, referrer, occurred_at)
        values (${input.eventId}, ${visitorId}, ${sessionId}, ${input.path}, ${safeQuery(input.url)}, ${input.title ?? null}, ${input.referrer ?? null}, ${now})
        on conflict (event_id) do nothing
      `;
    } else {
      await tx`
        insert into analytics_events (event_id, visitor_id, session_id, event_name, page_path, metadata_json, occurred_at)
        values (${input.eventId}, ${visitorId}, ${sessionId}, ${input.eventName}, ${input.path}, ${tx.json({})}, ${now})
        on conflict (event_id) do nothing
      `;
    }

    return { visitorId, sessionId, duplicate: false };
  });
}

export async function createLead(input: CreateLeadInput, context: AnalyticsContext = {}): Promise<CreateLeadResult> {
  const sql = getSqlClient();
  const now = context.now ?? new Date();
  const phone = normalizeLeadPhone(input.phone);
  const device = classifyDevice(context.userAgent ?? '');
  const geo = await resolveGeo(context.ip ?? null);

  return sql.begin(async (tx) => {
    const duplicateAfter = new Date(now.getTime() - LEAD_SUPPRESSION_MS);
    const [existing] = await tx<{ id: string; created_at: Date; visitor_id: string | null; session_id: string | null }[]>`
      select id, created_at, visitor_id, session_id
      from leads
      where phone = ${phone} and created_at >= ${duplicateAfter}
      order by created_at desc
      limit 1
    `;
    if (existing?.visitor_id && existing?.session_id) {
      return {
        id: existing.id,
        createdAt: new Date(existing.created_at),
        duplicate: true,
        visitorId: existing.visitor_id,
        sessionId: existing.session_id,
      };
    }

    let visitor: VisitorAttributionRow | undefined;
    if (context.visitorId) {
      [visitor] = await tx<VisitorAttributionRow[]>`
        select id,
          first_source, first_medium, first_campaign, first_content, first_term, first_gclid, first_fbclid, first_ttclid,
          last_source, last_medium, last_campaign, last_content, last_term, last_gclid, last_fbclid, last_ttclid
        from visitors where id = ${context.visitorId} limit 1 for update
      `;
    }

    let visitorId = visitor?.id;
    if (!visitorId) {
      visitorId = randomUUID();
      await tx`
        insert into visitors (
          id, created_at, first_seen_at, last_seen_at,
          first_landing_page, first_source, first_medium,
          last_landing_page, last_source, last_medium
        ) values (
          ${visitorId}, ${now}, ${now}, ${now},
          ${input.originatingPage}, 'direct', 'none',
          ${input.originatingPage}, 'direct', 'none'
        )
      `;
      [visitor] = await tx<VisitorAttributionRow[]>`
        select id,
          first_source, first_medium, first_campaign, first_content, first_term, first_gclid, first_fbclid, first_ttclid,
          last_source, last_medium, last_campaign, last_content, last_term, last_gclid, last_fbclid, last_ttclid
        from visitors where id = ${visitorId} limit 1
      `;
    } else {
      await tx`update visitors set last_seen_at = ${now} where id = ${visitorId}`;
    }

    let session: SessionAttributionRow | undefined;
    if (context.sessionId) {
      [session] = await tx<SessionAttributionRow[]>`
        select id, visitor_id, last_activity_at, source, medium, campaign, content, term, gclid, fbclid, ttclid
        from sessions
        where id = ${context.sessionId} and visitor_id = ${visitorId}
        limit 1 for update
      `;
      if (session && now.getTime() - new Date(session.last_activity_at).getTime() > SESSION_TTL_MS) session = undefined;
    }

    if (!session) {
      const sessionId = randomUUID();
      await tx`
        insert into sessions (
          id, visitor_id, started_at, last_activity_at, landing_page,
          source, medium, device_type, browser_family, os_family,
          country_code, country_name, region_code, region_name, city
        ) values (
          ${sessionId}, ${visitorId}, ${now}, ${now}, ${input.originatingPage},
          'direct', 'none', ${device.deviceType}, ${device.browserFamily}, ${device.osFamily},
          ${geo.countryCode}, ${geo.countryName}, ${geo.regionCode}, ${geo.regionName}, ${geo.city}
        )
      `;
      [session] = await tx<SessionAttributionRow[]>`
        select id, visitor_id, last_activity_at, source, medium, campaign, content, term, gclid, fbclid, ttclid
        from sessions where id = ${sessionId} limit 1
      `;
    } else {
      await tx`update sessions set last_activity_at = ${now} where id = ${session.id}`;
    }

    if (!visitor || !session) throw new Error('lead_tracking_context_unavailable');

    const leadId = randomUUID();
    await tx`
      insert into leads (
        id, name, phone, service, location, status, originating_page, created_at, visitor_id, session_id,
        source, medium, campaign, content, term, gclid, fbclid, ttclid,
        first_source, first_medium, first_campaign, first_content, first_term, first_gclid, first_fbclid, first_ttclid,
        last_source, last_medium, last_campaign, last_content, last_term, last_gclid, last_fbclid, last_ttclid
      ) values (
        ${leadId}, ${input.name ?? null}, ${phone}, ${input.service ?? null}, ${input.location ?? null}, 'new', ${input.originatingPage}, ${now}, ${visitorId}, ${session.id},
        ${session.source}, ${session.medium}, ${session.campaign}, ${session.content}, ${session.term}, ${session.gclid}, ${session.fbclid}, ${session.ttclid},
        ${visitor.first_source}, ${visitor.first_medium}, ${visitor.first_campaign}, ${visitor.first_content}, ${visitor.first_term}, ${visitor.first_gclid}, ${visitor.first_fbclid}, ${visitor.first_ttclid},
        ${visitor.last_source}, ${visitor.last_medium}, ${visitor.last_campaign}, ${visitor.last_content}, ${visitor.last_term}, ${visitor.last_gclid}, ${visitor.last_fbclid}, ${visitor.last_ttclid}
      )
    `;

    await tx`
      insert into analytics_events (event_id, visitor_id, session_id, event_name, page_path, metadata_json, occurred_at)
      values (${randomUUID()}, ${visitorId}, ${session.id}, 'lead_submit', ${input.originatingPage}, ${tx.json({ leadId })}, ${now})
    `;

    return { id: leadId, createdAt: now, duplicate: false, visitorId, sessionId: session.id };
  });
}
