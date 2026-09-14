# ZAHIDALEXBUR First-Party Analytics Dashboard — Design Spec

Date: 2026-09-14
Status: Proposed for implementation

## 1. Goal

Build a production-ready, branded analytics dashboard directly inside the existing ZAHIDALEXBUR Next.js application. The dashboard must use real first-party website data, live at the same domain and deployment as the public website, and remain focused on website analytics and incoming leads.

The system must not depend on Google Analytics, Cloudflare Analytics, PostHog, Plausible, or another hosted analytics product. Google Tag Manager is supported as an optional outbound integration, but the ZAHIDALEXBUR dashboard remains fully functional without GTM.

The existing website is currently a Next.js application configured as a static export. Implementing first-party ingestion and persistence requires converting it to a server-capable Next.js deployment while keeping the public site and dashboard in the same repository, application, domain, and hosting environment.

## 2. Chosen architecture

### Selected approach: one full-stack Next.js application + same-host persistent database

The public website, tracking endpoints, lead endpoint, analytics API, admin authentication, dashboard UI, and database access all belong to the same Next.js application.

Logical topology:

```text
Browser
  |
  |-- public pages --------------------------+
  |                                         |
  |-- POST /api/analytics/track ------------|--> ZAHIDALEXBUR Next.js app
  |-- POST /api/leads ----------------------|        |
  |                                         |        +--> same-host database
  +-- /analytics/* -------------------------+        +--> local GeoIP database
```

There is no separate analytics server.

### Alternatives considered and rejected

1. **Static site + hosted analytics service** — rejected because analytics must remain owned by and integrated directly with the site.
2. **Separate analytics backend/service** — rejected because the dashboard and backend must be deployed together with the website.
3. **Full-stack Next.js + same-host database** — selected because it satisfies real-time first-party tracking, protected admin analytics, lead attribution, and one-deployment ownership.

## 3. Scope

### In scope

- Visitors
- Sessions
- Page views
- Traffic source / medium / campaign
- UTM attribution
- `gclid`, `fbclid`, and similar click identifiers
- Device class
- Country, region, city
- Landing page
- Page-level conversion
- Incoming leads
- First-touch attribution
- Last-attributable-touch attribution
- Date-period filtering
- KPI comparison to previous period
- Dashboard charts and tables
- Ukraine geography map
- Admin-only analytics area
- CSV export
- Optional GTM container configuration

### Explicitly out of scope

- CRM pipeline
- ERP
- Accounting
- Project management
- Tasks
- Financial forecasting
- Sales stages
- Employee management
- Customer lifecycle automation

## 4. Routes

### Public website

Existing public routes remain intact.

### Dashboard routes

```text
/analytics
/analytics/leads
/analytics/traffic
/analytics/geography
/analytics/pages
/analytics/settings
/analytics/login
```

### Public ingestion routes

```text
POST /api/analytics/track
POST /api/leads
GET  /api/site-settings/analytics
```

`/api/site-settings/analytics` exposes only public analytics configuration required by the browser, currently the enabled GTM container ID. It never exposes admin or database settings.

### Protected analytics routes

```text
GET /api/analytics/summary
GET /api/analytics/timeseries
GET /api/analytics/sources
GET /api/analytics/geography
GET /api/analytics/pages
GET /api/analytics/devices
GET /api/analytics/leads
GET /api/analytics/export
GET /api/analytics/settings
PUT /api/analytics/settings
```

All protected endpoints require an authenticated admin session.

## 5. Data model

### `admin_users`

- `id`
- `email`
- `password_hash`
- `created_at`
- `updated_at`

Passwords use Argon2id. No public registration exists.

### `admin_sessions`

- `id`
- `user_id`
- `token_hash`
- `created_at`
- `expires_at`
- `last_seen_at`

Authentication uses a Secure, HttpOnly, SameSite=Lax session cookie. Raw session tokens are never stored in the database.

### `visitors`

- `id` UUID
- `created_at`
- `first_seen_at`
- `last_seen_at`
- `first_landing_page`
- `first_referrer`
- first-touch attribution fields
- last-attributable-touch fields

A random first-party visitor cookie identifies the browser. IP address is not used as the persistent visitor identity.

### `sessions`

- `id` UUID
- `visitor_id`
- `started_at`
- `last_activity_at`
- `landing_page`
- `referrer`
- `source`
- `medium`
- `campaign`
- `content`
- `term`
- `gclid`
- `fbclid`
- `ttclid`
- `device_type`
- `browser_family`
- `os_family`
- `country_code`
- `country_name`
- `region_code`
- `region_name`
- `city`

