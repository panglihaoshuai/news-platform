/**
 * GDELT Source Configuration
 * Hybrid Architecture: Layer 2 - GDELT API (Free, ~15min delay, 50,000+ sources)
 *
 * This configuration defines authoritative media sources for GDELT API queries.
 * GDELT provides free access to 50,000+ news sources with ~15-minute delay.
 *
 * @version 1.0.0
 * @date 2026-02-09
 */

import type { NewsSourceConfig, SourceTier, LanguageCode } from '@/types/unified-news';

// ============================================================================
// Source Tier Definitions (Media Authority)
// ============================================================================

export const SOURCE_TIERS: Record<string, SourceTier> = {
  tier1: 'tier1',
  tier2: 'tier2',
  tier3: 'tier3',
  tier4: 'tier4',
} as const;

// ============================================================================
// GDELT API Configuration
// ============================================================================

export const GDELT_CONFIG = {
  // GDELT Doc API 2.0 endpoint
  apiBaseUrl: 'https://api.gdeltproject.org/api/v2/doc/doc',

  // Query parameters
  defaultMode: 'artlist',
  defaultFormat: 'json',
  defaultMaxRecords: 50,
  defaultTimespan: '24h',

  // Rate limiting (GDELT has no official rate limit, but be respectful)
  requestDelayMs: 2000,

  // Data freshness assumptions
  estimatedDelayMinutes: 15,

  // Timeout
  timeoutMs: 60000,
};

// ============================================================================
// Domain-based Authority Mapping
// ============================================================================

/**
 * Media authority weights based on domain reputation
 * Higher weight = more authoritative source
 */
export const MEDIA_AUTHORITY_WEIGHTS: Record<string, number> = {
  // Tier 1: Major global news agencies (weight: 20)
  'bbc.com': 20,
  'reuters.com': 20,
  'afp.com': 20,
  'apnews.com': 20,
  'news.yahoo.com': 18,

  // Tier 1: Major TV networks and newspapers (weight: 18-20)
  'cnn.com': 18,
  'nytimes.com': 18,
  'theguardian.com': 18,
  'washingtonpost.com': 18,
  'wsj.com': 18,
  'bloomberg.com': 18,
  'aljazeera.com': 18,

  // Tier 2: Established international media (weight: 15-17)
  'france24.com': 15,
  'france24.fr': 15,
  'dw.com': 15,
  'dw.de': 15,
  'africanews.com': 15,
  'africanews.net': 15,
  'news24.com': 15,
  'thetimes.co.uk': 15,
  'telegraph.co.uk': 15,
  'independent.co.uk': 15,
  'lemonde.fr': 15,
  'elpais.com': 15,

  // Tier 3: Regional and specialized (weight: 10-14)
  'newsfromafrica.net': 10,
  'asia.nikkei.com': 12,
  'japan.times': 10,
  'koreaherald.com': 10,
  'straitstimes.com': 12,
  'businesstech.co.za': 10,
  'techcentral.co.za': 10,
};

// ============================================================================
// GDELT Source Configuration
// ============================================================================

