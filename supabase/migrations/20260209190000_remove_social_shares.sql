-- Migration: Remove social_shares column (GDELT doesn't provide real-time social engagement data)
-- Date: 2026-02-09
-- Reason: GDELT API artlist mode does not return social shares data, removing unused column

-- Remove v_hot_topics view first (depends on social_shares)
DROP VIEW IF EXISTS v_hot_topics;

-- Remove social_shares column
ALTER TABLE news_items
DROP COLUMN IF EXISTS social_shares;

-- Remove social shares index
DROP INDEX IF EXISTS idx_news_items_social_shares;

-- Remove social score importance index
DROP INDEX IF EXISTS idx_news_items_importance_social;
