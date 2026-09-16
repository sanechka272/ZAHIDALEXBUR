import test from 'node:test';
import assert from 'node:assert/strict';
import postgres from 'postgres';
import {
  UnauthorizedError,
  createAdmin,
  createAdminSession,
  logoutAdmin,
  requireAdminRequest,
  verifyCredentials,
} from '../lib/analytics/auth';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required for analytics auth tests');
const sql = postgres(databaseUrl, { max: 1 });

async function resetAuth() {
  await sql`truncate table admin_sessions, admin_users cascade`;
}

test.beforeEach(resetAuth);

test('admin passwords use Argon2id and credentials verify without storing plaintext', async () => {
  await createAdmin('Admin@Example.com', 'correct-horse-battery');
  const [row] = await sql<{ email: string; password_hash: string }[]>`select email, password_hash from admin_users limit 1`;
  assert.equal(row.email, 'admin@example.com');
  assert.match(row.password_hash, /^\$argon2id\$/);
  assert.doesNotMatch(row.password_hash, /correct-horse-battery/);

  const valid = await verifyCredentials('ADMIN@example.com', 'correct-horse-battery');
  const invalid = await verifyCredentials('admin@example.com', 'wrong-password');
  assert.equal(valid?.email, 'admin@example.com');
  assert.equal(invalid, null);
});

test('admin session stores only token hash and authenticates request cookie', async () => {
  await createAdmin('admin@example.com', 'correct-horse-battery');
  const user = await verifyCredentials('admin@example.com', 'correct-horse-battery');
  assert.ok(user);
  const session = await createAdminSession(user.id, new Date('2026-09-14T12:00:00Z'));

  const [stored] = await sql<{ token_hash: string }[]>`select token_hash from admin_sessions limit 1`;
  assert.notEqual(stored.token_hash, session.rawToken);
  assert.match(stored.token_hash, /^[a-f0-9]{64}$/);

  const request = new Request('https://zahidalexbur.com.ua/api/analytics/summary', {
    headers: { cookie: `zab_admin_session=${encodeURIComponent(session.rawToken)}` },
  });
  const authenticated = await requireAdminRequest(request, new Date('2026-09-14T12:01:00Z'));
  assert.equal(authenticated.id, user.id);
});

test('expired or logged-out session cannot authenticate', async () => {
  await createAdmin('admin@example.com', 'correct-horse-battery');
  const user = await verifyCredentials('admin@example.com', 'correct-horse-battery');
  assert.ok(user);
  const session = await createAdminSession(user.id, new Date('2026-09-01T00:00:00Z'));
  const request = new Request('https://zahidalexbur.com.ua/api/analytics/summary', {
    headers: { cookie: `zab_admin_session=${encodeURIComponent(session.rawToken)}` },
  });
  await assert.rejects(() => requireAdminRequest(request, new Date('2026-09-14T00:00:00Z')), UnauthorizedError);

  const active = await createAdminSession(user.id, new Date('2026-09-14T12:00:00Z'));
  await logoutAdmin(active.rawToken);
  const loggedOut = new Request('https://zahidalexbur.com.ua/api/analytics/summary', {
    headers: { cookie: `zab_admin_session=${encodeURIComponent(active.rawToken)}` },
  });
  await assert.rejects(() => requireAdminRequest(loggedOut, new Date('2026-09-14T12:01:00Z')), UnauthorizedError);
});

test.after(async () => { await sql.end({ timeout: 2 }); });
