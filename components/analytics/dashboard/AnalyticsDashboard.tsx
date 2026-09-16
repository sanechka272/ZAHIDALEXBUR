'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import UkraineMap from '@svg-maps/ukraine';
import WorldMap from '@svg-maps/world';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Sidebar from './Sidebar';
import DashboardHeader, { type PeriodPreset } from './DashboardHeader';

type Metric = { current: number; previous: number; deltaPercent: number | null };
type Summary = {
  visitors: Metric;
  sessions: Metric;
  pageViews: Metric;
  leads: Metric;
  conversionRate: Metric;
  costPerLead: null;
};
type TimeseriesPoint = { bucket: string; visitors: number; leads: number };
type SourceRow = { name: string; visitors: number; percentage: number };
type GeographyRow = { key: string; name: string; countryCode: string | null; regionCode: string | null; visitors: number; sessions: number; percentage: number };
type PageRow = { path: string; visits: number; conversions: number; conversionRate: number };
type DeviceRow = { deviceType: string; visitors: number; percentage: number };
type LeadRow = {
  id: string;
  name: string | null;
  phone: string;
  location: string | null;
  service: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  originatingPage: string;
  status: string;
  createdAt: string;
  firstSource: string | null;
  firstMedium: string | null;
  firstCampaign: string | null;
  lastSource: string | null;
  lastMedium: string | null;
  lastCampaign: string | null;
};

type DashboardData = {
  summary: Summary;
  timeseries: TimeseriesPoint[];
  sources: SourceRow[];
  geography: GeographyRow[];
  pages: PageRow[];
  devices: DeviceRow[];
  leads: LeadRow[];
};

type MapLocation = { id: string; name: string; path: string };
type SvgMapData = { label: string; viewBox: string; locations: MapLocation[] };

const EMPTY_SUMMARY: Summary = {
  visitors: { current: 0, previous: 0, deltaPercent: 0 },
  sessions: { current: 0, previous: 0, deltaPercent: 0 },
  pageViews: { current: 0, previous: 0, deltaPercent: 0 },
  leads: { current: 0, previous: 0, deltaPercent: 0 },
  conversionRate: { current: 0, previous: 0, deltaPercent: 0 },
  costPerLead: null,
};

const EMPTY_DATA: DashboardData = {
  summary: EMPTY_SUMMARY,
  timeseries: [],
  sources: [],
  geography: [],
  pages: [],
  devices: [],
  leads: [],
};

const sourceOrder = ['Google Ads', 'Meta Ads', 'Organic Search', 'Direct Traffic', 'Other'];
const sourceColors: Record<string, string> = {
  'Google Ads': '#a9784f',
  'Meta Ads': '#c2a46e',
  'Organic Search': '#555049',
  'Direct Traffic': '#8e857a',
  Other: '#d7cec2',
};
const deviceColors: Record<string, string> = {
  Mobile: '#a9784f',
  Desktop: '#2f2b27',
  Tablet: '#c6aa76',
  Unknown: '#d7cec2',
};

const regionCodeToMapId: Record<string, string> = {
  'UA-71': 'cherkasy', 'UA-74': 'chernihiv', 'UA-77': 'chernivtsi', 'UA-43': 'crimea',
  'UA-12': 'dnipropetrovsk', 'UA-14': 'donetsk', 'UA-26': 'ivano-frankivsk', 'UA-63': 'kharkiv',
  'UA-65': 'kherson', 'UA-68': 'khmelnytskyi', 'UA-35': 'kirovohrad', 'UA-32': 'kyiv',
  'UA-09': 'luhansk', 'UA-46': 'lviv', 'UA-48': 'mykolaiv', 'UA-51': 'odessa',
  'UA-53': 'poltava', 'UA-56': 'rivne', 'UA-59': 'sumy', 'UA-61': 'ternopil',
  'UA-05': 'vinnytsia', 'UA-07': 'volyn', 'UA-21': 'zakarpattia', 'UA-23': 'zaporizhia',
  'UA-18': 'zhytomyr', 'UA-30': 'kyiv-city',
};
const mapIdToRegionCode = Object.fromEntries(Object.entries(regionCodeToMapId).map(([code, id]) => [id, code]));

function todayInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('uk-UA').format(Math.round(value));
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
  if (normalized.startsWith('/blog/')) return normalized.split('/').at(-1)!.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return normalized;
}

