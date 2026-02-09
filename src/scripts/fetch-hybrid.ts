/**
 * Hybrid News Fetcher - Unified Entry Point
 *
 * Orchestrates fetching news from three sources:
 * - Layer 1: Direct RSS (accessible sources: TechCrunch, Wired, etc.) - REAL-TIME
 * - Layer 2: NewsData.io API (blocked sources: BBC, Reuters, etc.) - ~12hr delay
 * - Layer 3: GDELT API (50,000+ sources, free) - ~15min delay
 *
 * Architecture:
 * - Phase 1: Direct RSS (Priority - real-time)
 * - Phase 2: NewsData.io API (Fallback - for blocked sources)
 * - Phase 3: GDELT API (Supplement - comprehensive coverage)
 *
 * Usage:
 *   npx tsx src/scripts/fetch-hybrid.ts
 *
 * @version 2.0.0
 * @date 2026-02-09
 */

import 'dotenv/config';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import {
  NEWS_SOURCES,
  getEnabledSourcesByType,
  getHourlyFetchOrder,
} from '@/config/news-sources';
import { GDELT_CONFIG, getEnabledGdeltSources } from '@/config/gdelt-sources';
import { NewsDataTransformer } from '@/lib/data-transformer';
import { GdeltTransformer } from '@/lib/gdelt-transformer';
import { recordMetrics } from '@/lib/monitoring';
import type { NewsSourceConfig, UnifiedNewsItem, FetchMetricsRecord, SourceTier } from '@/types/unified-news';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // Layer 1: Direct RSS configuration
  rss: {
    timeout: 30000,
    maxConcurrent: 5,
    requestDelayMs: 1000,
  },

  // Layer 2: NewsData.io API configuration
  newsdata: {
    apiBaseUrl: 'https://newsdata.io/api/1/news',
    maxRequestsPerHour: 8,
    requestDelayMs: 5000,
  },

  // Layer 3: GDELT API configuration
  gdelt: {
    apiBaseUrl: GDELT_CONFIG.apiBaseUrl,
    timeout: GDELT_CONFIG.timeoutMs,
    requestDelayMs: GDELT_CONFIG.requestDelayMs,
    maxRecords: 50,
    timespan: '24h',
  },

  // Database configuration
  db: {
    batchSize: 50,
    retentionDays: 3,
  },

  // Deduplication
  dedup: {
    similarityThreshold: 0.5,
    timeWindowHours: 48,
  },
};

// ============================================================================
// Supabase Client
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const newsDataApiKey = process.env.NEWS_DATA_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Transformers
// ============================================================================

