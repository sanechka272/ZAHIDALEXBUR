import { z } from 'zod';

export const periodPresetSchema = z.enum([
  'today',
  'last7',
  'last30',
  'currentMonth',
  'previousMonth',
  'custom',
]);

export const groupBySchema = z.enum(['day', 'week', 'month']);

export const periodInputSchema = z.object({
  preset: periodPresetSchema.default('last30'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  groupBy: groupBySchema.optional(),
}).superRefine((value, ctx) => {
  if (value.preset === 'custom' && (!value.from || !value.to)) {
    ctx.addIssue({ code: 'custom', message: 'Custom period requires from and to dates' });
  }
  if (value.from && value.to && value.from > value.to) {
    ctx.addIssue({ code: 'custom', message: 'from must not be after to' });
  }
});

export type PeriodPreset = z.infer<typeof periodPresetSchema>;
export type PeriodInput = z.infer<typeof periodInputSchema>;
export type GroupBy = z.infer<typeof groupBySchema>;

export const trackEventSchema = z.object({
  eventId: z.string().min(8).max(128),
  eventName: z.enum(['page_view', 'lead_submit']),
  path: z.string().startsWith('/').max(2048),
  title: z.string().max(300).optional(),
  referrer: z.string().max(4096).optional().nullable(),
  url: z.string().url().max(4096),
  clientTimestamp: z.string().datetime().optional(),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;

export const leadInputSchema = z.object({
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(7).max(32),
  location: z.string().trim().max(180).optional(),
  service: z.string().trim().max(160).optional(),
  originatingPage: z.string().startsWith('/').max(2048),
  honeypot: z.string().max(200).optional().default(''),
  startedAtMs: z.number().int().positive(),
});

export type CreateLeadInput = z.infer<typeof leadInputSchema>;

export const analyticsSettingsSchema = z.object({
  gtmEnabled: z.boolean(),
  gtmContainerId: z.string().regex(/^GTM-[A-Z0-9]+$/).nullable(),
}).superRefine((value, ctx) => {
  if (value.gtmEnabled && !value.gtmContainerId) {
    ctx.addIssue({ code: 'custom', message: 'GTM container ID is required when GTM is enabled' });
  }
});
