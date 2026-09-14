import { randomUUID } from 'node:crypto';
import type { TrackEventInput } from './contracts';
import { parseAttribution } from './attribution';
import { classifyDevice } from './device';
import { resolveGeo } from './geo';
import { getSqlClient } from '@/lib/db/client';

const SESSION_TTL_MS = 30 * 60 * 1000;

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
