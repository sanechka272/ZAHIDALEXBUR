import { ZodError } from 'zod';
import { requireAdminRequest, UnauthorizedError } from '@/lib/analytics/auth';
import { periodFromRequest } from '@/lib/analytics/api';
import { csvResponse, type CsvValue } from '@/lib/analytics/csv';
import { getSummary } from '@/lib/analytics/dashboard-repository';
import { getAcquisitionExport, getLeadExport } from '@/lib/analytics/export-repository';

export const runtime = 'nodejs';

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status, headers: { 'cache-control': 'no-store' } });
}

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    const range = periodFromRequest(request);
    const type = new URL(request.url).searchParams.get('type') ?? 'overview';

    if (type === 'leads') {
      const leads = await getLeadExport(range);
      const rows: CsvValue[][] = [[
        'ID', 'Created At', 'Name', 'Phone', 'Location', 'Service', 'Status', 'Originating Page',
        'Current Source', 'Current Medium', 'Current Campaign', 'Current Content', 'Current Term', 'gclid', 'fbclid', 'ttclid',
        'First Touch Source', 'First Touch Medium', 'First Touch Campaign', 'First Touch Content', 'First Touch Term', 'First Touch gclid', 'First Touch fbclid', 'First Touch ttclid',
        'Last Touch Source', 'Last Touch Medium', 'Last Touch Campaign', 'Last Touch Content', 'Last Touch Term', 'Last Touch gclid', 'Last Touch fbclid', 'Last Touch ttclid',
      ]];
      for (const lead of leads) {
        rows.push([
          lead.id, lead.createdAt, lead.name, lead.phone, lead.location, lead.service, lead.status, lead.originatingPage,
          lead.source, lead.medium, lead.campaign, lead.content, lead.term, lead.gclid, lead.fbclid, lead.ttclid,
          lead.firstSource, lead.firstMedium, lead.firstCampaign, lead.firstContent, lead.firstTerm, lead.firstGclid, lead.firstFbclid, lead.firstTtclid,
          lead.lastSource, lead.lastMedium, lead.lastCampaign, lead.lastContent, lead.lastTerm, lead.lastGclid, lead.lastFbclid, lead.lastTtclid,
        ]);
      }
      return csvResponse('zahidalexbur-leads.csv', rows);
    }

    if (type !== 'overview') return errorResponse('invalid_export_type', 'Export type must be overview or leads', 400);

    const [summary, acquisition] = await Promise.all([getSummary(range), getAcquisitionExport(range)]);
    const rows: CsvValue[][] = [
      ['Record Type', 'Metric', 'Source', 'Medium', 'Campaign', 'Current', 'Previous', 'Delta %', 'Visitors', 'Sessions', 'Leads', 'Conversion Rate %'],
      ['metric', 'Visitors', null, null, null, summary.visitors.current, summary.visitors.previous, summary.visitors.deltaPercent, null, null, null, null],
      ['metric', 'Sessions', null, null, null, summary.sessions.current, summary.sessions.previous, summary.sessions.deltaPercent, null, null, null, null],
      ['metric', 'Page Views', null, null, null, summary.pageViews.current, summary.pageViews.previous, summary.pageViews.deltaPercent, null, null, null, null],
      ['metric', 'Leads', null, null, null, summary.leads.current, summary.leads.previous, summary.leads.deltaPercent, null, null, null, null],
      ['metric', 'Website Conversion Rate', null, null, null, summary.conversionRate.current, summary.conversionRate.previous, summary.conversionRate.deltaPercent, null, null, null, null],
    ];
    for (const row of acquisition) {
      rows.push(['acquisition', null, row.source, row.medium, row.campaign, null, null, null, row.visitors, row.sessions, row.leads, row.conversionRate]);
    }
    return csvResponse('zahidalexbur-analytics-overview.csv', rows);
  } catch (error) {
    if (error instanceof UnauthorizedError) return errorResponse('unauthorized', 'Authentication required', 401);
    if (error instanceof ZodError || (error instanceof Error && error.message.startsWith('Invalid '))) return errorResponse('invalid_query', 'Invalid analytics query', 400);
    console.error('[analytics] export failed', error);
    return errorResponse('internal_error', 'Analytics export failed', 500);
  }
}
