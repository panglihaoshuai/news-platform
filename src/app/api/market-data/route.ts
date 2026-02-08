/**
 * Alpha Vantage API Proxy
 * Hides API key by calling from server-side
 */

import { NextRequest, NextResponse } from 'next/server';

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

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
    const response = await fetch(
      `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check for rate limiting or errors
    if (data.Information?.includes('API rate limit') ||
        data.Note?.includes('API rate limit') ||
        data['Error Message']) {
      return NextResponse.json({ error: 'Rate limit or API error' }, { status: 429 });
    }

    // Parse GLOBAL_QUOTE response
    const quoteData = data['Global Quote'];
    if (!quoteData || Object.keys(quoteData).length === 0) {
      return NextResponse.json({ error: 'No data available' }, { status: 404 });
    }

    const result = {
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
