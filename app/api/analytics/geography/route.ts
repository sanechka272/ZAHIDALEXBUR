import { periodFromRequest, protectedAnalytics } from '@/lib/analytics/api';
import { getGeography, type GeographyScope } from '@/lib/analytics/dashboard-repository';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return protectedAnalytics(request, async () => {
    const scope = new URL(request.url).searchParams.get('scope') ?? 'ukraine';
    if (scope !== 'ukraine' && scope !== 'world') throw new Error('Invalid scope');
    return getGeography(periodFromRequest(request), scope as GeographyScope);
  });
}
