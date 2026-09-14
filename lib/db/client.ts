import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

let sqlClient: ReturnType<typeof postgres> | null = null;
let database: PostgresJsDatabase<typeof schema> | null = null;

function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required for server-side analytics');
  return url;
}

export function getSqlClient() {
  if (!sqlClient) {
    sqlClient = postgres(requireDatabaseUrl(), {
      max: Number(process.env.DATABASE_POOL_SIZE ?? 5),
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return sqlClient;
}

export function getDb() {
  if (!database) database = drizzle(getSqlClient(), { schema });
  return database;
}

export type Database = ReturnType<typeof getDb>;
