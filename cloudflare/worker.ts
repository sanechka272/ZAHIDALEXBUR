import { Container, getContainer } from '@cloudflare/containers';

type EdgeCf = {
  country?: string | null;
  region?: string | null;
  regionCode?: string | null;
  city?: string | null;
};

type VersionMetadata = {
  id?: string;
  tag?: string;
  timestamp?: string;
};

type Env = {
  APP_CONTAINER: unknown;
  ASSETS?: { fetch(input: Request | URL | string): Promise<Response> };
  CF_VERSION_METADATA?: VersionMetadata;
  DATABASE_URL?: string;
  ANALYTICS_SESSION_SECRET?: string;
  DATABASE_POOL_SIZE?: string;
  ANALYTICS_RETENTION_BATCH_SIZE?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  TELEGRAM_MESSAGE_THREAD_ID?: string;
};

type WorkerContext = {
  waitUntil(promise: Promise<unknown>): void;
};

type CacheKind = 'image' | 'static';

type EdgeLeadPayload = {
  name?: string;
  phone: string;
  location?: string;
  service?: string;
  originatingPage: string;
  honeypot: string;
  startedAtMs: number;
};

type TelegramApiResult = {
  ok: boolean;
  status: number;
  description?: string;
};

export class ZahidaContainer extends Container {
  defaultPort = 3000;
  sleepAfter = '2h';
  pingEndpoint = 'localhost/api/health';
  enableInternet = true;

  constructor(ctx: any, env: Env) {
    super(ctx, env);

    const envVars: Record<string, string> = {
      DATABASE_POOL_SIZE: env.DATABASE_POOL_SIZE ?? '5',
      ANALYTICS_RETENTION_BATCH_SIZE: env.ANALYTICS_RETENTION_BATCH_SIZE ?? '5000',
    };

    if (env.DATABASE_URL) envVars.DATABASE_URL = env.DATABASE_URL;
    if (env.ANALYTICS_SESSION_SECRET) envVars.ANALYTICS_SESSION_SECRET = env.ANALYTICS_SESSION_SECRET;
    if (env.TELEGRAM_BOT_TOKEN) envVars.TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN;
    if (env.TELEGRAM_CHAT_ID) envVars.TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID;
    if (env.TELEGRAM_MESSAGE_THREAD_ID) envVars.TELEGRAM_MESSAGE_THREAD_ID = env.TELEGRAM_MESSAGE_THREAD_ID;

    this.envVars = envVars;
  }
}

function edgeRequest(request: Request, trustedHeaders: Record<string, string> = {}) {
  const headers = new Headers(request.headers);
  const internalHeaders = [
    'x-zab-edge-country',
    'x-zab-edge-region',
    'x-zab-edge-region-code',
    'x-zab-edge-city',
    'x-zab-telegram-edge',
  ];
  for (const name of internalHeaders) headers.delete(name);

  const cf = (request as Request & { cf?: EdgeCf }).cf;
  if (cf?.country) headers.set('x-zab-edge-country', cf.country);
  if (cf?.region) headers.set('x-zab-edge-region', cf.region);
  if (cf?.regionCode) headers.set('x-zab-edge-region-code', cf.regionCode);
  if (cf?.city) headers.set('x-zab-edge-city', cf.city);
  for (const [name, value] of Object.entries(trustedHeaders)) headers.set(name, value);

  return new Request(request, { headers });
}


function escapeTelegramHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

async function readEdgeLeadPayload(request: Request): Promise<EdgeLeadPayload | null> {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) return null;
    } catch {
      return null;
    }
  }

  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;

  let raw: Record<string, unknown>;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 16 * 1024) return null;
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    raw = parsed as Record<string, unknown>;
  } catch {
    return null;
  }

  const phone = cleanString(raw.phone);
  const digits = phone.replace(/\D/g, '');
  const honeypot = cleanString(raw.honeypot);
  const originatingPage = cleanString(raw.originatingPage);
  const startedAtMs = typeof raw.startedAtMs === 'number' ? raw.startedAtMs : Number.NaN;
  const now = Date.now();

  if (honeypot || !originatingPage || digits.length < 7 || digits.length > 15) return null;
  if (!Number.isFinite(startedAtMs) || startedAtMs > now || now - startedAtMs < 1200) return null;

  return {
    name: cleanString(raw.name) || undefined,
    phone,
    location: cleanString(raw.location) || undefined,
    service: cleanString(raw.service) || undefined,
    originatingPage,
    honeypot,
    startedAtMs,
  };
}

