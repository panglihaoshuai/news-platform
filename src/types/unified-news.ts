/**
 * Unified News Data Types
 * 
 * Unified data format for all news sources (NewsData.io, RSS, RSSHub)
 * 
 * Design Principles:
 * - Lightweight: No images stored, focused on text content
 * - Traceable: original_url preserved for user click-through to original
 * - Analyzable: Classification, geography, priority metadata retained
 * 
 * @version 1.0.0
 * @date 2026-02-08
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * News source types
 */
export type NewsSourceType = 'newsdata' | 'rss' | 'rsshub' | 'gdelt';

/**
 * Source tier levels (media authority)
 */
export type SourceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

// ============================================================================
// NEW: Domain and Perspective Types for 85% Implementation
// ============================================================================

/**
 * News domain categories for classification
 */
export type Domain = 'politics' | 'finance' | 'technology' | 'sports' | 'society' | 'general';

/**
 * Geographic perspective of the source
 */
export type GeographicPerspective = 'local' | 'regional' | 'international' | 'global';

/**
 * Media affiliation type
 */
export type MediaAffiliation = 'official' | 'independent' | 'opposition' | 'neutral' | 'semi-official';

/**
 * Target audience
 */
export type TargetAudience = 'domestic' | 'diaspora' | 'international' | 'regional';

/**
 * Political ideology (mainly for Western media)
 */
export type PoliticalIdeology = 'progressive' | 'centrist' | 'conservative';

/**
 * Perspective tags for news sources
 * Enables filtering by viewpoint and audience
 */
export interface PerspectiveTags {
  /** Geographic scope of the source's perspective */
  geographic: GeographicPerspective;
  /** Media affiliation/political relationship */
  affiliation: MediaAffiliation;
  /** Political ideology (optional, mainly Western media) */
  ideology?: PoliticalIdeology;
  /** Primary target audience */
  audience: TargetAudience;
  /** Human-readable description of the perspective */
  description?: string;
}

/**
 * Domain weights for each source (which topics they cover most)
 */
export interface DomainWeights {
  /** General news percentage */
  general?: number;
  /** Politics percentage */
  politics?: number;
  /** Finance/Business percentage */
  finance?: number;
  /** Technology percentage */
  technology?: number;
  /** Sports percentage */
  sports?: number;
  /** Society/Culture percentage */
  society?: number;
  /** International relations percentage */
  international?: number;
}

/**
 * Event location extracted from news title
 */
export interface EventLocation {
  /** Country where the event occurred */
  country: string;
  /** ISO country code */
  countryCode: string;
  /** City where the event occurred (optional) */
  city?: string;
  /** Region code */
  region: RegionCode;
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Matched keyword that triggered extraction */
  matchedKeyword: string;
}

/**
 * Language codes
 */
export type LanguageCode = 'en' | 'zh' | 'fr' | 'de' | 'es' | 'ar' | 'ja' | 'ko' | 'pt' | 'ru' | 'other';

/**
 * Priority levels
 */
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

/**
 * Region codes
 */
export type RegionCode = 'GLOBAL' | 'NA' | 'EU' | 'AS' | 'ME' | 'AF' | 'OC' | 'SA' | 'RU' | 'IN' | 'UA';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * News source configuration
 */
export interface NewsSourceConfig {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Source type */
  type: NewsSourceType;
  /** Whether source is enabled */
  enabled: boolean;
  /** Priority (1 = highest) */
  priority: number;
  /** Source tier */
  tier: SourceTier;
  /** Primary language */
  language: LanguageCode;
  /** Geographic region */
  region: RegionCode;
  /** Source-specific configuration */
  config: {
    /** NewsData.io source ID */
    sourceId?: string;
    /** NewsData.io category */
    category?: string;
    /** RSS feed URL */
    feedUrl?: string;
    /** RSSHub route */
    route?: string;
    /** GDELT domain query */
    domain?: string;
  };
  /** Rate limiting configuration */
  rateLimit: {
    /** Maximum requests per window */
    maxRequests: number;
    /** Window size in minutes */
    windowMinutes: number;
  };
  /** NEW: Perspective tags for filtering by viewpoint */
  perspectiveTags?: PerspectiveTags;
  /** NEW: Domain/topic coverage weights */
  domainWeights?: DomainWeights;
}

