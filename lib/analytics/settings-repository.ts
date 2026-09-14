import { analyticsSettingsSchema } from './contracts';
import { getSqlClient } from '@/lib/db/client';

export type AnalyticsSettings = {
  gtmEnabled: boolean;
  gtmContainerId: string | null;
};

export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  const sql = getSqlClient();
  const [row] = await sql<{ gtm_enabled: boolean; gtm_container_id: string | null }[]>`
    select gtm_enabled, gtm_container_id
    from analytics_settings
    where id = 1
    limit 1
  `;
  return {
    gtmEnabled: row?.gtm_enabled ?? false,
    gtmContainerId: row?.gtm_container_id ?? null,
  };
}

export async function updateAnalyticsSettings(input: unknown): Promise<AnalyticsSettings> {
  const parsed = analyticsSettingsSchema.parse(input);
  const sql = getSqlClient();
  const [row] = await sql<{ gtm_enabled: boolean; gtm_container_id: string | null }[]>`
    insert into analytics_settings (id, gtm_enabled, gtm_container_id, updated_at)
    values (1, ${parsed.gtmEnabled}, ${parsed.gtmContainerId}, now())
    on conflict (id) do update
      set gtm_enabled = excluded.gtm_enabled,
          gtm_container_id = excluded.gtm_container_id,
          updated_at = now()
    returning gtm_enabled, gtm_container_id
  `;
  return { gtmEnabled: row.gtm_enabled, gtmContainerId: row.gtm_container_id };
}
