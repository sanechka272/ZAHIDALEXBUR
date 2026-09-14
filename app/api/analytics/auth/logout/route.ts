import { ADMIN_SESSION_COOKIE, logoutAdmin } from '@/lib/analytics/auth';

export const runtime = 'nodejs';

function cookieValue(header: string | null) {
  for (const chunk of (header ?? '').split(';')) {
    const [key, ...rest] = chunk.trim().split('=');
    if (key === ADMIN_SESSION_COOKIE && rest.length) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function POST(request: Request) {
  const token = cookieValue(request.headers.get('cookie'));
  if (token) await logoutAdmin(token);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return new Response(null, {
    status: 204,
    headers: {
      'cache-control': 'no-store',
      'set-cookie': `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    },
  });
}
