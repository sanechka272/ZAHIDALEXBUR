import { LoginForm } from './LoginForm';
import '../../analytics.css';

export default function AnalyticsLoginPage() {
  return (
    <main className="analytics-app tw-min-h-screen tw-bg-canvas tw-text-graphite tw-grid tw-place-items-center tw-p-6">
      <section className="tw-w-full tw-max-w-md tw-rounded-panel tw-border tw-border-black/10 tw-bg-white tw-p-8 tw-shadow-sm">
        <div className="tw-mb-8">
          <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-bronze">ZAHIDALEXBUR</div>
          <h1 className="tw-mt-3 tw-text-3xl tw-font-semibold">Analytics</h1>
          <p className="tw-mt-2 tw-text-sm tw-text-muted">Administrator access only.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
