import { ZodError } from 'zod';
import { groupBySchema, periodInputSchema, type GroupBy } from './contracts';
import { resolvePeriod, type ResolvedPeriod } from './period';
import { requireAdminRequest, UnauthorizedError } from './auth';

export function periodFromRequest(request: Request): ResolvedPeriod {
  const params = new URL(request.url).searchParams;
  const parsed = periodInputSchema.parse({
    preset: params.get('preset') ?? undefined,
    from: params.get('from') ?? undefined,
    to: params.get('to') ?? undefined,
    groupBy: params.get('groupBy') ?? undefined,
  });
  return resolvePeriod(parsed);
}

export function groupByFromRequest(request: Request): GroupBy {
  return groupBySchema.parse(new URL(request.url).searchParams.get('groupBy') ?? 'day');
}

export function positiveIntParam(request: Request, name: string, fallback: number, max: number) {
  const raw = new URL(request.url).searchParams.get(name);
  if (raw === null) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > max) throw new Error(`Invalid ${name}`);
  return parsed;
}

export function analyticsResponse(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

export async function protectedAnalytics<T>(request: Request, work: () => Promise<T>): Promise<Response> {
  try {
    await requireAdminRequest(request);
    return analyticsResponse(await work());
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return analyticsResponse({ error: { code: 'unauthorized', message: 'Authentication required' } }, 401);
    }
    if (error instanceof ZodError || (error instanceof Error && error.message.startsWith('Invalid '))) {
      return analyticsResponse({ error: { code: 'invalid_query', message: 'Invalid analytics query' } }, 400);
    }
    console.error('[analytics] protected API failed', error);
    return analyticsResponse({ error: { code: 'internal_error', message: 'Analytics request failed' } }, 500);
  }
}