/**
 * Region configuration for classification
 */
export interface RegionConfig {
  /** Region code */
  code: RegionCode;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** ISO country codes in this region */
  countries: string[];
  /** Keywords for detection */
  keywords: string[];
  /** Default center latitude */
  latitude: number;
  /** Default center longitude */
  longitude: number;
  /** Default zoom level */
  zoom: number;
}

/**
 * Country information for geocoding
 */
export interface CountryInfo {
  /** ISO country code */
  code: string;
  /** Country name */
  name: string;
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;
  /** Region code */
  region: RegionCode;
  /** Alternative names/keywords */
  keywords?: string[];
}

// ============================================================================
// Unified News Item
// ============================================================================

/**
 * Unified news item format
 * 
 * Design Decision: NO image_url field
 * - ✅ Lightweight design, reduces storage and transfer overhead
 * - ✅ Frontend focused on text content, not distracted by images
 * - ✅ User accesses original_url to view images on source site
 */
export interface UnifiedNewsItem {
  // === Core Fields ===
  /** Internal ID (UUID) */
  id: string;
  /** External source ID (for deduplication) */
  external_id: string;
  /** Title (fully preserved after cleaning) */
  title: string;
  /** Summary (cleaned, 800 char limit, enough to understand news gist) */
  summary: string;
  /** Original link (user can click to navigate to original page) */
  original_url: string;
  /** Source name */
  source_name: string;
  /** Source type */
  source_type: NewsSourceType;
  /** Source identifier */
  source_id: string;
  /** Source tier */
  source_tier: SourceTier;

  // === Time Fields ===
  /** Publication time (ISO 8601) */
  published_at: string;
  /** Fetch time (ISO 8601) */
  fetched_at: string;

  // === Geography Fields ===
  /** Latitude */
  geo_lat: number | null;
  /** Longitude */
  geo_lng: number | null;
  /** Region code */
  region_code: RegionCode | null;
  /** Country code */
  country_code: string | null;

  // === Classification Fields ===
  /** Language */
  language: LanguageCode;
  /** Topic categories */
  categories: string[];
  /** Priority level */
  priority: Priority;

  // === NEW: Domain Classification ===
  /** Domain classification: politics/finance/technology/sports/society/general */
  domain: Domain;
  /** Domain classification confidence (0-1) */
  domain_confidence: number;
  /** Keywords that triggered domain classification */
  domain_keywords: string[];

  // === NEW: Perspective Tags ===
  /** Geographic perspective of the source */
  geo_perspective: 'local' | 'regional' | 'international' | 'global';
  /** Media affiliation type */
  media_affiliation: 'official' | 'independent' | 'opposition' | 'neutral' | 'semi-official';
  /** Political ideology (mainly Western media) */
  political_ideology?: 'progressive' | 'centrist' | 'conservative';
  /** Target audience */
  target_audience: 'domestic' | 'diaspora' | 'international';
  /** Human-readable perspective description */
  perspective_description?: string;

  // === NEW: Event Location (extracted from title) ===
  /** Country where the news event occurred */
  event_country?: string;
  /** ISO country code for event location */
  event_country_code?: string;
  /** City where the news event occurred */
  event_city?: string;
  /** Region code for event location */
  event_region_code?: RegionCode;
  /** Event location confidence (0-1) */
  event_confidence?: number;

  // === CRISIS DETECTION (based on keywords, not GDELT tone) ===
  /** Crisis detection based on keywords in title/content */
  is_crisis?: boolean;

