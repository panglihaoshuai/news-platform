/**
 * GDELT Source Configuration - Global Balanced Architecture
 * 24 Authoritative Media Sources Across 6 Continents
 * 
 * Geographic Balance: NA(4) + EU(4) + AS(6) + ME(3) + AF(4) + LA(3) = 24
 * Target: 85% completion of global perspective + domain balance + viewpoint diversity
 * 
 * @version 2.0.0
 * @date 2026-02-09
 */

import type { 
  NewsSourceConfig, 
  SourceTier, 
  LanguageCode, 
  RegionCode,
  PerspectiveTags,
  DomainWeights 
} from '@/types/unified-news';

// ============================================================================
// Source Tier Definitions
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
  defaultMaxRecords: 100,  // Increased for 24 sources
  defaultTimespan: '48h',  // Extended window for global coverage

  // Rate limiting
  requestDelayMs: 2000,
  estimatedDelayMinutes: 15,
  timeoutMs: 60000,
};

// ============================================================================
// Domain-based Authority Mapping (24 sources)
// ============================================================================

export const MEDIA_AUTHORITY_WEIGHTS: Record<string, number> = {
  // Tier 1: Major global agencies (weight: 20)
  'bbc.com': 20,
  'reuters.com': 20,
  'afp.com': 20,
  'cnn.com': 18,
  'nytimes.com': 18,
  'bloomberg.com': 18,
  'wsj.com': 18,

  // Tier 2: Regional authorities (weight: 15-17)
  'dw.com': 15,
  'aljazeera.com': 16,
  'haaretz.com': 15,
  'jpost.com': 15,
  'africanews.com': 15,
  'news24.com': 15,
  'globo.com': 15,

  // Tier 2-3: Asia-Pacific (weight: 12-15)
  'japantimes.co.jp': 14,
  'koreaherald.com': 13,
  'straitstimes.com': 14,
  'timesofindia.com': 13,
  'abc.net.au': 14,
  'zaobao.com.sg': 14,
  'sina.com.cn': 12,
  'sohu.com': 11,
  '163.com': 12,
  'ifeng.com': 12,

  // Tier 3: Specialized regional (weight: 10-12)
  'theeastafrican.co.ke': 12,
  'english.ahram.org.eg': 12,
  'clarin.com': 12,
  'reforma.com': 11,
};

// ============================================================================
// Helper: Create perspective tags
// ============================================================================

function createPerspectiveTags(
  geographic: PerspectiveTags['geographic'],
  affiliation: PerspectiveTags['affiliation'],
  audience: PerspectiveTags['audience'],
  ideology?: PerspectiveTags['ideology'],
  description?: string
): PerspectiveTags {
  return { geographic, affiliation, audience, ideology, description };
}

function createDomainWeights(
  general?: number,
  politics?: number,
  finance?: number,
  technology?: number,
  sports?: number,
  society?: number,
  international?: number
): DomainWeights {
  return { general, politics, finance, technology, sports, society, international };
}

// ============================================================================
// GDELT Source Configuration - 24 Global Balanced Sources
// ============================================================================

