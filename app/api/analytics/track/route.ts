import { trackEventSchema } from '@/lib/analytics/contracts';
import { isLikelyBot } from '@/lib/analytics/device';
import { geoTokenFromEdgeHeaders } from '@/lib/analytics/edge-geo';
import { recordAnalyticsEvent } from '@/lib/analytics/repository';

export const runtime = 'nodejs';

const VISITOR_COOKIE = 'zab_visitor';
const SESSION_COOKIE = 'zab_session';
const MAX_BODY_BYTES = 16 * 1024;
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365 * 2;
const SESSION_MAX_AGE = 60 * 30;

function parseCookies(header: string | null) {
  const result = new Map<string, string>();
  for (const chunk of (header ?? '').split(';')) {
    const [rawKey, ...rest] = chunk.trim().split('=');
    if (!rawKey || rest.length === 0) continue;
    result.set(rawKey, decodeURIComponent(rest.join('=')));
  }
  return result;
}

function cookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`;
}

function clientGeoKey(request: Request) {
  const edgeGeo = geoTokenFromEdgeHeaders(request.headers);
  if (edgeGeo) return edgeGeo;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const candidate = forwarded || request.headers.get('x-real-ip') || null;
  return candidate?.startsWith('zab-edge:') ? null : candidate;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 });

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) return Response.json({ error: 'payload_too_large' }, { status: 413 });

  const userAgent = request.headers.get('user-agent') ?? '';
  if (isLikelyBot(userAgent)) return new Response(null, { status: 204 });

  let raw: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
      return Response.json({ error: 'payload_too_large' }, { status: 413 });
    }
    raw = JSON.parse(text);
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = trackEventSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: 'invalid_payload', issues: parsed.error.issues }, { status: 400 });
  }

  const cookies = parseCookies(request.headers.get('cookie'));
  try {
    const result = await recordAnalyticsEvent(parsed.data, {
      visitorId: cookies.get(VISITOR_COOKIE) ?? null,
      sessionId: cookies.get(SESSION_COOKIE) ?? null,
      userAgent,
      ip: clientGeoKey(request),
    });

    const headers = new Headers({ 'cache-control': 'no-store' });
    headers.append('set-cookie', cookie(VISITOR_COOKIE, result.visitorId, VISITOR_MAX_AGE));
    headers.append('set-cookie', cookie(SESSION_COOKIE, result.sessionId, SESSION_MAX_AGE));
    return Response.json({ ok: true, duplicate: result.duplicate }, { status: 200, headers });
  } catch (error) {
    console.error('[analytics] tracking ingestion failed', error);
    return Response.json({ error: 'ingestion_failed' }, { status: 500, headers: { 'cache-control': 'no-store' } });
  }
}
