'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function eventId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function sendPageView(pathname: string, search: string) {
  if (pathname.startsWith('/analytics')) return;
  const url = `${window.location.origin}${pathname}${search ? `?${search}` : ''}`;
  const payload = JSON.stringify({
    eventId: eventId(),
    eventName: 'page_view',
    path: `${pathname}${search ? `?${search}` : ''}`.slice(0, 2048),
    title: document.title.slice(0, 300),
    referrer: document.referrer || null,
    url,
    clientTimestamp: new Date().toISOString(),
  });

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    keepalive: true,
    body: payload,
  }).catch(() => undefined);
}

function TrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKey = useRef<string | null>(null);
  const search = searchParams.toString();

  useEffect(() => {
    if (!pathname) return;
    const key = `${pathname}?${search}`;
    if (lastKey.current === key) return;
    lastKey.current = key;
    const frame = requestAnimationFrame(() => sendPageView(pathname, search));
    return () => cancelAnimationFrame(frame);
  }, [pathname, search]);

  return null;
}

export function FirstPartyTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}
