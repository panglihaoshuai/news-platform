/**
 * Military Aircraft API Route
 * 
 * Proxy endpoint for fetching US military aircraft from OpenSky Network
 * 
 * GET /api/military/aircraft
 * 
 * Query params:
 *   - filter: 'military' (default) or 'all'
 * 
 * @module src/app/api/military/aircraft/route
 */

import { NextResponse } from 'next/server';
import { OpenSkyClient } from '@/lib/military/opensky-client';

/**
 * GET handler for military aircraft data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('filter');
    
    // Create client (default: filter for US military)
    const client = new OpenSkyClient({
      filterUSMilitary: filterType !== 'all',
    });

    // Fetch aircraft data
    const aircraft = await client.fetchUSMilitaryAircraft();

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      count: aircraft.length,
      data: aircraft,
    });
  } catch (error) {
    console.error('[Military Aircraft API] Error:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      success: false,
      error: message,
      data: [],
    }, { status: 500 });
  }
}
