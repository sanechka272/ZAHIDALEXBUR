import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to run analytics retention');

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const RETENTION = '13 months';
const batchSize = Math.max(100, Math.min(20_000, Number(process.env.ANALYTICS_RETENTION_BATCH_SIZE ?? 5_000)));

async function deleteInBatches(label: string, operation: () => Promise<{ id: string }[]>) {
  let total = 0;
  while (true) {
    const rows = await operation();
    total += rows.length;
    if (rows.length < batchSize) break;
  }
  console.log(`[analytics-retention] ${label}: ${total}`);
  return total;
}

async function run() {
  const cutoff = await sql<{ cutoff: Date }[]>`
    select now() - interval '13 months' as cutoff
  `;
  console.log(`[analytics-retention] raw-data policy: ${RETENTION}; cutoff=${cutoff[0]?.cutoff?.toISOString?.() ?? 'unknown'}`);

  await deleteInBatches('page_views deleted', () => sql<{ id: string }[]>`
    delete from page_views
    where id in (
      select id from page_views
      where occurred_at < now() - interval '13 months'
      order by occurred_at asc
      limit ${batchSize}
    )
    returning id
  `);

  await deleteInBatches('analytics_events deleted', () => sql<{ id: string }[]>`
    delete from analytics_events
    where id in (
      select id from analytics_events
      where occurred_at < now() - interval '13 months'
      order by occurred_at asc
      limit ${batchSize}
    )
    returning id
  `);

  await deleteInBatches('sessions deleted', () => sql<{ id: string }[]>`
    delete from sessions
    where id in (
      select s.id
      from sessions s
      where s.last_activity_at < now() - interval '13 months'
        and not exists (select 1 from page_views p where p.session_id = s.id)
        and not exists (select 1 from analytics_events e where e.session_id = s.id)
      order by s.last_activity_at asc
      limit ${batchSize}
    )
    returning id
  `);

  await deleteInBatches('orphan visitors deleted', () => sql<{ id: string }[]>`
    delete from visitors
    where id in (
      select v.id
      from visitors v
      where v.last_seen_at < now() - interval '13 months'
        and not exists (select 1 from sessions s where s.visitor_id = v.id)
      order by v.last_seen_at asc
      limit ${batchSize}
    )
    returning id
  `);

  await sql`
    delete from admin_sessions
    where expires_at < now() - interval '7 days'
  `;

  // Leads are intentionally not deleted by this job. They are durable business records.
}

try {
  await run();
} finally {
  await sql.end({ timeout: 5 });
}
