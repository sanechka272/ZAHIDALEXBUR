import * as maxmind from 'maxmind';
import type { CityResponse, Reader } from 'maxmind';

export type GeoInfo = {
  countryCode: string | null;
  countryName: string | null;
  regionCode: string | null;
  regionName: string | null;
  city: string | null;
};

let readerPromise: Promise<Reader<CityResponse> | null> | null = null;
let warned = false;

const ukraineRegionNames: Record<string, string> = {
  'cherkasy oblast': 'UA-71',
  'cherkaska oblast': 'UA-71',
  'chernihiv oblast': 'UA-74',
  'chernihivska oblast': 'UA-74',
  'chernivtsi oblast': 'UA-77',
  'chernivetska oblast': 'UA-77',
  'dnipropetrovsk oblast': 'UA-12',
  'dnipropetrovska oblast': 'UA-12',
  'donetsk oblast': 'UA-14',
  'donetska oblast': 'UA-14',
  'ivano-frankivsk oblast': 'UA-26',
  'ivano-frankivska oblast': 'UA-26',
  'kharkiv oblast': 'UA-63',
  'kharkivska oblast': 'UA-63',
  'kherson oblast': 'UA-65',
  'khersonska oblast': 'UA-65',
  'khmelnytskyi oblast': 'UA-68',
  'khmelnytska oblast': 'UA-68',
  'kirovohrad oblast': 'UA-35',
  'kirovohradska oblast': 'UA-35',
  'kyiv oblast': 'UA-32',
  'kyivska oblast': 'UA-32',
  'luhansk oblast': 'UA-09',
  'luhanska oblast': 'UA-09',
  'lviv oblast': 'UA-46',
  'lvivska oblast': 'UA-46',
  'mykolaiv oblast': 'UA-48',
  'mykolaivska oblast': 'UA-48',
  'odesa oblast': 'UA-51',
  'odessa oblast': 'UA-51',
  'odeska oblast': 'UA-51',
  'poltava oblast': 'UA-53',
  'poltavska oblast': 'UA-53',
  'rivne oblast': 'UA-56',
  'rivnenska oblast': 'UA-56',
  'sumy oblast': 'UA-59',
  'sumska oblast': 'UA-59',
  'ternopil oblast': 'UA-61',
  'ternopilska oblast': 'UA-61',
  'vinnytsia oblast': 'UA-05',
  'vinnytska oblast': 'UA-05',
  'volyn oblast': 'UA-07',
  'volynska oblast': 'UA-07',
  'zakarpattia oblast': 'UA-21',
  'zakarpatska oblast': 'UA-21',
  'zaporizhzhia oblast': 'UA-23',
  'zaporizka oblast': 'UA-23',
  'zhytomyr oblast': 'UA-18',
  'zhytomyrska oblast': 'UA-18',
  'autonomous republic of crimea': 'UA-43',
};

function warnOnce(error: unknown) {
  if (warned) return;
  warned = true;
  console.warn('[analytics] GeoIP database unavailable; geography will be recorded as unknown.', error instanceof Error ? error.message : error);
}

function cleanTokenValue(value: unknown, max: number) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

function decodeEdgeGeoToken(value: string): GeoInfo | null {
  if (!value.startsWith('zab-edge:')) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value.slice('zab-edge:'.length), 'base64url').toString('utf8')) as Record<string, unknown>;
    const countryCode = cleanTokenValue(parsed.countryCode, 2)?.toUpperCase() ?? null;
    const regionName = cleanTokenValue(parsed.regionName, 160);
    const rawRegionCode = cleanTokenValue(parsed.regionCode, 16);
    const city = cleanTokenValue(parsed.city, 160);
    if (!countryCode && !regionName && !rawRegionCode && !city) return null;
    return {
      countryCode,
      countryName: cleanTokenValue(parsed.countryName, 160),
      regionCode: normalizeUkraineRegion(countryCode, rawRegionCode, regionName),
      regionName,
      city,
    };
  } catch {
    return null;
  }
}

async function getReader() {
  if (!readerPromise) {
    readerPromise = (async () => {
      const path = process.env.GEOIP_CITY_DB_PATH;
      if (!path) return null;
      try {
        return await maxmind.open<CityResponse>(path);
      } catch (error) {
        warnOnce(error);
        return null;
      }
    })();
  }
  return readerPromise;
}

export function normalizeUkraineRegion(countryCode: string | null | undefined, isoCode: string | null | undefined, name: string | null | undefined) {
  if (countryCode?.toUpperCase() !== 'UA') return isoCode ?? null;
  if (isoCode) {
    const clean = isoCode.toUpperCase().replace(/^UA-/, '');
    if (/^\d{2}$/.test(clean)) return `UA-${clean}`;
  }
  if (!name) return null;
  return ukraineRegionNames[name.trim().toLowerCase()] ?? null;
}

export async function resolveGeo(ip: string | null | undefined): Promise<GeoInfo> {
  const empty: GeoInfo = { countryCode: null, countryName: null, regionCode: null, regionName: null, city: null };
  if (!ip) return empty;
  const edgeGeo = decodeEdgeGeoToken(ip);
  if (edgeGeo) return edgeGeo;
  const reader = await getReader();
  if (!reader) return empty;
  try {
    const result = reader.get(ip);
    if (!result) return empty;
    const subdivision = result.subdivisions?.[0];
    const countryCode = result.country?.iso_code ?? null;
    const regionName = subdivision?.names?.en ?? null;
    return {
      countryCode,
      countryName: result.country?.names?.en ?? null,
      regionCode: normalizeUkraineRegion(countryCode, subdivision?.iso_code ?? null, regionName),
      regionName,
      city: result.city?.names?.en ?? null,
    };
  } catch (error) {
    warnOnce(error);
    return empty;
  }
}
