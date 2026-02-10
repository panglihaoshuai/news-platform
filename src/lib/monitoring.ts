/**
 * Monitoring Module
 * 
 * Records fetch metrics, tracks API usage, and sends alerts.
 * 
 * @version 1.0.0
 * @date 2026-02-08
 */

import { createClient } from '@supabase/supabase-js';
import type { FetchMetricsRecord } from '@/types/unified-news';

// ============================================================================
// Configuration
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client if configured
let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// ============================================================================
// Metrics Recording
// ============================================================================

/**
 * Record fetch metrics to database
 */
export async function recordMetrics(metrics: FetchMetricsRecord): Promise<void> {
  if (!supabase) {
    console.warn('⚠️  Supabase not configured, skipping metrics recording');
    return;
  }

  try {
    const { error } = await (supabase
      .from('fetch_metrics') as any)
      .insert(metrics);

    if (error) {
      console.warn(`⚠️  Failed to record metrics: ${error.message}`);
    }
  } catch (e) {
    console.warn(`⚠️  Metrics recording error: ${e}`);
  }
}

/**
 * Record NewsData.io API usage
 */
export async function recordNewsDataUsage(
  date: string,
  hour: number,
  requestCount: number,
  articlesFetched: number
): Promise<void> {
  if (!supabase) {
    return;
  }

  try {
    const { error } = await (supabase
      .from('newsdata_usage') as any)
      .upsert(
        {
          date,
          hour,
          request_count: requestCount,
          articles_fetched: articlesFetched,
          cost_usd: 0, // Free tier
        },
        { onConflict: 'date,hour' }
      );

    if (error) {
      console.warn(`⚠️  Failed to record API usage: ${error.message}`);
    }
  } catch (e) {
    // Silent fail
  }
}

// ============================================================================
// Health Check
// ============================================================================

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'down';
  issues: string[];
  metrics: {
    apiUsage: {
      newsdata: { used: number; limit: number; remaining: number };
      rss: { success: number; failed: number };
    };
    lastFetch?: string;
    databaseStatus: 'connected' | 'disconnected';
  };
}

/**
 * Perform health check
 */
export async function healthCheck(): Promise<HealthCheckResult> {
  const issues: string[] = [];
  let databaseStatus: 'connected' | 'disconnected' = 'disconnected';
  let lastFetch: string | undefined;

  // Check database connection
  try {
    if (supabase) {
      const { error } = await supabase
        .from('news_items')
        .select('id')
        .limit(1);

      if (error) {
        issues.push(`Database: ${error.message}`);
      } else {
        databaseStatus = 'connected';
      }
    } else {
      issues.push('Database: Not configured');
    }
  } catch (e) {
    issues.push(`Database: ${e}`);
  }

  // Check API usage
  const apiUsage = {
    newsdata: { used: 0, limit: 200, remaining: 200 },
    rss: { success: 0, failed: 0 },
  };

  try {
    if (supabase) {
      // Get today's API usage
      const today = new Date().toISOString().split('T')[0];
      const { data: usageData } = await (supabase
        .from('newsdata_usage') as any)
        .select('request_count, articles_fetched')
        .eq('date', today);

      if (usageData) {
        apiUsage.newsdata.used = usageData.reduce((sum: number, u: any) => sum + u.request_count, 0);
        apiUsage.newsdata.remaining = Math.max(0, apiUsage.newsdata.limit - apiUsage.newsdata.used);
      }

      // Get last fetch time
      const { data: lastFetchData } = await (supabase
        .from('rss_sources') as any)
        .select('last_fetched_at')
        .not('last_fetched_at', 'is', null)
        .order('last_fetched_at', { ascending: false })
        .limit(1);

      if (lastFetchData && lastFetchData.length > 0) {
        lastFetch = lastFetchData[0].last_fetched_at;
      }

      // Get RSS success/failed counts
      const { data: sourceStats } = await (supabase
        .from('rss_sources') as any)
        .select('success_rate, fetch_count');

      if (sourceStats) {
        let totalSuccess = 0;
        let totalFailed = 0;
        sourceStats.forEach((s: any) => {
          if (s.fetch_count && s.fetch_count > 0) {
            const successRate = s.success_rate || 100;
            const total = s.fetch_count;
            totalSuccess += Math.round(total * (successRate / 100));
            totalFailed += Math.round(total * ((100 - successRate) / 100));
          }
        });
        apiUsage.rss.success = totalSuccess;
        apiUsage.rss.failed = totalFailed;
      }
    }
  } catch (e) {
    issues.push(`Stats: ${e}`);
  }

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'down';
  if (issues.length === 0) {
    status = 'healthy';
  } else if (issues.length <= 2 && databaseStatus === 'connected') {
    status = 'degraded';
  } else {
    status = 'down';
  }

  // Add warnings for low API remaining
  if (apiUsage.newsdata.remaining < 10) {
    issues.push(`NewsData.io API: Only ${apiUsage.newsdata.remaining} requests remaining`);
  }

  return {
    status,
    issues,
    metrics: {
      apiUsage,
      lastFetch,
      databaseStatus,
    },
  };
}

