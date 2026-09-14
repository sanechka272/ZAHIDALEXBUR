import test from 'node:test';
import assert from 'node:assert/strict';
import { POST as trackPost } from '../app/api/analytics/track/route';
import { POST as leadPost } from '../app/api/leads/route';
import { POST as loginPost } from '../app/api/analytics/auth/login/route';
import { GET as summaryGet } from '../app/api/analytics/summary/route';

test('tracking API rejects malformed analytics payloads', async () => {
  const request = new Request('https://zahidalexbur.com.ua/api/analytics/track', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://zahidalexbur.com.ua' },
    body: JSON.stringify({ nope: true }),
  });
  const response = await trackPost(request);
  assert.equal(response.status, 400);
});

test('tracking API rejects cross-origin posts', async () => {
  const request = new Request('https://zahidalexbur.com.ua/api/analytics/track', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    body: JSON.stringify({
      eventId: '12345678-1234', eventName: 'page_view', path: '/', url: 'https://zahidalexbur.com.ua/'
    }),
  });
  const response = await trackPost(request);
  assert.equal(response.status, 403);
});

test('lead API rejects honeypot and unrealistically fast submissions', async () => {
  const base = {
    phone: '+380991234567', originatingPage: '/', startedAtMs: Date.now(),
  };
  const honeypot = await leadPost(new Request('https://zahidalexbur.com.ua/api/leads', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://zahidalexbur.com.ua' },
    body: JSON.stringify({ ...base, honeypot: 'spam' }),
  }));
  assert.equal(honeypot.status, 400);

  const tooFast = await leadPost(new Request('https://zahidalexbur.com.ua/api/leads', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://zahidalexbur.com.ua' },
    body: JSON.stringify({ ...base, honeypot: '' }),
  }));
  assert.equal(tooFast.status, 400);
});

test('lead API rejects cross-origin posts', async () => {
  const response = await leadPost(new Request('https://zahidalexbur.com.ua/api/leads', {
    method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
    body: JSON.stringify({ phone: '+380991234567', originatingPage: '/', startedAtMs: Date.now() - 5000, honeypot: '' }),
  }));
  assert.equal(response.status, 403);
});

test('admin login API rejects malformed payloads before credential lookup', async () => {
  const response = await loginPost(new Request('https://zahidalexbur.com.ua/api/analytics/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://zahidalexbur.com.ua' },
    body: JSON.stringify({ email: 'not-an-email' }),
  }));
  assert.equal(response.status, 400);
});

test('protected analytics summary API rejects unauthenticated requests', async () => {
  const response = await summaryGet(new Request('https://zahidalexbur.com.ua/api/analytics/summary?preset=last30'));
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: { code: 'unauthorized', message: 'Authentication required' } });
});
