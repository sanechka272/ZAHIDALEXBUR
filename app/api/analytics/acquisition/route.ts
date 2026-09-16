import { periodFromRequest, protectedAnalytics } from '@/lib/analytics/api';
import { getAcquisitionExport } from '@/lib/analytics/export-repository';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  return protectedAnalytics(request, () => getAcquisitionExport(periodFromRequest(request)));
}
