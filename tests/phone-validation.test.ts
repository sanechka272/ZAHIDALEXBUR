import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidUaPhone, normalizeUaPhoneInput, UA_PHONE_PREFIX } from '../lib/phone';

test('phone input always keeps the +38 prefix', () => {
  assert.equal(UA_PHONE_PREFIX, '+38');
  assert.equal(normalizeUaPhoneInput(''), '+38');
  assert.equal(normalizeUaPhoneInput('+3'), '+38');
  assert.equal(normalizeUaPhoneInput('0991234567'), '+380991234567');
  assert.equal(normalizeUaPhoneInput('+380991234567'), '+380991234567');
  assert.equal(normalizeUaPhoneInput('991234567'), '+380991234567');
});

test('Ukrainian phone validation requires exact +380XXXXXXXXX format', () => {
  assert.equal(isValidUaPhone('+380991234567'), true);
  assert.equal(isValidUaPhone('+380671112233'), true);
  assert.equal(isValidUaPhone('+38'), false);
  assert.equal(isValidUaPhone('0991234567'), false);
  assert.equal(isValidUaPhone('+38099123456'), false);
  assert.equal(isValidUaPhone('+3809912345678'), false);
  assert.equal(isValidUaPhone('+48123123123'), false);
});
