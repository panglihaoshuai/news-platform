/**
 * GDELT API Fetcher Script
 *
 * Fetches news from GDELT Doc API 2.0 for authoritative media sources.
 * GDELT provides free access to 50,000+ news sources with ~15-minute delay.
 *
 * Architecture:
 * - Uses GDELT's domain-based queries for authoritative sources
 * - Transforms responses to unified format
 * - Batch inserts to Supabase database
 *
 * Usage:
 *   npx tsx scripts/fetch-gdelt.ts
 *
 * @version 1.0.0
 * @date 2026-02-09
 */

import 'dotenv/config';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import {
  GDELT_SOURCES,
  GDELT_CONFIG,
  getTier1DomainQuery,
  buildGdeltQueryUrl,
  getEnabledGdeltSources,
  getGdeltSourceByDomain,
} from '../src/config/gdelt-sources';
import { GdeltTransformer, type GdeltApiResponse, type GdeltArticle } from '../src/lib/gdelt-transformer';
import { recordMetrics } from '../src/lib/monitoring';
import type { NewsSourceConfig, UnifiedNewsItem, FetchMetricsRecord } from '../src/types/unified-news';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // GDELT API configuration
  apiBaseUrl: GDELT_CONFIG.apiBaseUrl,
  timeout: GDELT_CONFIG.timeoutMs,
  requestDelayMs: GDELT_CONFIG.requestDelayMs,

  // Batch size for database inserts
  batchSize: 50,

  // Data retention
  retentionDays: 3,

  // Query settings
  maxRecords: 50,
  timespan: '24h',

  // Fetch mode: 'single' (combined query) or 'multi' (per-source queries)
  fetchMode: 'single' as 'single' | 'multi',
};

// ============================================================================
// Supabase Client
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Transformer
// ============================================================================

const transformer = new GdeltTransformer();

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
// API Functions
// ============================================================================

/**
 * Fetch from GDELT API with combined query
 */
async function fetchWithCombinedQuery(): Promise<{
  fetched: number;
  items: UnifiedNewsItem[];
  errors: string[];
}> {
  const items: UnifiedNewsItem[] = [];
  const errors: string[] = [];

  // Build combined query for all tier 1 sources
  const query = getTier1DomainQuery();
  const url = buildGdeltQueryUrl({
    query,
    maxRecords: CONFIG.maxRecords * 2, // Get more for better coverage
    timespan: CONFIG.timespan,
    sortByDate: true,
  });

  console.log(`   📡 GDELT API: Combined query for tier 1 sources`);
  console.log(`   URL: ${url.slice(0, 100)}...`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(CONFIG.timeout),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data: GdeltApiResponse = await response.json();
    const articles = data.articles || [];

    console.log(`   ✅ Retrieved ${articles.length} articles from GDELT`);

    // Transform each article
    for (const article of articles) {
      try {
        const source = article.domain ? getGdeltSourceByDomain(article.domain) : undefined;
        const unifiedItem = transformer.transformGdeltArticle(article, source);
        if (unifiedItem) {
          items.push(unifiedItem);
        }
      } catch (err: any) {
        errors.push(`Failed to transform article: ${err.message}`);
      }
    }

    console.log(`   📦 Transformed ${items.length} articles to unified format`);

  } catch (err: any) {
    errors.push(`API request failed: ${err.message}`);
    console.error(`   ❌ API Error: ${err.message}`);
  }

  return { fetched: items.length, items, errors };
}

/**
 * Fetch from GDELT API with per-source queries
 */
