import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const route = await readFile(new URL('../app/api/leads/route.ts', import.meta.url), 'utf8');
const telegram = await readFile(new URL('../lib/notifications/telegram.ts', import.meta.url), 'utf8');
const env = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
const worker = await readFile(new URL('../cloudflare/worker.ts', import.meta.url), 'utf8');

test('successful lead submissions trigger Telegram Bot API notification', () => {
  assert.match(route, /notifyTelegramLead/);
  assert.match(route, /telegramHandledAtEdge/);
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


test('lead endpoint falls back to Telegram when database storage is unavailable', () => {
  assert.match(route, /lead storage failed; attempting Telegram fallback/);
  assert.match(route, /const fallbackId = randomUUID\(\)/);
  assert.match(route, /if \(telegram\.sent\)/);
  assert.match(route, /storage: 'telegram_only'/);
  assert.match(route, /status: 202/);
});


test('Worker edge owns Telegram delivery and exposes a safe status probe', () => {
  assert.match(worker, /sendLeadTelegramAtEdge/);
  assert.match(worker, /x-zab-telegram-edge/);
  assert.match(worker, /\/api\/telegram-status/);
  assert.match(worker, /telegramApiRequest\(env, 'getMe'\)/);
  assert.match(worker, /telegramApiRequest\(env, 'getChat'/);
  assert.match(worker, /x-zab-telegram-status/);
});

test('container route skips duplicate Telegram delivery when edge already handled it', () => {
  assert.match(route, /telegramHandledAtEdge/);
  assert.match(route, /if \(!telegramHandledAtEdge\)/);
  assert.match(route, /storage_unavailable/);
});


test('lead POST is completed at the Worker edge before container/database work', () => {
  assert.match(worker, /request\.method === 'POST' && url\.pathname === '\/api\/leads'/);
  assert.match(worker, /sendLeadTelegramAtEdge\(env, lead, leadId, false\)/);
  assert.match(worker, /storage: 'edge_telegram'/);
  assert.match(worker, /x-zab-lead-path': 'edge'/);

  const directLeadPosition = worker.indexOf("request.method === 'POST' && url.pathname === '/api/leads'");
  const normalContainerPosition = worker.indexOf("const container = getContainer");
  assert.ok(
    directLeadPosition >= 0 && normalContainerPosition > directLeadPosition,
    'direct Telegram lead delivery must happen before the normal container path',
  );
});
