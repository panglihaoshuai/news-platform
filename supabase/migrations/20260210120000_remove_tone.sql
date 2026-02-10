-- Migration: Remove unused tone columns (GDELT artlist doesn't provide tone data)
-- Date: 2026-02-10
-- Reason: GDELT v2 API artlist mode does not return tone/sentiment data

-- Step 1: Drop views that depend on removed columns
DROP VIEW IF EXISTS v_sentiment_news;
DROP VIEW IF EXISTS v_crisis_news;

-- Step 2: Remove unused columns
ALTER TABLE news_items
DROP COLUMN IF EXISTS tone,
DROP COLUMN IF EXISTS crisis_confidence;

-- Step 3: Remove indexes
DROP INDEX IF EXISTS idx_news_items_tone;
DROP INDEX IF EXISTS idx_news_items_cris_confidence;

-- Step 4: Create new crisis view (no dependency on removed columns)
CREATE OR REPLACE VIEW v_crisis_news AS
SELECT
  id,
  title,
  source_name,
  published_at,
  importance_score,
  country_code,
  event_country,
  event_city
FROM news_items
WHERE is_crisis = TRUE
ORDER BY importance_score DESC;

-- Grant permissions
GRANT SELECT ON v_crisis_news TO anon, authenticated;

COMMENT ON COLUMN news_items.is_crisis IS 'Crisis detection based on keywords in title';
COMMENT ON VIEW v_crisis_news IS 'News items flagged as crisis based on keyword detection';
