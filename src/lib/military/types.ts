/**
 * Military Tracking Data Types
 * 
 * Type definitions for US military aircraft, vessels, and overseas bases
 * 
 * @module src/lib/military/types
 */

/**
 * Military aircraft data from OpenSky API
 */
export interface MilitaryAircraft {
  /** ICAO 24-bit hex address */
  id: string;
  /** Callsign (flight number) */
  callsign: string | null;
  /** Country of registration */
  originCountry: string;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Latitude in decimal degrees */
  latitude: number;
  /** Altitude in feet */
  altitude: number;
  /** Ground velocity in m/s */
  velocity: number;
  /** Track angle in degrees (0-360) */
  heading: number;
  /** Unix timestamp */
  timestamp: number;
  /** Whether identified as US military */
  isMilitary: boolean;
  /** Vertical rate (climb/descent) in m/s */
  verticalRate?: number;
  /** Position accuracy */
  positionAccuracy?: 'estimated' | 'assumed' | 'known';
  /** Classified military aircraft type */
  aircraftType?: 'bomber' | 'transport' | 'fighter' | 'helicopter' | 'unknown';
}

/**
 * Raw OpenSky state vector (before filtering)
 */
export interface OpenSkyState {
  icao24: string;
  callsign: string | null;
  originCountry: string;
  timePosition: number | null;
  lastContact: number;
  longitude: number | null;
  latitude: number | null;
  baroAltitude: number | null;
  onGround: boolean;
  velocity: number | null;
  trueTrack: number | null;
  verticalRate: number | null;
  sensors: number[] | null;
  geoAltitude: number | null;
  positionAccuracy: string | null;
  equiType: string | null;
  category: number | null;
}

/**
 * Military vessel data from AIS
 */
export interface MilitaryVessel {
  /** MMSI number */
  id: string;
  /** Vessel name */
  name: string | null;
  /** Flag state */
  flag: string;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Latitude in decimal degrees */
  latitude: number;
  /** Speed over ground in knots */
  speed: number;
  /** Course over ground in degrees (0-360) */
  heading: number;
  /** Ship type category */
  shipType: string;
  /** Unix timestamp */
  timestamp: number;
  /** Whether identified as US military */
  isMilitary: boolean;
  /** IMO number (if available) */
  imo?: string;
  /** Destination (if available) */
  destination?: string;
  /** Navigation status */
  navigationStatus?: string;
}

/**
 * US overseas military base
 */
export interface USBase {
  /** Unique identifier */
  id: string;
  /** Base name in English */
  name: string;
  /** Base name in Chinese */
  nameCn: string;
  /** Geographic coordinates */
  location: {
    lat: number;
    lng: number;
  };
  /** Geographic region */
  region: USBaseRegion;
  /** Country location */
  country: string;
  /** Base type */
  type: USBaseType[];
  /** Branch (Air Force, Navy, etc.) */
  branch: USBranch[];
  /** Current status */
  status: 'active' | 'planned' | 'closed';
}

/**
 * US base geographic regions
 */
export type USBaseRegion = 
  | 'pacific' 
  | 'middleeast' 
  | 'europe' 
  | 'americas' 
  | 'india'
  | 'africa';

/**
 * US base types
 */
export type USBaseType = 
  | 'air' 
  | 'naval' 
  | 'combined' 
  | 'ground' 
  | 'logistics';

/**
 * US military branches
 */
export type USBranch = 
  | 'airforce' 
  | 'navy' 
  | 'army' 
  | 'marines' 
  | 'coastguard' 
  | 'nationalguard';

/**
 * Military tracking layer types
 */
export type MilitaryLayerType = 'air' | 'naval' | 'bases';

/**
 * Military tracking configuration
 * Note: naval layer disabled - no free real-time AIS data available
 */
export interface MilitaryTrackingConfig {
  /** Enable air tracking layer (real-time via OpenSky - free) */
  showAirLayer: boolean;
  /** Enable naval tracking layer - DISABLED (requires paid API) */
  showNavalLayer: boolean;
  /** Enable bases layer (local data) */
  showBasesLayer: boolean;
  /** Auto-refresh interval in seconds */
  refreshInterval: number;
  /** Enable trajectory tracking - DISABLED (requires vessel data) */
  enableTrajectories: boolean;
}

/**
 * Vessel trajectory point
 */
export interface TrajectoryPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

/**
 * Vessel track history
 */
export interface VesselTrack {
  mmsi: string;
  positions: TrajectoryPoint[];
  lastUpdated: number;
}

/**
 * Default military tracking configuration
 */
export const DEFAULT_MILITARY_CONFIG: MilitaryTrackingConfig = {
  showAirLayer: false,
  showNavalLayer: false,
  showBasesLayer: false,
  refreshInterval: 60,
  enableTrajectories: true,
};
