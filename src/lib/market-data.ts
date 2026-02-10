/**
 * Market Data Service - Alpha Vantage API Integration
 * Bloomberg Terminal War Room Edition
 * 
 * Provides real-time market data for:
 * - US equity benchmarks
 * - US treasury proxies
 * - Commodities (gold/oil/silver)
 * - Forex (USD/CNY, EUR/USD)
 * 
 * API: https://www.alphavantage.co/support#api-key
 * Free Tier: 500 requests/day, 15-20min delayed quotes
 * 
 * NOTE: Uses server-side proxy to hide API key
 * 
 * @module src/lib/market-data
 */

import { DesignTokens } from '@/styles/designTokens';

// Use local API proxy to hide the API key
const API_PROXY_URL = '/api/market-data';

// Supported market symbols with display information
export const MARKET_SYMBOLS = {
  // US Treasuries (ETF proxies)
  'TLT': {
    name: 'US 20Y+ Treasury',
    category: 'bonds',
    unit: 'USD',
    displayOrder: 1,
  },
  'IEF': {
    name: 'US 7-10Y Treasury',
    category: 'bonds',
    unit: 'USD',
    displayOrder: 2,
  },
  'SHY': {
    name: 'US 1-3Y Treasury',
    category: 'bonds',
    unit: 'USD',
    displayOrder: 3,
  },

  // US Equity Benchmarks (ETF proxies)
  'SPY': {
    name: 'S&P 500',
    category: 'indices',
    displayOrder: 4,
    unit: 'USD',
  },
  'QQQ': {
    name: 'NASDAQ 100',
    category: 'indices',
    displayOrder: 5,
    unit: 'USD',
  },
  'DIA': {
    name: 'Dow Jones',
    category: 'indices',
    displayOrder: 6,
    unit: 'USD',
  },

  // Commodities
  'GLD': { 
    name: 'Gold', 
    category: 'commodities',
    unit: 'USD/oz',
    displayOrder: 7,
  },
  'USO': {
    name: 'Oil', 
    category: 'commodities',
    unit: 'USD/bbl',
    displayOrder: 8,
  },
  'SLV': {
    name: 'Silver',
    category: 'commodities',
    unit: 'USD/oz',
    displayOrder: 9,
  },
  
  // Forex
  'USDCNY': { 
    name: 'USD/CNY', 
    category: 'forex',
    displayOrder: 10,
    unit: undefined as string | undefined,
    apiSymbol: 'FX:USD:CNY',
  },
  'EURUSD': { 
    name: 'EUR/USD', 
    category: 'forex',
    displayOrder: 11,
    unit: undefined as string | undefined,
    apiSymbol: 'FX:EUR:USD',
  },
} as const;

export type MarketSymbol = keyof typeof MARKET_SYMBOLS;

// ============================================================================
// Type Definitions
// ============================================================================

export interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  latestTradingDay: string;
  timestamp: number;
}

export interface MarketData {
  symbol: MarketSymbol;
  quote: MarketQuote | null;
  error?: string;
  lastUpdated: number;
}