async function telegramApiRequest(
  env: Env,
  method: string,
  payload?: Record<string, unknown>,
): Promise<TelegramApiResult> {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return { ok: false, status: 500, description: 'bot_token_missing' };

  try {
    const response = await fetch('https://api.telegram.org/bot' + token + '/' + method, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload ?? {}),
    });

    let body: { ok?: boolean; description?: string } = {};
    try {
      body = await response.json() as { ok?: boolean; description?: string };
    } catch {
      // Telegram normally returns JSON; keep a generic description otherwise.
    }

    return {
      ok: response.ok && body.ok !== false,
      status: response.status,
      description: body.description,
    };
  } catch (error) {
    return {
      ok: false,
      status: 503,
      description: error instanceof Error ? error.message : 'telegram_network_error',
    };
  }
}

async function sendLeadTelegramAtEdge(
  env: Env,
  lead: EdgeLeadPayload,
  leadId: string,
  duplicate: boolean,
): Promise<TelegramApiResult> {
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  if (!chatId) return { ok: false, status: 500, description: 'chat_id_missing' };

  const lines = [
    duplicate ? '🔁 <b>Повторна заявка ZAHIDALEXBUR</b>' : '💧 <b>Нова заявка ZAHIDALEXBUR</b>',
    '',
    lead.name ? '<b>Імʼя:</b> ' + escapeTelegramHtml(lead.name) : null,
    '<b>Телефон:</b> ' + escapeTelegramHtml(lead.phone),
    lead.location ? '<b>Населений пункт:</b> ' + escapeTelegramHtml(lead.location) : null,
    lead.service ? '<b>Послуга:</b> ' + escapeTelegramHtml(lead.service) : null,
    '<b>Сторінка:</b> ' + escapeTelegramHtml(lead.originatingPage),
    '<b>Lead ID:</b> ' + escapeTelegramHtml(leadId),
  ].filter(Boolean);

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: lines.join('\n'),
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };

  const threadRaw = env.TELEGRAM_MESSAGE_THREAD_ID?.trim();
  if (threadRaw) {
    const threadId = Number.parseInt(threadRaw, 10);
    if (Number.isFinite(threadId) && threadId > 0) body.message_thread_id = threadId;
  }

  return telegramApiRequest(env, 'sendMessage', body);
}

