import type { CreateLeadInput } from '@/lib/analytics/contracts';

type TelegramLead = {
  id: string;
  duplicate: boolean;
  data: CreateLeadInput;
};

const TELEGRAM_TIMEOUT_MS = 3500;

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function line(label: string, value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? `<b>${label}:</b> ${escapeHtml(normalized)}` : null;
}

function configuredThreadId() {
  const raw = process.env.TELEGRAM_MESSAGE_THREAD_ID?.trim();
  if (!raw) return undefined;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export async function notifyTelegramLead({ id, duplicate, data }: TelegramLead) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return { sent: false, skipped: true as const };

  const lines = [
    duplicate ? '🔁 <b>Повторна заявка ZAHIDALEXBUR</b>' : '💧 <b>Нова заявка ZAHIDALEXBUR</b>',
    '',
    line('Імʼя', data.name),
    line('Телефон', data.phone),
    line('Населений пункт', data.location),
    line('Послуга', data.service),
    line('Сторінка', data.originatingPage),
    `<b>Lead ID:</b> ${escapeHtml(id)}`,
  ].filter(Boolean);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    };

    const threadId = configuredThreadId();
    if (threadId) body.message_thread_id = threadId;

    const response = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error('[telegram] lead notification failed', { status: response.status });
      return { sent: false, skipped: false as const };
    }

    return { sent: true, skipped: false as const };
  } catch (error) {
    console.error('[telegram] lead notification failed', error instanceof Error ? error.message : 'unknown_error');
    return { sent: false, skipped: false as const };
  } finally {
    clearTimeout(timeout);
  }
}
