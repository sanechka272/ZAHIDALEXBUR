'use client';

export type PeriodPreset = 'today' | 'last7' | 'last30' | 'currentMonth' | 'previousMonth' | 'custom';

const periodLabels: Record<PeriodPreset, string> = {
  today: 'Today',
  last7: 'Last 7 Days',
  last30: 'Last 30 Days',
  currentMonth: 'Current Month',
  previousMonth: 'Previous Month',
  custom: 'Custom Range',
};

function MenuIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4v10m0 0 4-4m-4 4-4-4M5 19h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CalendarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 3v3m12-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function initials(email: string) {
  const base = email.split('@')[0] || 'admin';
  return base.slice(0, 2).toUpperCase();
}

export default function DashboardHeader({
  preset,
  customFrom,
  customTo,
  adminEmail,
  onPresetChange,
  onCustomFromChange,
  onCustomToChange,
  onMenu,
  onExport,
}: {
  preset: PeriodPreset;
  customFrom: string;
  customTo: string;
  adminEmail: string;
  onPresetChange: (preset: PeriodPreset) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  onMenu: () => void;
  onExport: () => void;
}) {
  function exportFullPeriod() {
    const params = new URLSearchParams({ preset, type: 'overview' });
    if (preset === 'custom') {
      params.set('from', customFrom);
      params.set('to', customTo);
    }
    window.location.assign(`/api/analytics/export?${params.toString()}`);
  }

  void onExport;

  return (
    <header className="analytics-header">
      <div className="analytics-header__title-block">
        <button type="button" className="analytics-mobile-menu" aria-label="Open analytics menu" onClick={onMenu}><MenuIcon /></button>
        <div>
          <span className="analytics-header__eyebrow">ZAHIDALEXBUR / INTELLIGENCE</span>
          <h1>Analytics</h1>
          <p>Key website performance metrics</p>
        </div>
      </div>
      <div className="analytics-header__actions">
        <div className="analytics-period-control">
          <span className="analytics-period-control__icon"><CalendarIcon /></span>
          <select aria-label="Analytics period" value={preset} onChange={(event) => onPresetChange(event.target.value as PeriodPreset)}>
            {Object.entries(periodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {preset === 'custom' ? (
          <div className="analytics-custom-dates">
            <input aria-label="Custom range start" type="date" value={customFrom} onChange={(event) => onCustomFromChange(event.target.value)} />
            <span>—</span>
            <input aria-label="Custom range end" type="date" value={customTo} onChange={(event) => onCustomToChange(event.target.value)} />
          </div>
        ) : null}
        <button type="button" className="analytics-export-button" onClick={exportFullPeriod}><DownloadIcon /><span>Export</span></button>
        <div className="analytics-admin-profile">
          <span className="analytics-admin-profile__avatar">{initials(adminEmail)}</span>
          <span className="analytics-admin-profile__copy"><strong>Administrator</strong><small>{adminEmail}</small></span>
        </div>
      </div>
    </header>
  );
}
