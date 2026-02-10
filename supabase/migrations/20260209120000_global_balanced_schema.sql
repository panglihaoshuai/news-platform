-- ============================================================================
-- Database Migration: Add Domain and Perspective Fields
-- For Global Balanced Architecture (24 sources)
-- 
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Add Domain Classification Fields to news_items
-- ============================================================================

-- Add domain field for topic classification
ALTER TABLE news_items ADD COLUMN domain VARCHAR(20) DEFAULT 'general';

-- Add domain confidence score (0-1)
ALTER TABLE news_items ADD COLUMN domain_confidence DECIMAL(3,2) DEFAULT 0.50;

-- Add matched keywords for domain classification
ALTER TABLE news_items ADD COLUMN domain_keywords TEXT[] DEFAULT '{}';

-- Create index for domain queries
CREATE INDEX IF NOT EXISTS idx_news_domain 
ON news_items(domain, created_at DESC);

-- ============================================================================
-- 2. Add Perspective Tag Fields
-- ============================================================================

-- Geographic perspective (local/regional/international/global)
ALTER TABLE news_items ADD COLUMN geo_perspective VARCHAR(20);

-- Media affiliation (official/independent/opposition/neutral/semi-official)
ALTER TABLE news_items ADD COLUMN media_affiliation VARCHAR(20);

-- Political ideology (progressive/centrist/conservative) - mainly for Western media
ALTER TABLE news_items ADD COLUMN political_ideology VARCHAR(20);

-- Target audience (domestic/diaspora/international)
ALTER TABLE news_items ADD COLUMN target_audience VARCHAR(20);

-- Perspective description (human-readable)
ALTER TABLE news_items ADD COLUMN perspective_description TEXT;