const newsdataTransformer = new NewsDataTransformer();
const gdeltTransformer = new GdeltTransformer();
const rssParser = new Parser({
  timeout: CONFIG.rss.timeout,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

// ============================================================================
// Utility Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

// ============================================================================
// Fetch Functions
// ============================================================================

/**
 * Fetch from NewsData.io API
 */
async function fetchFromNewsDataApi(
  source: NewsSourceConfig
): Promise<{ fetched: number; items: UnifiedNewsItem[] }> {
  if (!newsDataApiKey) {
    console.warn(`   ⚠️  NEWS_DATA_API_KEY not configured, skipping ${source.name}`);
    return { fetched: 0, items: [] };
  }

  const url = new URL(CONFIG.newsdata.apiBaseUrl);
  url.searchParams.set('apikey', newsDataApiKey);
  url.searchParams.set('type', 'news');
  
  if (source.config.sourceId) {
    url.searchParams.set('source', source.config.sourceId);
  }
  if (source.config.category) {
    url.searchParams.set('category', source.config.category);
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const articles = data.results || [];

  // Transform to unified format
  const items = newsdataTransformer.transformNewsDataBatch(articles, source);

  return { fetched: articles.length, items };
}

/**
 * Fetch from RSS feed
 */
async function fetchFromRss(
  source: NewsSourceConfig
): Promise<{ fetched: number; items: UnifiedNewsItem[] }> {
  const feedUrl = source.config.feedUrl;
  
  if (!feedUrl) {
    console.warn(`   ⚠️  No feed URL configured for ${source.name}`);
    return { fetched: 0, items: [] };
  }

  try {
    const feed = await rssParser.parseURL(feedUrl);
    const items = newsdataTransformer.transformRssBatch(feed.items, source);

    return { fetched: feed.items.length, items };
  } catch (error: any) {
    throw new Error(`RSS fetch failed: ${error.message}`);
  }
}

/**
 * Fetch from GDELT API (Layer 3)
 */
async function fetchFromGdeltApi(): Promise<{ fetched: number; items: UnifiedNewsItem[] }> {
  const gdeltSources = getEnabledGdeltSources();

  if (gdeltSources.length === 0) {
    console.log('   ℹ️  No GDELT sources enabled');
    return { fetched: 0, items: [] };
  }

  try {
    // Build combined query for tier 1 sources
    const tier1Sources = gdeltSources.filter((s: NewsSourceConfig) => s.tier === 'tier1');
    const domains = tier1Sources.map((s: NewsSourceConfig) => s.config.domain).filter(Boolean) as string[];
    const query = domains.map((d: string) => `domain:${d}`).join(' ');

    const url = new URL(CONFIG.gdelt.apiBaseUrl);
    url.searchParams.set('query', query);
    url.searchParams.set('mode', 'artlist');
    url.searchParams.set('format', 'json');
    url.searchParams.set('maxrecords', String(CONFIG.gdelt.maxRecords * 2));
    url.searchParams.set('timespan', CONFIG.gdelt.timespan);
    url.searchParams.set('sort', 'Date');

    console.log(`   📡 GDELT API: Combined query for ${tier1Sources.length} sources`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(CONFIG.gdelt.timeout),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const articles = data.articles || [];

    console.log(`   ✅ Retrieved ${articles.length} articles from GDELT`);

    // Transform articles
    const items = gdeltTransformer.transformGdeltBatch(articles);

    return { fetched: articles.length, items };
  } catch (error: any) {
    console.error(`   ❌ GDELT fetch failed: ${error.message}`);
    return { fetched: 0, items: [] };
  }
}

/**
 * Insert news items to database
 */
async function insertNewsItems(
  items: UnifiedNewsItem[],
  recentItems: Map<string, number>
): Promise<number> {
  if (items.length === 0) return 0;

  let inserted = 0;

  for (let i = 0; i < items.length; i += CONFIG.db.batchSize) {
    const batch = items.slice(i, i + CONFIG.db.batchSize);

    // Filter out duplicates
    const uniqueBatch = batch.filter((item: UnifiedNewsItem) => {
      // Check recent items map
      if (recentItems.has(item.external_id)) {
        return false;
      }
      
      // Check similarity (basic check)
      const recentTitles = Array.from(recentItems.keys());
      for (const recentTitle of recentTitles) {
        if (stringSimilarity(item.title, recentTitle) > CONFIG.dedup.similarityThreshold) {
          return false;
        }
      }
      
      return true;
    });

    if (uniqueBatch.length === 0) continue;

    const { error } = await supabase
      .from('news_items')
      .upsert(
        uniqueBatch.map((item) => ({
          id: item.id,
          source_id: item.source_id,
          source_name: item.source_name,
          source_language: item.language,
          title: item.title,
          summary: item.summary,
          original_url: item.original_url,
          published_at: item.published_at,
          geo_lat: item.geo_lat,
          geo_lng: item.geo_lng,
          region_code: item.region_code,
          country_code: item.country_code,
          importance_score: item.importance_score,
          categories: item.categories,
          priority: item.priority,
          created_at: item.created_at,
          source_type: item.source_type,
          source_tier: item.source_tier,
          fetched_at: item.fetched_at,
          importance_factors: item.importance_factors,
          external_id: item.external_id,
        })),
        {
          onConflict: 'external_id',
          ignoreDuplicates: true,
        }
      );

    if (error) {
      console.error(`   ❌ Insert error: ${error.message}`);
    } else {
      inserted += uniqueBatch.length;
    }
  }

  return inserted;
}

/**
 * Basic string similarity (simplified version)
 */
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  // Simple word overlap
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  
  let intersection = 0;
  words1.forEach((word) => {
    if (words2.has(word)) intersection++;
  });
  
  return intersection / Math.max(words1.size, words2.size);
}

/**
 * Get recent items for deduplication
 */
async function getRecentItems(): Promise<Map<string, number>> {
  const timeWindow = new Date(
    Date.now() - CONFIG.dedup.timeWindowHours * 60 * 60 * 1000
  ).toISOString();

  const { data } = await supabase
    .from('news_items')
    .select('external_id, title, published_at')
    .gt('published_at', timeWindow);

  const map = new Map<string, number>();
  
  data?.forEach((item) => {
    if (item.external_id) {
      map.set(item.external_id, 1);
    }
  });

  return map;
}

/**
 * Fetch from a single source
 */
async function fetchFromSource(
  source: NewsSourceConfig
): Promise<{
  sourceId: string;
  sourceName: string;
  type: string;
  fetched: number;
  inserted: number;
  error?: string;
}> {
  const startTime = Date.now();
  let fetched = 0;
  let inserted = 0;
  let error: string | undefined;

  try {
    console.log(`   📰 ${source.name} (${source.type})...`);

    let result: { fetched: number; items: UnifiedNewsItem[] };

    switch (source.type) {
      case 'newsdata':
        result = await fetchFromNewsDataApi(source);
        break;
      case 'rss':
        result = await fetchFromRss(source);
        break;
      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }

    fetched = result.fetched;

    if (result.items.length === 0) {
      console.log(`      ℹ️  No new items from ${source.name}`);
      return {
        sourceId: source.id,
        sourceName: source.name,
        type: source.type,
        fetched: 0,
        inserted: 0,
      };
    }

    // Get recent items for deduplication
    const recentItems = await getRecentItems();

    // Insert items
    inserted = await insertNewsItems(result.items, recentItems);

    // Update source last fetched time
    // Note: Supabase JS doesn't support raw SQL, using sequential query
    const { data: currentSource } = await supabase
      .from('rss_sources')
      .select('fetch_count, success_rate')
      .eq('id', source.id)
      .single();

    const newFetchCount = (currentSource?.fetch_count || 0) + 1;
    const newSuccessRate = currentSource
      ? (currentSource.success_rate * currentSource.fetch_count + (inserted > 0 ? 1 : 0)) / newFetchCount
      : (inserted > 0 ? 1 : 0);

    await supabase
      .from('rss_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
        fetch_count: newFetchCount,
        success_rate: newSuccessRate,
      })
      .eq('id', source.id);

    const duration = Date.now() - startTime;
    console.log(
      `      ✅ ${source.name}: ${inserted}/${fetched} inserted in ${duration}ms`
    );

  } catch (err: any) {
    error = err.message;
    console.error(`      ❌ ${source.name} failed: ${err.message}`);

    // Update failure count
    const { data: currentSource } = await supabase
      .from('rss_sources')
      .select('fetch_count, success_rate')
      .eq('id', source.id)
      .single();

    if (currentSource) {
      const newFetchCount = currentSource.fetch_count + 1;
      const newSuccessRate = (currentSource.success_rate * currentSource.fetch_count) / newFetchCount;

      await supabase
        .from('rss_sources')
        .update({
          fetch_count: newFetchCount,
          success_rate: newSuccessRate,
        })
        .eq('id', source.id);
    }
  }

  return {
    sourceId: source.id,
    sourceName: source.name,
    type: source.type,
    fetched,
    inserted,
    error,
  };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Main hybrid fetch function
 */
async function fetchHybrid(): Promise<FetchMetricsRecord> {
  const startTime = Date.now();
  console.log('🚀 === HYBRID NEWS FETCH STARTED ===\n');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   Config: Direct RSS + NewsData.io + GDELT (3-Layer Architecture)\n`);

  // Get all enabled sources
  const allSources = getHourlyFetchOrder().filter((s: NewsSourceConfig) => s.enabled);
  const newsdataSources = allSources.filter((s: NewsSourceConfig) => s.type === 'newsdata');
  const rssSources = allSources.filter((s: NewsSourceConfig) => s.type === 'rss');
  const gdeltSources = getEnabledGdeltSources();

  console.log(`📊 Sources:`);
  console.log(`   Direct RSS: ${rssSources.length}`);
  console.log(`   NewsData.io: ${newsdataSources.length}`);
  console.log(`   GDELT: ${gdeltSources.length}`);
  console.log(`   Total: ${allSources.length + gdeltSources.length}\n`);

  // Track statistics
  let totalFetched = 0;
  let totalInserted = 0;
  const failedSources: string[] = [];
  const apiUsage = {
    newsdata: { used: 0, limit: CONFIG.newsdata.maxRequestsPerHour },
    rss: { used: 0, success: 0, failed: 0 },
    gdelt: { used: 0, limit: 1 },
  };

  // Phase 1: Direct RSS (Priority - real-time)
  console.log('📡 === Phase 1: Direct RSS (Real-Time) ===\n');
  
  for (const source of newsdataSources) {
    if (apiUsage.newsdata.used >= CONFIG.newsdata.maxRequestsPerHour) {
      console.log(`\n⚠️  NewsData.io rate limit reached`);
      break;
    }

    const result = await fetchFromSource(source);
    totalFetched += result.fetched;
    totalInserted += result.inserted;
    apiUsage.newsdata.used++;

    if (result.error) {
      failedSources.push(result.sourceId);
      apiUsage.rss.failed++;
    } else {
      apiUsage.rss.success++;
    }

    // Rate limiting
    if (apiUsage.newsdata.used < newsdataSources.length) {
      await sleep(CONFIG.newsdata.requestDelayMs);
    }
  }

  console.log('\n');

  // Phase 2: NewsData.io API (Fallback - for blocked sources)
  console.log('📡 === Phase 2: NewsData.io API ===\n');

  for (const source of newsdataSources) {
    if (apiUsage.newsdata.used >= CONFIG.newsdata.maxRequestsPerHour) {
      console.log(`\n⚠️  NewsData.io rate limit reached`);
      break;
    }

    const result = await fetchFromSource(source);
    totalFetched += result.fetched;
    totalInserted += result.inserted;
    apiUsage.newsdata.used++;

    if (result.error) {
      failedSources.push(result.sourceId);
      apiUsage.rss.failed++;
    } else {
      apiUsage.rss.success++;
    }

    // Rate limiting
    if (apiUsage.newsdata.used < newsdataSources.length) {
      await sleep(CONFIG.newsdata.requestDelayMs);
    }
  }

  console.log('\n');

  // Phase 3: GDELT API (Supplement - comprehensive coverage, ~15min delay)
  console.log('📡 === Phase 3: GDELT API (~15min delay) ===\n');

  const gdeltResult = await fetchFromGdeltApi();
  totalFetched += gdeltResult.fetched;
  apiUsage.gdelt.used++;

  if (gdeltResult.items.length > 0) {
    // Get recent items for deduplication
    const recentItems = await getRecentItems();
    const insertedGdelt = await insertNewsItems(gdeltResult.items, recentItems);
    totalInserted += insertedGdelt;
    console.log(`   ✅ GDELT: ${insertedGdelt}/${gdeltResult.fetched} inserted`);
  }

  // Cleanup old data
  await cleanupOldData();

  const processingTime = Date.now() - startTime;

  // Create metrics record
  const metrics: FetchMetricsRecord = {
    timestamp: new Date().toISOString(),
    total_fetched: totalFetched,
    total_inserted: totalInserted,
    total_duplicates: totalFetched - totalInserted,
    failed_sources: failedSources,
    api_usage: apiUsage,
    processing_time: processingTime,
    status: failedSources.length === 0 ? 'success' : 
            failedSources.length >= allSources.length ? 'failed' : 'partial',
  };

  // Record metrics
  await recordMetrics(metrics);

  // Print summary
  console.log('\n📊 === FETCH SUMMARY ===');
  console.log(`   Total fetched: ${formatNumber(totalFetched)}`);
  console.log(`   Total inserted: ${formatNumber(totalInserted)}`);
  console.log(`   Duplicates: ${formatNumber(totalFetched - totalInserted)}`);
  console.log(`   Failed sources: ${failedSources.length}`);
  console.log(`   Processing time: ${(processingTime / 1000).toFixed(2)}s`);
  console.log(`\n📊 === API USAGE ===`);
  console.log(`   Direct RSS: ${apiUsage.rss.success} success, ${apiUsage.rss.failed} failed`);
  console.log(`   NewsData.io: ${apiUsage.newsdata.used}/${apiUsage.newsdata.limit}/hour`);
  console.log(`   GDELT: ${apiUsage.gdelt.used}/1 (~15min delay)`);
  console.log('\n🚀 === HYBRID FETCH COMPLETE (3-Layer Architecture) ===\n');

  return metrics;
}

/**
 * Clean up old data
 */
async function cleanupOldData(): Promise<void> {
  const expiryDate = new Date(
    Date.now() - CONFIG.db.retentionDays * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    const { error } = await supabase
      .from('news_items')
      .delete()
      .lt('published_at', expiryDate);

    if (error) {
      console.warn(`   ⚠️  Cleanup warning: ${error.message}`);
    } else {
      console.log(`   🧹 Cleaned up items older than ${CONFIG.db.retentionDays} days`);
    }
  } catch (e) {
    // Silent fail
  }
}

// ============================================================================
// Run
// ============================================================================

if (require.main === module) {
  fetchHybrid()
    .then((metrics) => {
      console.log('\n📄 Metrics JSON:');
      console.log(JSON.stringify(metrics, null, 2));
      process.exit(metrics.status === 'failed' ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export { fetchHybrid };
