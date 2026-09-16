import { createHash, randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { cookies } from 'next/headers';
import { getSqlClient } from '@/lib/db/client';

export const ADMIN_SESSION_COOKIE = 'zab_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LAST_SEEN_REFRESH_MS = 15 * 60 * 1000;

export type AdminUser = { id: string; email: string };

export class UnauthorizedError extends Error {
  constructor() {
    super('unauthorized');
    this.name = 'UnauthorizedError';
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function tokenHash(rawToken: string) {
  return createHash('sha256').update(rawToken).digest('hex');
}

function cookieValue(header: string | null, name: string) {
  for (const chunk of (header ?? '').split(';')) {
    const [key, ...rest] = chunk.trim().split('=');
    if (key === name && rest.length) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function createAdmin(email: string, password: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!/^\S+@\S+\.\S+$/.test(normalized)) throw new Error('invalid_email');
  if (password.length < 12) throw new Error('password_too_short');
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const sql = getSqlClient();
  await sql`
    insert into admin_users (email, password_hash, created_at, updated_at)
    values (${normalized}, ${passwordHash}, now(), now())
    on conflict (email) do update set password_hash = excluded.password_hash, updated_at = now()
  `;
}

export async function verifyCredentials(email: string, password: string): Promise<AdminUser | null> {
  const normalized = normalizeEmail(email);
  const sql = getSqlClient();
  const [row] = await sql<{ id: string; email: string; password_hash: string }[]>`
    select id, email, password_hash from admin_users where email = ${normalized} limit 1
  `;
  if (!row) return null;
  try {
    const valid = await argon2.verify(row.password_hash, password);
    return valid ? { id: row.id, email: row.email } : null;
  } catch {
    return null;
  }
}

export async function createAdminSession(userId: string, now = new Date()) {
  const sql = getSqlClient();
  const rawToken = randomBytes(32).toString('base64url');
  const hash = tokenHash(rawToken);
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await sql`
    insert into admin_sessions (user_id, token_hash, created_at, expires_at, last_seen_at)
    values (${userId}, ${hash}, ${now}, ${expiresAt}, ${now})
  `;
  return { rawToken, expiresAt };
}

async function requireAdminToken(rawToken: string | null | undefined, now = new Date()): Promise<AdminUser> {
  if (!rawToken) throw new UnauthorizedError();
  const sql = getSqlClient();
  const hash = tokenHash(rawToken);
  const [row] = await sql<{ session_id: string; user_id: string; email: string; expires_at: Date; last_seen_at: Date }[]>`
    select s.id session_id, u.id user_id, u.email, s.expires_at, s.last_seen_at
    from admin_sessions s
    join admin_users u on u.id = s.user_id
    where s.token_hash = ${hash}
    limit 1
  `;
  if (!row || new Date(row.expires_at).getTime() <= now.getTime()) throw new UnauthorizedError();
  if (now.getTime() - new Date(row.last_seen_at).getTime() >= LAST_SEEN_REFRESH_MS) {
    await sql`update admin_sessions set last_seen_at = ${now} where id = ${row.session_id}`;
  }
  return { id: row.user_id, email: row.email };
}

export async function requireAdminRequest(request: Request, now = new Date()) {
  return requireAdminToken(cookieValue(request.headers.get('cookie'), ADMIN_SESSION_COOKIE), now);
}

export async function requireAdmin(now = new Date()) {
  const store = await cookies();
  return requireAdminToken(store.get(ADMIN_SESSION_COOKIE)?.value ?? null, now);
}

export async function logoutAdmin(rawToken: string) {
  const sql = getSqlClient();
  await sql`delete from admin_sessions where token_hash = ${tokenHash(rawToken)}`;
}
