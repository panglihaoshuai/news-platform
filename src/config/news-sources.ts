/**
 * News Sources Configuration
 * Hybrid Architecture: NewsData.io API + Direct RSS Sources
 * 
 * This configuration defines all news sources for the Global Intel Map platform.
 * Sources are categorized by type and priority.
 * 
 * @version 1.0.0
 * @date 2026-02-08
 */

import type { NewsSourceConfig, SourceTier, LanguageCode } from '@/types/unified-news';

/**
 * Source Tier Definitions
 * 
 * - Tier 1: Major global news agencies (BBC, Reuters, AFP, etc.)
 * - Tier 2: Established technology and business publications
 * - Tier 3: Regional news sources
 * - Tier 4: Niche or specialized sources
 */
export const SOURCE_TIERS: Record<string, SourceTier> = {
  tier1: 'tier1',
  tier2: 'tier2',
  tier3: 'tier3',
  tier4: 'tier4',
} as const;

/**
 * Language Codes
 */
export const LANGUAGE_CODES: Record<string, LanguageCode> = {
  en: 'en',
  zh: 'zh',
  fr: 'fr',
  de: 'de',
  es: 'es',
  ar: 'ar',
  ja: 'ja',
  ko: 'ko',
  pt: 'pt',
  ru: 'ru',
} as const;

/**
 * News Source Configuration
 * 
 * Design Principles:
 * - NewsData.io API: Priority sources (Tier 1 media)
 * - Direct RSS: Accessible sources (TechCrunch, Wired, etc.)
 * - No images: Lightweight design, text-focused storage
 */
