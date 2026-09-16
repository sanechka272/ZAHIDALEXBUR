'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import DashboardHeader, { type PeriodPreset } from './DashboardHeader';

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

function todayInputValue(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('uk-UA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function touch(source: string | null, medium: string | null, campaign: string | null) {
  if (!source && !medium && !campaign) return '—';
  return [source, medium, campaign].filter(Boolean).join(' / ');
}

function sourceLabel(source: string | null, medium: string | null) {
  if (!source || source === 'direct') return 'Direct';
  if (source === 'google' && ['cpc', 'ppc', 'paid_search'].includes(medium ?? '')) return 'Google Ads';
  if (['meta', 'facebook', 'instagram'].includes(source) && ['paid_social', 'cpc', 'paid'].includes(medium ?? '')) return 'Meta Ads';
  if (medium === 'organic') return 'Organic';
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function serviceClass(service: string | null) {
  const value = (service ?? '').toLowerCase();
  if (value.includes('пром') || value.includes('industrial')) return 'industrial';
  if (value.includes('фільтр') || value.includes('filter')) return 'filter';
  return 'artesian';
}

export default function AnalyticsLeads({ adminEmail }: { adminEmail: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [preset, setPreset] = useState<PeriodPreset>('last30');
  const [customFrom, setCustomFrom] = useState(() => todayInputValue(-29));
  const [customTo, setCustomTo] = useState(() => todayInputValue());
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ preset, limit: '100' });
    if (preset === 'custom') {
      params.set('from', customFrom);
      params.set('to', customTo);
    }
    return params;
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/analytics/leads?${query.toString()}`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        if (response.status === 401) { window.location.assign('/analytics/login'); return []; }
        if (!response.ok) throw new Error('leads_load_failed');
        return response.json() as Promise<LeadRow[]>;
      })
      .then(setLeads)
      .catch((error) => { if (error?.name !== 'AbortError') setLeads([]); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    const params = new URLSearchParams(query);
    params.delete('limit');
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [query]);

  const filtered = useMemo(() => {
    const needle = queryText.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter((lead) => [lead.name, lead.phone, lead.location, lead.service, lead.source, lead.campaign, lead.originatingPage]
      .some((value) => value?.toLowerCase().includes(needle)));
  }, [leads, queryText]);

  const paid = leads.filter((lead) => ['cpc', 'ppc', 'paid', 'paid_search', 'paid_social'].includes(lead.medium ?? '')).length;
  const attributed = leads.filter((lead) => Boolean(lead.source && lead.source !== 'direct')).length;

  async function logout() {
    await fetch('/api/analytics/auth/logout', { method: 'POST' });
    window.location.assign('/analytics/login');
  }

  return (
    <div className="analytics-layout">
      <Sidebar active="Leads" open={drawerOpen} onClose={() => setDrawerOpen(false)} footer={<button type="button" className="analytics-logout" onClick={logout}><span>↗</span><strong>Sign out</strong></button>} />
      <main className="analytics-main analytics-leads-main">
        <DashboardHeader
          title="Leads"
          subtitle="Incoming website enquiries with first-touch and last-touch attribution"
          exportType="leads"
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
          <article className="analytics-leads-stat"><span>Total Leads</span><strong>{leads.length}</strong><small>Selected period</small></article>
          <article className="analytics-leads-stat"><span>Paid Traffic</span><strong>{paid}</strong><small>Paid source / medium</small></article>
          <article className="analytics-leads-stat"><span>Attributed</span><strong>{attributed}</strong><small>Non-direct source known</small></article>
        </section>

        <article className={`analytics-card analytics-leads-directory ${loading ? 'is-loading' : ''}`}>
          <div className="analytics-leads-directory__head">
            <div><span>LEAD DIRECTORY</span><h2>Website enquiries</h2><p>No CRM pipeline — only captured website leads and their acquisition context.</p></div>
            <label className="analytics-leads-search"><span>Search</span><input value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Name, phone, city, campaign…" /></label>
          </div>
          <div className="analytics-table-wrap analytics-table-wrap--directory">
            <table className="analytics-table analytics-table--directory">
              <thead><tr><th>Date</th><th>Name</th><th>Phone</th><th>Location</th><th>Service</th><th>Current Source</th><th>First Touch</th><th>Last Touch</th><th>Origin Page</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.length ? filtered.map((lead) => (
                  <tr key={lead.id}>
                    <td><span className="analytics-lead-date">{formatDate(lead.createdAt)}</span></td>
                    <td><strong>{lead.name || '—'}</strong><small>#{lead.id.slice(0, 8)}</small></td>
                    <td>{lead.phone}</td>
                    <td>{lead.location || '—'}</td>
                    <td><span className={`analytics-service-badge ${serviceClass(lead.service)}`}>{lead.service || 'General'}</span></td>
                    <td><span className="analytics-source-badge">{sourceLabel(lead.source, lead.medium)}</span><small>{lead.campaign || lead.medium || '—'}</small></td>
                    <td><span className="analytics-touch-cell">{touch(lead.firstSource, lead.firstMedium, lead.firstCampaign)}</span></td>
                    <td><span className="analytics-touch-cell">{touch(lead.lastSource, lead.lastMedium, lead.lastCampaign)}</span></td>
                    <td><code>{lead.originatingPage}</code></td>
                    <td><span className="analytics-status-badge">{lead.status}</span></td>
                  </tr>
                )) : <tr><td colSpan={10}><div className="analytics-empty-state"><span>•</span><p>{loading ? 'Loading leads…' : 'No leads match the selected period or search.'}</p></div></td></tr>}
              </tbody>
            </table>
          </div>
        </article>
      </main>
    </div>
  );
}
