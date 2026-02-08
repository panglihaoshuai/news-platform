/**
 * Market Data Service - Alpha Vantage API Integration
 * Bloomberg Terminal War Room Edition
 * 
 * Provides real-time market data for:
 * - Indices (S&P 500, NASDAQ, Dow Jones)
 * - Commodities (Gold, Oil)
 * - Cryptocurrencies (Bitcoin, Ethereum)
 * - Forex (USD/CNY, EUR/USD)
 * 
 * API: https://www.alphavantage.co/support#api-key
 * Free Tier: 500 requests/day, 15-20min delayed quotes
 * 
 * @module src/lib/market-data
 */

import { DesignTokens } from '@/styles/designTokens';

// ============================================================================
// Configuration
// ============================================================================

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Supported market symbols with display information
export const MARKET_SYMBOLS = {
  // Indices (Stock Market)
  'SPX': { 
    name: 'S&P 500', 
    category: 'indices',
    displayOrder: 1,
    unit: undefined as string | undefined,
  },
  'IXIC': { 
    name: 'NASDAQ', 
    category: 'indices',
    displayOrder: 2,
    unit: undefined as string | undefined,
  },
  'DJI': { 
    name: 'Dow Jones', 
    category: 'indices',
    displayOrder: 3,
    unit: undefined as string | undefined,
  },
  
  // Commodities
  'GC': { 
    name: 'Gold', 
    category: 'commodities',
    unit: 'USD/oz',
    displayOrder: 4,
  },
  'CL': { 
    name: 'Oil', 
    category: 'commodities',
    unit: 'USD/bbl',
    displayOrder: 5,
  },
  
  // Cryptocurrencies
  'BTC': { 
    name: 'Bitcoin', 
    category: 'crypto',
    unit: 'USD',
    displayOrder: 6,
  },
  'ETH': { 
    name: 'Ethereum', 
    category: 'crypto',
    unit: 'USD',
    displayOrder: 7,
  },
  
  // Forex
  'USDCNY': { 
    name: 'USD/CNY', 
    category: 'forex',
    displayOrder: 8,
    unit: undefined as string | undefined,
  },
  'EURUSD': { 
    name: 'EUR/USD', 
    category: 'forex',
    displayOrder: 9,
    unit: undefined as string | undefined,
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
// API Client
// ============================================================================

/**
 * Get API key from environment variable
 */
function getApiKey(): string {
  return process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '';
}

/**
 * Validate API response for rate limiting
 */
function isRateLimited(data: any): boolean {
  return data.Information?.includes('API rate limit') || 
         data.Note?.includes('API rate limit') ||
         data['Error Message']?.includes('API rate limit');
}

/**
 * Fetch quote for a single symbol
 */
async function fetchQuote(symbol: string): Promise<MarketQuote | null> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn('[MarketData] API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for rate limiting
    if (isRateLimited(data)) {
      console.warn('[MarketData] API rate limit reached');
      return null;
    }

    // Check for API error
    if (data['Error Message'] || data.Note) {
      console.warn('[MarketData] API error:', data);
      return null;
    }

    // Parse GLOBAL_QUOTE response
    const quoteData = data['Global Quote'];
    if (!quoteData || Object.keys(quoteData).length === 0) {
      return null;
    }

    const price = parseFloat(quoteData['05. price'] || '0');
    const change = parseFloat(quoteData['09. change'] || '0');
    const changePercent = parseFloat(quoteData['10. change percent']?.replace('%', '') || '0');
    const previousClose = parseFloat(quoteData['08. previous close'] || '0');
    const open = parseFloat(quoteData['02. open'] || '0');
    const high = parseFloat(quoteData['03. high'] || '0');
    const low = parseFloat(quoteData['04. low'] || '0');
    const volume = parseInt(quoteData['06. volume'] || '0');
    const latestTradingDay = quoteData['07. latest trading day'] || '';

    return {
      symbol,
      price,
      change,
      changePercent,
      previousClose,
      open,
      high,
      low,
      volume,
      latestTradingDay,
      timestamp: Date.now(),
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
  const request = fetchQuote(symbol).then((result) => {
    quoteCache.set(symbol, { data: result, timestamp: now });
    pendingRequests.delete(symbol);
    return result;
  });

  pendingRequests.set(symbol, request);
  return request;
}

/**
 * Fetch multiple quotes in parallel with concurrency limit
 */
export async function getQuotes(
  symbols: MarketSymbol[],
  concurrency: number = 5
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
