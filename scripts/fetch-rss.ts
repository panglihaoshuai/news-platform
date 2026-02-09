/**
 * RSS News Fetcher with Smart Classification
 * 
 * Fetches news from RSS feeds and classifies them using hybrid
 * keyword matching + DeepSeek LLM classification.
 */

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import dotenv from 'dotenv';
import path from 'path';
import { countries } from './countries';

// Import smart classifier
import {
  classifyNews,
  batchClassifyNews,
  SmartClassificationResult,
  NewsItemInput
} from '@/lib/smart-classifier';

// Import keyword matcher for deduplication
import { buildSynonymMap, loadActiveKeywords, KeywordEntry } from '@/lib/keyword-matcher';

// Import string-similarity for deduplication
const stringSimilarity = require('string-similarity') as {
  findBestMatch: (main: string, targets: string[]) => {
    bestMatch: { rating: number; target: string };
    ratings: Array<{ target: string; rating: number }>;
  };
  compareTwoStrings: (a: string, b: string) => number;
};

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const parser = new Parser({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
  }
});

// RSSHub.app proxy configuration for blocked sources
const RSSHUB_APP_BASE = 'https://rsshub.app';

interface RSSSource {
  id: string;
  name: string;
  feed_url: string;
  language: string;
  country_code: string | null;
  enabled: boolean;
  use_proxy?: boolean;  // Whether to route through RSSHub.app proxy
}

// Check if URL should use RSSHub.app proxy
function getProxiedUrl(url: string, useProxy?: boolean): string {
  if (!useProxy) return url;

  // RSSHub.app doesn't support direct Google News URLs, it needs special routes
  // For Google News, route through RSSHub
  if (url.includes('news.google.com/rss')) {
    // Extract query from Google News URL and convert to RSSHub route
    const match = url.match(/q=(.+?)&/);
    if (match) {
      const query = encodeURIComponent(match[1]);
      return `${RSSHUB_APP_BASE}/google/search/${query}?limit=50`;
    }
  }

  // For other URLs that need proxying
  if (url.startsWith('https://cn.reuters.com/')) {
    return `${RSSHUB_APP_BASE}${url.replace('https://cn.reuters.com', '')}`;
  }

  return url;
}

const SIMILARITY_THRESHOLD = 0.5;
const RETENTION_DAYS = 3;

// Interface definitions
interface CountryDef {
  name: string;
  code: string;
  lat: number;
  lng: number;
  region: string;
  keywords?: string[];
}

interface RSSSource {
  id: string;
  name: string;
  feed_url: string;
  language: string;
  country_code: string | null;
  enabled: boolean;
}

/**
 * Geocode news title to geographic coordinates
 */
function geocode(title: string, defaultCountryCode: string | null) {
  const lowerTitle = title.toLowerCase();
  for (const country of (countries as CountryDef[])) {
    if (lowerTitle.includes(country.name.toLowerCase())) {
      return { lat: country.lat, lng: country.lng, code: country.code, region: country.region };
    }
    if (country.keywords) {
      for (const keyword of country.keywords) {
        if (lowerTitle.includes(keyword.toLowerCase())) {
          return { lat: country.lat, lng: country.lng, code: country.code, region: country.region };
        }
      }
    }
  }
  if (defaultCountryCode && defaultCountryCode !== 'GLOBAL') {
    const defaultCountry = countries.find((c: CountryDef) => c.code === defaultCountryCode);
    if (defaultCountry) {
      return { lat: defaultCountry.lat, lng: defaultCountry.lng, code: defaultCountry.code, region: defaultCountry.region };
    }
  }
  return { lat: null, lng: null, code: defaultCountryCode, region: null };
}

/**
 * Prepare news item for classification
 */
function prepareNewsItem(
  title: string,
  sourceName: string,
  item: any,
  geo: ReturnType<typeof geocode>
): NewsItemInput {
  return {
    title,
    summary: item.contentSnippet || item.summary || item.content || '',
    sourceName,
    publishedAt: item.isoDate ? new Date(item.isoDate).toISOString() : new Date().toISOString(),
    enclosure: item.enclosure || item.image_url,
    creator: item.creator
  };
}

/**
 * Convert smart classification result to database format
 */
function convertToNewsItem(
  input: NewsItemInput,
  classification: SmartClassificationResult,
  sourceId: string,
  geo: ReturnType<typeof geocode>
) {
  return {
    source_id: sourceId,
    title: input.title,
    summary: input.summary?.substring(0, 800) || '',
    original_url: '',
    published_at: input.publishedAt,
    region_code: geo.region,
    country_code: geo.code,
    geo_lat: geo.lat,
    geo_lng: geo.lng,
    importance_score: classification.factors.mediaWeight + 
                      classification.factors.freshnessScore + 
                      classification.factors.keywordScore + 
                      classification.factors.contentBonus,
    importance_score_calculated: classification.factors.mediaWeight + 
                                  classification.factors.freshnessScore + 
                                  classification.factors.keywordScore + 
                                  classification.factors.contentBonus,
    categories: classification.categories,
    priority: classification.priority,
    // New fields for tracking
    classification_source: classification.source,
    classification_confidence: classification.confidence,
    used_llm: classification.usedLLM,
    llm_cost_estimate: classification.costEstimate
  };
}

/**
 * Process a single news item
 */