  // === Quality Fields ===
  /** Importance score (calculated) */
  importance_score: number;
  /** Importance factors breakdown */
  importance_factors: {
    /** Media weight (based on tier) */
    mediaWeight: number;
    /** Freshness score (based on publication time) */
    freshnessScore: number;
    /** Keyword score (based on keyword matching) */
    keywordScore: number;
    /** Content bonus (based on LLM classification) */
    contentBonus: number;
  };
  /** Social media engagement metrics (from GDELT) - NOT IMPLEMENTED, GDELT doesn't provide real-time social shares */
  // social_shares?: {
  //   facebook?: number;
  //   twitter?: number;
  //   gplus?: number;
  //   linkedin?: number;
  //   pinterest?: number;
  //   stumbleupon?: number;
  //   vk?: number;
  //   whatsapp?: number;
  //   telegram?: number;
  //   email?: number;
  // };

  // === Tracking Fields ===
  /** Classification source (keyword/llm) */
  classification_source?: 'keyword' | 'llm';
  /** Classification confidence (0-1) */
  classification_confidence?: number;
  /** Whether LLM was used */
  used_llm?: boolean;
  /** LLM cost estimate (USD) */
  llm_cost_estimate?: number;

  // === Metadata ===
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at?: string;
}

/**
 * News item input for classification
 */
export interface NewsItemInput {
  /** Title */
  title: string;
  /** Summary/description */
  summary: string;
  /** Source name */
  sourceName: string;
  /** Publication time (ISO string) */
  publishedAt: string;
  /** Original URL */
  originalUrl?: string;
  /** Creator/author (if available) */
  creator?: string;
}

/**
 * Smart classification result
 */
export interface SmartClassificationResult {
  /** Detected categories */
  categories: string[];
  /** Assigned priority */
  priority: Priority;
  /** Detected language */
  language: LanguageCode;
  /** Detected region */
  region: RegionCode | null;
  /** Keywords extracted */
  keywords: string[];
  /** Importance factors */
  factors: {
    /** Media weight */
    mediaWeight: number;
    /** Freshness score */
    freshnessScore: number;
    /** Keyword score */
    keywordScore: number;
    /** Content bonus */
    contentBonus: number;
  };
  /** Classification source */
  source: 'keyword' | 'llm';
  /** Confidence level (0-1) */
  confidence: number;
  /** Whether LLM was used */
  usedLLM: boolean;
  /** Cost estimate (USD) */
  costEstimate: number;
}

// ============================================================================
// NewsData.io API Types
// ============================================================================

/**
 * NewsData.io API response
 */
export interface NewsDataApiResponse {
  /** Request status */
  status: string;
  /** Response code */
  code?: string;
  /** Total results */
  totalResults?: number;
  /** Articles */
  results: NewsDataArticle[];
  /** Pagination */
  nextPage?: string;
}

/**
 * NewsData.io article
 */
export interface NewsDataArticle {
  /** Article ID */
  article_id: string;
  /** Title */
  title: string;
  /** Description/summary */
  description?: string;
  /** Full content */
  content?: string;
  /** Original URL */
  link: string;
  /** Publication date */
  pubDate: string;
  /** Image URL (optional, NOT stored) */
  image_url?: string;
  /** Source information */
  source_id: string;
  source_name?: string;
  source_url?: string;
  source_icon?: string;
  /** Categories */
  category?: string | string[];
  /** Language */
  language?: string;
  /** Country */
  country?: string[];
  /** Creator/author */
  creator?: string | string[];
  /** Video URL (if any) */
  video_url?: string;
}

// ============================================================================
// RSS Types
// ============================================================================

/**
 * RSS item (from rss-parser)
 */
