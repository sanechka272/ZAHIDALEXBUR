import { requireAdmin } from '@/lib/analytics/auth';
import AnalyticsLeads from '@/components/analytics/dashboard/AnalyticsLeads';

export const dynamic = 'force-dynamic';

export default async function AnalyticsLeadsPage() {
  const admin = await requireAdmin();
  return <AnalyticsLeads adminEmail={admin.email} />;
}
