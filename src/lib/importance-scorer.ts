/**
 * Importance Scoring Algorithm v2.0
 * 
 * Calculates importance score based on:
 * - Media weight (0-30 points)
 * - Freshness (0-20 points) - 1 hour fetch frequency, 8 hour shelf life
 * - Keywords (0-35 points) - Multi-domain comprehensive keyword library
 * - Content richness (0-15 points)
 * 
 * Total: 0-100 points
 */

import { NewsItem, RSSSource } from '@/types/news';

export interface KeywordLibrary {
  id: string;
  keyword: string;
  tier: 'P0' | 'P1' | 'P2' | 'P3';
  categories: string[];
  weight: number;
}

export interface ImportanceFactors {
  mediaWeight: number;
  freshnessScore: number;
  keywordScore: number;
  contentBonus: number;
  total: number;
  matchedKeywords: KeywordLibrary[];
  detectedCategories: string[];
}

// Media tier configuration
const MEDIA_TIERS: Record<string, number> = {
  // Tier 1: Global Top Tier (30 points)
  'Reuters': 30,
  'Reuters Global': 30,
  'BBC': 30,
  'BBC World': 30,
  'NYT': 30,
  'NYTimes': 30,
  'NYT World': 30,
  'New York Times': 30,
  'WSJ': 30,
  'Wall Street Journal': 30,
  
  // Tier 2: Authoritative Media (24 points)
  'FT': 24,
  'Financial Times': 24,
  'Guardian': 24,
  'The Guardian': 24,
  'Al Jazeera': 24,
  '联合早报': 24,
  
  // Tier 3: Regional Authoritative (18 points)
  'RFI': 18,
  'RFI 中文': 18,
  'BBC 中文': 18,
  'WSJ 中文': 18,
  'FT 中文': 18,
  'NYT 中文': 18,
  
  // Default: Regular Media (12 points)
  'default': 12
};

// Tier weight mapping
const TIER_WEIGHTS: Record<string, number> = {
  'P0': 35,
  'P1': 25,
  'P2': 15,
  'P3': 8
};

/**
 * Get media weight based on source name
 */
export function getMediaWeight(sourceName: string): number {
  // Exact match
  if (MEDIA_TIERS[sourceName] !== undefined) {
    return MEDIA_TIERS[sourceName];
  }
  
  // Partial match
  for (const [key, weight] of Object.entries(MEDIA_TIERS)) {
    if (sourceName.toLowerCase().includes(key.toLowerCase())) {
      return weight;
    }
  }
  
  return MEDIA_TIERS['default'];
}

/**
 * Calculate freshness score
 * 1 hour fetch frequency, 8 hour shelf life
 * Decay rate: 2.5 points per hour
 */
export function calculateFreshnessScore(publishedAt: string): number {
  const published = new Date(publishedAt).getTime();
  const now = Date.now();
  const hoursSincePublished = (now - published) / (1000 * 60 * 60);
  
  // Decay: 2.5 points per hour, max 8 hours (20 / 2.5 = 8)
  const score = Math.max(0, 20 - hoursSincePublished * 2.5);
  return Math.round(score);
}

/**
 * Match keywords and calculate score
 */
export function calculateKeywordScore(
  title: string,
  keywords: KeywordLibrary[]
): { score: number; matched: KeywordLibrary[]; categories: string[] } {
  const lowerTitle = title.toLowerCase();
  let totalScore = 0;
  const matched: KeywordLibrary[] = [];
  const categorySet = new Set<string>();
  
  for (const kw of keywords) {
    if (lowerTitle.includes(kw.keyword.toLowerCase())) {
      const weight = TIER_WEIGHTS[kw.tier] || 8;
      totalScore += weight;
      matched.push(kw);
      
      // Collect categories
      kw.categories.forEach(cat => { categorySet.add(cat); });
    }
  }
  
  // Cap at 35 points
  return {
    score: Math.min(35, totalScore),
    matched,
    categories: Array.from(categorySet)
  };
}

/**
 * Calculate content richness bonus
 */
export function calculateContentBonus(
  item: Partial<NewsItem> & { enclosure?: any; creator?: string }
): number {
  let bonus = 0;
  
  // Has enclosure (image/video) - evidence of significant event
  if (item.enclosure) {
    bonus += 5;
  }
  
  // Has categories from RSS source
  if (item.categories && item.categories.length > 0) {
    bonus += 3;
  }
  
  // Has substantial content
  if (item.summary && item.summary.length > 100) {
    bonus += 4;
  }
  
  // Has author/creator
  if (item.creator) {
    bonus += 3;
  }
  
  return Math.min(15, bonus);
}

/**
 * Determine priority tier based on total score
 */
