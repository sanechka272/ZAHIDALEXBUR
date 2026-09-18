import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const route = await readFile(new URL('../app/api/leads/route.ts', import.meta.url), 'utf8');
const telegram = await readFile(new URL('../lib/notifications/telegram.ts', import.meta.url), 'utf8');
const env = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
const worker = await readFile(new URL('../cloudflare/worker.ts', import.meta.url), 'utf8');

test('successful lead submissions trigger Telegram Bot API notification', () => {
  assert.match(route, /notifyTelegramLead/);
  assert.match(route, /await notifyTelegramLead\(/);
  assert.match(telegram, /api\.telegram\.org\/bot/);
  assert.match(telegram, /sendMessage/);
  assert.match(telegram, /Нова заявка ZAHIDALEXBUR/);
  assert.match(telegram, /Телефон/);
  assert.match(telegram, /Населений пункт/);
  assert.match(telegram, /Сторінка/);
});

test('Telegram credentials stay in deployment environment and are forwarded into the container', () => {
  assert.match(env, /^TELEGRAM_BOT_TOKEN=$/m);
  assert.match(env, /^TELEGRAM_CHAT_ID=$/m);
  assert.match(worker, /TELEGRAM_BOT_TOKEN\?: string/);
  assert.match(worker, /envVars\.TELEGRAM_BOT_TOKEN = env\.TELEGRAM_BOT_TOKEN/);
  assert.match(worker, /envVars\.TELEGRAM_CHAT_ID = env\.TELEGRAM_CHAT_ID/);
});