export interface RSSItem {
  /** Title */
  title?: string;
  /** Unique identifier */
  guid?: string;
  /** Link */
  link?: string;
  /** Publication date */
  pubDate?: string;
  /** ISO date */
  isoDate?: string;
  /** Description/summary */
  description?: string;
  /** Content */
  content?: string;
  /** Content snippet */
  contentSnippet?: string;
  /** Categories */
  categories?: string[];
  /** Creator/author */
  creator?: string;
  /** Image URL (optional, NOT stored) */
  enclosure?: {
    url?: string;
    type?: string;
  };
  /** Image (from rss-parser) */
  image?: {
    url?: string;
  };
  /** Media content */
  'media:content'?: {
    url?: string;
    type?: string;
  }[];
  /** Full text content */
  'content:encoded'?: string;
}

/**
 * RSS feed
 */
export interface RSSFeed {
  /** Feed title */
  title?: string;
  /** Feed description */
  description?: string;
  /** Feed URL */
  link?: string;
  /** Feed items */
  items: RSSItem[];
}

// ============================================================================
// Database Types
// ============================================================================

/**
 * News sources table (Supabase)
 */
export interface NewsSourceRecord {
  /** Source ID */
  id: string;
  /** Display name */
  name: string;
  /** Source type */
  type: NewsSourceType;
  /** Tier */
  tier: SourceTier;
  /** Language */
  language: LanguageCode;
  /** Region code */
  region_code: RegionCode;
  /** Feed URL */
  feed_url?: string;
  /** Configuration (JSON) */
  config?: Record<string, unknown>;
  /** Whether enabled */
  enabled: boolean;
  /** Priority */
  priority: number;
  /** Rate limit */
  rate_limit?: number;
  /** Last fetch time */
  last_fetched_at?: string;
  /** Fetch count */
  fetch_count?: number;
  /** Success rate (%) */
  success_rate?: number;
  /** Creation timestamp */
  created_at: string;
  /** Update timestamp */
  updated_at?: string;
}

/**
 * NewsData.io API usage table
 */
export interface NewsDataUsageRecord {
  /** Record ID */
  id?: number;
  /** Date */
  date: string;
  /** Hour */
  hour: number;
  /** Request count */
  request_count: number;
  /** Articles fetched */
  articles_fetched: number;
  /** Cost (USD) */
  cost_usd: number;
  /** Creation timestamp */
  created_at?: string;
}

/**
 * Fetch metrics record
 */
export interface FetchMetricsRecord {
  /** ID */
  id?: number;
  /** Timestamp */
  timestamp: string;
  /** Total fetched */
  total_fetched: number;
  /** Total inserted */
  total_inserted: number;
  /** Total duplicates */
  total_duplicates: number;
  /** Failed sources */
  failed_sources: string[];
  /** API usage */
  api_usage: {
    newsdata: {
      used: number;
      limit: number;
      remaining: number;
    };
    rss: {
      used: number;
      success: number;
      failed: number;
    };
  };
  /** Processing time (ms) */
  processing_time: number;
  /** Status */
  status: 'success' | 'partial' | 'failed';
  /** Error message (if any) */
  error_message?: string;
}

// ============================================================================
// Classification Types
// ============================================================================

/**
 * Classification context
 */
export interface ClassificationContext {
  /** Whether to use LLM */
  useLLM?: boolean;
  /** DeepSeek API key */
  deepseekKey?: string;
  /** Active keywords */
  keywords?: KeywordEntry[];
}

/**
 * Keyword entry
 */
export interface KeywordEntry {
  /** Keyword */
  keyword: string;
  /** Category */
  category: string;
  /** Priority boost */
  priority_boost?: number;
  /** Region */
  region?: RegionCode;
  /** Weight */
  weight?: number;
}

/**
 * Classification result
 */
export interface ClassificationResult {
  /** Language */
  language: LanguageCode;
  /** Region */
  region: RegionCode | null;
  /** Categories */
  categories: string[];
  /** Priority */
  priority: Priority;
  /** Keywords */
  keywords: string[];
}

// ============================================================================
// Export
// ============================================================================
