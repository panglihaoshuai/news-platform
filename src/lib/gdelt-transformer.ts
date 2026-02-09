/**
 * GDELT Data Transformer Module
 *
 * Transforms GDELT API responses into unified format for storage and analysis.
 * Handles GDELT's specific fields and adapts freshness scoring for its ~15min delay.
 *
 * Design Principles:
 * - Adapts freshness scoring for GDELT's ~15min estimated delay
 * - Maps GDELT's domain-based sources to unified format
 * - Preserves original URLs for traceability
 *
 * @version 1.0.0
 * @date 2026-02-09
 */

import { DataCleaner } from './data-cleaner';
import { GDELT_CONFIG, MEDIA_AUTHORITY_WEIGHTS } from '@/config/gdelt-sources';
import type {
  UnifiedNewsItem,
  NewsSourceConfig,
  Priority,
  LanguageCode,
  RegionCode,
  SourceTier,
} from '@/types/unified-news';

// ============================================================================
// GDELT API Response Types
// ============================================================================

/**
 * GDELT Doc API 2.0 response
 */
export interface GdeltApiResponse {
  articles: GdeltArticle[];
  nextPage?: string;
}

/**
 * GDELT article from Doc API
 */
export interface GdeltArticle {
  /** Article URL */
  url: string;
  /** Mobile URL */
  url_mobile?: string;
  /** Article title */
  title: string;
  /** Publication date (ISO format: YYYYMMDDTHHmmssZ) */
  seendate: string;
  /** Social image thumbnail */
  socialimage?: string;
  /** Source domain */
  domain: string;
  /** Language */
  language: string;
  /** Source country */
  sourcecountry?: string;
  /** Article tone/sentiment */
  tone?: number;
  /** Number of social shares */
  socialshares?: {
    facebook?: number;
    twitter?: number;
    gplus?: number;
    linkedin?: number;
    pinterest?: number;
    stumble?: number;
    vk?: number;
    whatsapp?: number;
    viber?: number;
    telegram?: number;
    email?: number;
  };
  /** Topics mentioned */
  topics?: string[];
  /** Entities mentioned */
  entities?: string[];
}

// ============================================================================
// Transformer Class
// ============================================================================

export class GdeltTransformer {
  private cleaner = new DataCleaner();

  // ============================================================================
  // Tier Weights (Media Authority)
  // ============================================================================

  private readonly TIER_WEIGHTS: Record<SourceTier, number> = {
    tier1: 20,
    tier2: 15,
    tier3: 10,
    tier4: 5,
  };

  // ============================================================================
  // Single Article Transformation
  // ============================================================================

  /**
   * Transform GDELT article to unified format
   *
   * Special handling for GDELT:
   * - Adapts freshness scoring for ~15min estimated delay
   * - Maps source by domain lookup
   * - Uses domain for source identification
   */
  transformGdeltArticle(
    article: GdeltArticle,
    source?: NewsSourceConfig
  ): UnifiedNewsItem | null {
    // Validate required fields
    if (!article.title || !article.url) {
      console.warn('⚠️  GDELT article missing title or URL, skipping');
      return null;
    }

    // Clean and validate
    const title = this.cleaner.cleanTitle(article.title);
    const summary = this.cleaner.cleanSummary(''); // GDELT doesn't provide summary
    const originalUrl = this.cleaner.standardizeUrl(article.url);

    // Determine source info
    const sourceName = this.getSourceName(article.domain, source);
    const sourceTier = this.getSourceTier(article.domain, source);
    const sourceId = source?.id || `gdelt-${article.domain}`;

    // Parse publication date
    const publishedAt = this.parseGdeltDate(article.seendate);

    // Geocode from title
    const geo = this.cleaner.geocode(title);

    // Calculate freshness with GDELT adjustment (~15min delay)
    const freshnessScore = this.calculateGdeltFreshness(publishedAt);

    // Detect language (from GDELT or infer from title)
    const language = this.detectLanguage(article.language, title);

    // Filter: Only keep Chinese and English articles
    if (!['zh', 'en'].includes(language)) {
      console.log(`   🌐 Skipping non-CN/EN article: ${title.slice(0, 50)}... (${language})`);
      return null;
    }

    // Extract categories from GDELT topics
    const categories = this.extractCategories(article.topics, source);

    // Calculate priority
    const priority = this.calculatePriority(sourceTier, categories, publishedAt);

    // Calculate importance factors
    const authorityWeight = this.getAuthorityWeight(article.domain);
    const importanceFactors = this.calculateImportanceFactors(
      sourceTier,
      freshnessScore,
      authorityWeight,
      0 // keywordScore
    );

    return {
      id: this.generateId(),
      external_id: this.generateExternalId(article.url),
      title,
      summary,
      original_url: originalUrl,
      source_name: sourceName,
      source_type: 'gdelt',
      source_id: sourceId,
      source_tier: sourceTier,
      published_at: publishedAt,
      fetched_at: new Date().toISOString(),
      geo_lat: geo.lat,
      geo_lng: geo.lng,
      region_code: geo.region as import('@/types/unified-news').RegionCode | null,
      country_code: article.sourcecountry || geo.code,
      language,
      categories,
      priority,
      importance_score: this.calculateImportanceScore(importanceFactors),
      importance_factors: importanceFactors,
      classification_source: 'keyword',
      classification_confidence: 0.7,
      created_at: new Date().toISOString(),
    };
  }