async function telegramStatusResponse(env: Env) {
  const tokenConfigured = Boolean(env.TELEGRAM_BOT_TOKEN?.trim());
  const chatConfigured = Boolean(env.TELEGRAM_CHAT_ID?.trim());

  if (!tokenConfigured || !chatConfigured) {
    return Response.json(
      {
        configured: false,
        tokenConfigured,
        chatConfigured,
        bot: null,
        chat: null,
      },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }

  const [bot, chat] = await Promise.all([
    telegramApiRequest(env, 'getMe'),
    telegramApiRequest(env, 'getChat', { chat_id: env.TELEGRAM_CHAT_ID!.trim() }),
  ]);

  return Response.json(
    {
      configured: true,
      bot,
      chat,
      ready: bot.ok && chat.ok,
    },
    { status: bot.ok && chat.ok ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  );
}

function responseWithTelegramStatus(response: Response, status: 'sent' | 'failed') {
  const headers = new Headers(response.headers);
  headers.set('x-zab-telegram-status', status);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isBackendPath(pathname: string) {
  return pathname === '/api' || pathname.startsWith('/api/') || pathname === '/analytics' || pathname.startsWith('/analytics/');
}

function cacheKind(request: Request, url: URL): CacheKind | null {
  if (request.method !== 'GET' || isBackendPath(url.pathname)) return null;

  if (url.pathname === '/_next/image') return 'image';
  if (url.pathname.startsWith('/_next/static/')) return 'static';

  // Do not cache page HTML in the Worker Cache API. The Next.js app lives in a
  // separately rolled-out Container image, so Worker-version keyed HTML could
  // outlive a CSS/content-only container deploy and make the site look stale.
  return null;
}

function cacheKey(request: Request, env: Env, kind: CacheKind) {
  const url = new URL(request.url);
  url.searchParams.set('__zab_worker_version', env.CF_VERSION_METADATA?.id ?? 'current');

  if (kind === 'image') {
    const accept = request.headers.get('accept') ?? '';
    url.searchParams.set('__zab_image_format', accept.includes('image/avif') ? 'avif' : accept.includes('image/webp') ? 'webp' : 'fallback');
  }

  return new Request(url.toString(), { method: 'GET' });
}

function browserCacheControl(kind: CacheKind) {
  if (kind === 'static') return 'public, max-age=31536000, immutable';
  return 'public, max-age=31536000, immutable';
}

function responseWithCacheStatus(response: Response, kind: CacheKind, status: 'HIT' | 'MISS') {
  const headers = new Headers(response.headers);
  headers.set('cache-control', browserCacheControl(kind));
  headers.set('x-zab-edge-cache', status);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function responseWithRelease(response: Response, env: Env) {
  const headers = new Headers(response.headers);
  headers.set('x-zab-worker-version', env.CF_VERSION_METADATA?.id ?? 'unknown');
  headers.set('x-zab-container-generation', 'v5');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function canStore(response: Response) {
  if (response.status !== 200) return false;
  if (response.headers.has('set-cookie')) return false;
  const cacheControl = response.headers.get('cache-control') ?? '';
  return !/private|no-store/i.test(cacheControl);
}

function localImageSource(value: string | null) {
  if (!value || !value.startsWith('/media/')) return null;
  if (value.includes('..') || value.includes('\\')) return null;
  return value;
}

function imageFormat(request: Request) {
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('image/avif')) return 'avif';
  if (accept.includes('image/webp')) return 'webp';
  return undefined;
}

async function transformNextImageAtEdge(request: Request, url: URL) {
  if (request.method !== 'GET' || url.pathname !== '/_next/image') return null;

  const source = localImageSource(url.searchParams.get('url'));
  const width = Number.parseInt(url.searchParams.get('w') ?? '', 10);
  const requestedQuality = Number.parseInt(url.searchParams.get('q') ?? '90', 10);
  if (!source || !Number.isFinite(width) || width < 16 || width > 3840) return null;

  const quality = Math.min(90, Math.max(78, Number.isFinite(requestedQuality) ? requestedQuality : 82));
  const sourceUrl = new URL(source, url.origin);
  const format = imageFormat(request);
  const image: Record<string, string | number> = {
    width,
    quality,
    fit: 'scale-down',
  };
  if (format) image.format = format;

  try {
    const transformed = await fetch(sourceUrl.toString(), {
      headers: { accept: request.headers.get('accept') ?? 'image/webp,image/*,*/*;q=0.8' },
      cf: { image },
    } as RequestInit & { cf: { image: Record<string, string | number> } });

    if (!transformed.ok) return null;

    const headers = new Headers(transformed.headers);
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    headers.set('x-zab-image-edge', 'cloudflare');
    headers.delete('set-cookie');

    return new Response(transformed.body, {
      status: transformed.status,
      statusText: transformed.statusText,
      headers,
    });
  } catch {
    return null;
  }
}

function isImageResizingSubrequest(request: Request, url: URL) {
  return url.pathname.startsWith('/media/') && /image-resizing/i.test(request.headers.get('via') ?? '');
}

export default {
  async fetch(request: Request, env: Env, ctx: WorkerContext) {
    const url = new URL(request.url);

    if (isImageResizingSubrequest(request, url) && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    if (request.method === 'GET' && url.pathname === '/api/telegram-status') {
      return responseWithRelease(await telegramStatusResponse(env), env);
    }

    // Lead delivery is handled at the Worker edge first. Telegram must not depend
    // on the Next.js container, database availability, or container cold starts.
    if (request.method === 'POST' && url.pathname === '/api/leads') {
      const lead = await readEdgeLeadPayload(request.clone());
      if (!lead) {
        return responseWithRelease(
          Response.json(
            { error: 'invalid_submission' },
            { status: 400, headers: { 'cache-control': 'no-store', 'x-zab-lead-path': 'edge' } },
          ),
          env,
        );
      }

      const leadId = crypto.randomUUID();
      const telegram = await sendLeadTelegramAtEdge(env, lead, leadId, false);

      if (!telegram.ok) {
        console.error('[telegram-edge] lead delivery failed', telegram);
        return responseWithRelease(
          Response.json(
            { error: 'telegram_delivery_failed' },
            {
              status: 502,
              headers: {
                'cache-control': 'no-store',
                'x-zab-lead-path': 'edge',
                'x-zab-telegram-status': 'failed',
              },
            },
          ),
          env,
        );
      }

      // Preserve analytics storage as best-effort background work. The visitor
      // should never see a failed form merely because analytics/database storage
      // is temporarily unavailable.
      const storageRequest = request.clone();
      const storageContainer = getContainer(env.APP_CONTAINER as any, 'zahidalexbur-production-v5');
      ctx.waitUntil(
        storageContainer
          .fetch(edgeRequest(storageRequest, { 'x-zab-telegram-edge': '1' }))
          .then((storageResponse) => {
            if (!storageResponse.ok) {
              console.error('[analytics-edge] background lead storage failed', storageResponse.status);
            }
          })
          .catch((error) => {
            console.error('[analytics-edge] background lead storage crashed', error);
          }),
      );

      return responseWithRelease(
        Response.json(
          { ok: true, id: leadId, duplicate: false, storage: 'edge_telegram' },
          {
            status: 201,
            headers: {
              'cache-control': 'no-store',
              'x-zab-lead-path': 'edge',
              'x-zab-telegram-status': 'sent',
            },
          },
        ),
        env,
      );
    }

    const edgeImage = await transformNextImageAtEdge(request, url);
    if (edgeImage) return edgeImage;

    const kind = cacheKind(request, url);
    const cache = (caches as any).default as {
      match(key: Request): Promise<Response | undefined>;
      put(key: Request, response: Response): Promise<void>;
    };

    if (kind) {
      const key = cacheKey(request, env, kind);
      const cached = await cache.match(key);
      if (cached) return responseWithRelease(responseWithCacheStatus(cached, kind, 'HIT'), env);
    }

    // New object name forces a fresh stateless Next.js container instance once,
    // avoiding a previously warm Durable Object instance during the rollout.
    const container = getContainer(env.APP_CONTAINER as any, 'zahidalexbur-production-v5');
    const isLeadSubmission = request.method === 'POST' && url.pathname === '/api/leads';
    const leadRequestCopy = isLeadSubmission ? request.clone() : null;

    let response: Response;
    try {
      response = await container.fetch(
        edgeRequest(request, isLeadSubmission ? { 'x-zab-telegram-edge': '1' } : {}),
      );
    } catch (error) {
      if (leadRequestCopy) {
        const lead = await readEdgeLeadPayload(leadRequestCopy);
        if (lead) {
          const fallbackId = crypto.randomUUID();
          const telegram = await sendLeadTelegramAtEdge(env, lead, fallbackId, false);
          if (telegram.ok) {
            return responseWithRelease(
              Response.json(
                { ok: true, id: fallbackId, duplicate: false, degraded: true, storage: 'telegram_only' },
                { status: 202, headers: { 'cache-control': 'no-store', 'x-zab-telegram-status': 'sent' } },
              ),
              env,
            );
          }
          console.error('[telegram-edge] container failure fallback failed', telegram);
        }
      }
      throw error;
    }

    if (isLeadSubmission && leadRequestCopy) {
      const lead = await readEdgeLeadPayload(leadRequestCopy);

      if (lead && response.ok) {
        let result: { id?: string; duplicate?: boolean } = {};
        try {
          result = await response.clone().json() as { id?: string; duplicate?: boolean };
        } catch {
          // Keep a generated request id if the container response is unexpectedly non-JSON.
        }

        const telegram = await sendLeadTelegramAtEdge(
          env,
          lead,
          result.id ?? crypto.randomUUID(),
          result.duplicate === true,
        );

        if (!telegram.ok) console.error('[telegram-edge] lead delivery failed', telegram);
        return responseWithRelease(responseWithTelegramStatus(response, telegram.ok ? 'sent' : 'failed'), env);
      }

      if (lead && response.status >= 500) {
        const fallbackId = crypto.randomUUID();
        const telegram = await sendLeadTelegramAtEdge(env, lead, fallbackId, false);

        if (telegram.ok) {
          return responseWithRelease(
            Response.json(
              { ok: true, id: fallbackId, duplicate: false, degraded: true, storage: 'telegram_only' },
              { status: 202, headers: { 'cache-control': 'no-store', 'x-zab-telegram-status': 'sent' } },
            ),
            env,
          );
        }

        console.error('[telegram-edge] database fallback delivery failed', telegram);
      }
    }

    if (!kind || !canStore(response)) return responseWithRelease(response, env);

    const key = cacheKey(request, env, kind);
    const cacheCopy = response.clone();
    const cacheHeaders = new Headers(cacheCopy.headers);
    cacheHeaders.set('cache-control', 'public, max-age=31536000, immutable');
    cacheHeaders.set('x-zab-edge-cache', 'STORED');

    ctx.waitUntil(cache.put(key, new Response(cacheCopy.body, {
      status: cacheCopy.status,
      statusText: cacheCopy.statusText,
      headers: cacheHeaders,
    })));

    return responseWithRelease(responseWithCacheStatus(response, kind, 'MISS'), env);
  },
};
