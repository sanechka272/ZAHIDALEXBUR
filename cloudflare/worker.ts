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
};

type WorkerContext = {
  waitUntil(promise: Promise<unknown>): void;
};

type CacheKind = 'html' | 'image' | 'static';

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

function isRscRequest(request: Request) {
  const accept = request.headers.get('accept') ?? '';
  return request.headers.has('rsc') || request.headers.has('next-router-state-tree') || accept.includes('text/x-component');
}

function cacheKind(request: Request, url: URL): CacheKind | null {
  if (request.method !== 'GET' || isBackendPath(url.pathname)) return null;

  if (url.pathname === '/_next/image') return 'image';
  if (url.pathname.startsWith('/_next/static/')) return 'static';

  const isPublicDocument = url.pathname === '/' || url.pathname === '/blog' || url.pathname.startsWith('/blog/');
  if (isPublicDocument && !isRscRequest(request) && (request.headers.get('accept') ?? '').includes('text/html')) return 'html';

  return null;
}

function cacheKey(request: Request, env: Env, kind: CacheKind) {
  const url = new URL(request.url);
  url.searchParams.set('__zab_worker_version', env.CF_VERSION_METADATA?.id ?? 'current');

  if (kind === 'image') {
    const accept = request.headers.get('accept') ?? '';
    url.searchParams.set('__zab_image_format', accept.includes('image/webp') ? 'webp' : 'fallback');
  }

  return new Request(url.toString(), { method: 'GET' });
}

function browserCacheControl(kind: CacheKind) {
  if (kind === 'static') return 'public, max-age=31536000, immutable';
  if (kind === 'image') return 'public, max-age=86400, stale-while-revalidate=604800';
  return 'public, max-age=0, must-revalidate';
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

function canStore(response: Response) {
  if (response.status !== 200) return false;
  if (response.headers.has('set-cookie')) return false;
  const cacheControl = response.headers.get('cache-control') ?? '';
  return !/private|no-store/i.test(cacheControl);
}

export default {
  async fetch(request: Request, env: Env, ctx: WorkerContext) {
    const url = new URL(request.url);
    const kind = cacheKind(request, url);
    const cache = (caches as any).default as {
      match(key: Request): Promise<Response | undefined>;
      put(key: Request, response: Response): Promise<void>;
    };

    if (kind) {
      const key = cacheKey(request, env, kind);
      const cached = await cache.match(key);
      if (cached) return responseWithCacheStatus(cached, kind, 'HIT');
    }

    const container = getContainer(env.APP_CONTAINER as any, 'zahidalexbur-production');
    const response = await container.fetch(edgeRequest(request));

    if (!kind || !canStore(response)) return response;

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

    return responseWithCacheStatus(response, kind, 'MISS');
  },
};
