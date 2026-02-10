-- Migration: Add sentiment and crisis detection columns
-- Date: 2026-02-10
-- Purpose: Add GDELT tone, crisis detection for sentiment filtering and importance scoring

-- Add sentiment and crisis columns
ALTER TABLE news_items
ADD COLUMN IF NOT EXISTS tone DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_crisis BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS crisis_confidence DECIMAL(3,2) DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_news_items_tone
ON news_items (tone);

CREATE INDEX IF NOT EXISTS idx_news_items_is_crisis
ON news_items (is_crisis) WHERE is_crisis = TRUE;

CREATE INDEX IF NOT EXISTS idx_news_items_cris_confidence
ON news_items (crisis_confidence);

-- Update importance_factors to include toneBonus (if it doesn't already)
-- Note: JSONB columns don't need migration, but we document the structure:

/*
importance_factors JSONB structure:
{
  "mediaWeight": 10-20,       // Media tier weight
  "freshnessScore": 1-10,      // Publication recency
  "keywordScore": 0-5,         // Keyword matching
  "toneBonus": 0-3,            // NEW: Sentiment extremity bonus
  "contentBonus": 0-5           // Content classification bonus
}
*/

-- Create view for crisis news
CREATE OR REPLACE VIEW v_crisis_news AS
SELECT
  id,
  title,
  source_name,
  published_at,
  importance_score,
  tone,
  crisis_confidence,
  country_code,
  event_country,
  event_city
FROM news_items
WHERE is_crisis = TRUE
ORDER BY crisis_confidence DESC, importance_score DESC;

-- Create view for sentiment-filtered news
CREATE OR REPLACE VIEW v_sentiment_news AS
SELECT
  id,
  title,
  source_name,
  published_at,
  importance_score,
  tone,
  country_code,
  event_country,
  CASE
    WHEN tone > 2 THEN 'positive'
    WHEN tone < -2 THEN 'negative'
    ELSE 'neutral'
  END AS sentiment_category
FROM news_items
WHERE tone IS NOT NULL
ORDER BY tone DESC;

-- Grant permissions
GRANT SELECT ON v_crisis_news TO anon, authenticated;
GRANT SELECT ON v_sentiment_news TO anon, authenticated;

COMMENT ON COLUMN news_items.tone IS 'GDELT sentiment tone (-10 extremely negative to +10 extremely positive)';
COMMENT ON COLUMN news_items.is_crisis IS 'Auto-detected crisis flag (tone < -6)';
COMMENT ON COLUMN news_items.crisis_confidence IS 'Crisis detection confidence based on tone extremity';
COMMENT ON VIEW v_crisis_news IS 'News items flagged as crisis (tone < -6)';
COMMENT ON VIEW v_sentiment_news IS 'News with sentiment classification (positive/neutral/negative)';
