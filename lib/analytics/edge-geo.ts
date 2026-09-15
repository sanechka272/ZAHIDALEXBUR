import { normalizeUkraineRegion, type GeoInfo } from './geo';

function clean(value: string | null, max = 160) {
  const normalized = value?.trim();
  return normalized ? normalized.slice(0, max) : null;
}

export function geoFromEdgeHeaders(headers: Headers, trusted = Boolean(process.env.CLOUDFLARE_APPLICATION_ID)): GeoInfo | null {
  if (!trusted) return null;

  const countryCode = clean(headers.get('x-zab-edge-country'), 2)?.toUpperCase() ?? null;
  const regionName = clean(headers.get('x-zab-edge-region'));
  const rawRegionCode = clean(headers.get('x-zab-edge-region-code'), 16);
  const city = clean(headers.get('x-zab-edge-city'));

  if (!countryCode && !regionName && !rawRegionCode && !city) return null;

  return {
    countryCode,
    countryName: null,
    regionCode: normalizeUkraineRegion(countryCode, rawRegionCode, regionName),
    regionName,
    city,
  };
}
