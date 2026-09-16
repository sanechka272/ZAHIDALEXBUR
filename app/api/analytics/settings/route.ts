import { ZodError } from 'zod';
import { requireAdminRequest, UnauthorizedError } from '@/lib/analytics/auth';
import { getAnalyticsSettings, updateAnalyticsSettings } from '@/lib/analytics/settings-repository';

export const runtime = 'nodejs';

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

async function requireAdmin(request: Request) {
  try {
    await requireAdminRequest(request);
    return null;
  } catch (error) {
    if (error instanceof UnauthorizedError) return json({ error: { code: 'unauthorized', message: 'Authentication required' } }, 401);
    throw error;
  }
}

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return json(await getAnalyticsSettings());
}

export async function PUT(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  if (!request.headers.get('content-type')?.includes('application/json')) return json({ error: { code: 'invalid_content_type', message: 'JSON required' } }, 415);
  try {
    return json(await updateAnalyticsSettings(await request.json()));
  } catch (error) {
    if (error instanceof ZodError) return json({ error: { code: 'invalid_settings', message: 'Invalid GTM settings' } }, 400);
    console.error('[analytics] settings update failed', error);
    return json({ error: { code: 'internal_error', message: 'Settings update failed' } }, 500);
  }
}
