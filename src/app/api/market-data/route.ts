/**
 * Alpha Vantage API Proxy
 * Hides API key by calling from server-side
 */

import { NextRequest, NextResponse } from 'next/server';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
const STOOQ_BASE_URL = 'https://stooq.com/q/l/';

function toStooqSymbol(symbol: string): string {
  if (symbol.startsWith('FX:')) {
    const [, fromCurrency, toCurrency] = symbol.split(':');
    return `${fromCurrency}${toCurrency}`.toLowerCase();
  }
  return `${symbol.toLowerCase()}.us`;
}

async function fetchStooqQuote(symbol: string): Promise<{
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
} | null> {
  const stooqSymbol = toStooqSymbol(symbol);
  const response = await fetch(`${STOOQ_BASE_URL}?s=${stooqSymbol}&i=d`, {
    headers: { Accept: 'text/plain' },
  });

  if (!response.ok) return null;
  const text = (await response.text()).trim();
  const parts = text.split(',');
  if (parts.length < 8 || parts[1] === 'N/D') return null;

  const open = parseFloat(parts[3] || '0');
  const high = parseFloat(parts[4] || '0');
  const low = parseFloat(parts[5] || '0');
  const close = parseFloat(parts[6] || '0');
  const volume = parseInt(parts[7] || '0');
  const previousClose = open || close;
  const change = close - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;

  return {
    symbol,
    price: close,
    change,
    changePercent,
    previousClose,
    open,
    high,
    low,
    volume,
    latestTradingDay: parts[1] || '',
    timestamp: Date.now(),
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    const isFxPair = symbol.startsWith('FX:');
    const queryUrl = isFxPair
      ? (() => {
          const [, fromCurrency, toCurrency] = symbol.split(':');
          return `${ALPHA_VANTAGE_BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${fromCurrency}&to_currency=${toCurrency}&apikey=${apiKey}`;
        })()
      : `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;

    const response = await fetch(queryUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check for rate limiting or errors
    if (data.Information || data.Note || data['Error Message']) {
      const fallback = await fetchStooqQuote(symbol);
      if (fallback) {
        return NextResponse.json(fallback, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
          },
        });
      }
      return NextResponse.json({ error: 'Rate limit or API error' }, { status: 429 });
    }

    let result: {
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
    };
    if (isFxPair) {
      const fxData = data['Realtime Currency Exchange Rate'];
      if (!fxData || Object.keys(fxData).length === 0) {
        const fallback = await fetchStooqQuote(symbol);
        if (!fallback) {
          return NextResponse.json({ error: 'No data available' }, { status: 404 });
        }
        return NextResponse.json(fallback, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
          },
        });
      }

      result = {
        symbol,
        price: parseFloat(fxData['5. Exchange Rate'] || '0'),
        change: 0,
        changePercent: 0,
        previousClose: 0,
        open: 0,
        high: 0,
        low: 0,
        volume: 0,
        latestTradingDay: fxData['6. Last Refreshed'] || '',
        timestamp: Date.now(),
      };
    } else {
      // Parse GLOBAL_QUOTE response
      const quoteData = data['Global Quote'];
      if (!quoteData || Object.keys(quoteData).length === 0) {
        const fallback = await fetchStooqQuote(symbol);
        if (!fallback) {
          return NextResponse.json({ error: 'No data available' }, { status: 404 });
        }
        return NextResponse.json(fallback, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
          },
        });
      }

      result = {
        symbol,
        price: parseFloat(quoteData['05. price'] || '0'),
        change: parseFloat(quoteData['09. change'] || '0'),
        changePercent: parseFloat(quoteData['10. change percent']?.replace('%', '') || '0'),
        previousClose: parseFloat(quoteData['08. previous close'] || '0'),
        open: parseFloat(quoteData['02. open'] || '0'),
        high: parseFloat(quoteData['03. high'] || '0'),
        low: parseFloat(quoteData['04. low'] || '0'),
        volume: parseInt(quoteData['06. volume'] || '0'),
        latestTradingDay: quoteData['07. latest trading day'] || '',
        timestamp: Date.now(),
      };
    }

    return NextResponse.json(result, {
      headers: {
        // Cache for 60 seconds on CDN, revalidate after 30 seconds
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('[API/MarketData] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