export const GDELT_SOURCES: NewsSourceConfig[] = [
  // ==========================================================================
  // Tier 1: Major Global News Agencies (Highest Priority)
  // ==========================================================================

  {
    id: 'gdelt-bbc',
    name: 'BBC World',
    type: 'gdelt',
    enabled: true,
    priority: 1,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      domain: 'bbc.com',
    },
    rateLimit: {
      maxRequests: 10,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-reuters',
    name: 'Reuters',
    type: 'gdelt',
    enabled: true,
    priority: 2,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      domain: 'reuters.com',
    },
    rateLimit: {
      maxRequests: 10,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-afp',
    name: 'AFP',
    type: 'gdelt',
    enabled: true,
    priority: 3,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      domain: 'afp.com',
    },
    rateLimit: {
      maxRequests: 10,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-apnews',
    name: 'AP News',
    type: 'gdelt',
    enabled: true,
    priority: 4,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      domain: 'apnews.com',
    },
    rateLimit: {
      maxRequests: 10,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-cnn',
    name: 'CNN',
    type: 'gdelt',
    enabled: true,
    priority: 5,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      domain: 'cnn.com',
    },
    rateLimit: {
      maxRequests: 10,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-nytimes',
    name: 'New York Times',
    type: 'gdelt',
    enabled: true,
    priority: 6,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      domain: 'nytimes.com',
    },
    rateLimit: {
      maxRequests: 10,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-guardian',
    name: 'The Guardian',
    type: 'gdelt',
    enabled: true,
    priority: 7,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      domain: 'theguardian.com',
    },
    rateLimit: {
      maxRequests: 10,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-washingtonpost',
    name: 'Washington Post',
    type: 'gdelt',
    enabled: true,
    priority: 8,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      domain: 'washingtonpost.com',
    },
    rateLimit: {
      maxRequests: 10,
      windowMinutes: 60,
    },
  },

  // ==========================================================================
  // Tier 1: Financial and Middle Eastern Media
  // ==========================================================================

  {
    id: 'gdelt-bloomberg',
    name: 'Bloomberg',
    type: 'gdelt',
    enabled: true,
    priority: 9,
    tier: 'tier1',
    language: 'en',
    region: 'GLOBAL',
    config: {
      domain: 'bloomberg.com',
    },
    rateLimit: {
      maxRequests: 10,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-aljazeera',
    name: 'Al Jazeera',
    type: 'gdelt',
    enabled: true,
    priority: 10,
    tier: 'tier1',
    language: 'en',
    region: 'ME',
    config: {
      domain: 'aljazeera.com',
    },
    rateLimit: {
      maxRequests: 10,
      windowMinutes: 60,
    },
  },

  // ==========================================================================
  // Tier 2: European and African Media
  // ==========================================================================

  {
    id: 'gdelt-france24',
    name: 'France 24',
    type: 'gdelt',
    enabled: true,
    priority: 11,
    tier: 'tier2',
    language: 'en',
    region: 'EU',
    config: {
      domain: 'france24.com',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-dw',
    name: 'Deutsche Welle',
    type: 'gdelt',
    enabled: true,
    priority: 12,
    tier: 'tier2',
    language: 'en',
    region: 'EU',
    config: {
      domain: 'dw.com',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-africanews',
    name: 'African News',
    type: 'gdelt',
    enabled: true,
    priority: 13,
    tier: 'tier2',
    language: 'en',
    region: 'AF',
    config: {
      domain: 'africanews.com',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
  {
    id: 'gdelt-news24',
    name: 'News24',
    type: 'gdelt',
    enabled: true,
    priority: 14,
    tier: 'tier2',
    language: 'en',
    region: 'AF',
    config: {
      domain: 'news24.com',
    },
    rateLimit: {
      maxRequests: 5,
      windowMinutes: 60,
    },
  },
];

// ============================================================================
// Combined Query Configuration
// ============================================================================

/**
 * Combined query string for all tier 1 sources
 * Used for a single efficient API call
 */
export function getTier1DomainQuery(): string {
  const tier1Sources = GDELT_SOURCES.filter(
    (s) => s.enabled && s.tier === 'tier1'
  );
  const domains = tier1Sources
    .map((s) => s.config.domain)
    .filter(Boolean) as string[];

  return domains.map((d) => `domain:${d}`).join(' OR ');
}

/**
 * Combined query string for all enabled sources
 */
export function getAllDomainQuery(): string {
  const enabledSources = GDELT_SOURCES.filter((s) => s.enabled);
  const domains = enabledSources
    .map((s) => s.config.domain)
    .filter(Boolean) as string[];

  return domains.map((d) => `domain:${d}`).join(' OR ');
}

/**
 * Get sources by tier
 */
export function getGdeltSourcesByTier(tier: SourceTier): NewsSourceConfig[] {
  return GDELT_SOURCES.filter((s) => s.enabled && s.tier === tier);
}

/**
 * Get sources by region
 */
export function getGdeltSourcesByRegion(
  region: string
): NewsSourceConfig[] {
  return GDELT_SOURCES.filter((s) => s.enabled && s.region === region);
}

/**
 * Get all enabled GDELT sources
 */
export function getEnabledGdeltSources(): NewsSourceConfig[] {
  return GDELT_SOURCES.filter((s) => s.enabled);
}

/**
 * Get source by domain
 */
export function getGdeltSourceByDomain(domain: string): NewsSourceConfig | undefined {
  return GDELT_SOURCES.find(
    (s) => s.enabled && s.config.domain?.toLowerCase() === domain.toLowerCase()
  );
}

// ============================================================================
// Query Builder
// ============================================================================

/**
 * Build GDELT API query URL
 */
export function buildGdeltQueryUrl(params: {
  query?: string;
  mode?: string;
  format?: string;
  maxRecords?: number;
  timespan?: string;
  sortByDate?: boolean;
}): string {
  const url = new URL(GDELT_CONFIG.apiBaseUrl);

  // Query expression
  if (params.query) {
    url.searchParams.set('query', params.query);
  } else {
    // Default to all enabled tier 1 sources
    url.searchParams.set('query', getTier1DomainQuery());
  }

  // Mode
  url.searchParams.set('mode', params.mode || GDELT_CONFIG.defaultMode);

  // Format
  url.searchParams.set('format', params.format || GDELT_CONFIG.defaultFormat);

  // Max records
  url.searchParams.set(
    'maxrecords',
    String(params.maxRecords || GDELT_CONFIG.defaultMaxRecords)
  );

  // Timespan
  url.searchParams.set('timespan', params.timespan || GDELT_CONFIG.defaultTimespan);

  // Sort by date (newest first)
  if (params.sortByDate) {
    url.searchParams.set('sort', 'Date');
  }

  return url.toString();
}

// ============================================================================
// Configuration Export
// ============================================================================

export default GDELT_SOURCES;
