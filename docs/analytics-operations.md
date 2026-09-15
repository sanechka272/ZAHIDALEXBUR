# ZAHIDALEXBUR Analytics — Production Operations

This document applies to branch `feature/first-party-analytics-dashboard` and the production deployment derived from it.

## Runtime topology

The analytics build is no longer a static export. Public pages, `/analytics/*`, and `/api/analytics/*` must run in the same deployment / same site so first-party cookies, attribution and lead tracking stay same-origin. The production runtime requires a real Node.js server capable of running `next start`, plus PostgreSQL reachable through `DATABASE_URL`.

The legacy `wrangler.jsonc` static-assets deployment that served `./out` is not a valid production target for this branch. Do not deploy this branch through the old static Cloudflare Worker pipeline unless the runtime is first migrated to a supported server-side Next.js adapter and PostgreSQL connectivity is verified.

## Required environment

- `DATABASE_URL` — production PostgreSQL connection string. Use TLS when the provider supports it.
- `ANALYTICS_SESSION_SECRET` — high-entropy secret, at least 32 bytes, unique to production.
- `GEOIP_CITY_DB_PATH` — filesystem path to a current MaxMind GeoLite2/GeoIP City `.mmdb` database. Without it, tracking remains functional but geography is stored as unknown.
- `DATABASE_POOL_SIZE` — optional PostgreSQL pool limit. Start conservatively for serverless/container deployments.
- `ANALYTICS_RETENTION_BATCH_SIZE` — optional cleanup batch size; default 5000.

Never commit production secrets or the licensed GeoIP database to the public repository.

## First production bootstrap

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Set `ANALYTICS_SESSION_SECRET` and `GEOIP_CITY_DB_PATH` in the hosting platform.
3. Install dependencies with the lockfile: `npm ci`.
4. Apply schema migrations: `npm run db:migrate`.
5. Create the first administrator interactively in the protected production environment: `npm run analytics:create-admin`.
6. Run `npm test` and `npm run build` against the release commit.
7. Start the application with `npm start` behind HTTPS.
8. Verify `/`, `/api/analytics/track`, `/api/leads`, `/analytics/login`, authenticated `/analytics`, and one CSV export from the live host.

## Deploy / release order

Always use this order: database backup or snapshot when applicable → `npm run db:migrate` → application deploy → smoke tests. Migrations are checksum-protected and must not be edited after being applied; add a new migration instead.

The public website and analytics API must stay on the same host or same site. Splitting them across unrelated origins requires an explicit cookie/CORS/security redesign and is not part of this release.

## Retention

Run `npm run analytics:retention` at least daily. The job deletes raw `page_views` and `analytics_events` older than 13 months in bounded batches, then removes old sessions/orphan visitors. It intentionally does not delete `leads`; attribution snapshots stored on lead rows remain durable business records.

For a cron platform, schedule the command during a low-traffic window and alert on non-zero exit status. The job is idempotent and safe to run repeatedly.

## Backups and restore

Use managed PostgreSQL point-in-time recovery when available. At minimum, take daily backups and retain multiple recovery points. Test a restore before considering the analytics database production-ready. The repository does not contain production data.

## Security checks

CI must pass tests, production build, and `npm audit --omit=dev --audit-level=high`. Admin authentication uses Argon2id hashes and server-side revocable sessions; keep analytics routes HTTPS-only in production. Rotate `ANALYTICS_SESSION_SECRET` only with a planned admin-session invalidation.

## GeoIP maintenance

Update the City `.mmdb` regularly according to the data provider's license and release cadence. Replace the file atomically and restart the application so the process opens the new database.

## Rollback

Application rollback is safe when the previous release understands the already-applied schema. Never roll back by deleting migration history. If a migration introduces a backward-incompatible schema change, ship an explicit corrective migration before rolling the application back.
