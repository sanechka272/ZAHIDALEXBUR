import { requireAdmin } from '@/lib/analytics/auth';
import AnalyticsDetail from '@/components/analytics/dashboard/AnalyticsDetail';

export const dynamic = 'force-dynamic';

export default async function AnalyticsGeographyPage() {
  const admin = await requireAdmin();
  return <AnalyticsDetail adminEmail={admin.email} mode="geography" />;
}
