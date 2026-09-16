import { getAnalyticsSettings } from '@/lib/analytics/settings-repository';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const settings = await getAnalyticsSettings();
    return Response.json(settings, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('[analytics] public site settings failed', error);
    return Response.json({ gtmEnabled: false, gtmContainerId: null }, { headers: { 'cache-control': 'no-store' } });
  }
}