function sourceLabel(source: string | null, medium: string | null) {
  if (!source) return 'Direct';
  if (source === 'google' && medium === 'cpc') return 'Google Ads';
  if (['meta', 'facebook', 'instagram'].includes(source) && ['paid_social', 'cpc'].includes(medium ?? '')) return 'Meta Ads';
  if (medium === 'organic') return 'Organic';
  if (source === 'direct') return 'Direct';
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function shortDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function bucketLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: 'short' }).format(date);
}

function MetricIcon({ type }: { type: 'visitors' | 'leads' | 'conversion' | 'cost' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'visitors') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 19v-1.2A4.8 4.8 0 0 1 7.8 13h1.4a4.8 4.8 0 0 1 4.8 4.8V19m1-9.2a2.5 2.5 0 1 0 0-4.8m.5 8h.6a4.2 4.2 0 0 1 4.2 4.2V19" {...common} /></svg>;
  if (type === 'leads') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5V4Zm4 4h6M9 12h6m-6 4h3" {...common} /></svg>;
  if (type === 'conversion') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17 10 12l3 3 6-8M15 7h4v4" {...common} /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v10H4V8Zm3-3h10v3M8 13h8m-4-3v6" {...common} /></svg>;
}

function Delta({ metric }: { metric: Metric }) {
  const positive = metric.deltaPercent !== null && metric.deltaPercent >= 0;
  const label = metric.deltaPercent === null ? 'New' : `${positive ? '+' : ''}${metric.deltaPercent.toFixed(1)}%`;
  return <span className={`analytics-delta ${positive ? 'is-positive' : 'is-negative'}`}>{label}</span>;
}

function AnimatedNumber({ value, kind = 'number' }: { value: number; kind?: 'number' | 'percent' }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const start = performance.now();
    const from = previous.current;
    const duration = 360;
    let frame = 0;
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
      else previous.current = value;
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{kind === 'percent' ? formatPercent(display) : formatNumber(display)}</>;
}

function KpiCard({ title, metric, icon, kind = 'number', footnote }: { title: string; metric: Metric | null; icon: 'visitors' | 'leads' | 'conversion' | 'cost'; kind?: 'number' | 'percent'; footnote?: string }) {
  const noValue = metric === null;
  return (
    <article className="analytics-kpi-card">
      <div className="analytics-kpi-card__top">
        <span className="analytics-kpi-card__icon"><MetricIcon type={icon} /></span>
        {metric ? <Delta metric={metric} /> : <span className="analytics-delta is-neutral">—</span>}
      </div>
      <p>{title}</p>
      <strong className="analytics-kpi-card__value">{noValue ? '—' : <AnimatedNumber value={metric.current} kind={kind} />}</strong>
      <small>{footnote ?? (metric ? `Previous period: ${kind === 'percent' ? formatPercent(metric.previous) : formatNumber(metric.previous)}` : 'Spend not configured')}</small>
    </article>
  );
}

function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="analytics-card-header"><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{action}</div>;
}

function EmptyState({ text = 'No data for selected period yet.' }: { text?: string }) {
  return <div className="analytics-empty-state"><span>•</span><p>{text}</p></div>;
}

function DonutCenter({ total, label }: { total: number; label: string }) {
  return <div className="analytics-donut-center"><strong>{formatNumber(total)}</strong><span>{label}</span></div>;
}

function GeographyMap({ rows, scope }: { rows: GeographyRow[]; scope: 'ukraine' | 'world' }) {
  const [hovered, setHovered] = useState<GeographyRow | null>(null);
  const map = (scope === 'ukraine' ? UkraineMap : WorldMap) as SvgMapData;
  const total = rows.reduce((sum, row) => sum + row.visitors, 0);
  const max = Math.max(1, ...rows.map((row) => row.visitors));
  const byKey = useMemo(() => new Map(rows.map((row) => [scope === 'ukraine' ? regionCodeToMapId[row.regionCode ?? ''] ?? row.key : (row.countryCode ?? row.key).toLowerCase(), row])), [rows, scope]);

  function fillFor(locationId: string) {
    const row = byKey.get(locationId);
    if (!row || row.visitors <= 0) return '#e8e1d7';
    const intensity = row.visitors / max;
    if (intensity > 0.74) return '#8e5f3f';
    if (intensity > 0.48) return '#ad7d56';
    if (intensity > 0.24) return '#c6a27c';
    return '#dbc4aa';
  }

  return (
    <div className="analytics-map-wrap">
      {hovered ? <div className="analytics-map-tooltip"><strong>{hovered.name}</strong><span>{formatNumber(hovered.visitors)} visitors</span><small>{formatPercent(hovered.percentage)} of traffic</small></div> : null}
      <svg viewBox={map.viewBox} role="img" aria-label={scope === 'ukraine' ? 'Visitor map of Ukraine' : 'Visitor world map'}>
        {map.locations.map((location) => {
          const row = byKey.get(location.id) ?? (scope === 'ukraine' ? rows.find((item) => mapIdToRegionCode[location.id] === item.regionCode) : undefined);
          return (
            <path
              key={location.id}
              d={location.path}
              aria-label={location.name}
              data-active={Boolean(row)}
              fill={fillFor(location.id)}
              onMouseEnter={() => setHovered(row ?? null)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(row ?? null)}
              onBlur={() => setHovered(null)}
              tabIndex={row ? 0 : -1}
            />
          );
        })}
      </svg>
      <div className="analytics-map-legend"><span>Low</span><i /><i /><i /><i /><span>High</span><small>{formatNumber(total)} visitors</small></div>
    </div>
  );
}

