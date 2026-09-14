import { periodFromRequest, positiveIntParam, protectedAnalytics } from '@/lib/analytics/api';
import { getPageDetails } from '@/lib/analytics/detail-repository';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return protectedAnalytics(request, () => getPageDetails(periodFromRequest(request), positiveIntParam(request, 'limit', 100, 500)));
}
