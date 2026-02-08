-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: rss_sources
-- Stores the list of RSS feeds to aggregate
create table rss_sources (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  feed_url text not null unique,
  region_code text not null, -- 'NA', 'EU', 'AS', 'ME', 'AF', 'OC', 'SA'
  country_code text,        -- ISO 3166-1 alpha-2
  language text default 'en',
  enabled boolean default true,
  fetch_interval_minutes int default 360, -- 6 hours
  last_fetched_at timestamptz,
  created_at timestamptz default now()
);

-- Table: news_items
-- Stores aggregated news articles
create table news_items (
  id uuid primary key default uuid_generate_v4(),
  source_id uuid references rss_sources(id) on delete set null,
  title text not null,
  summary text,
  original_url text not null,
  published_at timestamptz not null,
  
  -- Geospatial data
  geo_lat float,
  geo_lng float,
  region_code text, -- Denormalized for easier filtering
  country_code text, -- Denormalized
  
  -- Metadata
  importance_score int default 0, -- 0-100
  image_url text, -- Optional: if RSS provides a thumbnail
  
  created_at timestamptz default now(),
  
  -- Constraint to prevent duplicate URLs from same source
  unique(source_id, original_url)
);

-- Table: system_config
-- Stores operational parameters
create table system_config (
  key text primary key,
  value text not null,
  description text
);

-- Indexes for performance
create index idx_news_published_at on news_items(published_at desc);
create index idx_news_region on news_items(region_code);
create index idx_news_importance on news_items(importance_score desc);
create index idx_news_geo on news_items(geo_lat, geo_lng);

-- Row Level Security (RLS)
alter table rss_sources enable row level security;
alter table news_items enable row level security;
alter table system_config enable row level security;

-- Public read access policies
create policy "Public read access for news" on news_items for select using (true);
create policy "Public read access for sources" on rss_sources for select using (true);
create policy "Public read access for config" on system_config for select using (true);

-- Service role write access (implicit, but good to note)
-- Use service_role key for writing from GitHub Actions
