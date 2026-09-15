import test from 'node:test';
import assert from 'node:assert/strict';
import { geoFromEdgeHeaders, geoTokenFromEdgeHeaders } from '../lib/analytics/edge-geo';
import { resolveGeo } from '../lib/analytics/geo';

test('trusted Cloudflare edge headers become normalized visitor geography', async () => {
  const headers = new Headers({
    'x-zab-edge-country': 'UA',
    'x-zab-edge-region-code': '46',
    'x-zab-edge-region': 'Lviv Oblast',
    'x-zab-edge-city': 'Lviv',
  });
  const expected = {
    countryCode: 'UA',
    countryName: null,
    regionCode: 'UA-46',
    regionName: 'Lviv Oblast',
    city: 'Lviv',
  };
  assert.deepEqual(geoFromEdgeHeaders(headers, true), expected);
  const token = geoTokenFromEdgeHeaders(headers, true);
  assert.ok(token?.startsWith('zab-edge:'));
  assert.deepEqual(await resolveGeo(token), expected);
});

test('edge geography is ignored when request is not from a trusted container edge', () => {
  const headers = new Headers({ 'x-zab-edge-country': 'UA', 'x-zab-edge-city': 'Spoofed' });
  assert.equal(geoFromEdgeHeaders(headers, false), null);
  assert.equal(geoTokenFromEdgeHeaders(headers, false), null);
});
