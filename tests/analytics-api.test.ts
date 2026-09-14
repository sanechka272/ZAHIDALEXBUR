import test from 'node:test';
import assert from 'node:assert/strict';
import { POST as trackPost } from '../app/api/analytics/track/route';

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
