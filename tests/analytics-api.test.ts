import test from 'node:test';
import assert from 'node:assert/strict';
import { POST as trackPost } from '../app/api/analytics/track/route';
import { POST as leadPost } from '../app/api/leads/route';
import { POST as loginPost } from '../app/api/analytics/auth/login/route';
import { GET as summaryGet } from '../app/api/analytics/summary/route';
import { GET as exportGet } from '../app/api/analytics/export/route';
import { GET as settingsGet, PUT as settingsPut } from '../app/api/analytics/settings/route';
import { GET as healthGet } from '../app/api/health/route';

test('tracking API rejects malformed analytics payloads', async () => {
  const request = new Request('https://zahidalexbur.com/api/analytics/track', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://zahidalexbur.com' },
    body: JSON.stringify({ nope: true }),
  });
  const response = await trackPost(request);
  assert.equal(response.status, 400);
});

test('tracking API rejects cross-origin posts', async () => {
  const request = new Request('https://zahidalexbur.com/api/analytics/track', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    body: JSON.stringify({
      eventId: '12345678-1234', eventName: 'page_view', path: '/', url: 'https://zahidalexbur.com/'
    }),
  });
  const response = await trackPost(request);
  assert.equal(response.status, 403);
});

test('lead API rejects honeypot and unrealistically fast submissions', async () => {
  const base = {
    phone: '+380991234567', originatingPage: '/', startedAtMs: Date.now(),
  };
  const honeypot = await leadPost(new Request('https://zahidalexbur.com/api/leads', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://zahidalexbur.com' },
    body: JSON.stringify({ ...base, honeypot: 'spam' }),
  }));
  assert.equal(honeypot.status, 400);

  const tooFast = await leadPost(new Request('https://zahidalexbur.com/api/leads', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://zahidalexbur.com' },
    body: JSON.stringify({ ...base, honeypot: '' }),
  }));
  assert.equal(tooFast.status, 400);
});

test('lead API rejects cross-origin posts', async () => {
  const response = await leadPost(new Request('https://zahidalexbur.com/api/leads', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    body: JSON.stringify({ phone: '+380991234567', originatingPage: '/', startedAtMs: Date.now() - 5000, honeypot: '' }),
  }));
  assert.equal(response.status, 403);
});

test('admin login API rejects malformed payloads before credential lookup', async () => {
  const response = await loginPost(new Request('https://zahidalexbur.com/api/analytics/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://zahidalexbur.com' },
    body: JSON.stringify({ email: 'not-an-email' }),
  }));
  assert.equal(response.status, 400);
});

test('protected analytics summary API rejects unauthenticated requests', async () => {
  const response = await summaryGet(new Request('https://zahidalexbur.com/api/analytics/summary?preset=last30'));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: { code: 'unauthorized', message: 'Authentication required' } });
});

test('analytics export requires an authenticated admin session', async () => {
  const response = await exportGet(new Request('https://zahidalexbur.com/api/analytics/export?preset=last30&type=overview'));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: { code: 'unauthorized', message: 'Authentication required' } });
});

test('analytics settings read and write endpoints require authentication', async () => {
  const getResponse = await settingsGet(new Request('https://zahidalexbur.com/api/analytics/settings'));
  assert.equal(getResponse.status, 401);

  const putResponse = await settingsPut(new Request('https://zahidalexbur.com/api/analytics/settings', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ gtmEnabled: true, gtmContainerId: 'GTM-ABC123' }),
  }));
  assert.equal(putResponse.status, 401);
});

test('health endpoint reports runtime readiness without depending on database availability', async () => {
  const response = await healthGet();
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.runtime, 'ok');
  assert.equal(typeof body.databaseConfigured, 'boolean');
  assert.equal(typeof body.telegramConfigured, 'boolean');
});


test('lead API rejects malformed Ukrainian phone numbers', async () => {
  for (const phone of ['+38', '+38099123456', '+3809912345678', '+48123123123', '0991234567']) {
    const response = await leadPost(new Request('https://zahidalexbur.com/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://zahidalexbur.com' },
      body: JSON.stringify({
        phone,
        originatingPage: '/',
        startedAtMs: Date.now() - 5000,
        honeypot: '',
      }),
    }));
    assert.equal(response.status, 400, `expected invalid phone ${phone} to be rejected`);
  }
});
