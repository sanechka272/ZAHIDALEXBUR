'use client';

import type { ReactNode } from 'react';

const navItems = [
  { label: 'Analytics', href: '/analytics', icon: 'analytics' },
  { label: 'Leads', href: '/analytics/leads', icon: 'leads' },
  { label: 'Traffic Sources', href: '/analytics/traffic', icon: 'traffic' },
  { label: 'Geography', href: '/analytics/geography', icon: 'geo' },
  { label: 'Pages', href: '/analytics/pages', icon: 'pages' },
  { label: 'Settings', href: '/analytics/settings', icon: 'settings' },
] as const;

function NavIcon({ type }: { type: (typeof navItems)[number]['icon'] }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.55, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'analytics') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m5 10V5m6 14v-7m5 7V3" {...common} /></svg>;
  if (type === 'leads') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.5 19v-1.4A4.6 4.6 0 0 1 8.1 13h.8a4.6 4.6 0 0 1 4.6 4.6V19m2-10.5h5m-2.5-2.5v5" {...common} /></svg>;
  if (type === 'traffic') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17.5V13m7 4.5V6.5m7 11V9.8M3 20h18" {...common} /></svg>;
  if (type === 'geo') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5.2-8 11-8 11S4 15.2 4 10a8 8 0 1 1 16 0Z" {...common} /><circle cx="12" cy="10" r="2.5" {...common} /></svg>;
  if (type === 'pages') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Zm8 0v5h4M9 12h6M9 16h6" {...common} /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm8 3.5-2.1-.8a6.8 6.8 0 0 0-.5-1.2l.9-2-2.3-2.3-2 .9a6.8 6.8 0 0 0-1.2-.5L12 4h-3l-.8 2.1a6.8 6.8 0 0 0-1.2.5l-2-.9L2.7 8l.9 2a6.8 6.8 0 0 0-.5 1.2L1 12v3l2.1.8c.1.4.3.8.5 1.2l-.9 2L5 21.3l2-.9c.4.2.8.4 1.2.5L9 23h3l.8-2.1c.4-.1.8-.3 1.2-.5l2 .9 2.3-2.3-.9-2c.2-.4.4-.8.5-1.2L20 15v-3Z" {...common} /></svg>;
}

function BrandMark() {
  return (
    <a className="analytics-brand analytics-brand--logo" href="/analytics" aria-label="ZAHIDALEXBUR Analytics">
      <img src="/brand/zahidalexbur-logo.svg" alt="ZAHIDALEXBUR" />
    </a>
  );
}

export default function Sidebar({ open, onClose, footer, active = 'Analytics' }: { open: boolean; onClose: () => void; footer?: ReactNode; active?: string }) {
  return (
    <>
      <button type="button" className={`analytics-sidebar-backdrop ${open ? 'is-open' : ''}`} aria-label="Close analytics menu" onClick={onClose} />
      <aside className={`analytics-sidebar ${open ? 'is-open' : ''}`}>
        <div className="analytics-sidebar__top">
          <BrandMark />
          <button type="button" className="analytics-sidebar__close" aria-label="Close menu" onClick={onClose}>×</button>
        </div>
        <nav className="analytics-nav" aria-label="Analytics navigation">
          {navItems.map((item) => {
            const selected = item.label === active;
            return (
              <a key={item.label} href={item.href} className={selected ? 'is-active' : ''} onClick={onClose}>
                <span className="analytics-nav__icon"><NavIcon type={item.icon} /></span>
                <span>{item.label}</span>
                {selected ? <i aria-hidden="true" /> : null}
              </a>
            );
          })}
        </nav>
        <div className="analytics-sidebar__spacer" />
        <div className="analytics-sidebar-story">
          <img src="/media/service-industrial-rig.jpg" alt="" aria-hidden="true" />
          <div className="analytics-sidebar-story__shade" />
          <div className="analytics-sidebar-story__copy">
            <span>01 / FIELD DATA</span>
            <strong>Кожен візит.<br />Кожна заявка.<br />Одна картина.</strong>
          </div>
        </div>
        {footer ? <div className="analytics-sidebar__footer">{footer}</div> : null}
      </aside>
    </>
  );
}
