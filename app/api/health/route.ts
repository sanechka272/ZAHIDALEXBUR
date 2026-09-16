import { NextResponse } from 'next/server';
import { getSqlClient } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSqlClient();
    await sql`select 1 as ok`;
    return NextResponse.json(
      { status: 'ok', database: 'ok' },
      { status: 200, headers: { 'cache-control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { status: 'degraded', database: 'unavailable' },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    );
  }
}
