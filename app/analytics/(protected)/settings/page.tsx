import { requireAdmin } from '@/lib/analytics/auth';
import AnalyticsSettings from '@/components/analytics/dashboard/AnalyticsSettings';

export const dynamic = 'force-dynamic';

export default async function AnalyticsSettingsPage() {
  const admin = await requireAdmin();
  return <AnalyticsSettings adminEmail={admin.email} />;
}
