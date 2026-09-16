import { periodFromRequest, positiveIntParam, protectedAnalytics } from '@/lib/analytics/api';
import { getRecentLeads } from '@/lib/analytics/dashboard-repository';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return protectedAnalytics(request, () => getRecentLeads(periodFromRequest(request), positiveIntParam(request, 'limit', 20, 100)));
}
