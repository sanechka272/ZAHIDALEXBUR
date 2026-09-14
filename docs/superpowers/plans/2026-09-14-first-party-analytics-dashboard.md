# First-Party Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready first-party ZAHIDALEXBUR analytics and lead dashboard inside the existing Next.js application, on the same domain/deployment as the public website, with real visitor/session/page/UTM/geography/device/lead data and optional GTM support.

**Architecture:** Convert the current static-export Next.js app into a server-capable Next.js app while preserving the public site UI. Add PostgreSQL persistence behind focused repository modules, same-origin tracking and lead APIs, first/last-touch attribution, local GeoIP lookup, server-session admin auth, protected analytics APIs, and a branded `/analytics` dashboard. All implementation remains on `feature/first-party-analytics-dashboard` until intentionally merged.

**Tech Stack:** Next.js 16.3.4, React 19.3, TypeScript 5.9, PostgreSQL, Drizzle ORM + postgres.js, Zod, Argon2id, `maxmind`, `ua-parser-js`, Recharts, Tailwind CSS 3.4 with `preflight: false` and `tw-` prefix for analytics-only utilities, Node test runner + `tsx`, local SVG map assets.

**Spec:** `docs/superpowers/specs/2026-09-14-first-party-analytics-dashboard-design.md`

## Global Constraints

- Work only on branch `feature/first-party-analytics-dashboard`; do not merge to `main` as part of this plan.
- The public website, tracking API, leads API, dashboard, authentication and database access remain one Next.js application and one deployment.
- Do not depend on Google Analytics, Cloudflare Analytics, PostHog, Plausible or another hosted analytics product.
- GTM is optional and the first-party dashboard must continue to work when GTM is disabled or blocked.
- Capture `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`, `fbclid`, `ttclid`, referrer and landing page.
- Persist both first-touch and last-attributable-touch snapshots on every lead.
- A subsequent direct visit must not overwrite a known last-attributable-touch source.
- Use a 30-minute inactivity window for sessions.
- Do not persist raw IP addresses as an analytics dimension; use IP only transiently for GeoIP/abuse controls.
- GeoIP must use a local on-host `.mmdb` database, never a hosted runtime geolocation API.
- Store timestamps in UTC and aggregate/display periods in `Europe/Kyiv`.
- Empty datasets return zero/empty arrays; never synthesize demo analytics values.
- Dashboard remains focused on website analytics and incoming leads; no CRM pipeline, ERP, accounting, tasks, forecasting or employee modules.
- `/analytics/*` and protected analytics APIs require an authenticated admin session.
- Existing public visual styles must not be changed by Tailwind reset/preflight; Tailwind is analytics-scoped with prefix `tw-` and `preflight: false`.
- Preserve existing landing/blog routes and current public-site regression tests.
- CI must run on `main`, pull requests to `main`, and `feature/first-party-analytics-dashboard`.

---

## File Structure

### Server/data modules

- `lib/db/client.ts` — PostgreSQL connection factory.
- `lib/db/schema.ts` — Drizzle table definitions and exported DB row types.
- `lib/db/migrate.ts` — migration runner used by CI/deployment.
- `db/migrations/0001_analytics.sql` — first analytics/auth/settings schema.
- `lib/analytics/contracts.ts` — Zod request/query schemas and shared analytics types.
- `lib/analytics/period.ts` — named period parsing, UTC/Kyiv boundaries, comparison-period calculation.
- `lib/analytics/attribution.ts` — UTM/click/referrer normalization and first/last-touch rules.
- `lib/analytics/device.ts` — UA normalization to Mobile/Desktop/Tablet plus browser/OS families.
- `lib/analytics/geo.ts` — local MaxMind lookup and Ukraine region-key normalization.
- `lib/analytics/auth.ts` — admin password/session creation, lookup, invalidation and guards.
- `lib/analytics/repository.ts` — visitor/session/page/event ingestion and transactional lead creation.
- `lib/analytics/dashboard-repository.ts` — SQL aggregations for KPI/timeseries/sources/geography/pages/devices/leads/export.
- `lib/analytics/settings-repository.ts` — analytics settings read/write and public GTM projection.

### Public tracking/lead surface

- `components/analytics/FirstPartyTracker.tsx` — browser tracking lifecycle.
- `components/analytics/GtmBridge.tsx` — optional GTM loader and `dataLayer` bridge.
- `app/api/analytics/track/route.ts` — public page/event ingestion.
- `app/api/leads/route.ts` — public lead submission.
- `app/api/site-settings/analytics/route.ts` — safe public GTM settings.
- `components/LandingPage.tsx` — replace fake lead success with real `/api/leads` submission.
- `app/layout.tsx` — mount tracker/GTM bridge without changing public layout.

### Auth and dashboard