export const GDELT_SOURCES: NewsSourceConfig[] = [
  // ==========================================================================
  // NORTH AMERICA (4 sources) - Reduced from original 8
  // ==========================================================================

  {
    id: 'gdelt-cnn',
    name: 'CNN',
    type: 'gdelt',
    enabled: true,
    priority: 1,
    tier: 'tier1',
    language: 'en' as LanguageCode,
    region: 'NA' as RegionCode,
    config: { domain: 'cnn.com' },
    rateLimit: { maxRequests: 10, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'global',
      'independent',
      'international',
      'centrist',
      'American mainstream media with global reach'
    ),
    domainWeights: createDomainWeights(40, 30, 15, 10, 3, 2, 25),
  },
  {
    id: 'gdelt-nytimes',
    name: 'New York Times',
    type: 'gdelt',
    enabled: true,
    priority: 2,
    tier: 'tier1',
    language: 'en' as LanguageCode,
    region: 'NA' as RegionCode,
    config: { domain: 'nytimes.com' },
    rateLimit: { maxRequests: 10, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'global',
      'independent',
      'international',
      'progressive',
      'American liberal perspective with in-depth analysis'
    ),
    domainWeights: createDomainWeights(35, 35, 15, 10, 3, 2, 25),
  },
  {
    id: 'gdelt-bloomberg',
    name: 'Bloomberg',
    type: 'gdelt',
    enabled: true,
    priority: 3,
    tier: 'tier1',
    language: 'en' as LanguageCode,
    region: 'NA' as RegionCode,
    config: { domain: 'bloomberg.com' },
    rateLimit: { maxRequests: 10, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'global',
      'independent',
      'international',
      'centrist',
      'Global business and financial news authority'
    ),
    domainWeights: createDomainWeights(20, 20, 50, 20, 2, 3, 25),
  },
  {
    id: 'gdelt-wsj',
    name: 'Wall Street Journal',
    type: 'gdelt',
    enabled: true,
    priority: 4,
    tier: 'tier1',
    language: 'en' as LanguageCode,
    region: 'NA' as RegionCode,
    config: { domain: 'wsj.com' },
    rateLimit: { maxRequests: 10, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'global',
      'independent',
      'international',
      'conservative',
      'American conservative business perspective'
    ),
    domainWeights: createDomainWeights(25, 25, 45, 10, 2, 3, 20),
  },

  // ==========================================================================
  // EUROPE (4 sources)
  // ==========================================================================

  {
    id: 'gdelt-bbc',
    name: 'BBC World',
    type: 'gdelt',
    enabled: true,
    priority: 5,
    tier: 'tier1',
    language: 'en' as LanguageCode,
    region: 'EU' as RegionCode,
    config: { domain: 'bbc.com' },
    rateLimit: { maxRequests: 10, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'global',
      'independent',
      'international',
      'centrist',
      'British global broadcaster with worldwide reach'
    ),
    domainWeights: createDomainWeights(50, 30, 10, 5, 3, 2, 30),
  },
  {
    id: 'gdelt-reuters',
    name: 'Reuters',
    type: 'gdelt',
    enabled: true,
    priority: 6,
    tier: 'tier1',
    language: 'en' as LanguageCode,
    region: 'EU' as RegionCode,
    config: { domain: 'reuters.com' },
    rateLimit: { maxRequests: 10, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'global',
      'independent',
      'international',
      'centrist',
      'British news agency with neutral reporting style'
    ),
    domainWeights: createDomainWeights(35, 25, 35, 10, 2, 3, 30),
  },
  {
    id: 'gdelt-afp',
    name: 'AFP',
    type: 'gdelt',
    enabled: true,
    priority: 7,
    tier: 'tier1',
    language: 'en' as LanguageCode,
    region: 'EU' as RegionCode,
    config: { domain: 'afp.com' },
    rateLimit: { maxRequests: 10, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'international',
      'independent',
      'international',
      'centrist',
      'French news agency with European perspective'
    ),
    domainWeights: createDomainWeights(45, 30, 15, 5, 3, 2, 25),
  },
  {
    id: 'gdelt-dw',
    name: 'Deutsche Welle',
    type: 'gdelt',
    enabled: true,
    priority: 8,
    tier: 'tier2',
    language: 'en' as LanguageCode,
    region: 'EU' as RegionCode,
    config: { domain: 'dw.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'international',
      'official',
      'international',
      'centrist',
      'German public broadcaster for international audiences'
    ),
    domainWeights: createDomainWeights(50, 25, 15, 5, 3, 2, 25),
  },

  // ==========================================================================
  // ASIA-PACIFIC (6 sources) - NEW! Core addition for geographic balance
  // ==========================================================================

  {
    id: 'gdelt-japantimes',
    name: 'Japan Times',
    type: 'gdelt',
    enabled: true,
    priority: 9,
    tier: 'tier2',
    language: 'en' as LanguageCode,
    region: 'AS' as RegionCode,
    config: { domain: 'japantimes.co.jp' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'international',
      'centrist',
      'Japanese perspective on Asia-Pacific affairs'
    ),
    domainWeights: createDomainWeights(40, 25, 20, 10, 3, 2, 20),
  },
  {
    id: 'gdelt-koreaherald',
    name: 'Korea Herald',
    type: 'gdelt',
    enabled: true,
    priority: 10,
    tier: 'tier2',
    language: 'en' as LanguageCode,
    region: 'AS' as RegionCode,
    config: { domain: 'koreaherald.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'international',
      'centrist',
      'South Korean perspective, strong tech coverage'
    ),
    domainWeights: createDomainWeights(35, 20, 20, 20, 3, 2, 15),
  },
  {
    id: 'gdelt-straitstimes',
    name: 'Straits Times',
    type: 'gdelt',
    enabled: true,
    priority: 11,
    tier: 'tier2',
    language: 'en' as LanguageCode,
    region: 'AS' as RegionCode,
    config: { domain: 'straitstimes.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'international',
      'centrist',
      'Singapore perspective on Southeast Asia'
    ),
    domainWeights: createDomainWeights(45, 25, 20, 5, 3, 2, 25),
  },
  {
    id: 'gdelt-timesofindia',
    name: 'Times of India',
    type: 'gdelt',
    enabled: true,
    priority: 12,
    tier: 'tier2',
    language: 'en' as LanguageCode,
    region: 'AS' as RegionCode,
    config: { domain: 'timesofindia.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'domestic',
      'centrist',
      'Indian perspective on South Asia and technology'
    ),
    domainWeights: createDomainWeights(45, 30, 15, 10, 2, 3, 10),
  },
  {
    id: 'gdelt-abc-au',
    name: 'ABC Australia',
    type: 'gdelt',
    enabled: true,
    priority: 13,
    tier: 'tier2',
    language: 'en' as LanguageCode,
    region: 'OC' as RegionCode,
    config: { domain: 'abc.net.au' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'official',
      'international',
      'centrist',
      'Australian public broadcaster, Asia-Pacific focus'
    ),
    domainWeights: createDomainWeights(50, 25, 15, 5, 3, 2, 30),
  },
  {
    id: 'gdelt-zaobao',
    name: 'Lianhe Zaobao',
    type: 'gdelt',
    enabled: true,
    priority: 14,
    tier: 'tier2',
    language: 'zh' as LanguageCode,
    region: 'AS' as RegionCode,
    config: { domain: 'zaobao.com.sg' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'diaspora',
      'centrist',
      'Singapore Chinese perspective on China and regional affairs'
    ),
    domainWeights: createDomainWeights(45, 30, 15, 5, 2, 3, 35),
  },

  // ==========================================================================
  // ADDITIONAL CHINESE SOURCES (4 sources) - Added for bilingual balance
  // ==========================================================================

  {
    id: 'gdelt-sina',
    name: 'Sina News',
    type: 'gdelt',
    enabled: true,
    priority: 14,
    tier: 'tier2',
    language: 'zh' as LanguageCode,
    region: 'AS' as RegionCode,
    config: { domain: 'sina.com.cn' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'neutral',
      'domestic',
      'centrist',
      'Mainland Chinese commercial media perspective'
    ),
    domainWeights: createDomainWeights(40, 25, 20, 10, 3, 2, 30),
  },
  {
    id: 'gdelt-sohu',
    name: 'Sohu News',
    type: 'gdelt',
    enabled: true,
    priority: 15,
    tier: 'tier3',
    language: 'zh' as LanguageCode,
    region: 'AS' as RegionCode,
    config: { domain: 'sohu.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'neutral',
      'domestic',
      'centrist',
      'Mainland Chinese portal with broad coverage'
    ),
    domainWeights: createDomainWeights(35, 30, 25, 5, 3, 2, 25),
  },
  {
    id: 'gdelt-163',
    name: 'NetEase News',
    type: 'gdelt',
    enabled: true,
    priority: 16,
    tier: 'tier2',
    language: 'zh' as LanguageCode,
    region: 'AS' as RegionCode,
    config: { domain: '163.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'neutral',
      'domestic',
      'centrist',
      'Mainland Chinese tech-focused news platform'
    ),
    domainWeights: createDomainWeights(30, 25, 35, 5, 3, 2, 30),
  },
  {
    id: 'gdelt-ifeng',
    name: 'Ifeng',
    type: 'gdelt',
    enabled: true,
    priority: 17,
    tier: 'tier2',
    language: 'zh' as LanguageCode,
    region: 'AS' as RegionCode,
    config: { domain: 'ifeng.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'neutral',
      'domestic',
      'centrist',
      'Mainland Chinese media with Phoenix TV affiliation'
    ),
    domainWeights: createDomainWeights(45, 30, 15, 5, 3, 2, 35),
  },

  // ==========================================================================
  // MIDDLE EAST (3 sources) - Balanced Israeli and Arab perspectives
  // ==========================================================================

  {
    id: 'gdelt-aljazeera',
    name: 'Al Jazeera',
    type: 'gdelt',
    enabled: true,
    priority: 15,
    tier: 'tier1',
    language: 'en' as LanguageCode,
    region: 'ME' as RegionCode,
    config: { domain: 'aljazeera.com' },
    rateLimit: { maxRequests: 10, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'international',
      'semi-official',
      'international',
      'progressive',
      'Qatari-funded, Arab perspective on Middle East and global affairs'
    ),
    domainWeights: createDomainWeights(40, 35, 10, 5, 3, 7, 30),
  },
  {
    id: 'gdelt-haaretz',
    name: 'Haaretz',
    type: 'gdelt',
    enabled: true,
    priority: 16,
    tier: 'tier2',
    language: 'en' as LanguageCode,
    region: 'ME' as RegionCode,
    config: { domain: 'haaretz.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'international',
      'progressive',
      'Israeli liberal perspective, often critical of government'
    ),
    domainWeights: createDomainWeights(40, 40, 10, 5, 2, 3, 25),
  },
  {
    id: 'gdelt-jpost',
    name: 'Jerusalem Post',
    type: 'gdelt',
    enabled: true,
    priority: 17,
    tier: 'tier2',
    language: 'en' as LanguageCode,
    region: 'ME' as RegionCode,
    config: { domain: 'jpost.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'international',
      'conservative',
      'Israeli conservative perspective, closer to official line'
    ),
    domainWeights: createDomainWeights(40, 40, 10, 5, 2, 3, 25),
  },

  // ==========================================================================
  // AFRICA (4 sources) - Comprehensive regional coverage
  // ==========================================================================

  {
    id: 'gdelt-africanews',
    name: 'African News',
    type: 'gdelt',
    enabled: true,
    priority: 18,
    tier: 'tier2',
    language: 'en' as LanguageCode,
    region: 'AF' as RegionCode,
    config: { domain: 'africanews.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'international',
      'independent',
      'international',
      'centrist',
      'Pan-African perspective based in Ghana'
    ),
    domainWeights: createDomainWeights(60, 20, 10, 3, 4, 3, 30),
  },
  {
    id: 'gdelt-news24',
    name: 'News24',
    type: 'gdelt',
    enabled: true,
    priority: 19,
    tier: 'tier2',
    language: 'en' as LanguageCode,
    region: 'AF' as RegionCode,
    config: { domain: 'news24.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'domestic',
      'centrist',
      'South African perspective, business-focused'
    ),
    domainWeights: createDomainWeights(50, 25, 20, 3, 5, 2, 15),
  },
  {
    id: 'gdelt-eastafrican',
    name: 'The East African',
    type: 'gdelt',
    enabled: true,
    priority: 20,
    tier: 'tier3',
    language: 'en' as LanguageCode,
    region: 'AF' as RegionCode,
    config: { domain: 'theeastafrican.co.ke' },
    rateLimit: { maxRequests: 3, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'international',
      'centrist',
      'East African perspective based in Kenya'
    ),
    domainWeights: createDomainWeights(60, 20, 15, 2, 3, 5, 20),
  },
  {
    id: 'gdelt-ahram',
    name: 'Al-Ahram',
    type: 'gdelt',
    enabled: true,
    priority: 21,
    tier: 'tier3',
    language: 'en' as LanguageCode,
    region: 'AF' as RegionCode,
    config: { domain: 'english.ahram.org.eg' },
    rateLimit: { maxRequests: 3, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'official',
      'domestic',
      'centrist',
      'Egyptian state-affiliated, North African focus'
    ),
    domainWeights: createDomainWeights(55, 25, 10, 3, 4, 3, 20),
  },

  // ==========================================================================
  // LATIN AMERICA (3 sources) - NEW! Core addition for geographic balance
  // ==========================================================================

  {
    id: 'gdelt-globo',
    name: 'Globo',
    type: 'gdelt',
    enabled: true,
    priority: 22,
    tier: 'tier2',
    language: 'pt' as LanguageCode,
    region: 'SA' as RegionCode,
    config: { domain: 'globo.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'domestic',
      'centrist',
      'Brazilian mainstream media, Portuguese language'
    ),
    domainWeights: createDomainWeights(55, 25, 10, 3, 5, 2, 10),
  },
  {
    id: 'gdelt-clarin',
    name: 'Clarín',
    type: 'gdelt',
    enabled: true,
    priority: 23,
    tier: 'tier2',
    language: 'es' as LanguageCode,
    region: 'SA' as RegionCode,
    config: { domain: 'clarin.com' },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'domestic',
      'centrist',
      'Argentine perspective, Spanish language'
    ),
    domainWeights: createDomainWeights(60, 25, 10, 2, 4, 4, 10),
  },
  {
    id: 'gdelt-reforma',
    name: 'Reforma',
    type: 'gdelt',
    enabled: true,
    priority: 24,
    tier: 'tier3',
    language: 'es' as LanguageCode,
    region: 'SA' as RegionCode,
    config: { domain: 'reforma.com' },
    rateLimit: { maxRequests: 3, windowMinutes: 60 },
    perspectiveTags: createPerspectiveTags(
      'regional',
      'independent',
      'domestic',
      'centrist',
      'Mexican perspective with US relations focus'
    ),
    domainWeights: createDomainWeights(55, 25, 15, 2, 3, 5, 20),
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Combined query string for all tier 1 sources
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

/**
 * Get sources by perspective tag
 */
export function getSourcesByPerspective(
  tagType: keyof PerspectiveTags,
  value: string
): NewsSourceConfig[] {
  return GDELT_SOURCES.filter(
    (s) => s.enabled && s.perspectiveTags?.[tagType] === value
  );
}

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

  if (params.query) {
    url.searchParams.set('query', params.query);
  } else {
    url.searchParams.set('query', getTier1DomainQuery());
  }

  url.searchParams.set('mode', params.mode || GDELT_CONFIG.defaultMode);
  url.searchParams.set('format', params.format || GDELT_CONFIG.defaultFormat);
  url.searchParams.set(
    'maxrecords',
    String(params.maxRecords || GDELT_CONFIG.defaultMaxRecords)
  );
  url.searchParams.set('timespan', params.timespan || GDELT_CONFIG.defaultTimespan);

  if (params.sortByDate) {
    url.searchParams.set('sort', 'Date');
  }

  return url.toString();
}

