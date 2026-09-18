'use client';

import { useEffect } from 'react';

const META_PIXEL_ID = '1629168988924211';

type MetaPixelFn = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
};

type LeadEvent = {
  leadId?: string | null;
  pagePath?: string;
};

declare global {
  interface Window {
    fbq?: MetaPixelFn;
    _fbq?: MetaPixelFn;
  }
}

function ensureMetaPixel() {
  if (!window.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue = fbq.queue || [];
        fbq.queue.push(args);
      }
    }) as MetaPixelFn;

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = '2.0';
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.dataset.zabMetaPixel = META_PIXEL_ID;
    document.head.appendChild(script);
  }

  if (document.documentElement.dataset.zabMetaPixel !== META_PIXEL_ID) {
    window.fbq?.('init', META_PIXEL_ID);
    document.documentElement.dataset.zabMetaPixel = META_PIXEL_ID;
  }
}

export function MetaPixel() {
  useEffect(() => {
    if (window.location.pathname.startsWith('/analytics')) return;

    ensureMetaPixel();

    const onLead = (event: Event) => {
      const detail = (event as CustomEvent<LeadEvent>).detail ?? {};
      const params = {
        content_name: 'Website lead',
        content_category: 'Lead form',
        page_path: detail.pagePath ?? window.location.pathname,
      };

      if (detail.leadId) {
        window.fbq?.('track', 'Lead', params, { eventID: detail.leadId });
      } else {
        window.fbq?.('track', 'Lead', params);
      }
    };

    window.addEventListener('zab:lead_submit', onLead);
    return () => window.removeEventListener('zab:lead_submit', onLead);
  }, []);

  return null;
}
