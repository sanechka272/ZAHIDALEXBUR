'use client';

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

type Settings = { gtmEnabled: boolean; gtmContainerId: string | null };

function MenuIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function initials(email: string) {
  return (email.split('@')[0] || 'admin').slice(0, 2).toUpperCase();
}

export default function AnalyticsSettings({ adminEmail }: { adminEmail: string }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [gtmEnabled, setGtmEnabled] = useState(false);
  const [gtmContainerId, setGtmContainerId] = useState('');
  const [status, setStatus] = useState<'loading' | 'idle' | 'saving' | 'saved' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/analytics/settings', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) { window.location.assign('/analytics/login'); return null; }
        if (!response.ok) throw new Error('settings_load_failed');
        return response.json() as Promise<Settings>;
      })
      .then((settings) => {
        if (!settings) return;
        setGtmEnabled(settings.gtmEnabled);
        setGtmContainerId(settings.gtmContainerId ?? '');
        setStatus('idle');
      })
      .catch(() => setStatus('error'));
  }, []);

  async function save() {
    setStatus('saving');
    const response = await fetch('/api/analytics/settings', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ gtmEnabled, gtmContainerId: gtmContainerId.trim() || null }),
    });
    if (response.status === 401) { window.location.assign('/analytics/login'); return; }
    if (!response.ok) { setStatus('error'); return; }
    setStatus('saved');
    window.setTimeout(() => setStatus('idle'), 1800);
  }

  async function logout() {
    await fetch('/api/analytics/auth/logout', { method: 'POST' });
    window.location.assign('/analytics/login');
  }

  return (
    <div className="analytics-layout">
      <Sidebar active="Settings" open={drawerOpen} onClose={() => setDrawerOpen(false)} footer={<button type="button" className="analytics-logout" onClick={logout}><span>↗</span><strong>Sign out</strong></button>} />
      <main className="analytics-main analytics-settings-main">
        <header className="analytics-header analytics-settings-header">
          <div className="analytics-header__title-block">
            <button type="button" className="analytics-mobile-menu" aria-label="Open analytics menu" onClick={() => setDrawerOpen(true)}><MenuIcon /></button>
            <div><span className="analytics-header__eyebrow">ZAHIDALEXBUR / INTELLIGENCE</span><h1>Settings</h1><p>Tracking integrations and analytics configuration</p></div>
          </div>
          <div className="analytics-admin-profile"><span className="analytics-admin-profile__avatar">{initials(adminEmail)}</span><span className="analytics-admin-profile__copy"><strong>Administrator</strong><small>{adminEmail}</small></span></div>
        </header>

        <section className="analytics-settings-grid">
          <article className="analytics-card analytics-settings-card">
            <div className="analytics-settings-card__heading">
              <div><span>INTEGRATION 01</span><h2>Google Tag Manager</h2><p>Optional event bridge for advertising pixels and external measurement. First-party analytics keeps working when GTM is disabled.</p></div>
              <div className="analytics-settings-toggle"><span>Enable GTM</span><label className="analytics-switch" aria-label="Enable GTM"><input type="checkbox" checked={gtmEnabled} onChange={(event) => setGtmEnabled(event.target.checked)} /><span /></label></div>
            </div>
            <div className="analytics-settings-field"><label htmlFor="gtm-id">GTM Container ID</label><div><input id="gtm-id" value={gtmContainerId} onChange={(event) => setGtmContainerId(event.target.value.toUpperCase())} placeholder="GTM-XXXXXXX" disabled={!gtmEnabled} /><small>Format: GTM-XXXXXXX</small></div></div>
            <div className="analytics-settings-events"><span>Events pushed to dataLayer</span><div><code>page_view</code><code>lead_submit</code></div></div>
            {status === 'error' ? <p className="analytics-settings-error">Could not save settings. Check the GTM container ID.</p> : null}
            <div className="analytics-settings-actions"><button type="button" className="analytics-settings-save" disabled={status === 'saving' || status === 'loading'} onClick={save}>{status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved ✓' : 'Save changes'}</button></div>
          </article>

          <article className="analytics-card analytics-settings-card analytics-settings-card--system">
            <div className="analytics-settings-card__heading"><div><span>CORE TRACKING</span><h2>First-party Analytics</h2><p>Native tracking is part of ZAHIDALEXBUR and cannot be disabled from this integration panel.</p></div><span className="analytics-live-indicator"><i />Active</span></div>
            <div className="analytics-settings-status-list">
              <div><span>Visitor & session tracking</span><strong>Active</strong></div>
              <div><span>UTM source / medium / campaign</span><strong>Active</strong></div>
              <div><span>gclid / fbclid / ttclid</span><strong>Active</strong></div>
              <div><span>First-touch attribution</span><strong>Active</strong></div>
              <div><span>Last-attributable-touch</span><strong>Active</strong></div>
              <div><span>Lead attribution snapshots</span><strong>Active</strong></div>
            </div>
          </article>

          <article className="analytics-card analytics-settings-note">
            <span>DATA OWNERSHIP</span><h2>Website data stays first-party.</h2><p>GTM is an optional delivery layer for tags. The dashboard does not depend on Google Analytics, Cloudflare Analytics, PostHog or another external analytics product.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