A new session begins after 30 minutes of inactivity or when the existing session cookie is absent/expired.

### `page_views`

- `id` UUID
- `event_id` unique idempotency key
- `visitor_id`
- `session_id`
- `path`
- `query_without_sensitive_values`
- `page_title`
- `referrer`
- `occurred_at`

### `analytics_events`

Used only for events that are not ordinary page views.

- `id` UUID
- `event_id` unique idempotency key
- `visitor_id`
- `session_id`
- `event_name`
- `page_path`
- `metadata_json`
- `occurred_at`

Initial tracked conversion event: `lead_submit`.

### `leads`

- `id`
- `name`
- `phone`
- `service`
- `location`
- `status`
- `originating_page`
- `created_at`
- `visitor_id`
- `session_id`
- current-session attribution snapshot
- first-touch attribution snapshot
- last-attributable-touch snapshot

Lead attribution is copied onto the lead at submission time so historical lead attribution remains stable even if a visitor returns later.

### `analytics_settings`

Singleton settings row:

- `gtm_container_id` nullable
- `gtm_enabled`
- `updated_at`

## 6. Attribution rules

### Captured parameters

Automatically capture:

- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `gclid`
- `fbclid`
- `ttclid`
- landing page
- referrer

### Source classification

Priority:

1. Explicit UTM fields
2. Paid click identifier (`gclid`, `fbclid`, `ttclid`)
3. Recognized referring search/social host
4. Generic referral
5. Direct

### First-touch

Captured only once for a visitor when the visitor first arrives. It never changes.

### Last-touch

Use **last attributable touch**, not simple last visit. A subsequent direct visit must not erase a known campaign/referral source. A new attributable session updates the visitor's last-touch fields.

### Lead storage

Every lead stores both:

- first-touch attribution snapshot
- last-attributable-touch attribution snapshot

The dashboard can display either column or both.

## 7. First-party tracker

A small client component is mounted once in the root public layout.

Responsibilities:

- create/read first-party visitor ID
- create/read 30-minute session ID
- capture initial URL attribution parameters
- send page view on initial navigation
- detect App Router route changes and send subsequent page views
- batch/retry safely when possible
- avoid duplicate events with event IDs
- use `navigator.sendBeacon` during page unload when appropriate
- never block rendering

Tracking requests are same-origin.

The tracker does not send raw form values or sensitive page content into generic analytics events.

## 8. Ingestion endpoint

`POST /api/analytics/track`

Requirements:

- same-origin request validation
- strict JSON schema validation
- payload size limit
- bot/user-agent filtering
- idempotent event IDs
- server-side timestamps for canonical persistence
- session renewal
- server-side device normalization
- GeoIP lookup using a local on-host IP-to-location database
- no runtime call to an external geolocation API

The raw IP address is used only transiently for GeoIP lookup and abuse controls; it is not stored as a permanent analytics dimension.

If the local GeoIP database is unavailable or does not resolve an address, geography is persisted as unknown rather than inventing a location.

## 9. Local geography resolution

Geography must not depend on Cloudflare-specific headers or a hosted IP API.

Deployment includes a local GeoIP `.mmdb` dataset readable by the application server. The dataset itself can be provisioned privately on the host rather than committed to the public GitHub repository.

Normalized dimensions:

- country
- region/oblast
- city

Ukraine region names are normalized to stable oblast keys used by the dashboard SVG map.

## 10. Lead submission

The existing public lead forms must stop using a fake frontend-only success state and submit to `POST /api/leads`.

The endpoint:

1. validates name/phone/service/location
2. reads visitor/session cookies
3. loads first and last attribution
4. creates the lead
5. creates an associated `lead_submit` conversion event
6. returns a safe success response

The lead write and conversion event write occur in one database transaction.

Basic abuse protection:

- same-origin validation
- hidden honeypot
- minimum form completion duration
- payload limits
- normalized phone value
- duplicate suppression window for obvious repeated submissions

## 11. GTM support

GTM is optional and is not a dependency of the dashboard.

In `/analytics/settings` the administrator can:

- enter a container ID matching `GTM-XXXXXXX`
- enable/disable GTM
- save settings

The public site loads GTM only when enabled and a valid ID exists.

A small `dataLayer` bridge exposes useful events to GTM, initially:

- `page_view`
- `lead_submit`

