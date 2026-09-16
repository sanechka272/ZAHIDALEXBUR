import { groupByFromRequest, periodFromRequest, protectedAnalytics } from '@/lib/analytics/api';
import { getTimeseries } from '@/lib/analytics/dashboard-repository';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return protectedAnalytics(request, () => getTimeseries(periodFromRequest(request), groupByFromRequest(request)));
}
