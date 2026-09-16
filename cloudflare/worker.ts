import { Container, getContainer } from '@cloudflare/containers';

type EdgeCf = {
  country?: string | null;
  region?: string | null;
  regionCode?: string | null;
  city?: string | null;
};

type Env = {
  APP_CONTAINER: unknown;
  DATABASE_URL: string;
  ANALYTICS_SESSION_SECRET: string;
  DATABASE_POOL_SIZE?: string;
  ANALYTICS_RETENTION_BATCH_SIZE?: string;
};

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} Worker secret is required`);
  return value;
}

export class ZahidaContainer extends Container {
  defaultPort = 3000;
  sleepAfter = '10m';
  pingEndpoint = 'localhost/api/health';
  enableInternet = true;

  constructor(ctx: any, env: Env) {
    super(ctx, env);
    this.envVars = {
      DATABASE_URL: required(env.DATABASE_URL, 'DATABASE_URL'),
      ANALYTICS_SESSION_SECRET: required(env.ANALYTICS_SESSION_SECRET, 'ANALYTICS_SESSION_SECRET'),
      DATABASE_POOL_SIZE: env.DATABASE_POOL_SIZE ?? '5',
      ANALYTICS_RETENTION_BATCH_SIZE: env.ANALYTICS_RETENTION_BATCH_SIZE ?? '5000',
    };
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

export default {
  async fetch(request: Request, env: Env) {
    const container = getContainer(env.APP_CONTAINER as any, 'zahidalexbur-production');
    return container.fetch(edgeRequest(request));
  },
};
