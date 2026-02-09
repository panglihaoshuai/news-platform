-- ============================================================================
-- Fix news_items table - Add all missing columns
-- ============================================================================

-- 检查表是否存在，不存在则创建
CREATE TABLE IF NOT EXISTS news_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_language TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  original_url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  region_code TEXT,
  country_code TEXT,
  importance_score INTEGER DEFAULT 0,
  categories TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'P3',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source_type TEXT DEFAULT 'rss',
  source_tier TEXT,
  fetched_at TIMESTAMPTZ,
  importance_factors JSONB,
  external_id TEXT,
  classification_confidence FLOAT DEFAULT 0.7,
  classification_source TEXT DEFAULT 'keyword',
  used_llm BOOLEAN DEFAULT false,
  llm_cost_estimate FLOAT DEFAULT 0
);

-- ============================================================================
-- Add missing columns one by one (if they don't exist)
-- ============================================================================

-- Core fields
DO $$
BEGIN
  -- Check and add external_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='news_items' AND column_name='external_id') THEN
    ALTER TABLE news_items ADD COLUMN external_id TEXT;
  END IF;

  -- Check and add classification_confidence
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='news_items' AND column_name='classification_confidence') THEN
    ALTER TABLE news_items ADD COLUMN classification_confidence FLOAT DEFAULT 0.7;
  END IF;

  -- Check and add classification_source
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='news_items' AND column_name='classification_source') THEN
    ALTER TABLE news_items ADD COLUMN classification_source TEXT DEFAULT 'keyword';
  END IF;

  -- Check and add used_llm
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='news_items' AND column_name='used_llm') THEN
    ALTER TABLE news_items ADD COLUMN used_llm BOOLEAN DEFAULT false;
  END IF;

  -- Check and add llm_cost_estimate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='news_items' AND column_name='llm_cost_estimate') THEN
    ALTER TABLE news_items ADD COLUMN llm_cost_estimate FLOAT DEFAULT 0;
  END IF;

  -- Check and add importance_factors
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='news_items' AND column_name='importance_factors') THEN
    ALTER TABLE news_items ADD COLUMN importance_factors JSONB;
  END IF;

  -- Check and add source_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='news_items' AND column_name='source_type') THEN
    ALTER TABLE news_items ADD COLUMN source_type TEXT DEFAULT 'rss';
  END IF;

  -- Check and add source_tier
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='news_items' AND column_name='source_tier') THEN
    ALTER TABLE news_items ADD COLUMN source_tier TEXT;
  END IF;

  -- Check and add fetched_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='news_items' AND column_name='fetched_at') THEN
    ALTER TABLE news_items ADD COLUMN fetched_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================================================
-- Create indexes
-- ============================================================================

-- Index for external_id (if unique constraint doesn't exist)
DO $$
BEGIN
  -- Drop existing constraint if exists
  ALTER TABLE news_items DROP CONSTRAINT IF EXISTS news_items_external_id_key;
  
  -- Add unique constraint only if external_id column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='news_items' AND column_name='external_id') THEN
    ALTER TABLE news_items ADD CONSTRAINT news_items_external_id_key UNIQUE (external_id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_items_published_at ON news_items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_source_id ON news_items(source_id);
CREATE INDEX IF NOT EXISTS idx_news_items_region_code ON news_items(region_code);
CREATE INDEX IF NOT EXISTS idx_news_items_priority ON news_items(priority);
CREATE INDEX IF NOT EXISTS idx_news_items_created_at ON news_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_items_external_id ON news_items(external_id);

-- ============================================================================
-- Create rss_sources table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS rss_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'rss',
  tier TEXT,
  language TEXT,
  region_code TEXT,
  feed_url TEXT,
  config JSONB,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  last_fetched_at TIMESTAMPTZ,
  fetch_count INTEGER DEFAULT 0,
  success_rate DOUBLE PRECISION DEFAULT 1
);

-- ============================================================================
-- Create fetch_metrics table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS fetch_metrics (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  total_fetched INTEGER DEFAULT 0,
  total_inserted INTEGER DEFAULT 0,
  total_duplicates INTEGER DEFAULT 0,
  failed_sources TEXT[],
  api_usage JSONB,
  processing_time INTEGER DEFAULT 0,
  status TEXT,
  error_message TEXT
);

-- ============================================================================
-- Verify table structure
-- ============================================================================

SELECT 'news_items columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'news_items'
ORDER BY ordinal_position;