-- Create indexes for perspective queries
CREATE INDEX IF NOT EXISTS idx_news_geo_perspective 
ON news_items(geo_perspective, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_media_affiliation 
ON news_items(media_affiliation, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_political_ideology 
ON news_items(political_ideology, created_at DESC);

-- ============================================================================
-- 3. Add Event Location Fields (for geography extraction)
-- ============================================================================

-- Event location country
ALTER TABLE news_items ADD COLUMN event_country VARCHAR(100);

-- Event location country code (ISO 3166-1 alpha-2)
ALTER TABLE news_items ADD COLUMN event_country_code VARCHAR(2);

-- Event location city
ALTER TABLE news_items ADD COLUMN event_city VARCHAR(100);

-- Event location region code
ALTER TABLE news_items ADD COLUMN event_region_code VARCHAR(5);

-- Event location confidence (0-1)
ALTER TABLE news_items ADD COLUMN event_confidence DECIMAL(3,2) DEFAULT 0.50;

-- Create indexes for event location queries
CREATE INDEX IF NOT EXISTS idx_news_event_country 
ON news_items(event_country_code, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_event_region 
ON news_items(event_region_code, created_at DESC);

-- ============================================================================
-- 4. Update news_items view for easier querying
-- ============================================================================

CREATE OR REPLACE VIEW v_news_with_classifications AS
SELECT 
  id,
  title,
  source_name,
  source_type,
  source_tier,
  domain,
  domain_confidence,
  geo_perspective,
  media_affiliation,
  political_ideology,
  target_audience,
  event_country_code,
  event_region_code,
  region_code,
  country_code,
  geo_lat,
  geo_lng,
  published_at,
  created_at,
  importance_score,
  original_url
FROM news_items
WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- 5. Create domain distribution function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_domain_distribution(hours INTEGER DEFAULT 24)
RETURNS TABLE (
  domain VARCHAR(20),
  count BIGINT,
  percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH domain_counts AS (
    SELECT 
      domain,
      COUNT(*) as count
    FROM news_items
    WHERE created_at > NOW() - (hours || ' hours')::INTERVAL
    GROUP BY domain
  )
  SELECT 
    dc.domain,
    dc.count::BIGINT,
    (dc.count * 100.0 / SUM(dc.count) OVER())::DECIMAL(5,2) as percentage
  FROM domain_counts dc
  ORDER BY dc.count DESC;
END;
$$;

-- ============================================================================
-- 6. Create geographic distribution function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_geographic_distribution(hours INTEGER DEFAULT 24)
RETURNS TABLE (
  region_code VARCHAR(5),
  event_country_code VARCHAR(2),
  country_name VARCHAR(100),
  count BIGINT,
  percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH geo_counts AS (
    SELECT 
      COALESCE(event_region_code, region_code) as region_code,
      event_country_code,
      event_country as country_name,
      COUNT(*) as count
    FROM news_items
    WHERE created_at > NOW() - (hours || ' hours')::INTERVAL
    AND (event_country_code IS NOT NULL OR region_code IS NOT NULL)
    GROUP BY event_region_code, region_code, event_country_code, event_country
  )
  SELECT 
    gc.region_code,
    gc.event_country_code,
    gc.country_name,
    gc.count::BIGINT,
    (gc.count * 100.0 / SUM(gc.count) OVER())::DECIMAL(5,2) as percentage
  FROM geo_counts gc
  ORDER BY gc.count DESC;
END;
$$;

-- ============================================================================
-- 7. Create source region coverage function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_source_region_coverage(hours INTEGER DEFAULT 24)
RETURNS TABLE (
  source_name VARCHAR(100),
  source_region VARCHAR(5),
  article_count BIGINT,
  unique_locations INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ns.source_name,
    ns.region_code as source_region,
    COUNT(ni.id)::BIGINT as article_count,
    COUNT(DISTINCT ni.event_country_code) as unique_locations
  FROM news_sources ns
  LEFT JOIN news_items ni 
    ON ns.id = ni.source_id 
    AND ni.created_at > NOW() - (hours || ' hours')::INTERVAL
  WHERE ns.enabled = true
  GROUP BY ns.source_name, ns.region_code
  ORDER BY article_count DESC;
END;
$$;

-- ============================================================================
-- 8. Create perspective distribution function
-- ============================================================================

CREATE OR REPLACE FUNCTION get_perspective_distribution(hours INTEGER DEFAULT 24)
RETURNS TABLE (
  perspective_type VARCHAR(30),
  perspective_value VARCHAR(30),
  count BIGINT,
  percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Geographic perspective
  SELECT 
    'geographic' as perspective_type,
    geo_perspective as perspective_value,
    COUNT(*)::BIGINT,
    (COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0))::DECIMAL(5,2)
  FROM news_items
  WHERE created_at > NOW() - (hours || ' hours')::INTERVAL
  AND geo_perspective IS NOT NULL
  GROUP BY geo_perspective
  
  UNION ALL
  
  -- Media affiliation
  SELECT 
    'affiliation' as perspective_type,
    media_affiliation as perspective_value,
    COUNT(*)::BIGINT,
    (COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0))::DECIMAL(5,2)
  FROM news_items
  WHERE created_at > NOW() - (hours || ' hours')::INTERVAL
  AND media_affiliation IS NOT NULL
  GROUP BY media_affiliation
  
  UNION ALL
  
  -- Political ideology
  SELECT 
    'ideology' as perspective_type,
    COALESCE(political_ideology, 'unknown') as perspective_value,
    COUNT(*)::BIGINT,
    (COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER(), 0))::DECIMAL(5,2)
  FROM news_items
  WHERE created_at > NOW() - (hours || ' hours')::INTERVAL
  GROUP BY COALESCE(political_ideology, 'unknown')
  
  ORDER BY perspective_type, count DESC;
END;
$$;

-- ============================================================================
-- 9. Create source tier summary
-- ============================================================================

CREATE OR REPLACE FUNCTION get_source_tier_summary(hours INTEGER DEFAULT 24)
RETURNS TABLE (
  tier VARCHAR(10),
  source_count INTEGER,
  article_count BIGINT,
  avg_articles_per_source DECIMAL(10,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH tier_stats AS (
    SELECT 
      source_tier as tier,
      COUNT(DISTINCT source_id) as source_count,
      COUNT(*) as article_count
    FROM news_items
    WHERE created_at > NOW() - (hours || ' hours')::INTERVAL
    GROUP BY source_tier
  )
  SELECT 
    ts.tier,
    ts.source_count,
    ts.article_count::BIGINT,
    (ts.article_count::DECIMAL / NULLIF(ts.source_count, 0))::DECIMAL(10,2) as avg_articles_per_source
  FROM tier_stats ts
  ORDER BY ts.tier;
END;
$$;

-- ============================================================================
-- 10. Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN news_items.domain IS 'News domain classification: politics/finance/technology/sports/society/general';
COMMENT ON COLUMN news_items.domain_confidence IS 'Confidence score for domain classification (0-1)';
COMMENT ON COLUMN news_items.domain_keywords IS 'Keywords that triggered the domain classification';
COMMENT ON COLUMN news_items.geo_perspective IS 'Geographic perspective of the source: local/regional/international/global';
COMMENT ON COLUMN news_items.media_affiliation IS 'Media affiliation type: official/independent/opposition/neutral/semi-official';
COMMENT ON COLUMN news_items.political_ideology IS 'Political ideology (mainly Western media): progressive/centrist/conservative';
COMMENT ON COLUMN news_items.target_audience IS 'Target audience: domestic/diaspora/international';
COMMENT ON COLUMN news_items.event_country IS 'Country where the news event occurred (extracted from title)';
COMMENT ON COLUMN news_items.event_country_code IS 'ISO country code for event location';
COMMENT ON COLUMN news_items.event_city IS 'City where the news event occurred';
COMMENT ON COLUMN news_items.event_region_code IS 'Region code for event location';
COMMENT ON COLUMN news_items.event_confidence IS 'Confidence score for event location extraction (0-1)';

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database migration complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added:';
  RAISE NOTICE '  - domain, domain_confidence, domain_keywords';
  RAISE NOTICE '  - geo_perspective, media_affiliation, political_ideology, target_audience, perspective_description';
  RAISE NOTICE '  - event_country, event_country_code, event_city, event_region_code, event_confidence';
  RAISE NOTICE '';
  RAISE NOTICE 'New functions available:';
  RAISE NOTICE '  - get_domain_distribution(hours)';
  RAISE NOTICE '  - get_geographic_distribution(hours)';
  RAISE NOTICE '  - get_source_region_coverage(hours)';
  RAISE NOTICE '  - get_perspective_distribution(hours)';
  RAISE NOTICE '  - get_source_tier_summary(hours)';
  RAISE NOTICE '';
  RAISE NOTICE 'New view created:';
  RAISE NOTICE '  - v_news_with_classifications';
END;
$$;

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================

-- To rollback, run:
-- ALTER TABLE news_items DROP COLUMN IF EXISTS domain;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS domain_confidence;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS domain_keywords;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS geo_perspective;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS media_affiliation;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS political_ideology;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS target_audience;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS perspective_description;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS event_country;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS event_country_code;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS event_city;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS event_region_code;
-- ALTER TABLE news_items DROP COLUMN IF EXISTS event_confidence;
-- DROP VIEW IF EXISTS v_news_with_classifications;
-- DROP FUNCTION IF EXISTS get_domain_distribution(INTEGER);
-- DROP FUNCTION IF EXISTS get_geographic_distribution(INTEGER);
-- DROP FUNCTION IF EXISTS get_source_region_coverage(INTEGER);
-- DROP FUNCTION IF EXISTS get_perspective_distribution(INTEGER);
-- DROP FUNCTION IF EXISTS get_source_tier_summary(INTEGER);
