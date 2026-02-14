/**
 * Military Filter Module
 * 
 * Functions to identify US military aircraft and vessels from OpenSky/AIS data
 * 
 * @module src/lib/military/military-filter
 */

import type { MilitaryAircraft, MilitaryVessel } from './types';

// ============================================================================
// ICAO Hex Prefixes for US Military Aircraft
// ============================================================================

/**
 * US Department of Defense ICAO hex prefixes
 * Format: AE followed by 3 hex digits (total 6 chars)
 */
const US_DOD_ICAO_PREFIXES = ['AE', 'AD', 'AF'];

/**
 * US Coast Guard ICAO hex prefix
 * Format: A0 followed by 4 hex digits
 */
const US_CG_ICAO_PREFIX = 'A0';

/**
 * US Army ICAO hex prefix
 */
const US_ARMY_ICAO_PREFIX = 'AD';

/**
 * US Air Force ICAO hex prefix
 */
const US_AIRFORCE_ICAO_PREFIX = 'AF';

/**
 * US Navy ICAO hex prefix
 */
const US_NAVY_ICAO_PREFIX = 'AE';

// ============================================================================
// US Military Callsign Patterns
// ============================================================================

/**
 * US Air Force callsign prefixes (transport aircraft)
 */
const US_AF_CALLSIGNS = ['RCH', 'REACH'];

/**
 * US Navy callsign prefixes
 */
const US_NAVY_CALLSIGNS = ['CNV', 'VFA', 'VA', 'VAW', 'VR', 'VS', 'VX', 'VRC'];

/**
 * US Army callsign prefixes
 */
const US_ARMY_CALLSIGNS = ['DOV', 'AR', 'AU', 'FRIES'];

/**
 * US Coast Guard callsign prefixes
 */
const US_CG_CALLSIGNS = ['GOD', 'GODHD', 'CG', 'COASTGUARD'];

/**
 * US military aircraft type codes in callsigns
 * These are aircraft type indicators that may appear in callsigns
 */
const US_AIRCRAFT_CODES = ['C130', 'C17', 'C5', 'KC135', 'KC10', 'B52', 'B2', 'B1', 'F16', 'F22', 'F35', 'F18', 'F15', 'E3', 'E8', 'AWACS', 'U2', 'V22', 'H60', 'H47'];

// ============================================================================
// MMSI Prefixes for US Military Vessels
// ============================================================================

/**
 * US Navy MMSI prefix (MID = Maritime Identification Digits)
 * 369 = USA (Navy)
 * 367 = USA (Navy auxiliary)
 */
const US_NAVY_MMSI_PREFIXES = ['369', '367'];

 /**
  * US Coast Guard MMSI prefix
  */
const US_CG_MMSI_PREFIXES = ['367', '316'];

// ============================================================================
// Flag Country Name Mappings
// ============================================================================

/**
 * Variations of US country names
 */
