import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const leadForm = await readFile(new URL('../components/LeadForm.tsx', import.meta.url), 'utf8');

test('lead form uses application phone validation instead of browser-native pattern validation', () => {
  assert.match(leadForm, /<form className="reference-lead-form" onSubmit=\{submit\} noValidate>/);
  assert.doesNotMatch(leadForm, /pattern="\\\\\+380/);
  assert.match(leadForm, /isValidUaPhone\(phone\)/);
  assert.match(leadForm, /type="tel"/);
});
