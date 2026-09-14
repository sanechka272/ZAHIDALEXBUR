export type Attribution = {
  source: string;
  medium: string;
  campaign: string | null;
  content: string | null;
  term: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  referrer: string | null;
  landingPage: string;
  attributable: boolean;
};

export type AttributionState = { first: Attribution; last: Attribution };

const internalHosts = new Set(['zahidalexbur.com.ua', 'www.zahidalexbur.com.ua']);

function value(params: URLSearchParams, key: string) {
  const raw = params.get(key)?.trim();
  return raw ? raw.slice(0, 512) : null;
}

function classifyReferrer(referrer: string | null): Pick<Attribution, 'source' | 'medium' | 'attributable'> {
  if (!referrer) return { source: 'direct', medium: 'none', attributable: false };
  try {
    const host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, '');
    if (!host || internalHosts.has(host)) return { source: 'direct', medium: 'none', attributable: false };
    if (host === 'google.com' || host.endsWith('.google.com')) return { source: 'google', medium: 'organic', attributable: true };
    if (host === 'bing.com' || host.endsWith('.bing.com')) return { source: 'bing', medium: 'organic', attributable: true };
    if (host === 'yahoo.com' || host.endsWith('.yahoo.com')) return { source: 'yahoo', medium: 'organic', attributable: true };
    if (host === 'duckduckgo.com' || host.endsWith('.duckduckgo.com')) return { source: 'duckduckgo', medium: 'organic', attributable: true };
    if (host.includes('facebook.com') || host.includes('instagram.com')) return { source: 'meta', medium: 'social', attributable: true };
    if (host.includes('tiktok.com')) return { source: 'tiktok', medium: 'social', attributable: true };
    if (host.includes('youtube.com') || host === 'youtu.be') return { source: 'youtube', medium: 'social', attributable: true };
    return { source: host, medium: 'referral', attributable: true };
  } catch {
    return { source: 'direct', medium: 'none', attributable: false };
  }
}

export function parseAttribution(urlString: string, referrerInput?: string | null): Attribution {
  const url = new URL(urlString);
  const params = url.searchParams;
  const referrer = referrerInput?.trim() ? referrerInput.slice(0, 4096) : null;
  const utmSource = value(params, 'utm_source');
  const utmMedium = value(params, 'utm_medium');
  const campaign = value(params, 'utm_campaign');
  const content = value(params, 'utm_content');
  const term = value(params, 'utm_term');
  const gclid = value(params, 'gclid');
  const fbclid = value(params, 'fbclid');
  const ttclid = value(params, 'ttclid');
  const landingPage = `${url.pathname || '/'}${url.search}`.slice(0, 2048);

  if (utmSource || utmMedium || campaign || content || term) {
    const fallback = classifyReferrer(referrer);
    return {
      source: (utmSource ?? fallback.source ?? 'campaign').toLowerCase(),
      medium: (utmMedium ?? 'campaign').toLowerCase(),
      campaign,
      content,
      term,
      gclid,
      fbclid,
      ttclid,
      referrer,
      landingPage,
      attributable: true,
    };
  }

  if (gclid) {
    return { source: 'google', medium: 'cpc', campaign, content, term, gclid, fbclid, ttclid, referrer, landingPage, attributable: true };
  }
  if (fbclid) {
    return { source: 'meta', medium: 'paid_social', campaign, content, term, gclid, fbclid, ttclid, referrer, landingPage, attributable: true };
  }
  if (ttclid) {
    return { source: 'tiktok', medium: 'paid_social', campaign, content, term, gclid, fbclid, ttclid, referrer, landingPage, attributable: true };
  }

  const classified = classifyReferrer(referrer);
  return {
    ...classified,
    campaign,
    content,
    term,
    gclid,
    fbclid,
    ttclid,
    referrer,
    landingPage,
  };
}

export function applyAttribution(existing: AttributionState | null, incoming: Attribution): AttributionState {
  if (!existing) return { first: incoming, last: incoming };
  return {
    first: existing.first,
    last: incoming.attributable ? incoming : existing.last,
  };
}

export function sourceBucket(source: string, medium: string): 'Google Ads' | 'Meta Ads' | 'Organic Search' | 'Direct Traffic' | 'Other' {
  const s = source.toLowerCase();
  const m = medium.toLowerCase();
  if (s === 'google' && ['cpc', 'ppc', 'paid', 'paid_search'].includes(m)) return 'Google Ads';
  if (['meta', 'facebook', 'instagram'].includes(s) && ['paid_social', 'cpc', 'paid'].includes(m)) return 'Meta Ads';
  if (m === 'organic') return 'Organic Search';
  if (s === 'direct' || m === 'none') return 'Direct Traffic';
  return 'Other';
}