async function fetchWithPerSourceQueries(): Promise<{
  fetched: number;
  items: UnifiedNewsItem[];
  errors: string[];
}> {
  const items: UnifiedNewsItem[] = [];
  const errors: string[] = [];
  const sources = getEnabledGdeltSources();

  console.log(`   📡 GDELT API: Per-source queries for ${sources.length} sources`);

  for (const source of sources) {
    try {
      const domain = source.config.domain;
      if (!domain) {
        continue;
      }

      const url = buildGdeltQueryUrl({
        query: `domain:${domain}`,
        maxRecords: CONFIG.maxRecords,
        timespan: CONFIG.timespan,
        sortByDate: true,
      });

      console.log(`   📡 Fetching ${source.name} (${domain})...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(CONFIG.timeout),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: GdeltApiResponse = await response.json();
      const articles = data.articles || [];

      // Transform articles
      const sourceItems = transformer.transformGdeltBatch(articles, source);
      items.push(...sourceItems);

      console.log(`      ✅ ${source.name}: ${articles.length} -> ${sourceItems.length} articles`);

      // Rate limiting
      await sleep(CONFIG.requestDelayMs);

    } catch (err: any) {
      errors.push(`Failed to fetch ${source.name}: ${err.message}`);
      console.error(`      ❌ ${source.name} failed: ${err.message}`);
    }
  }

  return { fetched: items.length, items, errors };
}

/**
 * Insert news items to database
 */
async function insertNewsItems(
  items: UnifiedNewsItem[]
): Promise<number> {
  if (items.length === 0) return 0;

  let inserted = 0;

  // Remove duplicates
  const uniqueItems = transformer.removeDuplicates(items);
  console.log(`   📦 Inserting ${uniqueItems.length} unique articles`);

  for (let i = 0; i < uniqueItems.length; i += CONFIG.batchSize) {
    const batch = uniqueItems.slice(i, i + CONFIG.batchSize);

    const { error } = await supabase
      .from('news_items')
      .upsert(
        batch.map((item) => ({
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
      inserted += batch.length;
    }
  }

  return inserted;
}

/**
 * Clean up old data
 */
async function cleanupOldData(): Promise<void> {
  const expiryDate = new Date(
    Date.now() - CONFIG.retentionDays * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    const { error } = await supabase
      .from('news_items')
      .delete()
      .lt('published_at', expiryDate)
      .eq('source_type', 'gdelt');

    if (error) {
      console.warn(`   ⚠️  Cleanup warning: ${error.message}`);
    } else {
      console.log(`   🧹 Cleaned up GDELT items older than ${CONFIG.retentionDays} days`);
    }
  } catch (e) {
    // Silent fail
  }
}

/**
 * Update GDELT source statistics
 */
async function updateSourceStats(
  totalInserted: number,
  totalFetched: number
): Promise<void> {
  // Get or create GDELT source record
  const { data: existing } = await supabase
    .from('rss_sources')
    .select('*')
    .eq('type', 'gdelt')
    .single();

  if (existing) {
    await supabase
      .from('rss_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
        fetch_count: (existing.fetch_count || 0) + 1,
        success_rate: totalInserted > 0 ? 1 : 0,
      })
      .eq('id', existing.id);
  } else {
    // Create new record
    await supabase.from('rss_sources').insert({
      id: 'gdelt-main',
      name: 'GDELT',
      type: 'gdelt',
      tier: 'tier1',
      language: 'en',
      region_code: 'GLOBAL',
      enabled: true,
      priority: 0,
      last_fetched_at: new Date().toISOString(),
      fetch_count: 1,
      success_rate: totalInserted > 0 ? 1 : 0,
    });
  }
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Main fetch function
 */
async function fetchGdelt(): Promise<FetchMetricsRecord> {
  const startTime = Date.now();
  console.log('🚀 === GDELT FETCH STARTED ===\n');
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   Mode: ${CONFIG.fetchMode === 'single' ? 'Combined Query' : 'Per-Source Queries'}`);
  console.log(`   Sources: ${getEnabledGdeltSources().length} enabled\n`);

  // Fetch based on mode
  let result: { fetched: number; items: UnifiedNewsItem[]; errors: string[] };

  if (CONFIG.fetchMode === 'single') {
    result = await fetchWithCombinedQuery();
  } else {
    result = await fetchWithPerSourceQueries();
  }

  // Insert to database
  console.log('\n📦 === Database Insert ===\n');
  const inserted = await insertNewsItems(result.items);

  // Update statistics
  await updateSourceStats(inserted, result.fetched);

  // Cleanup old data
  await cleanupOldData();

  const processingTime = Date.now() - startTime;

  // Create metrics record
  const metrics: FetchMetricsRecord = {
    timestamp: new Date().toISOString(),
    total_fetched: result.fetched,
    total_inserted: inserted,
    total_duplicates: result.fetched - inserted,
    failed_sources: result.errors.map((e, i) => `error_${i}`),
    api_usage: {
      newsdata: { used: 0, limit: 0 },
      rss: { used: 0, success: result.errors.length === 0 ? 1 : 0, failed: result.errors.length },
    },
    processing_time: processingTime,
    status: result.errors.length === 0 ? 'success' : 'partial',
    error_message: result.errors.length > 0 ? result.errors.join('; ') : undefined,
  };

  // Record metrics
  await recordMetrics(metrics);

  // Print summary
  console.log('\n📊 === FETCH SUMMARY ===');
  console.log(`   Total fetched: ${formatNumber(result.fetched)}`);
  console.log(`   Total inserted: ${formatNumber(inserted)}`);
  console.log(`   Duplicates: ${formatNumber(result.fetched - inserted)}`);
  console.log(`   Errors: ${result.errors.length}`);
  console.log(`   Processing time: ${(processingTime / 1000).toFixed(2)}s`);
  console.log('\n🚀 === GDELT FETCH COMPLETE ===\n');

  return metrics;
}

// ============================================================================
// Run
// ============================================================================

if (require.main === module) {
  fetchGdelt()
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

export { fetchGdelt };
