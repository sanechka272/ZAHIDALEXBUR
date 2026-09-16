import { periodFromRequest, positiveIntParam, protectedAnalytics } from '@/lib/analytics/api';
import { getPopularPages } from '@/lib/analytics/dashboard-repository';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return protectedAnalytics(request, () => getPopularPages(periodFromRequest(request), positiveIntParam(request, 'limit', 12, 100)));
}
