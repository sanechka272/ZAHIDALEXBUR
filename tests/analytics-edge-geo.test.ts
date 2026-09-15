import test from 'node:test';
import assert from 'node:assert/strict';
import { geoFromEdgeHeaders } from '../lib/analytics/edge-geo';

test('trusted Cloudflare edge headers become normalized visitor geography', () => {
  const headers = new Headers({
    'x-zab-edge-country': 'UA',
    'x-zab-edge-region-code': '46',
    'x-zab-edge-region': 'Lviv Oblast',
    'x-zab-edge-city': 'Lviv',
  });
  assert.deepEqual(geoFromEdgeHeaders(headers, true), {
    countryCode: 'UA',
    countryName: null,
    regionCode: 'UA-46',
    regionName: 'Lviv Oblast',
    city: 'Lviv',
  });
});

test('edge geography is ignored when request is not from a trusted container edge', () => {
  const headers = new Headers({ 'x-zab-edge-country': 'UA', 'x-zab-edge-city': 'Spoofed' });
  assert.equal(geoFromEdgeHeaders(headers, false), null);
});
