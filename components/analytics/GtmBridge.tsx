'use client';

import { useEffect } from 'react';

type Settings = { gtmEnabled: boolean; gtmContainerId: string | null };

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
  useEffect(() => {
    let active = true;
    let script: HTMLScriptElement | null = null;
    let frame: HTMLIFrameElement | null = null;
    let enabled = false;

    const onPageView = (event: Event) => {
      if (!enabled) return;
      const detail = (event as CustomEvent<{ pagePath?: string }>).detail;
      push({ event: 'page_view', page_path: detail?.pagePath ?? window.location.pathname });
    };
    const onLead = (event: Event) => {
      if (!enabled) return;
      const detail = (event as CustomEvent<{ leadId?: string; pagePath?: string }>).detail;
      push({ event: 'lead_submit', lead_id: detail?.leadId ?? null, page_path: detail?.pagePath ?? window.location.pathname });
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
      })
      .catch(() => undefined);

    return () => {
      active = false;
      window.removeEventListener('zab:page_view', onPageView);
      window.removeEventListener('zab:lead_submit', onLead);
      script?.remove();
      frame?.remove();
    };
  }, []);

  return null;
}
