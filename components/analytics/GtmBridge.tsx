'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

type Settings = { gtmEnabled: boolean; gtmContainerId: string | null };
type PageEvent = { pagePath?: string };
type LeadEvent = { leadId?: string | null; pagePath?: string };

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function validContainer(value: string | null | undefined): value is string {
  return Boolean(value && /^GTM-[A-Z0-9]+$/.test(value));
}

function push(event: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
}

export function GtmBridge() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/analytics')) return;
    let active = true;
    let script: HTMLScriptElement | null = null;
    let frame: HTMLIFrameElement | null = null;
    let enabled = false;
    let pendingPagePath = `${window.location.pathname}${window.location.search}`;
    let lastPagePath: string | null = null;
    let pendingLead: LeadEvent | null = null;

    const pushPage = (pagePath: string) => {
      if (lastPagePath === pagePath) return;
      lastPagePath = pagePath;
      push({ event: 'page_view', page_path: pagePath });
    };

    const onPageView = (event: Event) => {
      const detail = (event as CustomEvent<PageEvent>).detail;
      const pagePath = detail?.pagePath ?? `${window.location.pathname}${window.location.search}`;
      pendingPagePath = pagePath;
      if (enabled) pushPage(pagePath);
    };
    const onLead = (event: Event) => {
      const detail = (event as CustomEvent<LeadEvent>).detail ?? {};
      if (!enabled) {
        pendingLead = detail;
        return;
      }
      push({ event: 'lead_submit', lead_id: detail.leadId ?? null, page_path: detail.pagePath ?? window.location.pathname });
    };

    window.addEventListener('zab:page_view', onPageView);
    window.addEventListener('zab:lead_submit', onLead);

    fetch('/api/site-settings/analytics', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<Settings> : Promise.reject())
      .then((settings) => {
        if (!active || !settings.gtmEnabled || !validContainer(settings.gtmContainerId)) return;
        enabled = true;
        const id = settings.gtmContainerId;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

        script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
        script.dataset.zabGtm = id;
        document.head.appendChild(script);

        frame = document.createElement('iframe');
        frame.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(id)}`;
        frame.height = '0';
        frame.width = '0';
        frame.style.display = 'none';
        frame.style.visibility = 'hidden';
        frame.title = 'Google Tag Manager';
        frame.dataset.zabGtm = id;
        document.body.prepend(frame);

        pushPage(pendingPagePath);
        if (pendingLead) {
          push({ event: 'lead_submit', lead_id: pendingLead.leadId ?? null, page_path: pendingLead.pagePath ?? window.location.pathname });
          pendingLead = null;
        }
      })
      .catch(() => undefined);

    return () => {
      active = false;
      window.removeEventListener('zab:page_view', onPageView);
      window.removeEventListener('zab:lead_submit', onLead);
      script?.remove();
      frame?.remove();
    };
  }, [pathname]);

  return null;
}
