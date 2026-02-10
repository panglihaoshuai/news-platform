/**
 * NewsData.io API Fetcher Script
 * 
 * Fetches news from NewsData.io API for sources that are blocked
 * when accessed directly (BBC, Reuters, AFP, etc.).
 * 
 * Prerequisites:
 * - NEWS_DATA_API_KEY environment variable must be set
 * - Valid NewsData.io account (free tier: 200 requests/day)
 * 
 * Usage:
 *   npx tsx src/scripts/fetch-newsdata.ts
 * 
 * @version 1.0.0
 * @date 2026-02-08
 */

import 'dotenv/config';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import {
  NEWS_SOURCES,
  getEnabledSourcesByType,
} from '@/config/news-sources';
import { NewsDataTransformer } from '@/lib/data-transformer';
import type { NewsSourceConfig, UnifiedNewsItem } from '@/types/unified-news';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  // NewsData.io API configuration
  apiBaseUrl: 'https://newsdata.io/api/1/news',
  
  // Rate limiting (free tier: 200 requests/day)
  maxRequestsPerHour: 8,
  requestDelayMs: 5000, // 5 seconds between requests
  
  // Batch size for database inserts
  batchSize: 50,
  
  // Data retention
  retentionDays: 3,
};

// ============================================================================
// Supabase Client
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const newsDataApiKey = process.env.NEWS_DATA_API_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!newsDataApiKey) {
  console.error('❌ Missing NewsData.io API key');
  console.error('   Required: NEWS_DATA_API_KEY');
  console.error('   Get your free API key at: https://newsdata.io/');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// Transformer
// ============================================================================

const transformer = new NewsDataTransformer();

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch news from NewsData.io API for a specific source
 */
async function fetchFromNewsDataApi(
  sourceId: string,
  category?: string
): Promise<any[]> {
  const url = new URL(CONFIG.apiBaseUrl);
  url.searchParams.set('apikey', newsDataApiKey);
  url.searchParams.set('type', 'news');
  
  // Add source filter if provided
  if (sourceId) {
    url.searchParams.set('source', sourceId);
  }
  
  // Add category filter if provided
  if (category) {
    url.searchParams.set('category', category);
  }

  console.log(`   📡 API Request: ${url.toString().slice(0, 80)}...`);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`   ❌ API Error: ${response.status} - ${errorText}`);
    throw new Error(`NewsData.io API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'success') {
    console.error(`   ❌ API Error: ${data.code || 'Unknown error'}`);
    throw new Error(`NewsData.io API error: ${data.code || 'Unknown error'}`);
  }

  console.log(`   ✅ Retrieved ${data.results?.length || 0} articles`);
  return data.results || [];
}

/**
 * Fetch news for a source configuration
 */
async function fetchForSource(source: NewsSourceConfig): Promise<{
  fetched: number;
  inserted: number;
  sourceId: string;
  error?: string;
}> {
  const startTime = Date.now();
  let fetched = 0;
  let inserted = 0;

  try {
    console.log(`\n📰 Fetching ${source.name} (${source.config.sourceId})...`);

    // Fetch from API
    const articles = await fetchFromNewsDataApi(
      source.config.sourceId!,
      source.config.category
    );

    fetched = articles.length;

    if (articles.length === 0) {
      console.log(`   ℹ️  No articles found for ${source.name}`);
      return { fetched, inserted, sourceId: source.id };
    }

    // Transform to unified format
    const items = transformer.transformNewsDataBatch(articles, source);

    // Remove duplicates
    const uniqueItems = transformer.removeDuplicates(items);

    // Batch insert to database
    for (let i = 0; i < uniqueItems.length; i += CONFIG.batchSize) {
      const batch = uniqueItems.slice(i, i + CONFIG.batchSize);
      
      const { data, error } = await supabase
        .from('news_items')
        .upsert(
          batch.map((item) => ({
            // Map to database schema
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
            // Additional fields
            source_type: item.source_type,
            source_tier: item.source_tier,
            fetched_at: item.fetched_at,
            importance_factors: item.importance_factors,
          })),
          {
            onConflict: 'external_id',
            ignoreDuplicates: true,
          }
        );

      if (error) {
        console.error(`   ❌ Database error: ${error.message}`);
        throw error;
      }

      inserted += batch.length;
    }

    // Update source last fetched time
    await supabase
      .from('rss_sources')
      .update({
        last_fetched_at: new Date().toISOString(),
      } as any)
      .eq('id', source.id);

    // Record API usage
    await recordApiUsage(source.id, articles.length);

    const duration = Date.now() - startTime;
    console.log(`   ✅ ${source.name}: ${inserted}/${fetched} inserted in ${duration}ms`);

    return { fetched, inserted, sourceId: source.id };

  } catch (error: any) {
    console.error(`   ❌ ${source.name} failed: ${error.message}`);
    return { fetched, inserted, sourceId: source.id, error: error.message };
  }
}

/**
 * Record API usage for monitoring
 */
async function recordApiUsage(sourceId: string, articlesCount: number): Promise<void> {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const hour = now.getUTCHours();

  try {
    const { error } = await supabase
      .from('newsdata_usage')
      .upsert(
        {
          date,
          hour,
          request_count: 1,
          articles_fetched: articlesCount,
          cost_usd: 0, // Free tier
        },
        {
          onConflict: 'date,hour',
        }
      );

    if (error) {
      console.warn(`   ⚠️  Failed to record API usage: ${error.message}`);
    }
  } catch (e) {
    // Silent fail for usage recording
  }
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Fetch news from all NewsData.io sources
 */
async function fetchAllNewsData(): Promise<{
  totalFetched: number;
  totalInserted: number;
  failedSources: string[];
  duration: number;
}> {
  const startTime = Date.now();
  console.log('🚀 === NewsData.io Fetch Started ===\n');

  // Get enabled NewsData.io sources
  const newsdataSources = getEnabledSourcesByType('newsdata').filter(
    (s) => s.enabled
  );

  if (newsdataSources.length === 0) {
    console.log('ℹ️  No NewsData.io sources enabled');
    return { totalFetched: 0, totalInserted: 0, failedSources: [], duration: 0 };
  }

  console.log(`📡 Found ${newsdataSources.length} enabled NewsData.io sources`);
  console.log(`   Rate limit: ${CONFIG.maxRequestsPerHour}/hour (free tier)\n`);

  // Track statistics
  let totalFetched = 0;
  let totalInserted = 0;
  const failedSources: string[] = [];
  let requestCount = 0;

  // Process each source with rate limiting
  for (const source of newsdataSources) {
    // Check rate limit
    if (requestCount >= CONFIG.maxRequestsPerHour) {
      console.log(`\n⚠️  Rate limit reached (${CONFIG.maxRequestsPerHour} requests/hour)`);
      console.log(`   Waiting 1 hour before continuing...`);
      await sleep(60 * 60 * 1000); // Wait 1 hour
      requestCount = 0;
    }

    const result = await fetchForSource(source);
    totalFetched += result.fetched;
    totalInserted += result.inserted;
    requestCount++;

    if (result.error) {
      failedSources.push(source.id);
    }

    // Delay between requests
    if (requestCount < newsdataSources.length) {
      console.log(`   ⏳ Waiting ${CONFIG.requestDelayMs / 1000}s before next request...`);
      await sleep(CONFIG.requestDelayMs);
    }
  }

  // Cleanup old data
  await cleanupOldData();

  const duration = Date.now() - startTime;

  // Print summary
  console.log('\n📊 === NewsData.io Fetch Summary ===');
  console.log(`   Total fetched: ${totalFetched}`);
  console.log(`   Total inserted: ${totalInserted}`);
  console.log(`   Failed sources: ${failedSources.length}`);
  console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
  console.log(`   API requests used: ${requestCount}/${CONFIG.maxRequestsPerHour}/hour`);
  console.log('🚀 === NewsData.io Fetch Complete ===\n');

  return {
    totalFetched,
    totalInserted,
    failedSources,
    duration,
  };
}

/**
 * Clean up old news items
 */
async function cleanupOldData(): Promise<void> {
  const expiryDate = new Date(
    Date.now() - CONFIG.retentionDays * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    const { error } = await supabase
      .from('news_items')
      .delete()
      .lt('published_at', expiryDate);

    if (error) {
      console.warn(`   ⚠️  Cleanup warning: ${error.message}`);
    } else {
      console.log(`   🧹 Cleaned up items older than ${CONFIG.retentionDays} days`);
    }
  } catch (e) {
    // Silent fail for cleanup
  }
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Run
// ============================================================================

if (require.main === module) {
  fetchAllNewsData()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.failedSources.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

export { fetchAllNewsData, fetchForSource };
