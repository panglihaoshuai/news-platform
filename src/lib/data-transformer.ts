/**
 * Data Transformer Module
 * 
 * Transforms news data from various sources (NewsData.io, RSS, RSSHub)
 * into unified format for storage and analysis.
 * 
 * Design Principles:
 * - Lightweight: No images stored
 * - Unified: Single format for all sources
 * - Traceable: Original URLs preserved
 * 
 * @version 1.0.0
 * @date 2026-02-08
 */

import { DataCleaner } from './data-cleaner';
import type {
  UnifiedNewsItem,
  NewsSourceConfig,
  NewsDataArticle,
  RSSItem,
  SmartClassificationResult,
  Priority,
  LanguageCode,
  RegionCode,
  SourceTier,
} from '@/types/unified-news';

/**
 * News Data Transformer Class
 */
export class NewsDataTransformer {
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
  // NewsData.io Transformation
  // ============================================================================

  /**
   * Transform NewsData.io article to unified format
   * 
   * Note: Images are NOT extracted/stored
   * - Lightweight design, focused on text content
   * - Users access original_url to view images
   */
  transformNewsData(
    article: NewsDataArticle,
    source: NewsSourceConfig
  ): UnifiedNewsItem {
    // Clean and validate
    const title = this.cleaner.cleanTitle(article.title);
    const summary = this.cleaner.cleanSummary(article.description || '');
    const originalUrl = this.cleaner.standardizeUrl(article.link);
    const publishedAt = this.cleaner.standardizeDate(article.pubDate);

    // Geocode
    const geo = this.cleaner.geocode(title);

    // Calculate freshness score
    const freshnessScore = this.calculateFreshness(publishedAt);

    // Detect language
    const language = this.detectLanguage(title, article.language);

    // Extract categories
    const categories = this.extractCategories(article.category, source);

    // Calculate priority
    const priority = this.calculatePriority(source, categories, publishedAt);

    // Calculate importance factors
    const importanceFactors = this.calculateImportanceFactors(
      source.tier,
      freshnessScore,
      0, // keywordScore - would be calculated by classifier
      0  // contentBonus - would be calculated by LLM
    );

    return {
      id: this.generateId(),
      external_id: article.article_id || originalUrl,
      title,
      summary,
      original_url: originalUrl,
      source_name: source.name,
      source_type: 'newsdata',
      source_id: source.id,
      source_tier: source.tier,
      published_at: publishedAt,
      fetched_at: new Date().toISOString(),
      geo_lat: geo.lat,
      geo_lng: geo.lng,
      region_code: geo.region,
      country_code: geo.code,
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
  // RSS Transformation
  // ============================================================================

  /**
   * Transform RSS item to unified format
   * 
   * Note: Images are NOT extracted/stored
   */
  transformRss(
    item: RSSItem,
    source: NewsSourceConfig
  ): UnifiedNewsItem {
    // Clean and validate
    const title = this.cleaner.cleanTitle(item.title || 'No Title');
    const summary = this.cleaner.cleanSummary(
      item.contentSnippet || item.summary || item.description || item.content || ''
    );
    const originalUrl = this.cleaner.standardizeUrl(item.link || '', source.config.feedUrl);
    const publishedAt = this.cleaner.standardizeDate(item.isoDate || item.pubDate || '');

    // Geocode
    const geo = this.cleaner.geocode(title);

    // Calculate freshness
    const freshnessScore = this.calculateFreshness(publishedAt);

    // Detect language
    const language = this.detectLanguage(title, undefined);

    // Extract categories
    const categories = this.extractCategories(item.categories, source);

    // Calculate priority
    const priority = this.calculatePriority(source, categories, publishedAt);

    // Calculate importance factors
    const importanceFactors = this.calculateImportanceFactors(
      source.tier,
      freshnessScore,
      0,
      0
    );

    return {
      id: this.generateId(),
      external_id: item.guid || originalUrl,
      title,
      summary,
      original_url: originalUrl,
      source_name: source.name,
      source_type: 'rss',
      source_id: source.id,
      source_tier: source.tier,
      published_at: publishedAt,
      fetched_at: new Date().toISOString(),
      geo_lat: geo.lat,
      geo_lng: geo.lng,
      region_code: geo.region,
      country_code: geo.code,
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
  // Classification Helpers
  // ============================================================================

  /**
   * Detect language
   */
  private detectLanguage(
    title: string,
    apiLanguage?: string
  ): LanguageCode {
    // First check API-provided language
    if (apiLanguage) {
      const lang = apiLanguage.toLowerCase().slice(0, 2);
      if (['en', 'zh', 'fr', 'de', 'es', 'ar', 'ja', 'ko', 'pt', 'ru'].includes(lang)) {
        return lang as LanguageCode;
      }
    }

    // Fallback to title-based detection
    return this.cleaner.detectLanguage(title);
  }

  /**
   * Extract categories from source
   */
  private extractCategories(
    sourceCategories: string | string[] | undefined,
    source: NewsSourceConfig
  ): string[] {
    const categories: string[] = [];

    // Add source category if available
    if (source.config.category) {
      categories.push(this.capitalizeCategory(source.config.category));
    }

    // Add API categories
    if (sourceCategories) {
      const cats = Array.isArray(sourceCategories)
        ? sourceCategories
        : [sourceCategories];
      cats.forEach((cat) => {
        const capitalized = this.capitalizeCategory(cat);
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
   * Calculate freshness score (0-10)
   */
  private calculateFreshness(pubDate: string): number {
    const hoursAgo = this.cleaner.getHoursAgo(pubDate);
    
    if (hoursAgo <= 1) return 10;
    if (hoursAgo <= 2) return 9;
    if (hoursAgo <= 4) return 8;
    if (hoursAgo <= 6) return 7;
    if (hoursAgo <= 12) return 6;
    if (hoursAgo <= 24) return 5;
    if (hoursAgo <= 48) return 4;
    if (hoursAgo <= 72) return 3;
    if (hoursAgo <= 168) return 2; // 1 week
    return 1;
  }

  /**
   * Calculate priority based on source tier, categories, and freshness
   */
  private calculatePriority(
    source: NewsSourceConfig,
    categories: string[],
    pubDate: string
  ): Priority {
    // Base priority from tier (1 = highest priority)
    const tierPriority: Record<SourceTier, number> = {
      tier1: 1,
      tier2: 2,
      tier3: 3,
      tier4: 4,
    };

    let priority = tierPriority[source.tier] || 4;

    // Boost for breaking/urgent categories
    const urgentCategories = ['Breaking', 'Top', 'World', 'Politics', 'Business'];
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

  /**
   * Calculate importance factors
   */
  private calculateImportanceFactors(
    tier: SourceTier,
    freshnessScore: number,
    keywordScore: number,
    contentBonus: number
  ): UnifiedNewsItem['importance_factors'] {
    return {
      mediaWeight: this.TIER_WEIGHTS[tier] || 10,
      freshnessScore,
      keywordScore,
      contentBonus,
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
  // Utility Methods
  // ============================================================================

  /**
   * Generate unique ID
   */
  private generateId(): string {
    // Use crypto.randomUUID() if available (Node.js 19+)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  // ============================================================================
  // Batch Transformation
  // ============================================================================

  /**
   * Transform multiple NewsData.io articles
   */
  transformNewsDataBatch(
    articles: NewsDataArticle[],
    source: NewsSourceConfig
  ): UnifiedNewsItem[] {
    return articles
      .filter((article) => this.cleaner.isValidTitle(article.title))
      .map((article) => this.transformNewsData(article, source));
  }

  /**
   * Transform multiple RSS items
   */
  transformRssBatch(
    items: RSSItem[],
    source: NewsSourceConfig
  ): UnifiedNewsItem[] {
    return items
      .filter((item) => this.cleaner.isValidTitle(item.title || ''))
      .map((item) => this.transformRss(item, source));
  }

  // ============================================================================
  // Deduplication
  // ============================================================================

  /**
   * Check if two items are duplicates based on external_id
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

  // ============================================================================
  // Merging with Classification Results
  // ============================================================================

  /**
   * Merge transformer output with LLM classification result
   */
  mergeClassification(
    item: UnifiedNewsItem,
    classification: SmartClassificationResult
  ): UnifiedNewsItem {
    return {
      ...item,
      categories: classification.categories,
      priority: classification.priority,
      language: classification.language,
      region_code: classification.region || item.region_code,
      importance_factors: {
        ...item.importance_factors,
        keywordScore: classification.factors.keywordScore,
        contentBonus: classification.factors.contentBonus,
      },
      importance_score: this.calculateImportanceScore({
        ...item.importance_factors,
        keywordScore: classification.factors.keywordScore,
        contentBonus: classification.factors.contentBonus,
      }),
      classification_source: classification.source,
      classification_confidence: classification.confidence,
      used_llm: classification.usedLLM,
      llm_cost_estimate: classification.costEstimate,
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const newsDataTransformer = new NewsDataTransformer();
export default NewsDataTransformer;
