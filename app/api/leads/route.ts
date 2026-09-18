import { randomUUID } from 'node:crypto';
import { leadInputSchema } from '@/lib/analytics/contracts';
import { geoTokenFromEdgeHeaders } from '@/lib/analytics/edge-geo';
import { createLead } from '@/lib/analytics/repository';
import { notifyTelegramLead } from '@/lib/notifications/telegram';
import { isValidUaPhone } from '@/lib/phone';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 16 * 1024;
const MIN_COMPLETION_MS = 1200;
const VISITOR_COOKIE = 'zab_visitor';
const SESSION_COOKIE = 'zab_session';
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365 * 2;
const SESSION_MAX_AGE = 60 * 30;

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function parseCookies(header: string | null) {
  const result = new Map<string, string>();
  for (const chunk of (header ?? '').split(';')) {
    const [rawKey, ...rest] = chunk.trim().split('=');
    if (!rawKey || rest.length === 0) continue;
    result.set(rawKey, decodeURIComponent(rest.join('=')));
  }
  return result;
}

function clientGeoKey(request: Request) {
  const edgeGeo = geoTokenFromEdgeHeaders(request.headers);
  if (edgeGeo) return edgeGeo;
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const candidate = forwarded || request.headers.get('x-real-ip') || null;
  return candidate?.startsWith('zab-edge:') ? null : candidate;
}

function cookie(name: string, value: string, maxAge: number) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return Response.json({ error: 'unsupported_media_type' }, { status: 415 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BODY_BYTES) return Response.json({ error: 'payload_too_large' }, { status: 413 });

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

  const parsed = leadInputSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: 'invalid_payload' }, { status: 400 });
  if (parsed.data.honeypot.trim()) return Response.json({ error: 'invalid_submission' }, { status: 400 });

  const now = Date.now();
  if (parsed.data.startedAtMs > now || now - parsed.data.startedAtMs < MIN_COMPLETION_MS) {
    return Response.json({ error: 'invalid_submission' }, { status: 400 });
  }

  if (!isValidUaPhone(parsed.data.phone)) return Response.json({ error: 'invalid_phone' }, { status: 400 });

  const telegramHandledAtEdge = request.headers.get('x-zab-telegram-edge') === '1';
  const cookies = parseCookies(request.headers.get('cookie'));
  const context = {
    visitorId: cookies.get(VISITOR_COOKIE) ?? null,
    sessionId: cookies.get(SESSION_COOKIE) ?? null,
    userAgent: request.headers.get('user-agent') ?? '',
    ip: clientGeoKey(request),
  };

  try {
    const result = await createLead(parsed.data, context);

    if (!telegramHandledAtEdge) {
      await notifyTelegramLead({
        id: result.id,
        duplicate: result.duplicate,
        data: parsed.data,
      });
    }

    const headers = new Headers({ 'cache-control': 'no-store' });
    headers.append('set-cookie', cookie(VISITOR_COOKIE, result.visitorId, VISITOR_MAX_AGE));
    headers.append('set-cookie', cookie(SESSION_COOKIE, result.sessionId, SESSION_MAX_AGE));
    return Response.json({ ok: true, id: result.id, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201, headers });
  } catch (error) {
    console.error('[analytics] lead storage failed; attempting Telegram fallback', error);

    if (telegramHandledAtEdge) {
      return Response.json(
        { error: 'storage_unavailable' },
        { status: 500, headers: { 'cache-control': 'no-store' } },
      );
    }

    const fallbackId = randomUUID();
    const telegram = await notifyTelegramLead({
      id: fallbackId,
      duplicate: false,
      data: parsed.data,
    });

    if (telegram.sent) {
      return Response.json(
        { ok: true, id: fallbackId, duplicate: false, degraded: true, storage: 'telegram_only' },
        { status: 202, headers: { 'cache-control': 'no-store' } },
      );
    }

    return Response.json({ error: 'submission_failed' }, { status: 500, headers: { 'cache-control': 'no-store' } });
  }
}
