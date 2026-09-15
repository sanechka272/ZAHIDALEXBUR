# ZAHIDALEXBUR Analytics — Production Operations

This document applies to branch `feature/first-party-analytics-dashboard` and the production deployment derived from it.

## Runtime topology

The analytics build is no longer a static export. Public pages, `/analytics/*`, and `/api/analytics/*` must run in the same deployment / same site so first-party cookies, attribution and lead tracking stay same-origin. The application is built as a Next.js standalone Node server and packaged by `Dockerfile`.

For the existing Cloudflare setup, the supported release path is **Cloudflare Containers** behind a Worker proxy. Containers require the **Workers Paid** plan. The Worker forwards every request to one singleton Next.js container, injects Cloudflare country / region / city metadata into private headers, and passes runtime secrets into the container. The old static `./out` assets deployment must not be used for this branch.

PostgreSQL remains the durable analytics store and must be reachable through outbound HTTPS/TCP from the container using `DATABASE_URL`.

## Required environment and secrets

- `DATABASE_URL` — production PostgreSQL connection string. Use TLS when the provider supports it.
- `ANALYTICS_SESSION_SECRET` — high-entropy secret, at least 32 bytes, unique to production.
- `DATABASE_POOL_SIZE` — optional PostgreSQL pool limit; Wrangler config defaults to 5.
- `ANALYTICS_RETENTION_BATCH_SIZE` — optional cleanup batch size; Wrangler config defaults to 5000.
- `GEOIP_CITY_DB_PATH` — optional on generic Node/Docker hosts. Cloudflare production does not require a MaxMind database because the edge Worker provides visitor geography. MaxMind stays available as the non-Cloudflare fallback.

Never commit production secrets or a licensed GeoIP database to the public repository. For Cloudflare, create encrypted Worker secrets:

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put ANALYTICS_SESSION_SECRET
```

## First production bootstrap

1. Provision a production PostgreSQL database and save its TLS connection URL.
2. From a trusted machine or one-off protected job, set `DATABASE_URL` and run `npm install` followed by `npm run db:migrate`.
3. With the same production `DATABASE_URL`, create the first administrator: `npm run analytics:create-admin`.
4. Ensure the Cloudflare account is on Workers Paid and Containers are available.
5. Add `DATABASE_URL` and `ANALYTICS_SESSION_SECRET` with `wrangler secret put` as shown above.
6. Run `npm test`, `npm run build`, and `npm run security:audit` against the release commit.
7. Run `npm run deploy`. Wrangler builds `Dockerfile`, pushes the image to Cloudflare's managed registry, deploys the Worker and rolls out the Container.
8. Verify `/api/health` returns HTTP 200, then smoke-test `/`, `/api/analytics/track`, `/api/leads`, `/analytics/login`, authenticated `/analytics`, and one CSV export from the live host.

## Deploy / release order

Always use this order: database backup or snapshot when applicable → `npm run db:migrate` → `npm run deploy` → `/api/health` → application smoke tests. Migrations are checksum-protected and must not be edited after being applied; add a new migration instead.

The public website and analytics API stay on the same Cloudflare Worker hostname / custom domain. Splitting them across unrelated origins requires an explicit cookie/CORS/security redesign and is not part of this release.

`wrangler.jsonc` defines one `basic` Container instance. This is intentionally conservative for the current website traffic profile and keeps all requests on one application instance while PostgreSQL remains the source of truth. Increase capacity only after observing real production load.

## Health and observability

`GET /api/health` executes a database probe and returns `200` only when the application can reach PostgreSQL. Docker and Cloudflare Container startup health checks use this endpoint. It returns no credentials, connection strings, or internal database details.

Cloudflare Worker observability is enabled in `wrangler.jsonc`. Treat repeated 5xx responses, container restart loops, database connection exhaustion, and failed retention jobs as operational alerts.

## Retention

Run `npm run analytics:retention` at least daily. The job deletes raw `page_views` and `analytics_events` older than 13 months in bounded batches, then removes old sessions/orphan visitors. It intentionally does not delete `leads`; attribution snapshots stored on lead rows remain durable business records.

For a cron platform, schedule the command during a low-traffic window and alert on non-zero exit status. The job is idempotent and safe to run repeatedly. Cloudflare Container deployment does not by itself schedule this command; run it from a trusted scheduled job that has `DATABASE_URL`.

## Backups and restore

Use managed PostgreSQL point-in-time recovery when available. At minimum, take daily backups and retain multiple recovery points. Test a restore before considering the analytics database production-ready. The repository does not contain production data.

## Security checks

CI must pass migrations, tests, production build, Docker image build, Wrangler dry-run validation, and `npm audit --omit=dev --audit-level=high`. Admin authentication uses Argon2id hashes and server-side revocable sessions; keep analytics routes HTTPS-only in production. Rotate `ANALYTICS_SESSION_SECRET` only with a planned admin-session invalidation.

The Worker deletes any visitor-supplied `x-zab-edge-*` headers and replaces them from Cloudflare `request.cf` before proxying to Next.js. The Node application only trusts those headers when running inside a Cloudflare Container, preventing direct clients from forging geography in the normal production path.

## GeoIP fallback maintenance

On a non-Cloudflare Node host, set `GEOIP_CITY_DB_PATH` to a current MaxMind GeoLite2/GeoIP City `.mmdb` database and update it according to the data provider's license and release cadence. Cloudflare Container production uses edge geography and does not need this file.

## Rollback

Application rollback is safe when the previous release understands the already-applied schema. Never roll back by deleting migration history. If a migration introduces a backward-incompatible schema change, ship an explicit corrective migration before rolling the application back.
