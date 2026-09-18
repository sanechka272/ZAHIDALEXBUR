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

function edgeRequest(request: Request) {
  const headers = new Headers(request.headers);
  const internalHeaders = [
    'x-zab-edge-country',
    'x-zab-edge-region',
    'x-zab-edge-region-code',
    'x-zab-edge-city',
  ];
  for (const name of internalHeaders) headers.delete(name);

  const cf = (request as Request & { cf?: EdgeCf }).cf;
  if (cf?.country) headers.set('x-zab-edge-country', cf.country);
  if (cf?.region) headers.set('x-zab-edge-region', cf.region);
  if (cf?.regionCode) headers.set('x-zab-edge-region-code', cf.regionCode);
  if (cf?.city) headers.set('x-zab-edge-city', cf.city);

  return new Request(request, { headers });
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
  headers.set('x-zab-container-generation', 'v2');
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

  const quality = Math.min(95, Math.max(88, Number.isFinite(requestedQuality) ? requestedQuality : 90));
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
    const container = getContainer(env.APP_CONTAINER as any, 'zahidalexbur-production-v2');
    const response = await container.fetch(edgeRequest(request));

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