  // ============================================================================
  // Batch Transformation
  // ============================================================================

  /**
   * Transform multiple GDELT articles
   */
  transformGdeltBatch(
    articles: GdeltArticle[],
    source?: NewsSourceConfig
  ): UnifiedNewsItem[] {
    return articles
      .map((article) => this.transformGdeltArticle(article, source))
      .filter((item): item is UnifiedNewsItem => item !== null);
  }

  // ============================================================================
  // Freshness Calculation (GDELT-specific)
  // ============================================================================

  /**
   * Calculate freshness score for GDELT articles
   * Adapts for ~15 minute estimated delay in GDELT processing
   *
   * Time windows adjusted with factor 0.85 to account for delay
   */
  private calculateGdeltFreshness(pubDate: string): number {
    const hoursAgo = this.cleaner.getHoursAgo(pubDate);

    // Apply GDELT delay adjustment
    // Articles that appear on GDELT are already ~15 minutes old
    const adjustedHours = hoursAgo + 0.25; // Add 15 minutes

    if (adjustedHours <= 0.5) return 10; // 0-30 mins
    if (adjustedHours <= 2) return 9; // 30 mins - 2 hours
    if (adjustedHours <= 4) return 8; // 2-4 hours
    if (adjustedHours <= 6) return 7; // 4-6 hours
    if (adjustedHours <= 12) return 6; // 6-12 hours
    if (adjustedHours <= 24) return 5; // 12-24 hours
    if (adjustedHours <= 48) return 4; // 24-48 hours
    if (adjustedHours <= 72) return 3; // 48-72 hours
    if (adjustedHours <= 168) return 2; // 1 week
    return 1; // Older
  }

  // ============================================================================
  // Priority Calculation
  // ============================================================================

  /**
   * Calculate priority based on source tier, categories, and freshness
   */
  private calculatePriority(
    tier: SourceTier,
    categories: string[],
    pubDate: string
  ): Priority {
    // Base priority from tier
    const tierPriority: Record<SourceTier, number> = {
      tier1: 1,
      tier2: 2,
      tier3: 3,
      tier4: 4,
    };

    let priority = tierPriority[tier] || 4;

    // Boost for urgent categories
    const urgentCategories = ['Breaking', 'Top', 'World', 'Politics', 'War', 'Crisis'];
    const hasUrgent = categories.some((c) =>
      urgentCategories.some((uc) => c.toLowerCase().includes(uc.toLowerCase()))
    );

    // Boost for recent news
    const hoursAgo = this.cleaner.getHoursAgo(pubDate);
    const isRecent = hoursAgo <= 6;

    // Adjust priority
    if (hasUrgent && isRecent) {
      priority = Math.min(priority, 1); // P0
    } else if (hasUrgent || isRecent) {
      priority = Math.min(priority, 2); // P1
    }

    return `P${priority}` as Priority;
  }

  // ============================================================================
  // Importance Factors
  // ============================================================================

  /**
   * Calculate importance factors
   */
  private calculateImportanceFactors(
    tier: SourceTier,
    freshnessScore: number,
    authorityWeight: number,
    keywordScore: number
  ): UnifiedNewsItem['importance_factors'] {
    return {
      mediaWeight: this.TIER_WEIGHTS[tier] || 10,
      freshnessScore,
      keywordScore,
      contentBonus: authorityWeight - this.TIER_WEIGHTS[tier], // Additional authority bonus
    };
  }

