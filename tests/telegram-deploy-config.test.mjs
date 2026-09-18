import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const wrangler = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
const telegram = await readFile(new URL('../lib/notifications/telegram.ts', import.meta.url), 'utf8');

test('production deploy requires Telegram credentials', () => {
  assert.match(wrangler, /"secrets"\s*:\s*\{/);
  assert.match(wrangler, /"TELEGRAM_BOT_TOKEN"/);
  assert.match(wrangler, /"TELEGRAM_CHAT_ID"/);
});

test('Telegram API failures log the safe API description for diagnosis', () => {
  assert.match(telegram, /description = 'telegram_api_error'/);
  assert.match(telegram, /lead notification failed/);
  assert.match(telegram, /status: response\.status, description/);
});
