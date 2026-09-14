'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import DashboardHeader, { type PeriodPreset } from './DashboardHeader';

type Mode = 'traffic' | 'geography' | 'pages';
type AcquisitionRow = { source: string; medium: string; campaign: string | null; visitors: number; sessions: number; leads: number; conversionRate: number };
type GeographyRow = { key: string; name: string; countryCode: string | null; regionCode: string | null; visitors: number; sessions: number; percentage: number };
type CityRow = { key: string; city: string; regionName: string | null; countryCode: string | null; countryName: string | null; visitors: number; sessions: number; percentage: number };
type PageRow = { path: string; pageViews: number; uniqueVisitors: number; leads: number; conversionRate: number };

function todayInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('uk-UA').format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function pageTitle(path: string) {
  const normalized = path.replace(/\/$/, '') || '/';
  const known: Record<string, string> = {
    '/': 'Home',
    '/services': 'Services',
    '/process': 'Drilling Process',
    '/prices': 'Prices',
    '/reviews': 'Reviews',
    '/contact': 'Contacts',
    '/about': 'About',
    '/blog': 'Blog',
  };
  if (known[normalized]) return known[normalized];
  return normalized;
}

const copy: Record<Mode, { title: string; subtitle: string; active: string }> = {
  traffic: { title: 'Traffic Sources', subtitle: 'Source, medium and campaign performance from first-party sessions', active: 'Traffic Sources' },
  geography: { title: 'Visitor Geography', subtitle: 'Where website visitors are coming from — country, region and city', active: 'Geography' },
  pages: { title: 'Pages', subtitle: 'Page views, unique visitors, originating leads and conversion', active: 'Pages' },
};

