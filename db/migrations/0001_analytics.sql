create extension if not exists pgcrypto;

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references admin_users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now()
);
create index if not exists admin_sessions_user_id_idx on admin_sessions(user_id);
create index if not exists admin_sessions_expires_at_idx on admin_sessions(expires_at);

create table if not exists visitors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  first_landing_page text,
  first_referrer text,
  first_source text,
  first_medium text,
  first_campaign text,
  first_content text,
  first_term text,
  first_gclid text,
  first_fbclid text,
  first_ttclid text,
  last_landing_page text,
  last_referrer text,
  last_source text,
  last_medium text,
  last_campaign text,
  last_content text,
  last_term text,
  last_gclid text,
  last_fbclid text,
  last_ttclid text
);
create index if not exists visitors_last_seen_at_idx on visitors(last_seen_at);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  visitor_id uuid not null references visitors(id) on delete cascade,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  landing_page text not null,
  referrer text,
  source text not null,
  medium text not null,
  campaign text,
  content text,
  term text,
  gclid text,
  fbclid text,
  ttclid text,
  device_type text not null,
  browser_family text,
  os_family text,
  country_code text,
  country_name text,
  region_code text,
  region_name text,
  city text
);
create index if not exists sessions_visitor_started_idx on sessions(visitor_id, started_at);
create index if not exists sessions_started_at_idx on sessions(started_at);
create index if not exists sessions_source_idx on sessions(source, medium, campaign, started_at);
create index if not exists sessions_geo_idx on sessions(country_code, region_code, city, started_at);

create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  visitor_id uuid not null references visitors(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  path text not null,
  query_without_sensitive_values text,
  page_title text,
  referrer text,
  occurred_at timestamptz not null default now()
);
create index if not exists page_views_occurred_at_idx on page_views(occurred_at);
create index if not exists page_views_path_occurred_idx on page_views(path, occurred_at);
create index if not exists page_views_session_occurred_idx on page_views(session_id, occurred_at);

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  visitor_id uuid references visitors(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  event_name text not null,
  page_path text,
  metadata_json jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists analytics_events_name_occurred_idx on analytics_events(event_name, occurred_at);
create index if not exists analytics_events_occurred_at_idx on analytics_events(occurred_at);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text not null,
  service text,
  location text,
  status text not null default 'new',
  originating_page text not null,
  created_at timestamptz not null default now(),
  visitor_id uuid references visitors(id) on delete set null,
  session_id uuid references sessions(id) on delete set null,
  source text,
  medium text,
  campaign text,
  content text,
  term text,
  gclid text,
  fbclid text,
  ttclid text,
  first_source text,
  first_medium text,
  first_campaign text,
  first_content text,
  first_term text,
  first_gclid text,
  first_fbclid text,
  first_ttclid text,
  last_source text,
  last_medium text,
  last_campaign text,
  last_content text,
  last_term text,
  last_gclid text,
  last_fbclid text,
  last_ttclid text
);
create index if not exists leads_created_at_idx on leads(created_at);
create index if not exists leads_source_idx on leads(source, medium, campaign, created_at);
create index if not exists leads_visitor_idx on leads(visitor_id, created_at);

create table if not exists analytics_settings (
  id integer primary key default 1 check (id = 1),
  gtm_container_id text,
  gtm_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into analytics_settings (id, gtm_enabled)
values (1, false)
on conflict (id) do nothing;
