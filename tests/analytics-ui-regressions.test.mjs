import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const nextConfig = readFileSync(new URL('../next.config.mjs', import.meta.url), 'utf8');
const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const tailwindUrl = new URL('../tailwind.analytics.config.ts', import.meta.url);
const analyticsCssUrl = new URL('../app/analytics.css', import.meta.url);
const dashboardUrl = new URL('../components/analytics/dashboard/AnalyticsDashboard.tsx', import.meta.url);
const sidebarUrl = new URL('../components/analytics/dashboard/Sidebar.tsx', import.meta.url);
const headerUrl = new URL('../components/analytics/dashboard/DashboardHeader.tsx', import.meta.url);
const pageUrl = new URL('../app/analytics/(protected)/page.tsx', import.meta.url);

test('analytics runtime is server-capable and isolated from public CSS', () => {
  assert.doesNotMatch(nextConfig, /output:\s*['"]export['"]/);
  assert.equal(existsSync(tailwindUrl), true, 'analytics Tailwind config must exist');
  assert.equal(existsSync(analyticsCssUrl), true, 'analytics CSS entry must exist');

  const tailwindConfig = readFileSync(tailwindUrl, 'utf8');
  assert.match(tailwindConfig, /prefix:\s*['"]tw-['"]/);
  assert.match(tailwindConfig, /preflight:\s*false/);
  assert.match(ci, /feature\/first-party-analytics-dashboard/);
});

test('analytics dashboard matches the branded navigation and KPI contract', () => {
  for (const url of [dashboardUrl, sidebarUrl, headerUrl, pageUrl]) {
    assert.equal(existsSync(url), true, `${url.pathname.split('/').at(-1)} must exist`);
  }

  const dashboard = readFileSync(dashboardUrl, 'utf8');
  const sidebar = readFileSync(sidebarUrl, 'utf8');
  const header = readFileSync(headerUrl, 'utf8');
  const css = readFileSync(analyticsCssUrl, 'utf8');

  for (const label of ['Analytics', 'Leads', 'Traffic Sources', 'Geography', 'Pages', 'Settings']) {
    assert.match(sidebar, new RegExp(label.replace(' ', '\\s+')));
  }
  assert.match(header, /Key website performance metrics/);
  for (const label of ['Visitors', 'Leads', 'Website Conversion Rate', 'Cost per Lead']) {
    assert.match(dashboard, new RegExp(label.replace(/ /g, '\\s+')));
  }
  assert.match(dashboard, /Visitors and Leads/);
  assert.match(dashboard, /Traffic Sources/);
  assert.match(dashboard, /Visitor Geography/);
  assert.match(dashboard, /Popular Pages/);
  assert.match(dashboard, /Recent Leads/);
  assert.match(dashboard, /Devices/);
  assert.match(css, /--analytics-canvas:\s*#f4f0e8/i);
  assert.match(css, /grid-template-columns:\s*240px\s+minmax\(0,\s*1fr\)/);
  assert.match(css, /@media\s*\(max-width:\s*767px\)/);
});

test('dashboard avoids generic blue SaaS styling and provides reduced-motion safeguards', () => {
  const css = readFileSync(analyticsCssUrl, 'utf8');
  assert.doesNotMatch(css, /#(?:2563eb|3b82f6|0ea5e9|06b6d4)/i);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /--analytics-bronze:/);
  assert.match(css, /--analytics-gold:/);
});
