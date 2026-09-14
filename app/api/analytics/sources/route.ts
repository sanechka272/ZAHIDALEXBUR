import { periodFromRequest, protectedAnalytics } from '@/lib/analytics/api';
import { getTrafficSources } from '@/lib/analytics/dashboard-repository';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return protectedAnalytics(request, () => getTrafficSources(periodFromRequest(request)));
}