- `app/analytics/login/page.tsx` — login screen.
- `app/api/analytics/auth/login/route.ts` — login endpoint.
- `app/api/analytics/auth/logout/route.ts` — logout endpoint.
- `app/analytics/(protected)/layout.tsx` — server auth gate and analytics shell.
- `app/analytics/(protected)/page.tsx` — overview dashboard.
- `app/analytics/(protected)/leads/page.tsx`
- `app/analytics/(protected)/traffic/page.tsx`
- `app/analytics/(protected)/geography/page.tsx`
- `app/analytics/(protected)/pages/page.tsx`
- `app/analytics/(protected)/settings/page.tsx`
- `components/analytics/dashboard/*` — sidebar, header, period picker, KPI cards, charts, tables, map, responsive drawer.
- `public/maps/ukraine-oblasts.svg` — repository-local oblast vector map used only by the dashboard.
- `app/analytics.css` — analytics entry for scoped Tailwind plus small component tokens.
- `tailwind.analytics.config.ts` — prefix `tw-`, `preflight: false`, analytics-only content paths and ZAHIDALEXBUR theme tokens.
- `postcss.config.mjs` — Tailwind/PostCSS processing.

### Protected APIs

- `app/api/analytics/summary/route.ts`
- `app/api/analytics/timeseries/route.ts`
- `app/api/analytics/sources/route.ts`
- `app/api/analytics/geography/route.ts`
- `app/api/analytics/pages/route.ts`
- `app/api/analytics/devices/route.ts`
- `app/api/analytics/leads/route.ts`
- `app/api/analytics/export/route.ts`
- `app/api/analytics/settings/route.ts`

### Tooling and tests

- `scripts/create-analytics-admin.ts` — explicit admin bootstrap utility.
- `.env.example` — documented required runtime values.
- `.github/workflows/ci.yml` — feature-branch trigger and PostgreSQL service.
- `tests/analytics-attribution.test.ts`
- `tests/analytics-period.test.ts`
- `tests/analytics-repository.test.ts`
- `tests/analytics-auth.test.ts`
- `tests/analytics-api.test.ts`
- `tests/analytics-ui-regressions.test.mjs`
- existing `tests/*.test.mjs` remain and continue to pass.

---

### Task 1: Make the application server-capable and establish analytics-safe tooling

