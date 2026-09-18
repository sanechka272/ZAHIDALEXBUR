import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      runtime: 'ok',
      databaseConfigured: Boolean(process.env.DATABASE_URL),
      telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    },
    { status: 200, headers: { 'cache-control': 'no-store' } },
  );
}