The first-party analytics event is persisted independently even if GTM is blocked or fails to load.

## 12. Admin authentication

Because the dashboard contains lead phone numbers and traffic data, `/analytics/*` must not be public.

Implementation:

- `/analytics/login`
- email + password
- Argon2id hash
- server session table
- HttpOnly Secure cookie
- route protection for dashboard and protected API endpoints
- rate-limited login attempts
- logout invalidates the server session

No multi-user role system is introduced; one or more admin users are sufficient.

## 13. Dashboard visual design

The dashboard follows the supplied ZAHIDALEXBUR concept rather than a generic SaaS admin theme.

### Core palette

- warm off-white application background
- white cards
- near-black/dark brown fixed sidebar
- bronze and muted gold accents
- graphite primary typography
- warm gray secondary text
- restrained green for positive deltas
- subtle borders and shadows
- 14–18px card radii

No blue SaaS theme, glassmorphism, neon accents, or heavy gradients.

### Sidebar

Desktop width: approximately 240px.

Items:

- Analytics
- Leads
- Traffic Sources
- Geography
- Pages
- Settings

Active item uses a subtle bronze tint and small gold accent.

Lower sidebar area uses a repository-local drilling image with a dark overlay and short ZAHIDALEXBUR branded line.

Tablet collapses the sidebar. Mobile uses a drawer.

## 14. Main dashboard layout

### Header

- title `Analytics`
- subtitle `Key website performance metrics`
- date-range selector
- Export button
- administrator profile block

### KPI row

Four cards:

1. Visitors
2. Leads
3. Website Conversion Rate
4. Cost per Lead

Each displays current value, period delta, and previous-period comparison.

`Cost per Lead` requires ad spend input. Until spend data is available, the KPI displays a clear `—` / `Spend not configured` state rather than fabricating CPL. A later version may accept manual or imported spend, but ad-account integrations are outside this spec.

### Row 2

- Visitors and Leads line chart
- Traffic Sources donut chart

Line chart grouping:

- daily
- weekly
- monthly

Traffic Sources:

- Google Ads
- Meta Ads
- Organic Search
- Direct Traffic
- Other

Categories are derived from normalized source/medium data, not hard-coded counts.

### Row 3

- Visitor Geography
- Popular Pages

Visitor Geography represents website visitors, not lead locations.

Ukraine mode:

- local SVG map of Ukraine oblasts
- region intensity based on visitor count
- hover tooltip: region, visitors, percentage
- ranked top-region list
- highest-volume region emphasized within the same bronze palette

World mode:

- country ranking/data model is functional
- the visual world map can be added without changing the API contract; initial implementation may show country ranking if a production-quality local world SVG is not yet included

Popular pages table:

- page
- visits
- conversion rate

Pages are data-driven. Labels may map routes to friendly names such as Home, Services, Drilling Process, Prices, Reviews, Contacts, About.

### Row 4

- Recent Leads table
- Devices donut

Lead table columns:

- ID
- Name
- Phone
- Location
- Service
- Source
- Date

Service uses muted badges. Header contains `View all →`.

Devices:

- Mobile
- Desktop
- Tablet

## 15. Date filtering

Supported periods:

- Today
- Last 7 Days
- Last 30 Days
- Current Month
- Previous Month
- Custom range

All dashboard modules use the same active period:

- KPIs
- timeseries
- traffic sources
- geography
- popular pages
- recent leads
- devices

Every request resolves an equivalent immediately preceding comparison period of equal duration for KPI deltas.

Dates are stored in UTC. Dashboard grouping and display use the configured site timezone, initially `Europe/Kyiv`.

## 16. API response contracts

A shared date filter contract is used across endpoints:

```ts
{
  from: string; // ISO datetime/date
  to: string;   // ISO datetime/date
  timezone: 'Europe/Kyiv';
  groupBy?: 'day' | 'week' | 'month';
}
```

Endpoints return numeric raw values; formatting (`12.4K`, `%`, localized dates) is a UI responsibility.

Empty periods return zero/empty arrays, never synthetic demo values.

## 17. Charts and map implementation

Use local application code and npm libraries only; no hosted chart embeds.

Recommended:

- Recharts for line/donut visualization
- repository-local SVG/GeoJSON-derived Ukraine map component
- Tailwind utilities scoped to the analytics surface