const US_FLAG_NAMES = [
  'united states',
  'united states of america',
  'usa',
  'us',
  'america',
  'u.s.a.',
  'u.s.',
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize string for comparison (lowercase, trim)
 */
function normalize(str: string | null): string {
  if (!str) return '';
  return str.toLowerCase().trim();
}

/**
 * Check if string starts with any of the given prefixes
 */
function startsWithAny(str: string, prefixes: string[]): boolean {
  const normalized = str.toUpperCase();
  return prefixes.some(prefix => normalized.startsWith(prefix));
}

// ============================================================================
// Main Filter Functions
// ============================================================================

/**
 * Check if ICAO 24-bit hex address belongs to US military
 * 
 * Reference: ICAO hex codes for US military:
 * - AE: US Department of Defense (most common)
 * - AD: US Army
 * - AF: US Air Force  
 * - A0: US Coast Guard
 * 
 * @param icao24 - ICAO hex address (can be 6+ characters)
 * @returns true if identified as US military
 */
export function isUSMilitaryAircraft(icao24: string | null): boolean {
  if (!icao24 || icao24.length < 6) {
    return false;
  }

  const hex = icao24.toUpperCase();
  
  // Check for valid hex characters (at least 6)
  const cleanHex = hex.substring(0, 6);
  if (!/^[0-9A-F]{6}$/.test(cleanHex)) {
    return false;
  }

  // US DoD (Air Force, Navy, Marine Corps) - most common
  if (cleanHex.startsWith('AE')) {
    return true;
  }

  // US Army
  if (cleanHex.startsWith('AD')) {
    return true;
  }

  // US Air Force
  if (cleanHex.startsWith('AF')) {
    return true;
  }

  // US Coast Guard
  if (cleanHex.startsWith('A0')) {
    return true;
  }

  return false;
}

/**
 * Check if callsign matches US military patterns
 * 
 * US military callsigns follow specific patterns:
 * - RCH/REACH: Air Mobility Command transport
 * - CNV: Navy transport
 * - DOV: Army transport
 * - GODHD: Coast Guard
 * - Military aircraft type codes (C130, F16, etc.)
 * 
 * @param callsign - Flight callsign
 * @returns true if identified as US military
 */
export function isUSMilitaryCallsign(callsign: string | null): boolean {
  if (!callsign) {
    return false;
  }

  const normalized = normalize(callsign);
  
  if (normalized.length === 0) {
    return false;
  }

  // Check against known US military callsign prefixes
  const allUSCallsigns = [
    ...US_AF_CALLSIGNS,
    ...US_NAVY_CALLSIGNS,
    ...US_ARMY_CALLSIGNS,
    ...US_CG_CALLSIGNS,
  ];

  if (startsWithAny(normalized, allUSCallsigns)) {
    return true;
  }

  // Check for US military aircraft type codes
  return US_AIRCRAFT_CODES.some(code => 
    normalized.startsWith(code.toLowerCase()) || 
    normalized.includes(code.toLowerCase())
  );
}

/**
 * Check if MMSI belongs to US Navy or Coast Guard
 * 
 * MMSI (Maritime Mobile Service Identity) format:
 * - MID (Maritime Identification Digits) first 3 digits
 * - 369 = USA Navy
 * - 367 = USA Navy auxiliary
 * - 367/316 = US Coast Guard
 * 
 * @param mmsi - 9-digit MMSI number
 * @returns true if identified as US military
 */
export function isUSMilitaryVessel(mmsi: string | null): boolean {
  if (!mmsi) {
    return false;
  }

  // Remove any whitespace
  const clean = mmsi.replace(/\s/g, '');
  
  // Check for valid MMSI (9 digits, starts with non-zero)
  if (!/^[1-9]\d{8}$/.test(clean)) {
    return false;
  }

  // US Navy and Coast Guard MID codes
  const firstThree = clean.substring(0, 3);
  
  if (US_NAVY_MMSI_PREFIXES.includes(firstThree)) {
    return true;
  }

  // Additional USCG specific patterns
  if (firstThree === '316') {
    return true;
  }

  return false;
}

/**
 * Check if country name is United States
 * 
 * @param country - Country name from OpenSky/AIS
 * @returns true if country is USA
 */
export function isUSFlag(country: string | null): boolean {
  if (!country) {
    return false;
  }

  const normalized = normalize(country);
  
  return US_FLAG_NAMES.some(usName => 
    normalized === usName
  );
}

/**
 * Check if aircraft is US military (combined check)
 * 
 * @param aircraft - Military aircraft object
 * @returns true if identified as US military
 */
export function isUSMilitaryAircraftObject(aircraft: Pick<MilitaryAircraft, 'id' | 'callsign' | 'originCountry'>): boolean {
  return (
    isUSMilitaryAircraft(aircraft.id) ||
    isUSMilitaryCallsign(aircraft.callsign) ||
    isUSFlag(aircraft.originCountry)
  );
}

/**
 * Check if vessel is US military (combined check)
 * 
 * @param vessel - Military vessel object
 * @returns true if identified as US military
 */
export function isUSMilitaryVesselObject(vessel: Pick<MilitaryVessel, 'id' | 'name' | 'flag'>): boolean {
  const vesselName = vessel.name?.toUpperCase() || '';
  return (
    isUSMilitaryVessel(vessel.id) ||
    isUSFlag(vessel.flag) ||
    vesselName.startsWith('USS') ||
    vesselName.startsWith('USNS')
  );
}

// ============================================================================
// Re-export types
// ============================================================================

export type { MilitaryAircraft, MilitaryVessel } from './types';