export const NEWS_SOURCES: NewsSourceConfig[] = [
  // ============================================================================
  // NewsData.io API Sources (Priority 1 - Tier 1 Media)
  // ============================================================================
  // These sources require NewsData.io API key and are accessed via their API.
  // Free tier: 200 requests/day, approximately 8 requests/hour.

  {
    id: 'bbc-news',
    name: 'BBC World',
    type: 'newsdata',
    enabled: true,
    priority: 1,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      sourceId: 'bbc-news',
      category: 'world',
    },
    rateLimit: {
      maxRequests: 1,
      windowMinutes: 60,
    },
  },
  {
    id: 'reuters',
    name: 'Reuters',
    type: 'newsdata',
    enabled: true,
    priority: 2,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      sourceId: 'reuters',
      category: 'business',
    },
    rateLimit: {
      maxRequests: 1,
      windowMinutes: 60,
    },
  },
  {
    id: 'afp',
    name: 'AFP',
    type: 'newsdata',
    enabled: true,
    priority: 3,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      sourceId: 'afp',
      category: 'world',
    },
    rateLimit: {
      maxRequests: 1,
      windowMinutes: 60,
    },
  },
  {
    id: 'the-guardian',
    name: 'The Guardian',
    type: 'newsdata',
    enabled: true,
    priority: 4,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      sourceId: 'the-guardian',
      category: 'world',
    },
    rateLimit: {
      maxRequests: 1,
      windowMinutes: 60,
    },
  },
  {
    id: 'nytimes',
    name: 'New York Times',
    type: 'newsdata',
    enabled: true,
    priority: 5,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      sourceId: 'nytimes',
      category: 'world',
    },
    rateLimit: {
      maxRequests: 1,
      windowMinutes: 60,
    },
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    type: 'newsdata',
    enabled: true,
    priority: 6,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      sourceId: 'bloomberg',
      category: 'business',
    },
    rateLimit: {
      maxRequests: 1,
      windowMinutes: 60,
    },
  },
  {
    id: 'cnn',
    name: 'CNN',
    type: 'newsdata',
    enabled: true,
    priority: 7,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      sourceId: 'cnn',
      category: 'world',
    },
    rateLimit: {
      maxRequests: 1,
      windowMinutes: 60,
    },
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    type: 'newsdata',
    enabled: true,
    priority: 8,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      sourceId: 'al-jazeera-english',
      category: 'world',
    },
    rateLimit: {
      maxRequests: 1,
      windowMinutes: 60,
    },
  },

  // ============================================================================
  // Direct RSS Sources (Priority 2 - Accessible Sources)
  // ============================================================================
  // These sources can be accessed directly without API key.
  // They are not blocked by IP restrictions.

  {
    id: 'techcrunch',
    name: 'TechCrunch',
    type: 'rss',
    enabled: true,
    priority: 10,
    tier: 'tier2',
    language: 'en',
    region: 'GLOBAL',
    config: {
      feedUrl: 'https://techcrunch.com/feed/',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'wired',
    name: 'Wired',
    type: 'rss',
    enabled: true,
    priority: 11,
    tier: 'tier2',
    language: 'en',
    region: 'GLOBAL',
    config: {
      feedUrl: 'https://www.wired.com/feed/rss',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    type: 'rss',
    enabled: true,
    priority: 12,
    tier: 'tier2',
    language: 'en',
    region: 'GLOBAL',
    config: {
      feedUrl: 'https://www.theverge.com/rss/index.xml',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'africa-news',
    name: 'Africa News',
    type: 'rss',
    enabled: true,
    priority: 13,
    tier: 'tier2',
    language: 'en',
    region: 'AF',
    config: {
      feedUrl: 'https://www.africanews.com/feed/published/rss/rssFeedCategoriesNews/business.xml',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'france-24',
    name: 'France 24',
    type: 'rss',
    enabled: true,
    priority: 14,
    tier: 'tier2',
    language: 'en',
    region: 'GLOBAL',
    config: {
      feedUrl: 'https://www.france24.com/en/rss',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'solidot',
    name: 'Solidot',
    type: 'rss',
    enabled: true,
    priority: 15,
    tier: 'tier3',
    language: 'zh',
    region: 'AS',
    config: {
      feedUrl: 'https://www.solidot.org/index.rss',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'mit-technology-review',
    name: 'MIT Technology Review',
    type: 'rss',
    enabled: true,
    priority: 16,
    tier: 'tier2',
    language: 'en',
    region: 'GLOBAL',
    config: {
      feedUrl: 'https://www.technologyreview.com/feed/',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'hacker-news',
    name: 'Hacker News',
    type: 'rss',
    enabled: true,
    priority: 17,
    tier: 'tier3',
    language: 'en',
    region: 'GLOBAL',
    config: {
      feedUrl: 'https://news.ycombinator.com/rss',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'thenextweb',
    name: 'The Next Web',
    type: 'rss',
    enabled: true,
    priority: 18,
    tier: 'tier2',
    language: 'en',
    region: 'GLOBAL',
    config: {
      feedUrl: 'https://thenextweb.com/feed/',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'reuters-technology',
    name: 'Reuters Technology',
    type: 'rss',
    enabled: true,
    priority: 19,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      feedUrl: 'https://www.reutersagency.com/feed/?taxonomy=subject&description=Technology',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'bbc-technology',
    name: 'BBC Technology',
    type: 'rss',
    enabled: true,
    priority: 20,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      feedUrl: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'nasa-news',
    name: 'NASA News',
    type: 'rss',
    enabled: true,
    priority: 21,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      feedUrl: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get enabled sources by type
 */
export function getEnabledSourcesByType(type: 'newsdata' | 'rss' | 'rsshub'): NewsSourceConfig[] {
  return NEWS_SOURCES.filter((source) => source.type === type && source.enabled);
}

/**
 * Get all enabled sources
 */
export function getAllEnabledSources(): NewsSourceConfig[] {
  return NEWS_SOURCES.filter((source) => source.enabled);
}

/**
 * Get source by ID
 */
export function getSourceById(id: string): NewsSourceConfig | undefined {
  return NEWS_SOURCES.find((source) => source.id === id);
}

/**
 * Get sources by region
 */
export function getSourcesByRegion(region: string): NewsSourceConfig[] {
  return NEWS_SOURCES.filter((source) => source.enabled && source.region === region);
}

/**
 * Get sources by language
 */
export function getSourcesByLanguage(language: string): NewsSourceConfig[] {
  return NEWS_SOURCES.filter((source) => source.enabled && source.language === language);
}

/**
 * Calculate total daily request count for NewsData.io API
 * Used for capacity planning (200 requests/day free tier)
 */
export function getNewsDataDailyRequestCount(): number {
  const newsdataSources = getEnabledSourcesByType('newsdata');
  // Each source typically needs 1-2 requests per day
  return newsdataSources.length * 1;
}

/**
 * Get priority-ordered sources for hourly fetch schedule
 * NewsData.io API: 8 requests/hour available (200/day / 24 hours)
 * RSS Sources: No rate limit (unlimited)
 */
export function getHourlyFetchOrder(): NewsSourceConfig[] {
  return [...NEWS_SOURCES]
    .filter((source) => source.enabled)
    .sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// Configuration Export
// ============================================================================

export default NEWS_SOURCES;