export default function AnalyticsDetail({ adminEmail, mode }: { adminEmail: string; mode: Mode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [preset, setPreset] = useState<PeriodPreset>('last30');
  const [customFrom, setCustomFrom] = useState(() => todayInputValue(-29));
  const [customTo, setCustomTo] = useState(() => todayInputValue());
  const [scope, setScope] = useState<'ukraine' | 'world'>('ukraine');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [acquisition, setAcquisition] = useState<AcquisitionRow[]>([]);
  const [geography, setGeography] = useState<GeographyRow[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [pages, setPages] = useState<PageRow[]>([]);

  const periodQuery = useMemo(() => {
    const params = new URLSearchParams({ preset });
    if (preset === 'custom') {
      params.set('from', customFrom);
      params.set('to', customTo);
    }
    return params;
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    const params = new URLSearchParams(periodQuery);
    if (mode === 'geography') params.set('scope', scope);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [periodQuery, mode, scope]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    const request = async <T,>(url: string): Promise<T> => {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      if (response.status === 401) {
        window.location.assign('/analytics/login');
        throw new Error('unauthorized');
      }
      if (!response.ok) throw new Error('analytics_detail_load_failed');
      return response.json() as Promise<T>;
    };

    const query = periodQuery.toString();
    const load = mode === 'traffic'
      ? request<AcquisitionRow[]>(`/api/analytics/acquisition?${query}`).then(setAcquisition)
      : mode === 'pages'
        ? request<PageRow[]>(`/api/analytics/page-details?${query}&limit=100`).then(setPages)
        : Promise.all([
            request<GeographyRow[]>(`/api/analytics/geography?${query}&scope=${scope}`).then(setGeography),
            request<CityRow[]>(`/api/analytics/geography/cities?${query}&scope=${scope}`).then(setCities),
          ]).then(() => undefined);

    load.catch((reason) => {
      if (reason?.name !== 'AbortError' && reason?.message !== 'unauthorized') setError(true);
    }).finally(() => setLoading(false));

    return () => controller.abort();
  }, [mode, periodQuery, scope]);

  async function logout() {
    await fetch('/api/analytics/auth/logout', { method: 'POST' });
    window.location.assign('/analytics/login');
  }

  const config = copy[mode];
  const totalVisitors = mode === 'traffic'
    ? acquisition.reduce((sum, row) => sum + row.visitors, 0)
    : mode === 'geography'
      ? geography.reduce((sum, row) => sum + row.visitors, 0)
      : pages.reduce((sum, row) => sum + row.uniqueVisitors, 0);
  const totalSessions = mode === 'traffic'
    ? acquisition.reduce((sum, row) => sum + row.sessions, 0)
    : mode === 'geography'
      ? geography.reduce((sum, row) => sum + row.sessions, 0)
      : pages.reduce((sum, row) => sum + row.pageViews, 0);
  const totalLeads = mode === 'traffic'
    ? acquisition.reduce((sum, row) => sum + row.leads, 0)
    : mode === 'pages'
      ? pages.reduce((sum, row) => sum + row.leads, 0)
      : 0;

  return (
    <div className="analytics-layout">
      <Sidebar active={config.active} open={drawerOpen} onClose={() => setDrawerOpen(false)} footer={<button type="button" className="analytics-logout" onClick={logout}><span>↗</span><strong>Sign out</strong></button>} />
      <main className="analytics-main analytics-leads-main">
        <DashboardHeader
          title={config.title}
          subtitle={config.subtitle}
          preset={preset}
          customFrom={customFrom}
          customTo={customTo}
          adminEmail={adminEmail}
          onPresetChange={setPreset}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          onMenu={() => setDrawerOpen(true)}
          onExport={() => undefined}
        />

        <section className="analytics-leads-overview">
          <article className="analytics-leads-stat"><span>{mode === 'pages' ? 'Unique Visitors' : 'Visitors'}</span><strong>{formatNumber(totalVisitors)}</strong><small>Selected period</small></article>
          <article className="analytics-leads-stat"><span>{mode === 'pages' ? 'Page Views' : 'Sessions'}</span><strong>{formatNumber(totalSessions)}</strong><small>Selected period</small></article>
          <article className="analytics-leads-stat"><span>{mode === 'geography' ? 'Cities Tracked' : 'Leads'}</span><strong>{formatNumber(mode === 'geography' ? cities.length : totalLeads)}</strong><small>{mode === 'geography' ? 'With resolved city' : 'Attributed website leads'}</small></article>
        </section>

        {mode === 'geography' ? (
          <div className="analytics-detail-toolbar">
            <div><span>VISITOR LOCATION MODE</span><strong>Visitor geography, not lead geography</strong></div>
            <div className="analytics-segmented">
              <button type="button" className={scope === 'ukraine' ? 'is-active' : ''} onClick={() => setScope('ukraine')}>Ukraine</button>
              <button type="button" className={scope === 'world' ? 'is-active' : ''} onClick={() => setScope('world')}>World</button>
            </div>
          </div>
        ) : null}

        <article className={`analytics-card analytics-leads-directory ${loading ? 'is-loading' : ''}`}>
          <div className="analytics-leads-directory__head">
            <div>
              <span>{mode === 'traffic' ? 'ACQUISITION DETAIL' : mode === 'geography' ? 'VISITOR GEOGRAPHY' : 'PAGE PERFORMANCE'}</span>
              <h2>{mode === 'traffic' ? 'Source / medium / campaign' : mode === 'geography' ? (scope === 'ukraine' ? 'Top regions' : 'Top countries') : 'Website pages'}</h2>
              <p>{error ? 'Could not load analytics data. Refresh the page and try again.' : 'Real first-party data for the selected period.'}</p>
            </div>
          </div>

          <div className="analytics-table-wrap analytics-table-wrap--directory">
            {mode === 'traffic' ? (
              <table className="analytics-table analytics-table--directory">
                <thead><tr><th>Source</th><th>Medium</th><th>Campaign</th><th>Visitors</th><th>Sessions</th><th>Leads</th><th>Conversion</th></tr></thead>
                <tbody>{acquisition.length ? acquisition.map((row, index) => <tr key={`${row.source}-${row.medium}-${row.campaign ?? 'none'}-${index}`}><td><strong>{row.source}</strong></td><td>{row.medium}</td><td>{row.campaign || '—'}</td><td>{formatNumber(row.visitors)}</td><td>{formatNumber(row.sessions)}</td><td>{formatNumber(row.leads)}</td><td><strong>{formatPercent(row.conversionRate)}</strong></td></tr>) : <tr><td colSpan={7}><div className="analytics-empty-state"><span>•</span><p>{loading ? 'Loading traffic sources…' : 'No traffic data for this period.'}</p></div></td></tr>}</tbody>
              </table>
            ) : mode === 'pages' ? (
              <table className="analytics-table analytics-table--directory">
                <thead><tr><th>Page</th><th>Path</th><th>Page Views</th><th>Unique Visitors</th><th>Leads</th><th>Conversion</th></tr></thead>
                <tbody>{pages.length ? pages.map((row) => <tr key={row.path}><td><strong>{pageTitle(row.path)}</strong></td><td><code>{row.path}</code></td><td>{formatNumber(row.pageViews)}</td><td>{formatNumber(row.uniqueVisitors)}</td><td>{formatNumber(row.leads)}</td><td><strong>{formatPercent(row.conversionRate)}</strong></td></tr>) : <tr><td colSpan={6}><div className="analytics-empty-state"><span>•</span><p>{loading ? 'Loading page analytics…' : 'No page data for this period.'}</p></div></td></tr>}</tbody>
              </table>
            ) : (
              <table className="analytics-table analytics-table--directory">
                <thead><tr><th>{scope === 'ukraine' ? 'Region' : 'Country'}</th><th>Code</th><th>Visitors</th><th>Sessions</th><th>Traffic Share</th></tr></thead>
                <tbody>{geography.length ? geography.map((row) => <tr key={row.key}><td><strong>{row.name}</strong></td><td>{row.regionCode || row.countryCode || '—'}</td><td>{formatNumber(row.visitors)}</td><td>{formatNumber(row.sessions)}</td><td><strong>{formatPercent(row.percentage)}</strong></td></tr>) : <tr><td colSpan={5}><div className="analytics-empty-state"><span>•</span><p>{loading ? 'Loading visitor geography…' : 'No geography data for this period.'}</p></div></td></tr>}</tbody>
              </table>
            )}
          </div>
        </article>

        {mode === 'geography' ? (
          <article className="analytics-card analytics-leads-directory">
            <div className="analytics-leads-directory__head"><div><span>CITY BREAKDOWN</span><h2>Top visitor cities</h2><p>City-level website visitor distribution for the selected geography mode.</p></div></div>
            <div className="analytics-table-wrap analytics-table-wrap--directory">
              <table className="analytics-table analytics-table--directory">
                <thead><tr><th>City</th><th>Region</th><th>Country</th><th>Visitors</th><th>Sessions</th><th>Traffic Share</th></tr></thead>
                <tbody>{cities.length ? cities.map((row) => <tr key={row.key}><td><strong>{row.city}</strong></td><td>{row.regionName || '—'}</td><td>{row.countryName || row.countryCode || '—'}</td><td>{formatNumber(row.visitors)}</td><td>{formatNumber(row.sessions)}</td><td><strong>{formatPercent(row.percentage)}</strong></td></tr>) : <tr><td colSpan={6}><div className="analytics-empty-state"><span>•</span><p>{loading ? 'Loading cities…' : 'No city data resolved for this period.'}</p></div></td></tr>}</tbody>
              </table>
            </div>
          </article>
        ) : null}
      </main>
    </div>
  );
}