export interface MarketDataState {
  data: Map<MarketSymbol, MarketData>;
  lastFetchTime: number;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// API Client (Server-side Proxy)
// ============================================================================

/**
 * Fetch quote for a single symbol via proxy
 * This hides the API key from the client
 */
async function fetchQuote(symbol: string): Promise<MarketQuote | null> {
  try {
    const response = await fetch(
      `${API_PROXY_URL}?symbol=${symbol}`
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[MarketData] API rate limit reached');
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      console.warn('[MarketData] API error:', data.error);
      return null;
    }

    return {
      symbol: data.symbol,
      price: data.price,
      change: data.change,
      changePercent: data.changePercent,
      previousClose: data.previousClose,
      open: data.open,
      high: data.high,
      low: data.low,
      volume: data.volume,
      latestTradingDay: data.latestTradingDay,
      timestamp: data.timestamp,
    };
  } catch (error) {
    console.error(`[MarketData] Failed to fetch quote for ${symbol}:`, error);
    return null;
  }
}

// ============================================================================
// Data Fetching with Caching and Rate Limiting
// ============================================================================

// Cache with 60-second TTL
interface CacheEntry {
  data: MarketQuote | null;
  timestamp: number;
}

const quoteCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 60 seconds

// Request deduplication
const pendingRequests = new Map<string, Promise<MarketQuote | null>>();

/**
 * Get cached quote or fetch new data
 */
export async function getQuote(symbol: MarketSymbol): Promise<MarketQuote | null> {
  const now = Date.now();
  const symbolConfig = MARKET_SYMBOLS[symbol];
  const requestSymbol = 'apiSymbol' in symbolConfig ? symbolConfig.apiSymbol : symbol;
  
  // Check cache first
  const cached = quoteCache.get(symbol);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Check for pending request (deduplication)
  const pending = pendingRequests.get(symbol);
  if (pending) {
    return pending;
  }

  // Fetch new data
  const request = fetchQuote(requestSymbol).then((result) => {
    if (result) {
      quoteCache.set(symbol, { data: result, timestamp: now });
    } else if (cached?.data) {
      quoteCache.set(symbol, { data: cached.data, timestamp: now });
    }
    pendingRequests.delete(symbol);
    return result ?? cached?.data ?? null;
  });

  pendingRequests.set(symbol, request);
  return request;
}

/**
 * Fetch multiple quotes in parallel with concurrency limit
 */
export async function getQuotes(
  symbols: MarketSymbol[],
  concurrency: number = 2
): Promise<Map<MarketSymbol, MarketQuote | null>> {
  const results = new Map<MarketSymbol, MarketQuote | null>();
  
  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < symbols.length; i += concurrency) {
    const batch = symbols.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (symbol) => {
        const quote = await getQuote(symbol);
        return { symbol, quote };
      })
    );
    
    batchResults.forEach(({ symbol, quote }) => {
      results.set(symbol, quote);
    });

    await new Promise((resolve) => setTimeout(resolve, 900));
  }

  return results;
}

/**
 * Get all market data with metadata
 */
export async function getAllMarketData(): Promise<MarketData[]> {
  const symbols = Object.keys(MARKET_SYMBOLS) as MarketSymbol[];
  const quotes = await getQuotes(symbols);
  const now = Date.now();

  return symbols.map((symbol) => ({
    symbol,
    quote: quotes.get(symbol) || null,
    lastUpdated: now,
  }));
}

/**
 * Clear the cache (useful for manual refresh)
 */
export function clearCache(): void {
  quoteCache.clear();
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Format price with appropriate decimals
 */
export function formatPrice(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format change with sign
 */
export function formatChange(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

/**
 * Format change percentage
 */
export function formatChangePercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Get change color based on value (green for up, red for down)
 * Note: For stocks: up = green, down = red
 * For forex: up = red (stronger USD), down = green (weaker USD)
 */
export function getChangeColor(
  value: number, 
  tokens: DesignTokens
): string {
  return value >= 0 ? tokens.accent.up : tokens.accent.down;
}

// ============================================================================
// Hook Integration Helpers
// ============================================================================

/**
 * Hook-friendly fetch function with loading state
 */
export async function fetchMarketDataWithState(
  onProgress?: (symbol: MarketSymbol, progress: number, total: number) => void
): Promise<MarketDataState> {
  const symbols = Object.keys(MARKET_SYMBOLS) as MarketSymbol[];
  const data = new Map<MarketSymbol, MarketData>();
  let error: string | null = null;
  const now = Date.now();

  try {
    const quotes = await getQuotes(symbols, 5);

    symbols.forEach((symbol, index) => {
      if (onProgress) {
        onProgress(symbol, index + 1, symbols.length);
      }

      data.set(symbol, {
        symbol,
        quote: quotes.get(symbol) || null,
        lastUpdated: now,
      });
    });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Unknown error';
    console.error('[MarketData] Fetch failed:', error);
  }

  return {
    data,
    lastFetchTime: now,
    isLoading: false,
    error,
  };
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  getQuote,
  getQuotes,
  getAllMarketData,
  clearCache,
  formatPrice,
  formatChange,
  formatChangePercent,
  getChangeColor,
  fetchMarketDataWithState,
  MARKET_SYMBOLS,
};