// ============================================================================
// Alerting
// ============================================================================

/**
 * Alert thresholds
 */
const ALERTS = {
  maxFailedSources: 5,
  minApiRemaining: 10,
  maxDatabaseErrors: 3,
};

/**
 * Check and send alerts
 */
export async function checkAlerts(metrics: FetchMetricsRecord): Promise<void> {
  // Check for high failure rate
  if (metrics.failed_sources.length >= ALERTS.maxFailedSources) {
    await sendAlert(
      `⚠️ High Failure Rate: ${metrics.failed_sources.length} sources failed`,
      'warning'
    );
  }

  // Check API usage
  if (metrics.api_usage.newsdata.remaining <= ALERTS.minApiRemaining) {
    await sendAlert(
      `⚠️ NewsData.io API Limit: ${metrics.api_usage.newsdata.remaining}/${metrics.api_usage.newsdata.limit} remaining`,
      'warning'
    );
  }

  // Check for complete failure
  if (metrics.status === 'failed') {
    await sendAlert(
      `🚨 Fetch Failed: ${metrics.error_message || 'Unknown error'}`,
      'error'
    );
  }
}

/**
 * Send alert (console for now, can be extended to Slack/email)
 */
async function sendAlert(message: string, level: 'info' | 'warning' | 'error'): Promise<void> {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️';
  
  console.log(`[${timestamp}] ${prefix} ALERT: ${message}`);

  // TODO: Extend with Slack, email, PagerDuty integrations
  // if (process.env.SLACK_WEBHOOK_URL) {
  //   await sendSlackAlert(message, level);
  // }
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get fetch statistics for a time period
 */
export async function getFetchStats(
  startDate: string,
  endDate: string
): Promise<{
  totalFetched: number;
  totalInserted: number;
  avgProcessingTime: number;
  successRate: number;
  topFailedSources: { id: string; name: string; failures: number }[];
}> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data: metrics } = await (supabase
    .from('fetch_metrics') as any)
    .select('*')
    .gte('timestamp', startDate)
    .lte('timestamp', endDate);

  const typedMetrics = (metrics ?? []) as FetchMetricsRecord[];

  if (!typedMetrics || typedMetrics.length === 0) {
    return {
      totalFetched: 0,
      totalInserted: 0,
      avgProcessingTime: 0,
      successRate: 0,
      topFailedSources: [],
    };
  }

  const totalFetched = typedMetrics.reduce((sum, m) => sum + m.total_fetched, 0);
  const totalInserted = typedMetrics.reduce((sum, m) => sum + m.total_inserted, 0);
  const totalProcessingTime = typedMetrics.reduce((sum, m) => sum + m.processing_time, 0);
  const avgProcessingTime = totalProcessingTime / typedMetrics.length;

  const successCount = typedMetrics.filter((m) => m.status === 'success').length;
  const successRate = (successCount / typedMetrics.length) * 100;

  // Count failed sources
  const failedCounts = new Map<string, number>();
  typedMetrics.forEach((m) => {
    (m.failed_sources || []).forEach((sourceId: string) => {
      failedCounts.set(sourceId, (failedCounts.get(sourceId) || 0) + 1);
    });
  });

  const topFailedSources = Array.from(failedCounts.entries())
    .map(([id, failures]) => ({ id, name: '', failures }))
    .sort((a, b) => b.failures - a.failures)
    .slice(0, 10);

  return {
    totalFetched,
    totalInserted,
    avgProcessingTime,
    successRate,
    topFailedSources,
  };
}

// ============================================================================
// Export
// ============================================================================