function serviceClass(service: string | null) {
  const value = (service ?? '').toLowerCase();
  if (value.includes('пром') || value.includes('industrial')) return 'industrial';
  if (value.includes('фільтр') || value.includes('filter')) return 'filter';
  return 'artesian';
}

export default function AnalyticsDashboard({ adminEmail }: { adminEmail: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [preset, setPreset] = useState<PeriodPreset>('last30');
  const [customFrom, setCustomFrom] = useState(() => todayInputValue(-29));
  const [customTo, setCustomTo] = useState(() => todayInputValue(0));
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [geoScope, setGeoScope] = useState<'ukraine' | 'world'>('ukraine');
  const [data, setData] = useState<DashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ preset, groupBy });
    if (preset === 'custom') {
      params.set('from', customFrom);
      params.set('to', customTo);
    }
    return params;
  }, [preset, customFrom, customTo, groupBy]);

  useEffect(() => {
    const params = new URLSearchParams(query);
    params.delete('groupBy');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    setLoading(true);
    setError(null);
    const base = query.toString();
    const urls = [
      `/api/analytics/summary?${base}`,
      `/api/analytics/timeseries?${base}`,
      `/api/analytics/sources?${base}`,
      `/api/analytics/geography?${base}&scope=${geoScope}`,
      `/api/analytics/pages?${base}&limit=8`,
      `/api/analytics/devices?${base}`,
      `/api/analytics/leads?${base}&limit=8`,
    ];

    Promise.all(urls.map(async (url) => {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      if (response.status === 401) {
        window.location.assign('/analytics/login');
        throw new Error('Authentication expired');
      }
      if (!response.ok) throw new Error('Analytics data request failed');
      return response.json();
    })).then(([summary, timeseries, sources, geography, pages, devices, leads]) => {
      if (!current) return;
      setData({ summary, timeseries, sources, geography, pages, devices, leads });
    }).catch((reason) => {
      if (!current || reason?.name === 'AbortError') return;
      setError('Не вдалося завантажити аналітику. Спробуйте оновити сторінку.');
    }).finally(() => {
      if (current) setLoading(false);
    });

    return () => { current = false; controller.abort(); };
  }, [query, geoScope]);

  async function logout() {
    await fetch('/api/analytics/auth/logout', { method: 'POST' });
    window.location.assign('/analytics/login');
  }

  function exportCsv() {
    const lines = [
      ['ID', 'Name', 'Phone', 'Location', 'Service', 'Source', 'Medium', 'Campaign', 'First Touch', 'Last Touch', 'Page', 'Date'],
      ...data.leads.map((lead) => [
        lead.id,
        lead.name ?? '',
        lead.phone,
        lead.location ?? '',
        lead.service ?? '',
        lead.source ?? '',
        lead.medium ?? '',
        lead.campaign ?? '',
        [lead.firstSource, lead.firstMedium, lead.firstCampaign].filter(Boolean).join(' / '),
        [lead.lastSource, lead.lastMedium, lead.lastCampaign].filter(Boolean).join(' / '),
        lead.originatingPage,
        lead.createdAt,
      ]),
    ];
    const csv = lines.map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `zahidalexbur-analytics-${preset}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const orderedSources = sourceOrder.map((name) => data.sources.find((row) => row.name === name) ?? { name, visitors: 0, percentage: 0 });
  const sourceTotal = data.sources.reduce((sum, row) => sum + row.visitors, 0);
  const deviceTotal = data.devices.reduce((sum, row) => sum + row.visitors, 0);
  const topGeo = data.geography.slice(0, 6);

  return (
    <div className="analytics-layout">
      <Sidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={<button type="button" className="analytics-logout" onClick={logout}><span>↗</span><strong>Sign out</strong></button>}
      />
      <main className="analytics-main" id="analytics-overview">
        <DashboardHeader
          preset={preset}
          customFrom={customFrom}
          customTo={customTo}
          adminEmail={adminEmail}
          onPresetChange={setPreset}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
          onMenu={() => setDrawerOpen(true)}
          onExport={exportCsv}
        />

        {error ? <div className="analytics-error-banner">{error}</div> : null}
        <section className={`analytics-dashboard ${loading ? 'is-loading' : ''}`}>
          <div className="analytics-kpi-grid">
            <KpiCard title="Visitors" metric={data.summary.visitors} icon="visitors" />
            <KpiCard title="Leads" metric={data.summary.leads} icon="leads" />
            <KpiCard title="Website Conversion Rate" metric={data.summary.conversionRate} icon="conversion" kind="percent" />
            <KpiCard title="Cost per Lead" metric={data.summary.costPerLead} icon="cost" />
          </div>

          <div className="analytics-row analytics-row--primary">
            <article className="analytics-card analytics-card--chart">
              <CardHeader
                title="Visitors and Leads"
                subtitle="Website activity across the selected period"
                action={<div className="analytics-segmented">{(['day', 'week', 'month'] as const).map((item) => <button key={item} type="button" className={groupBy === item ? 'is-active' : ''} onClick={() => setGroupBy(item)}>{item === 'day' ? 'Daily' : item === 'week' ? 'Weekly' : 'Monthly'}</button>)}</div>}
              />
              <div className="analytics-chart-legend"><span><i className="visitors" />Visitors</span><span><i className="leads" />Leads</span></div>
              <div className="analytics-line-chart">
                {data.timeseries.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.timeseries} margin={{ top: 12, right: 12, bottom: 0, left: -18 }}>
                      <CartesianGrid vertical={false} stroke="#ece7df" strokeDasharray="3 5" />
                      <XAxis dataKey="bucket" tickFormatter={bucketLabel} axisLine={false} tickLine={false} tick={{ fill: '#8a8177', fontSize: 11 }} minTickGap={22} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a8177', fontSize: 11 }} allowDecimals={false} />
                      <Tooltip labelFormatter={(label) => bucketLabel(String(label))} contentStyle={{ borderRadius: 14, border: '1px solid #e7dfd5', boxShadow: '0 16px 40px rgba(39,35,31,.12)', fontSize: 12 }} />
                      <Line type="monotone" dataKey="visitors" stroke="#a9784f" strokeWidth={2.4} dot={{ r: 2.8, fill: '#a9784f', strokeWidth: 0 }} activeDot={{ r: 4 }} animationDuration={420} />
                      <Line type="monotone" dataKey="leads" stroke="#302c28" strokeWidth={2.1} dot={{ r: 2.8, fill: '#302c28', strokeWidth: 0 }} activeDot={{ r: 4 }} animationDuration={460} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <EmptyState text="Traffic will appear after the first tracked visits." />}
              </div>
            </article>

            <article className="analytics-card" id="traffic-sources">
              <CardHeader title="Traffic Sources" subtitle="Visitors by acquisition channel" />
              <div className="analytics-donut-layout">
                <div className="analytics-donut-wrap">
                  {sourceTotal ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={orderedSources.filter((row) => row.visitors > 0)} dataKey="visitors" nameKey="name" innerRadius="67%" outerRadius="88%" paddingAngle={2} animationDuration={420}>{orderedSources.filter((row) => row.visitors > 0).map((row) => <Cell key={row.name} fill={sourceColors[row.name]} stroke="none" />)}</Pie><Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e7dfd5', fontSize: 12 }} /></PieChart></ResponsiveContainer> : <div className="analytics-donut-placeholder" />}
                  <DonutCenter total={sourceTotal} label="visitors" />
                </div>
                <div className="analytics-source-list">
                  {orderedSources.map((row) => <div key={row.name}><span><i style={{ background: sourceColors[row.name] }} />{row.name}</span><strong>{formatPercent(row.percentage)}</strong><small>{formatNumber(row.visitors)}</small></div>)}
                </div>
              </div>
            </article>
          </div>

          <div className="analytics-row analytics-row--secondary">
            <article className="analytics-card analytics-card--geography" id="geography">
              <CardHeader
                title="Visitor Geography"
                subtitle="Where website visitors are coming from"
                action={<div className="analytics-segmented"><button type="button" className={geoScope === 'ukraine' ? 'is-active' : ''} onClick={() => setGeoScope('ukraine')}>Ukraine</button><button type="button" className={geoScope === 'world' ? 'is-active' : ''} onClick={() => setGeoScope('world')}>World</button></div>}
              />
              <div className="analytics-geography-layout">
                <GeographyMap rows={data.geography} scope={geoScope} />
                <div className="analytics-geo-ranking">
                  <div className="analytics-geo-ranking__head"><span>{geoScope === 'ukraine' ? 'Top regions' : 'Top countries'}</span><small>Visitors</small></div>
                  {topGeo.length ? topGeo.map((row, index) => (
                    <div className="analytics-geo-row" key={row.key}>
                      <span className="analytics-geo-row__rank">{String(index + 1).padStart(2, '0')}</span>
                      <div><strong>{row.name}</strong><span>{formatPercent(row.percentage)} of traffic · {formatNumber(row.sessions)} sessions</span></div>
                      <b>{formatNumber(row.visitors)}</b>
                    </div>
                  )) : <EmptyState text="Geography will appear when GeoIP data is available." />}
                </div>
              </div>
            </article>

            <article className="analytics-card" id="popular-pages">
              <CardHeader title="Popular Pages" subtitle="Visits and page-level conversion" />
              <div className="analytics-table-wrap analytics-table-wrap--compact">
                <table className="analytics-table">
                  <thead><tr><th>Page</th><th>Visits</th><th>Conversion</th></tr></thead>
                  <tbody>
                    {data.pages.length ? data.pages.map((row) => <tr key={row.path}><td><strong>{pageTitle(row.path)}</strong><small>{row.path}</small></td><td>{formatNumber(row.visits)}</td><td><span className="analytics-conversion-pill">{formatPercent(row.conversionRate)}</span></td></tr>) : <tr><td colSpan={3}><EmptyState text="Page metrics will appear after tracking starts." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </article>
          </div>

          <div className="analytics-row analytics-row--tertiary">
            <article className="analytics-card analytics-card--leads" id="recent-leads">
              <CardHeader title="Recent Leads" subtitle="Latest incoming website enquiries" action={<a href="#recent-leads">View all →</a>} />
              <div className="analytics-table-wrap">
                <table className="analytics-table analytics-table--leads">
                  <thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Location</th><th>Service</th><th>Source</th><th>Date</th></tr></thead>
                  <tbody>
                    {data.leads.length ? data.leads.map((lead, index) => <tr key={lead.id}><td><span className="analytics-lead-id">#{String(index + 1).padStart(3, '0')}</span></td><td><strong>{lead.name || '—'}</strong></td><td>{lead.phone}</td><td>{lead.location || '—'}</td><td><span className={`analytics-service-badge ${serviceClass(lead.service)}`}>{lead.service || 'General'}</span></td><td><span className="analytics-source-badge">{sourceLabel(lead.source, lead.medium)}</span></td><td>{shortDate(lead.createdAt)}</td></tr>) : <tr><td colSpan={7}><EmptyState text="New website leads will appear here automatically." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="analytics-card">
              <CardHeader title="Devices" subtitle="Visitor device distribution" />
              <div className="analytics-device-card">
                <div className="analytics-donut-wrap analytics-donut-wrap--devices">
                  {deviceTotal ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.devices} dataKey="visitors" nameKey="deviceType" innerRadius="67%" outerRadius="88%" paddingAngle={2} animationDuration={420}>{data.devices.map((row) => <Cell key={row.deviceType} fill={deviceColors[row.deviceType] ?? deviceColors.Unknown} stroke="none" />)}</Pie><Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #e7dfd5', fontSize: 12 }} /></PieChart></ResponsiveContainer> : <div className="analytics-donut-placeholder" />}
                  <DonutCenter total={deviceTotal} label="visitors" />
                </div>
                <div className="analytics-device-list">
                  {['Mobile', 'Desktop', 'Tablet'].map((name) => {
                    const row = data.devices.find((item) => item.deviceType === name) ?? { deviceType: name, visitors: 0, percentage: 0 };
                    return <div key={name}><span><i style={{ background: deviceColors[name] }} />{name}</span><strong>{formatPercent(row.percentage)}</strong><small>{formatNumber(row.visitors)} visitors</small></div>;
                  })}
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