**Files:**
- Modify: `next.config.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `tailwind.analytics.config.ts`
- Create: `postcss.config.mjs`
- Create: `app/analytics.css`
- Modify: `.github/workflows/ci.yml`
- Create: `.env.example`
- Test: `tests/analytics-ui-regressions.test.mjs`

**Interfaces:**
- Produces: a server-capable Next.js build, analytics-only `tw-` Tailwind utilities, feature-branch CI with PostgreSQL, and runtime environment contract.
- Environment contract: `DATABASE_URL`, `ANALYTICS_SESSION_SECRET`, `GEOIP_CITY_DB_PATH`, `ANALYTICS_ADMIN_PASSWORD` for bootstrap command only.

- [ ] **Step 1: Write a failing regression test for server mode and analytics Tailwind isolation**

Add assertions to `tests/analytics-ui-regressions.test.mjs` that:

```js
assert.doesNotMatch(nextConfig, /output:\s*['"]export['"]/);
assert.match(tailwindConfig, /prefix:\s*['"]tw-['"]/);
assert.match(tailwindConfig, /preflight:\s*false/);
assert.match(ci, /feature\/first-party-analytics-dashboard/);
```

- [ ] **Step 2: Run the regression test and confirm RED**

Run:

```bash
node --test tests/analytics-ui-regressions.test.mjs
```

Expected: FAIL because the app is still static-exported and analytics Tailwind/feature CI do not exist.

- [ ] **Step 3: Install focused dependencies and update scripts**

Set scripts to include:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "tsx --test tests/*.test.ts && node --test tests/*.test.mjs",
  "db:migrate": "tsx lib/db/migrate.ts",
  "analytics:create-admin": "tsx scripts/create-analytics-admin.ts"
}
```

Add runtime dependencies:

```text
drizzzle-orm is NOT a valid package name; use drizzle-orm
postgres
zod
argon2
maxmind
ua-parser-js
recharts
```

Add dev dependencies:

```text
tsx
tailwindcss@3.4.17
postcss
autoprefixer
@types/ua-parser-js
```

Remove `output: 'export'` from `next.config.mjs` and keep a standard server-capable Next configuration.

- [ ] **Step 4: Add analytics-only Tailwind configuration**

`tailwind.analytics.config.ts` must use:

```ts
import type { Config } from 'tailwindcss';

export default {
  prefix: 'tw-',
  corePlugins: { preflight: false },
  content: [
    './app/analytics/**/*.{ts,tsx}',
    './components/analytics/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F0E8',
        panel: '#FFFFFF',
        sidebar: '#17130F',
        graphite: '#27231F',
        muted: '#847B70',
        bronze: '#A9784F',
        gold: '#B9945A',
        positive: '#4F7A5B',
      },
      borderRadius: {
        panel: '16px',
      },
    },
  },
} satisfies Config;
```

`app/analytics.css` imports Tailwind layers and defines only `.analytics-app` design tokens; it must not reset `html`, `body`, generic `button`, generic `table`, or public-site selectors.

- [ ] **Step 5: Make CI exercise the feature branch and PostgreSQL**

Configure `.github/workflows/ci.yml` push branches as:

```yaml
branches: [main, feature/first-party-analytics-dashboard]
```

Add PostgreSQL 16 service with test credentials and set:

```yaml
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/zahidalexbur_test
  ANALYTICS_SESSION_SECRET: ci-only-session-secret-at-least-32-bytes
  GEOIP_CITY_DB_PATH: ./tests/fixtures/empty.mmdb
```

Before tests, run `npm run db:migrate` once migration code exists; until Task 2 lands, keep migration invocation out of CI so this task remains green.

- [ ] **Step 6: Run existing and new tests, then production build**

Run:

```bash
npm test
npm run build
```

Expected: all existing public-site tests remain green and Next builds without static export.

- [ ] **Step 7: Commit**

```bash
git add next.config.mjs package.json package-lock.json tailwind.analytics.config.ts postcss.config.mjs app/analytics.css .github/workflows/ci.yml .env.example tests/analytics-ui-regressions.test.mjs
git commit -m "chore: prepare server analytics runtime"
```

---

### Task 2: Create the PostgreSQL schema, migration runner and typed database boundary

**Files:**
- Create: `lib/db/client.ts`
- Create: `lib/db/schema.ts`
- Create: `lib/db/migrate.ts`
- Create: `db/migrations/0001_analytics.sql`
- Modify: `.github/workflows/ci.yml`
- Test: `tests/analytics-repository.test.ts`

**Interfaces:**
- Produces: `getDb(): Database`, typed tables, and a migration command.
- Tables: `admin_users`, `admin_sessions`, `visitors`, `sessions`, `page_views`, `analytics_events`, `leads`, `analytics_settings`.
- Later repository tasks consume table exports from `lib/db/schema.ts` only; route handlers do not import raw table definitions directly.

- [ ] **Step 1: Write an integration test that expects the analytics schema**

Test a real CI PostgreSQL database by asserting:

```ts
const tables = await sql<{ table_name: string }[]>`
  select table_name from information_schema.tables
  where table_schema = 'public'
`;
for (const name of ['visitors', 'sessions', 'page_views', 'analytics_events', 'leads', 'admin_users', 'admin_sessions', 'analytics_settings']) {
  assert.ok(tables.some((row) => row.table_name === name));
}
```

- [ ] **Step 2: Run the integration test and confirm RED**

Run:

```bash
npm run db:migrate
npx tsx --test tests/analytics-repository.test.ts
```

Expected: FAIL because schema/migration modules do not exist.

- [ ] **Step 3: Implement the database client**

`lib/db/client.ts` exports a lazily-created `postgres` client and Drizzle DB. It must throw a clear startup error if `DATABASE_URL` is absent in server code, never import from client components, and use a small connection pool suitable for one web application.

- [ ] **Step 4: Implement schema and migration SQL**

Use UUID primary keys generated by PostgreSQL (`gen_random_uuid()`) and create these important indexes:

```text
sessions(visitor_id, started_at)
sessions(started_at)
sessions(source, medium, campaign, started_at)
sessions(country_code, region_code, city, started_at)
page_views(occurred_at)
page_views(path, occurred_at)
page_views(session_id, occurred_at)
analytics_events(event_name, occurred_at)
leads(created_at)
leads(source, medium, campaign, created_at)
```

`page_views.event_id` and `analytics_events.event_id` are unique idempotency keys.

- [ ] **Step 5: Implement `lib/db/migrate.ts`**

Read ordered `.sql` files from `db/migrations`, maintain a `_migrations` table keyed by filename/checksum, run pending migrations transactionally, and refuse a checksum mismatch for an already-applied migration.

- [ ] **Step 6: Enable migrations in CI and run database tests**

Add before test step:

```yaml
- name: Migrate test database
  run: npm run db:migrate
```

Run:

```bash
npm run db:migrate
npx tsx --test tests/analytics-repository.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/db db/migrations .github/workflows/ci.yml tests/analytics-repository.test.ts
git commit -m "feat: add analytics database schema"
```

---

### Task 3: Implement period parsing, attribution, device classification and local GeoIP normalization

**Files:**
- Create: `lib/analytics/contracts.ts`
- Create: `lib/analytics/period.ts`
- Create: `lib/analytics/attribution.ts`
- Create: `lib/analytics/device.ts`
- Create: `lib/analytics/geo.ts`
- Test: `tests/analytics-period.test.ts`
- Test: `tests/analytics-attribution.test.ts`

**Interfaces:**
- Produces: `resolvePeriod(input, now)`, `parseAttribution(url, referrer)`, `applyAttribution(existing, incoming)`, `classifyDevice(userAgent)`, `resolveGeo(ip)`.
- Attribution shape:

```ts
export type Attribution = {
  source: string;
  medium: string;
  campaign: string | null;
  content: string | null;
  term: string | null;
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  referrer: string | null;
  landingPage: string;
  attributable: boolean;
};
```

- [ ] **Step 1: Write RED tests for period semantics**

Cover Today, Last 7 Days, Last 30 Days, Current Month, Previous Month, custom range, equal-duration comparison period, and Europe/Kyiv day boundaries.

Example assertion:

```ts
const range = resolvePeriod({ preset: 'last7' }, new Date('2026-09-14T18:00:00Z'));
assert.equal(range.timezone, 'Europe/Kyiv');
assert.equal(range.comparisonDurationMs, range.currentDurationMs);
```

- [ ] **Step 2: Write RED tests for attribution semantics**

Required cases:

```text
utm_* beats referrer classification
gclid => google / cpc when no explicit UTM source/medium
fbclid => meta / paid_social when no explicit UTM source/medium
google organic referrer => google / organic
direct first visit => direct / none
direct return does not overwrite a known last attributable touch
new UTM campaign does update last attributable touch
first touch never changes
```

- [ ] **Step 3: Implement `contracts.ts`, `period.ts`, and `attribution.ts`**

Use Zod to reject malformed dates, unsupported grouping and excessive custom ranges. Keep source classification deterministic and testable with no network calls.

- [ ] **Step 4: Implement device and GeoIP modules**

`classifyDevice()` returns:

```ts
{ deviceType: 'Mobile' | 'Desktop' | 'Tablet'; browserFamily: string; osFamily: string }
```

`resolveGeo(ip)` reads `GEOIP_CITY_DB_PATH` lazily. A missing/unreadable DB returns `{ countryCode: null, countryName: null, regionCode: null, regionName: null, city: null }` and logs one server warning instead of failing tracking.

Normalize Ukrainian region names to stable keys such as `UA-46` for Lviv Oblast when the MMDB result provides matching region identifiers/names.

- [ ] **Step 5: Run unit tests**

Run:

```bash
npx tsx --test tests/analytics-period.test.ts tests/analytics-attribution.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/analytics/contracts.ts lib/analytics/period.ts lib/analytics/attribution.ts lib/analytics/device.ts lib/analytics/geo.ts tests/analytics-period.test.ts tests/analytics-attribution.test.ts
git commit -m "feat: add analytics attribution and period core"
```

---

### Task 4: Build idempotent visitor/session/page ingestion repositories and public tracking API

**Files:**
- Create: `lib/analytics/repository.ts`
- Create: `app/api/analytics/track/route.ts`
- Create: `components/analytics/FirstPartyTracker.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/analytics-repository.test.ts`
- Test: `tests/analytics-api.test.ts`

**Interfaces:**
- Produces repository function:

```ts
recordAnalyticsEvent(input: TrackEventInput, context: RequestContext): Promise<TrackResult>
```

- Browser POST payload:

```ts
{
  eventId: string;
  eventName: 'page_view' | 'lead_submit';
  path: string;
  title?: string;
  referrer?: string;
  url: string;
  clientTimestamp?: string;
}
```

- Server sets/renews `zab_visitor` and `zab_session` first-party cookies.

- [ ] **Step 1: Extend repository integration tests with ingestion RED cases**

Verify:

```text
first page view creates visitor + session + page_view
same eventId cannot double-count
same visitor inside 30 minutes reuses session
expired session creates a new session
known campaign becomes visitor first/last touch
subsequent direct session leaves last attributable touch intact
```

- [ ] **Step 2: Implement `recordAnalyticsEvent()` transactionally**

The repository must:

1. resolve/create visitor from cookie ID
2. resolve/create 30-minute session
3. normalize attribution/device/geo
4. update visitor `last_seen_at`
5. update last-attributable touch only for attributable visits
6. insert idempotent page/event row
7. return cookie/session metadata to the route

- [ ] **Step 3: Implement `/api/analytics/track`**

Reject non-JSON and oversized payloads, validate Zod schema, reject obvious bot user agents, derive IP from standard reverse-proxy headers without relying on Cloudflare-only headers, and call repository code. Canonical persisted time is server time.

- [ ] **Step 4: Implement the non-blocking tracker**

`FirstPartyTracker` sends an initial `page_view`, observes App Router path/search changes, creates crypto-random event IDs, uses same-origin `fetch(..., { keepalive: true })`, and uses `navigator.sendBeacon` only for queued unload data. It must never include form field values in generic analytics payloads.

- [ ] **Step 5: Mount tracker in `app/layout.tsx` and run tests/build**

Run:

```bash
npm test
npm run build
```

Expected: all existing landing/blog tests plus ingestion tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/analytics/repository.ts app/api/analytics/track/route.ts components/analytics/FirstPartyTracker.tsx app/layout.tsx tests/analytics-repository.test.ts tests/analytics-api.test.ts
git commit -m "feat: collect first-party website analytics"
```

---

### Task 5: Replace fake lead submission with persistent leads and attribution snapshots

**Files:**
- Create: `app/api/leads/route.ts`
- Modify: `lib/analytics/repository.ts`
- Modify: `components/LandingPage.tsx`
- Test: `tests/analytics-repository.test.ts`
- Test: `tests/analytics-api.test.ts`
- Modify: existing lead/contact regression tests if they currently assert fake success behavior.

**Interfaces:**
- Produces:

```ts
createLead(input: CreateLeadInput, context: RequestContext): Promise<{ id: string; createdAt: Date }>
```

- Accepted public fields:

```ts
{
  name?: string;
  phone: string;
  location?: string;
  service?: string;
  originatingPage: string;
  honeypot?: string;
  startedAtMs: number;
}
```

- [ ] **Step 1: Write RED tests for lead persistence and attribution**

Verify a lead stores:

```text
visitor_id/session_id
originating page
current session source/medium/campaign
first-touch source/medium/campaign
last-attributable-touch source/medium/campaign
status = 'new'
```

Also verify duplicate obvious submissions inside the suppression window return the existing success outcome without inserting multiple lead rows.

- [ ] **Step 2: Implement transactional lead creation**

In one DB transaction:

1. normalize phone
2. find/create tracking context
3. read visitor first/last attribution
4. insert lead snapshot
5. insert `lead_submit` conversion event

- [ ] **Step 3: Implement `/api/leads` abuse protections**

Reject honeypot values, submissions completed unrealistically fast, invalid phone payloads, wrong content type and excessive payload size. Do not expose database errors to clients.

- [ ] **Step 4: Update `LeadForm`**

Replace `setSent(true)` fake handling with a real `fetch('/api/leads', { method: 'POST' })`. Track loading/error/success states; only show success after HTTP success. Include `window.location.pathname` and form start timestamp.

- [ ] **Step 5: Run lead/API/public regression tests and build**

Run:

```bash
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/api/leads/route.ts lib/analytics/repository.ts components/LandingPage.tsx tests
git commit -m "feat: persist attributed website leads"
```

---

### Task 6: Add admin authentication and protect analytics routes/APIs

**Files:**
- Create: `lib/analytics/auth.ts`
- Create: `scripts/create-analytics-admin.ts`
- Create: `app/analytics/login/page.tsx`
- Create: `app/api/analytics/auth/login/route.ts`
- Create: `app/api/analytics/auth/logout/route.ts`
- Create: `app/analytics/(protected)/layout.tsx`
- Test: `tests/analytics-auth.test.ts`
- Test: `tests/analytics-api.test.ts`

**Interfaces:**
- Produces:

```ts
createAdmin(email: string, password: string): Promise<void>
verifyCredentials(email: string, password: string): Promise<AdminUser | null>
createAdminSession(userId: string): Promise<{ rawToken: string; expiresAt: Date }>
requireAdmin(): Promise<AdminUser>
requireAdminRequest(request: Request): Promise<AdminUser>
logoutAdmin(rawToken: string): Promise<void>
```

- Cookie: `zab_admin_session`, HttpOnly, Secure in production, SameSite=Lax, Path=/.

- [ ] **Step 1: Write RED auth tests**

Cover Argon2id hashes, valid/invalid credentials, token hashing at rest, expiry, logout invalidation and protected API rejection without session.

- [ ] **Step 2: Implement auth service**

Use a 32-byte random session token and store only SHA-256 token hash. Admin session expiry defaults to 7 days. Refresh `last_seen_at` at a throttled interval rather than every request.

- [ ] **Step 3: Add explicit admin bootstrap script**

Usage:

```bash
ANALYTICS_ADMIN_PASSWORD='strong-secret' npm run analytics:create-admin -- --email admin@example.com
```

The script validates password length >= 12 and upserts only the named admin user's password hash; it never prints the password.

- [ ] **Step 4: Implement login/logout and protected analytics layout**

Unauthenticated `/analytics/*` protected routes redirect to `/analytics/login`. The login page itself remains reachable. Protected route handlers return 401 JSON instead of redirecting.

- [ ] **Step 5: Run auth tests and build**

Run:

```bash
npx tsx --test tests/analytics-auth.test.ts tests/analytics-api.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/analytics/auth.ts scripts/create-analytics-admin.ts app/analytics app/api/analytics/auth tests/analytics-auth.test.ts tests/analytics-api.test.ts
git commit -m "feat: protect analytics dashboard with admin auth"
```

---

### Task 7: Build aggregation repositories and protected analytics APIs

**Files:**
- Create: `lib/analytics/dashboard-repository.ts`
- Create: `app/api/analytics/summary/route.ts`
- Create: `app/api/analytics/timeseries/route.ts`
- Create: `app/api/analytics/sources/route.ts`
- Create: `app/api/analytics/geography/route.ts`
- Create: `app/api/analytics/pages/route.ts`
- Create: `app/api/analytics/devices/route.ts`
- Create: `app/api/analytics/leads/route.ts`
- Test: `tests/analytics-repository.test.ts`
- Test: `tests/analytics-api.test.ts`

**Interfaces:**
- Produces functions:

```ts
getSummary(range): Promise<Summary>
getTimeseries(range, groupBy): Promise<TimeseriesPoint[]>
getTrafficSources(range): Promise<TrafficSourceRow[]>
getGeography(range, scope): Promise<GeographyRow[]>
getPopularPages(range): Promise<PageRow[]>
getDevices(range): Promise<DeviceRow[]>
getRecentLeads(range, limit): Promise<LeadRow[]>
```

- `Summary` includes visitors, sessions, pageViews, leads, conversionRate and previous-period values/deltas. `costPerLead` is `null` until spend exists.

- [ ] **Step 1: Seed deterministic analytics fixtures in integration tests**

Insert visitors/sessions/pageviews/leads across current and comparison periods so exact counts and conversion rates are known.

- [ ] **Step 2: Write RED aggregation assertions**

Verify visitor count uses distinct visitors, sessions use distinct sessions, page views count page rows, conversion rate = leads/visitors when visitors > 0, and each source/geography/device/page aggregation respects the active period.

- [ ] **Step 3: Implement SQL aggregation repository**

All aggregation occurs in SQL. Do not fetch raw event tables and aggregate in JS. Use half-open UTC intervals `[from, to)` derived by `resolvePeriod`.

- [ ] **Step 4: Implement protected route handlers**

Every handler:

1. requires admin
2. validates period query with Zod
3. calls one repository method
4. returns numeric raw values
5. uses consistent JSON error shape `{ error: { code, message } }`

- [ ] **Step 5: Run repository/API tests**

Run:

```bash
npx tsx --test tests/analytics-repository.test.ts tests/analytics-api.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/analytics/dashboard-repository.ts app/api/analytics/summary app/api/analytics/timeseries app/api/analytics/sources app/api/analytics/geography app/api/analytics/pages app/api/analytics/devices app/api/analytics/leads tests
git commit -m "feat: expose protected analytics aggregates"
```

---

### Task 8: Implement GTM settings and independent first-party/GTM event bridge

**Files:**
- Create: `lib/analytics/settings-repository.ts`
- Create: `app/api/site-settings/analytics/route.ts`
- Create: `app/api/analytics/settings/route.ts`
- Create: `components/analytics/GtmBridge.tsx`
- Modify: `app/layout.tsx`
- Test: `tests/analytics-api.test.ts`
- Test: `tests/analytics-ui-regressions.test.mjs`

**Interfaces:**
- Produces public shape:

```ts
{ gtmEnabled: boolean; gtmContainerId: string | null }
```

- Protected PUT accepts:

```ts
{ gtmEnabled: boolean; gtmContainerId: string | null }
```

- [ ] **Step 1: Write RED tests for GTM validation and public projection**

Accept only IDs matching `/^GTM-[A-Z0-9]+$/`. Public endpoint must expose no admin/session/database information.

- [ ] **Step 2: Implement settings repository and APIs**

Use the singleton `analytics_settings` row. Protected PUT validates admin session. Public GET returns only GTM configuration.

- [ ] **Step 3: Implement `GtmBridge`**

Fetch safe settings once, inject the standard GTM script only when enabled and valid, and expose:

```ts
window.dataLayer.push({ event: 'page_view', page_path: path })
window.dataLayer.push({ event: 'lead_submit', lead_id: id, page_path: path })
```

First-party persistence must occur regardless of GTM state.

- [ ] **Step 4: Mount bridge and run tests/build**

Run:

```bash
npm test
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/analytics/settings-repository.ts app/api/site-settings/analytics app/api/analytics/settings components/analytics/GtmBridge.tsx app/layout.tsx tests
git commit -m "feat: add optional GTM integration"
```

---

### Task 9: Build the branded analytics shell, period picker and KPI overview

**Files:**
- Create: `components/analytics/dashboard/AnalyticsShell.tsx`
- Create: `components/analytics/dashboard/Sidebar.tsx`
- Create: `components/analytics/dashboard/MobileNav.tsx`
- Create: `components/analytics/dashboard/DashboardHeader.tsx`
- Create: `components/analytics/dashboard/PeriodPicker.tsx`
- Create: `components/analytics/dashboard/KpiCard.tsx`
- Create: `components/analytics/dashboard/useAnalyticsPeriod.ts`
- Create: `app/analytics/(protected)/page.tsx`
- Modify: `app/analytics/(protected)/layout.tsx`
- Modify: `app/analytics.css`
- Test: `tests/analytics-ui-regressions.test.mjs`

**Interfaces:**
- Period presets: `today | last7 | last30 | currentMonth | previousMonth | custom`.
- Shared dashboard query state is encoded in URL search params so page refresh/share preserves the selected period.

- [ ] **Step 1: Write RED structural/UI tests**

Assert the shell contains exact nav labels:

```text
Analytics
Leads
Traffic Sources
Geography
Pages
Settings
```

Assert overview contains KPI labels:

```text
Visitors
Leads
Website Conversion Rate
Cost per Lead
```

- [ ] **Step 2: Implement the fixed premium sidebar and responsive navigation**

Use approximately 240px desktop sidebar, local ZAHIDALEXBUR logo, warm off-white canvas, dark-brown sidebar, bronze active state, drilling image in lower sidebar, tablet collapse and mobile drawer. No generic blue tokens.

- [ ] **Step 3: Implement header and period picker**

Header copy:

```text
Analytics
Key website performance metrics
```

Picker options exactly match the spec and custom dates update URL query parameters.

- [ ] **Step 4: Implement KPI cards using real summary API**

Each card has icon, label, current value, delta and previous-period comparison. `costPerLead === null` renders `—` and `Spend not configured`, never a fake number.

- [ ] **Step 5: Implement restrained count-up and reduced-motion behavior**

Count-up runs 200–500ms only on first load/period changes and resolves immediately under `prefers-reduced-motion: reduce`.

- [ ] **Step 6: Run UI tests and build**

Run:

```bash
node --test tests/analytics-ui-regressions.test.mjs
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add components/analytics/dashboard app/analytics app/analytics.css tests/analytics-ui-regressions.test.mjs
git commit -m "feat: build branded analytics dashboard shell"
```

---

### Task 10: Add real charts, Ukraine geography, popular pages and recent leads

**Files:**
- Create: `components/analytics/dashboard/VisitorsLeadsChart.tsx`
- Create: `components/analytics/dashboard/TrafficSourcesDonut.tsx`
- Create: `components/analytics/dashboard/UkraineMap.tsx`
- Create: `components/analytics/dashboard/PopularPagesTable.tsx`
- Create: `components/analytics/dashboard/RecentLeadsTable.tsx`
- Create: `components/analytics/dashboard/DevicesDonut.tsx`
- Create: `public/maps/ukraine-oblasts.svg`
- Modify: `app/analytics/(protected)/page.tsx`
- Test: `tests/analytics-ui-regressions.test.mjs`

**Interfaces:**
- Components consume protected API data for the active URL period.
- Ukraine map uses stable region keys matching `normalizeUkraineRegion()` from Task 3.

- [ ] **Step 1: Write RED UI tests for all overview modules**

Require headings:

```text
Visitors and Leads
Traffic Sources
Visitor Geography
Popular Pages
Recent Leads
Devices
```

Also assert the map asset is repository-local and no hosted chart/embed URL exists.

- [ ] **Step 2: Implement Visitors/Leads line chart**

Use Recharts with two series: muted bronze Visitors and graphite Leads, subtle grid, readable axes, hover tooltip and day/week/month grouping selector.

- [ ] **Step 3: Implement Traffic Sources and Devices donuts**

Traffic source labels exactly:

```text
Google Ads
Meta Ads
Organic Search
Direct Traffic
Other
```

Center label shows total visitors. Devices shows Mobile/Desktop/Tablet and total visitors.

- [ ] **Step 4: Vendor a local Ukraine oblast SVG and implement map interactivity**

Store the map under `public/maps/ukraine-oblasts.svg` with oblast paths addressable by stable region key. `UkraineMap` colors regions by visitor-volume buckets in the bronze palette, visually emphasizes the highest bucket, and shows a keyboard-accessible tooltip with region/visitors/percentage.

- [ ] **Step 5: Implement Ukraine / World switch**

Ukraine mode displays map + ranked regions. World mode displays ranked countries from the same geography API until a local production-quality world vector map is added in a separately approved enhancement; the API contract already supports it.

- [ ] **Step 6: Implement Popular Pages and Recent Leads tables**

Popular pages: page name, visits, conversion rate. Recent leads: ID, Name, Phone, Location, Service, Source, Date with muted service badges and `View all →` link.

- [ ] **Step 7: Verify responsive layout**

Mobile requirements: KPI 2-column then 1-column, cards stack, region list below map, tables use horizontal overflow without shrinking text below readable size.

- [ ] **Step 8: Run tests/build and commit**

```bash
npm test
npm run build
git add components/analytics/dashboard public/maps/ukraine-oblasts.svg app/analytics tests/analytics-ui-regressions.test.mjs
git commit -m "feat: add analytics charts geography and tables"
```

---

### Task 11: Build dedicated Leads, Traffic, Geography, Pages and Settings screens

**Files:**
- Create: `app/analytics/(protected)/leads/page.tsx`
- Create: `app/analytics/(protected)/traffic/page.tsx`
- Create: `app/analytics/(protected)/geography/page.tsx`
- Create: `app/analytics/(protected)/pages/page.tsx`
- Create: `app/analytics/(protected)/settings/page.tsx`
- Create or reuse focused components under `components/analytics/dashboard/`
- Test: `tests/analytics-ui-regressions.test.mjs`

**Interfaces:**
- All pages consume the same URL period contract and protected APIs.
- Leads view exposes both first-touch and last-touch attribution columns/details.

- [ ] **Step 1: Write RED route/UI tests**

Assert all five pages exist and use analytics shell navigation. Assert Leads renders labels for both `First touch` and `Last touch`. Assert Settings renders `GTM Container ID` and `Enable GTM`.

- [ ] **Step 2: Implement Leads page**

Provide period filter, pagination, status display, core lead fields, originating page, current source, first-touch source/campaign and last-touch source/campaign. Do not add CRM pipeline controls.

- [ ] **Step 3: Implement Traffic Sources page**

Break down source/medium/campaign with visitors, sessions, leads and conversion rate. Include UTM campaign drill-down as a table/filter, not a sales-funnel module.

- [ ] **Step 4: Implement Geography page**

Reuse visitor geography component with country/region/city ranked tables and Ukraine/World mode. Copy must explicitly say visitor geography, not lead geography.

- [ ] **Step 5: Implement Pages page**

Show route/label, visits, unique visitors, leads originating from the page and page conversion rate.

- [ ] **Step 6: Implement Settings page**

Allow authenticated admin to enable/disable GTM and save a validated container ID. Include a status note that first-party analytics remains active independently of GTM.

- [ ] **Step 7: Run tests/build and commit**

```bash
npm test
npm run build
git add app/analytics components/analytics/dashboard tests/analytics-ui-regressions.test.mjs
git commit -m "feat: add analytics detail screens"
```

---

### Task 12: Add CSV export, hardening, retention cleanup and final regression verification

**Files:**
- Create: `app/api/analytics/export/route.ts`
- Create: `lib/analytics/csv.ts`
- Create: `scripts/analytics-retention.ts`
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `README.md` if present, otherwise create `docs/analytics-operations.md`
- Test: `tests/analytics-api.test.ts`
- Test: all existing and analytics tests.

**Interfaces:**
- Overview export includes visitors, sessions, page views, leads, conversion rate, source/medium/campaign for selected period.
- Leads export includes first-touch and last-touch attribution columns.
- Retention script deletes raw page/event rows older than 13 months while retaining lead records and aggregated business records required by the app.

- [ ] **Step 1: Write RED export tests**

Verify authenticated CSV response headers, selected-period filtering, escaped CSV values and both attribution families in lead export.

- [ ] **Step 2: Implement CSV serialization and export route**

Use RFC-4180-safe quoting. Return UTF-8 with BOM so Ukrainian text opens correctly in common spreadsheet applications.

- [ ] **Step 3: Implement retention command**

Add:

```json
"analytics:retention": "tsx scripts/analytics-retention.ts"
```

Delete raw analytics older than 13 months in bounded batches. Never delete leads in this command.

- [ ] **Step 4: Add deployment/operations documentation**

Document exact required values and commands:

```text
DATABASE_URL=postgresql://...
ANALYTICS_SESSION_SECRET=<32+ random bytes>
GEOIP_CITY_DB_PATH=/absolute/path/GeoLite2-City.mmdb
npm run db:migrate
ANALYTICS_ADMIN_PASSWORD='...' npm run analytics:create-admin -- --email admin@example.com
npm run build
npm start
```

Explicitly document that the application and DB are intended to be hosted together under the ZAHIDALEXBUR deployment environment and that the feature branch must not be merged until the target host supports persistent Node.js + PostgreSQL.

- [ ] **Step 5: Run complete fresh verification**

Run:

```bash
npm run db:migrate
npm test
npm run build
```

Expected:

```text
all Node/TS analytics tests pass
all existing public-site regression tests pass
TypeScript stage passes inside Next build
production Next build exits 0
```

- [ ] **Step 6: Review branch diff against `main`**

Check that all analytics work is isolated to `feature/first-party-analytics-dashboard` and that no merge or deployment to main has occurred.

- [ ] **Step 7: Commit final hardening**

```bash
git add app/api/analytics/export lib/analytics/csv.ts scripts/analytics-retention.ts package.json .env.example docs tests
git commit -m "feat: finalize first-party analytics dashboard"
```

- [ ] **Step 8: Do not merge**

Leave the completed feature branch available for preview/review. Merge to `main` only after explicit user approval in a later turn.