  /**
   * Calculate overall importance score
   */
  private calculateImportanceScore(
    factors: UnifiedNewsItem['importance_factors']
  ): number {
    return (
      factors.mediaWeight +
      factors.freshnessScore +
      factors.keywordScore +
      factors.contentBonus
    );
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get source name from domain
   */
  private getSourceName(domain: string, source?: NewsSourceConfig): string {
    if (source) {
      return source.name;
    }

    // Map common domains to names
    const domainMap: Record<string, string> = {
      'bbc.com': 'BBC World',
      'reuters.com': 'Reuters',
      'afp.com': 'AFP',
      'apnews.com': 'AP News',
      'cnn.com': 'CNN',
      'nytimes.com': 'New York Times',
      'theguardian.com': 'The Guardian',
      'washingtonpost.com': 'Washington Post',
      'bloomberg.com': 'Bloomberg',
      'aljazeera.com': 'Al Jazeera',
      'france24.com': 'France 24',
      'dw.com': 'Deutsche Welle',
      'africanews.com': 'African News',
      'news24.com': 'News24',
    };

    return domainMap[domain.toLowerCase()] || domain;
  }

  /**
   * Get source tier from domain
   */
  private getSourceTier(domain: string, source?: NewsSourceConfig): SourceTier {
    if (source) {
      return source.tier;
    }

    // Infer tier from domain
    const tier1Domains = [
      'bbc.com',
      'reuters.com',
      'afp.com',
      'apnews.com',
      'cnn.com',
      'nytimes.com',
      'theguardian.com',
      'washingtonpost.com',
      'bloomberg.com',
      'aljazeera.com',
    ];

    const tier2Domains = ['france24.com', 'dw.com', 'africanews.com', 'news24.com'];

    const lowerDomain = domain.toLowerCase();
    if (tier1Domains.includes(lowerDomain)) return 'tier1';
    if (tier2Domains.includes(lowerDomain)) return 'tier2';
    return 'tier3';
  }

  /**
   * Get authority weight from domain
   */
  private getAuthorityWeight(domain: string): number {
    const lowerDomain = domain.toLowerCase();
    return MEDIA_AUTHORITY_WEIGHTS[lowerDomain] || 10;
  }

  /**
   * Parse GDELT date format
   * GDELT uses: YYYYMMDDHHMMSS format
   */
  private parseGdeltDate(gdeltDate: string): string {
    if (!gdeltDate) {
      return new Date().toISOString();
    }

    // GDELT format 1: YYYYMMDDTHHMMSSZ (ISO-like with T and Z)
    const isoMatch = gdeltDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
    if (isoMatch) {
      const [, year, month, day, hour, minute, second] = isoMatch;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      );
      return date.toISOString();
    }

    // GDELT format 2: YYYYMMDDHHMMSS (plain)
    const plainMatch = gdeltDate.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
    if (plainMatch) {
      const [, year, month, day, hour, minute, second] = plainMatch;
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      );
      return date.toISOString();
    }

    // Try parsing as regular date string
    const date = new Date(gdeltDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Fallback to current time
    console.warn(`⚠️  Invalid GDELT date format: ${gdeltDate}`);
    return new Date().toISOString();
  }

  /**
   * Detect language
   */
  private detectLanguage(
    gdeltLanguage?: string,
    title?: string
  ): LanguageCode {
    // First check GDELT-provided language
    if (gdeltLanguage) {
      const lang = gdeltLanguage.toLowerCase().slice(0, 2);
      if (['en', 'zh', 'fr', 'de', 'es', 'ar', 'ja', 'ko', 'pt', 'ru'].includes(lang)) {
        return lang as LanguageCode;
      }
    }

    // Fallback to title-based detection
    if (title) {
      return this.cleaner.detectLanguage(title);
    }

    return 'en';
  }

  /**
   * Extract categories from GDELT topics
   */
  private extractCategories(
    topics?: string[],
    source?: NewsSourceConfig
  ): string[] {
    const categories: string[] = [];

    // Add source category if available
    if (source?.config?.category) {
      categories.push(this.capitalizeCategory(source.config.category));
    }

    // Add GDELT topics
    if (topics && topics.length > 0) {
      topics.forEach((topic) => {
        const capitalized = this.capitalizeCategory(topic);
        if (!categories.includes(capitalized)) {
          categories.push(capitalized);
        }
      });
    }

    // Default category if none found
    if (categories.length === 0) {
      categories.push('General');
    }

    return categories;
  }

  /**
   * Capitalize category name
   */
  private capitalizeCategory(category: string): string {
    return category
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Generate external ID from URL
   */
  private generateExternalId(url: string): string {
    // Use URL as external ID for deduplication
    return url;
  }

  // ============================================================================
  // Deduplication
  // ============================================================================

  /**
   * Check if two items are duplicates
   */
  isDuplicate(item1: UnifiedNewsItem, item2: UnifiedNewsItem): boolean {
    return item1.external_id === item2.external_id;
  }

  /**
   * Remove duplicates from array
   */
  removeDuplicates(items: UnifiedNewsItem[]): UnifiedNewsItem[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.external_id)) {
        return false;
      }
      seen.add(item.external_id);
      return true;
    });
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const gdeltTransformer = new GdeltTransformer();
export default GdeltTransformer;
