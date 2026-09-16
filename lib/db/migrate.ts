import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to run migrations');

const sql = postgres(databaseUrl, { max: 1, prepare: false });
const migrationsDir = resolve(process.cwd(), 'db/migrations');

async function migrate() {
  await sql`
    create table if not exists _migrations (
      filename text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `;

  const files = (await readdir(migrationsDir)).filter((name) => name.endsWith('.sql')).sort();
  for (const filename of files) {
    const path = resolve(migrationsDir, filename);
    const content = await readFile(path, 'utf8');
    const checksum = createHash('sha256').update(content).digest('hex');
    const [existing] = await sql<{ checksum: string }[]>`
      select checksum from _migrations where filename = ${filename}
    `;
    if (existing) {
      if (existing.checksum !== checksum) {
        throw new Error(`Migration checksum mismatch for ${filename}`);
      }
      continue;
    }

    await sql.begin(async (tx) => {
      await tx.unsafe(content);
      await tx`
        insert into _migrations (filename, checksum)
        values (${filename}, ${checksum})
      `;
    });
    console.log(`Applied migration ${filename}`);
  }
}

try {
  await migrate();
} finally {
  await sql.end({ timeout: 5 });
}
