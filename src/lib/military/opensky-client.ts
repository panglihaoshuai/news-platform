/**
 * OpenSky Network API Client
 * 
 * Fetches and filters US military aircraft data from OpenSky Network
 * 
 * OpenSky API: https://opensky-network.org/api/states/all
 * Rate limit: 4000 requests/hour (free tier)
 * 
 * @module src/lib/military/opensky-client
 */

import type { MilitaryAircraft } from './types';
import { 
  isUSMilitaryAircraft, 
  isUSMilitaryCallsign, 
  isUSFlag,
  isUSMilitaryAircraftObject 
} from './military-filter';
import { classifyAircraftType } from './aircraft-classifier';

// ============================================================================
// Configuration
// ============================================================================

const OPENSKY_API_URL = 'https://opensky-network.org/api/states/all';

/**
 * OpenSky API response structure
 */
interface OpenSkyResponse {
  time: number;
  states: OpenSkyState[] | null;
}

/**
 * Raw OpenSky state vector (18 fields)
 * Index-based fields from OpenSky API
 */
type OpenSkyState = [
  string,                    // 0: icao24
  string | null,             // 1: callsign
  string,                    // 2: originCountry
  number | null,             // 3: timePosition
  number,                    // 4: lastContact
  number | null,             // 5: longitude
  number | null,             // 6: latitude
  number | null,             // 7: baroAltitude
  boolean,                    // 8: onGround
  number | null,             // 9: velocity
  number | null,             // 10: trueTrack
  number | null,              // 11: verticalRate
  number[] | null,           // 12: sensors
  number | null,             // 13: geoAltitude
  string | null,             // 14: positionAccuracy
  string | null,             // 15: equiType
  string | null,              // 16: category
  number | null               // 17: navAltitude
];

/**
 * OpenSky client configuration
 */
export interface OpenSkyClientConfig {
  /** API base URL */
  apiUrl?: string;
  /** Request timeout in ms */
  timeout?: number;
  /** Filter for US military only (default: true) */
  filterUSMilitary?: boolean;
}

/**
 * OpenSky client error
 */
export class OpenSkyError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'OpenSkyError';
  }
}

// ============================================================================
// Client Implementation
// ============================================================================

/**
 * OpenSky Network API Client
 * 
 * Fetches aircraft state vectors and filters for US military aircraft
 */
export class OpenSkyClient {
  private apiUrl: string;
  private timeout: number;
  private filterUSMilitary: boolean;

  constructor(config: OpenSkyClientConfig = {}) {
    this.apiUrl = config.apiUrl || OPENSKY_API_URL;
    this.timeout = config.timeout || 30000;
    this.filterUSMilitary = config.filterUSMilitary ?? true;
  }

  /**
   * Fetch all aircraft states from OpenSky
   * 
   * @returns Raw OpenSky response with all aircraft
   */
  async fetchAllAircraft(): Promise<OpenSkyResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.apiUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new OpenSkyError(
          `OpenSky API error: ${response.statusText}`,
          'API_ERROR',
          response.status
        );
      }

      const data = await response.json();
      return data as OpenSkyResponse;
    } catch (error) {
      if (error instanceof OpenSkyError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OpenSkyError('Request timeout', 'TIMEOUT');
      }
      throw new OpenSkyError(
        `Failed to fetch aircraft: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FETCH_ERROR'
      );
    }
  }

  /**
   * Transform raw OpenSky state to MilitaryAircraft
   * 
   * @param state - Raw OpenSky state vector
   * @returns MilitaryAircraft object
   */
  private transformState(state: OpenSkyState): MilitaryAircraft {
    const [icao24, callsign, originCountry, , lastContact, longitude, latitude, baroAltitude, , velocity, trueTrack, verticalRate, , geoAltitude, positionAccuracy] = state;

    const baseAircraft: MilitaryAircraft = {
      id: icao24 || '',
      callsign: callsign?.trim() || null,
      originCountry: originCountry || 'Unknown',
      longitude: longitude ?? 0,
      latitude: latitude ?? 0,
      altitude: baroAltitude ?? geoAltitude ?? 0,
      velocity: velocity ?? 0,
      heading: trueTrack ?? 0,
      timestamp: lastContact ?? Math.floor(Date.now() / 1000),
      isMilitary: false, // Will be set by filter
      verticalRate: verticalRate ?? undefined,
      positionAccuracy: positionAccuracy as 'estimated' | 'assumed' | 'known' | undefined,
    };

    const classification = classifyAircraftType(baseAircraft);
    return {
      ...baseAircraft,
      aircraftType: classification.type,
    };
  }

  /**
   * Check if aircraft is US military
   * 
   * @param aircraft - Aircraft to check
   * @returns true if US military
   */
  private isUSMilitary(aircraft: MilitaryAircraft): boolean {
    return isUSMilitaryAircraftObject({
      id: aircraft.id,
      callsign: aircraft.callsign,
      originCountry: aircraft.originCountry,
    });
  }

  /**
   * Fetch and filter US military aircraft
   * 
   * @returns Array of US military aircraft
   */
  async fetchUSMilitaryAircraft(): Promise<MilitaryAircraft[]> {
    const response = await this.fetchAllAircraft();

    if (!response.states || response.states.length === 0) {
      return [];
    }

    // Transform all states to MilitaryAircraft
    let aircraft = response.states.map(state => this.transformState(state));

    // Filter for US military if configured
    if (this.filterUSMilitary) {
      aircraft = aircraft.filter(aircraft => this.isUSMilitary(aircraft));
      
      // Mark as military
      aircraft = aircraft.map(aircraft => ({
        ...aircraft,
        isMilitary: true,
      }));
    }

    return aircraft;
  }

  /**
   * Fetch all aircraft (no filtering)
   * 
   * @returns Array of all aircraft
   */
  async fetchAll(): Promise<MilitaryAircraft[]> {
    const response = await this.fetchAllAircraft();

    if (!response.states || response.states.length === 0) {
      return [];
    }

    return response.states.map(state => this.transformState(state));
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultClient: OpenSkyClient | null = null;

/**
 * Get default OpenSky client instance
 * 
 * @param config - Optional configuration override
 * @returns OpenSkyClient instance
 */
export function getOpenSkyClient(config?: OpenSkyClientConfig): OpenSkyClient {
  if (!defaultClient) {
    defaultClient = new OpenSkyClient(config);
  }
  return defaultClient;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Fetch US military aircraft using default client
 * 
 * @returns Array of US military aircraft
 */
export async function fetchUSMilitaryAircraft(): Promise<MilitaryAircraft[]> {
  const client = getOpenSkyClient();
  return client.fetchUSMilitaryAircraft();
}

/**
 * Fetch all aircraft using default client
 * 
 * @returns Array of all aircraft
 */
export async function fetchAllAircraft(): Promise<MilitaryAircraft[]> {
  const client = getOpenSkyClient();
  return client.fetchAll();
}

// ============================================================================
// Export Types
// ============================================================================

export type { OpenSkyResponse, OpenSkyState };