export function determinePriority(totalScore: number): 'P0' | 'P1' | 'P2' | 'P3' | null {
  if (totalScore >= 80) return 'P0';
  if (totalScore >= 60) return 'P1';
  if (totalScore >= 40) return 'P2';
  if (totalScore >= 20) return 'P3';
  return null;
}

/**
 * Main importance scoring function
 */
export function calculateImportanceScore(
  newsItem: NewsItem,
  source: RSSSource,
  keywords: KeywordLibrary[]
): ImportanceFactors {
  // 1. Media weight (30 points max)
  const mediaWeight = getMediaWeight(source.name);
  
  // 2. Freshness (20 points max)
  const freshnessScore = calculateFreshnessScore(newsItem.published_at);
  
  // 3. Keywords (35 points max)
  const keywordResult = calculateKeywordScore(newsItem.title, keywords);
  const keywordScore = keywordResult.score;
  
  // 4. Content bonus (15 points max)
  const contentBonus = calculateContentBonus({
    ...newsItem,
    enclosure: (newsItem as any).enclosure,
    creator: (newsItem as any).creator
  });
  
  // Calculate total
  const total = Math.min(100, mediaWeight + freshnessScore + keywordScore + contentBonus);
  
  return {
    mediaWeight,
    freshnessScore,
    keywordScore,
    contentBonus,
    total,
    matchedKeywords: keywordResult.matched,
    detectedCategories: keywordResult.categories
  };
}

/**
 * Batch calculate scores for multiple news items
 */
export function batchCalculateScores(
  newsItems: NewsItem[],
  sources: RSSSource[],
  keywords: KeywordLibrary[]
): Map<string, ImportanceFactors> {
  const results = new Map<string, ImportanceFactors>();
  const sourceMap = new Map(sources.map(s => [s.id, s]));
  
  for (const item of newsItems) {
    const source = sourceMap.get(item.source_id);
    if (source) {
      const factors = calculateImportanceScore(item, source, keywords);
      results.set(item.id, factors);
    }
  }
  
  return results;
}

/**
 * Scoring result interface for UI components
 */
export interface ScoringResult {
  totalScore: number;
  factors: {
    mediaWeight: number;
    freshnessScore: number;
    keywordScore: number;
    contentBonus: number;
  };
  matchedKeywords: Array<{
    keyword: string;
    tier: 'P0' | 'P1' | 'P2' | 'P3';
    weight: number;
  }>;
  suggestedCategories: string[];
  suggestedPriority: 'P0' | 'P1' | 'P2' | 'P3' | null;
}

/**
 * Quick score calculation without full context
 * Used for real-time testing in admin panel
 */
export function quickCalculateScore(
  title: string,
  sourceName: string,
  keywords: KeywordLibrary[],
  publishedAt?: string
): ImportanceFactors {
  const mediaWeight = getMediaWeight(sourceName);
  const freshnessScore = publishedAt ? calculateFreshnessScore(publishedAt) : 20;
  const keywordResult = calculateKeywordScore(title, keywords);
  const keywordScore = keywordResult.score;
  const contentBonus = 5; // Assume basic content for testing
  
  const total = Math.min(100, mediaWeight + freshnessScore + keywordScore + contentBonus);
  
  return {
    mediaWeight,
    freshnessScore,
    keywordScore,
    contentBonus,
    total,
    matchedKeywords: keywordResult.matched,
    detectedCategories: keywordResult.categories
  };
}

/**
 * Simplified quick score for UI components
 * Returns ScoringResult format
 */
export function quickScore(
  title: string,
  sourceName: string,
  publishedAt: string,
  keywords: Array<{ keyword: string; tier: 'P0' | 'P1' | 'P2' | 'P3'; categories: string[]; weight: number }>
): ScoringResult {
  // Convert simplified keywords to KeywordLibrary format
  const libKeywords: KeywordLibrary[] = keywords.map((k, i) => ({
    id: `temp-${i}`,
    keyword: k.keyword,
    tier: k.tier,
    categories: k.categories,
    weight: k.weight,
  }));

  const result = quickCalculateScore(title, sourceName, libKeywords, publishedAt);
  
  return {
    totalScore: result.total,
    factors: {
      mediaWeight: result.mediaWeight,
      freshnessScore: result.freshnessScore,
      keywordScore: result.keywordScore,
      contentBonus: result.contentBonus,
    },
    matchedKeywords: result.matchedKeywords.map(k => ({
      keyword: k.keyword,
      tier: k.tier,
      weight: TIER_WEIGHTS[k.tier] || 8,
    })),
    suggestedCategories: result.detectedCategories,
    suggestedPriority: determinePriority(result.total),
  };
}
