import { z } from 'zod';
import { ADMIN_SESSION_COOKIE, createAdminSession, verifyCredentials } from '@/lib/analytics/auth';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; } catch { return false; }
}

function rateKey(request: Request, email: string) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return `${ip}:${email.toLowerCase()}`;
}

function blocked(key: string, now: number) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

function fail(key: string, now: number) {
  const entry = attempts.get(key);
  if (!entry || entry.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else entry.count += 1;
}

function sessionCookie(token: string, expiresAt: Date) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: 'forbidden' }, { status: 403 });
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return Response.json({ error: 'unsupported_media_type' }, { status: 415 });
  }

  let raw: unknown;
  try { raw = await request.json(); } catch { return Response.json({ error: 'invalid_json' }, { status: 400 }); }
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return Response.json({ error: 'invalid_payload' }, { status: 400 });

  const now = Date.now();
  const key = rateKey(request, parsed.data.email);
  if (blocked(key, now)) return Response.json({ error: 'too_many_attempts' }, { status: 429 });

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    fail(key, now);
    return Response.json({ error: 'invalid_credentials' }, { status: 401 });
  }

  attempts.delete(key);
  const session = await createAdminSession(user.id);
  const headers = new Headers({ 'cache-control': 'no-store' });
  headers.append('set-cookie', sessionCookie(session.rawToken, session.expiresAt));
  return Response.json({ ok: true, user: { email: user.email } }, { status: 200, headers });
}
