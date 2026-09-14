import { requireAdmin } from '@/lib/analytics/auth';
import AnalyticsDashboard from '@/components/analytics/dashboard/AnalyticsDashboard';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const admin = await requireAdmin();
  return <AnalyticsDashboard adminEmail={admin.email} />;
}
