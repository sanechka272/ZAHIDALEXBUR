import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true });

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
}, (table) => [uniqueIndex('admin_users_email_uidx').on(table.email)]);

export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => adminUsers.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
  expiresAt: ts('expires_at').notNull(),
  lastSeenAt: ts('last_seen_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('admin_sessions_token_uidx').on(table.tokenHash),
  index('admin_sessions_user_id_idx').on(table.userId),
  index('admin_sessions_expires_at_idx').on(table.expiresAt),
]);

export const visitors = pgTable('visitors', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: ts('created_at').notNull().defaultNow(),
  firstSeenAt: ts('first_seen_at').notNull().defaultNow(),
  lastSeenAt: ts('last_seen_at').notNull().defaultNow(),
  firstLandingPage: text('first_landing_page'),
  firstReferrer: text('first_referrer'),
  firstSource: text('first_source'),
  firstMedium: text('first_medium'),
  firstCampaign: text('first_campaign'),
  firstContent: text('first_content'),
  firstTerm: text('first_term'),
  firstGclid: text('first_gclid'),
  firstFbclid: text('first_fbclid'),
  firstTtclid: text('first_ttclid'),
  lastLandingPage: text('last_landing_page'),
  lastReferrer: text('last_referrer'),
  lastSource: text('last_source'),
  lastMedium: text('last_medium'),
  lastCampaign: text('last_campaign'),
  lastContent: text('last_content'),
  lastTerm: text('last_term'),
  lastGclid: text('last_gclid'),
  lastFbclid: text('last_fbclid'),
  lastTtclid: text('last_ttclid'),
}, (table) => [index('visitors_last_seen_at_idx').on(table.lastSeenAt)]);

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  visitorId: uuid('visitor_id').notNull().references(() => visitors.id, { onDelete: 'cascade' }),
  startedAt: ts('started_at').notNull().defaultNow(),
  lastActivityAt: ts('last_activity_at').notNull().defaultNow(),
  landingPage: text('landing_page').notNull(),
  referrer: text('referrer'),
  source: text('source').notNull(),
  medium: text('medium').notNull(),
  campaign: text('campaign'),
  content: text('content'),
  term: text('term'),
  gclid: text('gclid'),
  fbclid: text('fbclid'),
  ttclid: text('ttclid'),
  deviceType: text('device_type').notNull(),
  browserFamily: text('browser_family'),
  osFamily: text('os_family'),
  countryCode: text('country_code'),
  countryName: text('country_name'),
  regionCode: text('region_code'),
  regionName: text('region_name'),
  city: text('city'),
}, (table) => [
  index('sessions_visitor_started_idx').on(table.visitorId, table.startedAt),
  index('sessions_started_at_idx').on(table.startedAt),
  index('sessions_source_idx').on(table.source, table.medium, table.campaign, table.startedAt),
  index('sessions_geo_idx').on(table.countryCode, table.regionCode, table.city, table.startedAt),
]);

export const pageViews = pgTable('page_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull(),
  visitorId: uuid('visitor_id').notNull().references(() => visitors.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  queryWithoutSensitiveValues: text('query_without_sensitive_values'),
  pageTitle: text('page_title'),
  referrer: text('referrer'),
  occurredAt: ts('occurred_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('page_views_event_id_uidx').on(table.eventId),
  index('page_views_occurred_at_idx').on(table.occurredAt),
  index('page_views_path_occurred_idx').on(table.path, table.occurredAt),
  index('page_views_session_occurred_idx').on(table.sessionId, table.occurredAt),
]);

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: text('event_id').notNull(),
  visitorId: uuid('visitor_id').references(() => visitors.id, { onDelete: 'set null' }),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  eventName: text('event_name').notNull(),
  pagePath: text('page_path'),
  metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>().notNull().default({}),
  occurredAt: ts('occurred_at').notNull().defaultNow(),
}, (table) => [
  uniqueIndex('analytics_events_event_id_uidx').on(table.eventId),
  index('analytics_events_name_occurred_idx').on(table.eventName, table.occurredAt),
  index('analytics_events_occurred_at_idx').on(table.occurredAt),
]);

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  phone: text('phone').notNull(),
  service: text('service'),
  location: text('location'),
  status: text('status').notNull().default('new'),
  originatingPage: text('originating_page').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
  visitorId: uuid('visitor_id').references(() => visitors.id, { onDelete: 'set null' }),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  source: text('source'),
  medium: text('medium'),
  campaign: text('campaign'),
  content: text('content'),
  term: text('term'),
  gclid: text('gclid'),
  fbclid: text('fbclid'),
  ttclid: text('ttclid'),
  firstSource: text('first_source'),
  firstMedium: text('first_medium'),
  firstCampaign: text('first_campaign'),
  firstContent: text('first_content'),
  firstTerm: text('first_term'),
  firstGclid: text('first_gclid'),
  firstFbclid: text('first_fbclid'),
  firstTtclid: text('first_ttclid'),
  lastSource: text('last_source'),
  lastMedium: text('last_medium'),
  lastCampaign: text('last_campaign'),
  lastContent: text('last_content'),
  lastTerm: text('last_term'),
  lastGclid: text('last_gclid'),
  lastFbclid: text('last_fbclid'),
  lastTtclid: text('last_ttclid'),
}, (table) => [
  index('leads_created_at_idx').on(table.createdAt),
  index('leads_source_idx').on(table.source, table.medium, table.campaign, table.createdAt),
  index('leads_visitor_idx').on(table.visitorId, table.createdAt),
]);

export const analyticsSettings = pgTable('analytics_settings', {
  id: integer('id').primaryKey().default(1),
  gtmContainerId: text('gtm_container_id'),
  gtmEnabled: boolean('gtm_enabled').notNull().default(false),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export type VisitorRow = typeof visitors.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type LeadRow = typeof leads.$inferSelect;
export type AdminUserRow = typeof adminUsers.$inferSelect;
