import { redirect } from 'next/navigation';
import { requireAdmin, UnauthorizedError } from '@/lib/analytics/auth';
import '../../analytics.css';

export default async function ProtectedAnalyticsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect('/analytics/login');
    throw error;
  }
  return <div className="analytics-app">{children}</div>;
}