async function processNewsItem(
  title: string,
  source: RSSSource,
  item: any,
  recentTitles: string[],
  keywords: KeywordEntry[],
  synonymMap: Map<string, any>
) {
  // Deduplicate
  if (recentTitles.length > 0) {
    const matches = stringSimilarity.findBestMatch(title, recentTitles);
    if (matches.bestMatch.rating > SIMILARITY_THRESHOLD) {
      return null; // Skip duplicate
    }
  }

  // Geocode
  const geo = geocode(title, source.country_code);
  
  // Only process if it has coordinates
  if (!geo.lat || !geo.lng) {
    return null;
  }

  // Prepare input for classification
  const newsInput = prepareNewsItem(title, source.name, item, geo);

  // Classify using smart classifier
  const classification = await classifyNews(newsInput, keywords);

  // Convert to database format
  const newsItem = convertToNewsItem(newsInput, classification, source.id, geo);

  return newsItem;
}

/**
 * Main fetch function
 */
async function fetchAllFeeds() {
  console.log('--- GLOBAL INTEL FETCH STARTED ---');
  console.log('Using Smart Classification (Keyword + DeepSeek LLM)');

  // Load keyword library
  const keywords = await loadActiveKeywords();
  const synonymMap = buildSynonymMap(keywords);
  console.log(`📚 Loaded ${keywords.length} keywords from library`);

  // Check DeepSeek configuration
  const hasDeepSeekKey = !!process.env.DEEPSEEK_API_KEY;
  if (hasDeepSeekKey) {
    console.log('✅ DeepSeek API key configured - LLM classification enabled');
  } else {
    console.log('⚠️ DeepSeek API key not configured - using keyword-only classification');
  }

  // Fetch recent news for deduplication
  const { data: recentNews } = await supabase
    .from('news_items')
    .select('title')
    .gt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  const recentTitles = recentNews?.map(n => n.title) || [];

  // Get active sources
  const { data: sources } = await supabase
    .from('rss_sources')
    .select('*')
    .eq('enabled', true);

  if (!sources || sources.length === 0) {
    console.log('No active RSS sources found');
    return;
  }

  console.log(`📡 Found ${sources.length} active sources`);

  // Statistics
  let totalProcessed = 0;
  let totalLLMUsed = 0;
  let totalCost = 0;

  for (const source of sources) {
    try {
      // Get the URL (with proxy if needed)
      const fetchUrl = getProxiedUrl(source.feed_url, source.use_proxy);
      console.log(`📡 Fetching [${source.language}] ${source.name}...`);
      if (fetchUrl !== source.feed_url) {
        console.log(`   └─ Using proxy: ${fetchUrl.substring(0, 80)}...`);
      }

      let feed: any;
      try {
        feed = await parser.parseURL(fetchUrl);
      } catch (fetchError) {
        // If direct fetch fails and proxy is available, try RSSHub.app
        if (!source.use_proxy && source.feed_url.includes('news.google.com')) {
          console.log(`   └─ Direct fetch failed, trying RSSHub.app proxy...`);
          const proxyUrl = `${RSSHUB_APP_BASE}/google/search/${encodeURIComponent(source.name)}?limit=30`;
          try {
            feed = await parser.parseURL(proxyUrl);
          } catch (proxyError) {
            console.log(`   ⚠️  Both direct and proxy failed`);
            continue;
          }
        } else {
          throw fetchError;
        }
      }

      const newsItems: any[] = [];

      for (const item of feed.items) {
        const title = item.title || 'No Title';

        const newsItem = await processNewsItem(
          title,
          source,
          item,
          recentTitles,
          keywords,
          synonymMap
        );

        if (newsItem) {
          newsItems.push(newsItem);
          recentTitles.push(title);
          totalProcessed++;

          // Track LLM usage
          if (newsItem.used_llm) {
            totalLLMUsed++;
            totalCost += newsItem.llm_cost_estimate || 0;
          }
        }
      }

      if (newsItems.length > 0) {
        const { error } = await supabase
          .from('news_items')
          .upsert(newsItems, { onConflict: 'source_id,original_url', ignoreDuplicates: true });

        if (error) {
          console.error(`❌ Insert error for ${source.name}:`, error.message);
        } else {
          const p0Count = newsItems.filter((n: any) => n.priority === 'P0').length;
          const p1Count = newsItems.filter((n: any) => n.priority === 'P1').length;
          const llmCount = newsItems.filter((n: any) => n.used_llm).length;
          console.log(`✅ Processed ${newsItems.length} items from ${source.name} (P0: ${p0Count}, P1: ${p1Count}, LLM: ${llmCount})`);
        }
      }

      // Update last fetch time
      await supabase
        .from('rss_sources')
        .update({ last_fetched_at: new Date().toISOString() })
        .eq('id', source.id);

    } catch (err: any) {
      console.error(`⚠️ Failed ${source.name}: ${err.message}`);
    }
  }

  // Cleanup old items
  const expiryDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('news_items').delete().lt('published_at', expiryDate);

  // Print summary
  console.log('--- GLOBAL INTEL FETCH FINISHED ---');
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`LLM classifications: ${totalLLMUsed}`);
  console.log(`Estimated cost: $${totalCost.toFixed(4)}`);
}

// Run the fetcher
fetchAllFeeds().catch(console.error);