To avoid modifying the visual behavior of the existing public website, dashboard Tailwind must be isolated. Use a dashboard-specific Tailwind entry and disable/reset global preflight behavior that could affect legacy public CSS. If the chosen Tailwind version makes safe scoping impractical, use Tailwind utilities only within an `.analytics-app` boundary and regression-test the public landing page CSS.

## 18. Responsive behavior

Desktop:

- fixed sidebar
- full multi-column dashboard

Tablet:

- collapsed navigation
- cards reflow to fewer columns

Mobile:

- sidebar drawer
- two-column KPIs where space allows
- one-column KPIs at very small widths
- dashboard cards stacked
- geography region ranking below map
- tables horizontally scroll without shrinking text to unreadable sizes

## 19. Interactions

Restrained only:

- 200–500ms transitions
- slight card hover
- chart draw animation
- KPI count-up on first load/period change
- clean hover/focus tooltips
- no looping decorative animation
- reduced-motion support

## 20. Export

`Export` downloads a CSV for the selected period.

Initial export contains:

- daily/weekly/monthly visitors
- sessions
- page views
- leads
- conversion rate
- source/medium/campaign dimensions

Lead-specific export from the Leads page includes attribution columns for both first-touch and last-touch.

## 21. Storage and performance

The implementation must keep the storage layer isolated behind repository functions so hosting/database details do not leak into dashboard components.

For a single-host Node deployment, a same-host SQL database is required. The first implementation should use a SQL schema and indexed aggregation queries. Necessary indexes include timestamps, visitor/session IDs, page path, source/medium/campaign, country/region/city, and lead timestamp.

No dashboard request should load all raw events into application memory. Aggregation is performed in SQL.

Raw analytics retention defaults to 13 months and should be configurable later without changing the dashboard contracts.

## 22. Privacy and safety

- no permanent storage of raw IP for analytics
- no passwords in source control
- no GTM secret values; only public container ID
- admin auth required for leads and analytics
- no generic tracker collection of form field contents
- protected APIs return `Cache-Control: no-store`
- public ingestion endpoints validate same-origin traffic and payload sizes
- user-agent bot filtering
- accessible keyboard states and semantic tables/buttons

## 23. Migration from current static export

Current `next.config.mjs` uses `output: 'export'`. This must be removed for the production analytics implementation because API routes, sessions, database reads/writes, and protected dashboard rendering require a Next.js server runtime.

The public website remains the same Next.js app and preserves its current routes/design. The migration is runtime-level, not a frontend rewrite.

`wrangler.jsonc` is not treated as the architectural target. Final deployment configuration will be adapted to the user's selected server-capable hosting environment, but the application itself remains provider-neutral.

## 24. Testing strategy

### Unit tests

- UTM parsing
- referrer/source classification
- first-touch immutability
- last-attributable-touch update rules
- date presets and comparison-period calculations
- device normalization
- page conversion calculations
- GTM ID validation

### Integration tests

- new visitor + first session
- returning visitor + new attributable session
- returning direct session does not erase last attributable touch
- page view persistence
- duplicate event idempotency
- lead transaction stores first + last attribution
- dashboard period endpoints
- auth/session protection
- settings save/load

### UI regression tests

- sidebar/navigation structure
- four KPI cards
- all dashboard cards present
- period selection updates every data module
- geography is visitor-based
- mobile drawer and responsive tables
- existing public website remains visually/functionally intact

### Production build verification

- TypeScript
- tests
- Next production build
- database migration dry-run/check

## 25. Delivery order

1. Runtime/database foundation and migrations
2. Admin authentication
3. Tracker + attribution + geography ingestion
4. Real lead endpoint and form wiring
5. Analytics aggregation API
6. Dashboard shell and visual system
7. KPI/timeseries/source/device charts
8. Ukraine geography module
9. Leads/pages/settings screens
10. GTM settings + dataLayer bridge
11. Export
12. Responsive/accessibility/performance pass
13. Full regression and production build

## 26. Acceptance criteria

The feature is accepted only when:

- `/analytics` is part of the same ZAHIDALEXBUR app and protected from public access
- page views create real database records
- date periods update every dashboard module
- first-touch and last-attributable-touch both persist and appear on leads
- public lead forms create real leads in the same database
- GTM can be enabled/disabled with a valid container ID without affecting first-party tracking
- UTM/source/medium/campaign/device/geography/page data comes from real visits
- geography reports visitor origin rather than lead-entered location
- no third-party analytics service is required
- no demo metrics are substituted for empty real data
- public website behavior remains intact
- tests and production build pass
