import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAttribution, parseAttribution } from '../lib/analytics/attribution';

test('explicit UTM parameters take priority over referrer classification', () => {
  const a = parseAttribution('https://zahidalexbur.com.ua/?utm_source=facebook&utm_medium=paid_social&utm_campaign=lviv&utm_content=video-a&utm_term=water', 'https://www.google.com/search?q=drilling');
  assert.equal(a.source, 'facebook');
  assert.equal(a.medium, 'paid_social');
  assert.equal(a.campaign, 'lviv');
  assert.equal(a.content, 'video-a');
  assert.equal(a.term, 'water');
  assert.equal(a.attributable, true);
});

test('click identifiers create paid attribution when UTM source and medium are absent', () => {
  const google = parseAttribution('https://zahidalexbur.com.ua/?gclid=abc', null);
  assert.equal(google.source, 'google');
  assert.equal(google.medium, 'cpc');
  const meta = parseAttribution('https://zahidalexbur.com.ua/?fbclid=def', null);
  assert.equal(meta.source, 'meta');
  assert.equal(meta.medium, 'paid_social');
});

test('search referrer becomes organic and empty referrer becomes direct', () => {
  const organic = parseAttribution('https://zahidalexbur.com.ua/', 'https://www.google.com/search?q=well');
  assert.equal(organic.source, 'google');
  assert.equal(organic.medium, 'organic');
  assert.equal(organic.attributable, true);
  const direct = parseAttribution('https://zahidalexbur.com.ua/', null);
  assert.equal(direct.source, 'direct');
  assert.equal(direct.medium, 'none');
  assert.equal(direct.attributable, false);
});

test('first touch is immutable and direct return does not erase last attributable touch', () => {
  const paid = parseAttribution('https://zahidalexbur.com.ua/?utm_source=google&utm_medium=cpc&utm_campaign=search', null);
  const initial = applyAttribution(null, paid);
  const direct = parseAttribution('https://zahidalexbur.com.ua/prices', null);
  const returned = applyAttribution(initial, direct);
  assert.equal(returned.first.source, 'google');
  assert.equal(returned.last.source, 'google');
  assert.equal(returned.last.campaign, 'search');
});

test('new attributable visit updates last touch but never first touch', () => {
  const first = parseAttribution('https://zahidalexbur.com.ua/?utm_source=google&utm_medium=cpc&utm_campaign=search', null);
  const initial = applyAttribution(null, first);
  const second = parseAttribution('https://zahidalexbur.com.ua/?utm_source=instagram&utm_medium=paid_social&utm_campaign=retargeting', null);
  const updated = applyAttribution(initial, second);
  assert.equal(updated.first.source, 'google');
  assert.equal(updated.last.source, 'instagram');
  assert.equal(updated.last.campaign, 'retargeting');
});