/**
 * Get geographic distribution summary
 */
export function getGeographicDistribution(): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  for (const source of GDELT_SOURCES) {
    if (source.enabled) {
      distribution[source.region] = (distribution[source.region] || 0) + 1;
    }
  }
  
  return distribution;
}

/**
 * Validate source configuration
 */
export function validateSourceConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for duplicate IDs
  const ids = GDELT_SOURCES.map(s => s.id);
  const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate source IDs: ${duplicates.join(', ')}`);
  }
  
  // Check for duplicate domains
  const domains = GDELT_SOURCES.map(s => s.config.domain);
  const dupDomains = domains.filter((item, index) => domains.indexOf(item) !== index);
  if (dupDomains.length > 0) {
    errors.push(`Duplicate domains: ${dupDomains.join(', ')}`);
  }
  
  // Check required fields
  for (const source of GDELT_SOURCES) {
    if (!source.id || !source.name || !source.config.domain) {
      errors.push(`Source ${source.id || 'unknown'} missing required fields`);
    }
  }
  
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Configuration Export
// ============================================================================

export default GDELT_SOURCES;

// Log configuration summary on load
console.log('✅ GDELT Global Balanced Configuration Loaded');
console.log(`📊 Total Sources: ${GDELT_SOURCES.length}`);
console.log(`🌍 Geographic Distribution:`, getGeographicDistribution());
console.log(`✓ Validation:`, validateSourceConfig());
