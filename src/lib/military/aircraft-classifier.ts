/**
 * Aircraft classification heuristics for US military tracking.
 *
 * Free-data only classification from callsign + flight profile.
 */

import type { MilitaryAircraft } from './types';

export type MilitaryAircraftType = 'bomber' | 'transport' | 'fighter' | 'helicopter' | 'unknown';

export interface AircraftClassifiedResult {
  type: MilitaryAircraftType;
  confidence: 'high' | 'medium' | 'low';
}

const BOMBER_PATTERNS = [/\bB52\w*/i, /\bB[- ]?1\w*/i, /\bB[- ]?2\w*/i, /\bBOMBER\b/i];
const TRANSPORT_PATTERNS = [/\bRCH\b/i, /\bREACH\b/i, /\bC130\b/i, /\bC17\b/i, /\bC5\b/i, /\bKC135\b/i, /\bKC10\b/i];
const FIGHTER_PATTERNS = [/\bVFA\d+/i, /\bF[- ]?15\b/i, /\bF[- ]?16\b/i, /\bF[- ]?18\b/i, /\bF[- ]?22\b/i, /\bF[- ]?35\b/i];
const HELICOPTER_PATTERNS = [/\bH[- ]?60\b/i, /\bH[- ]?47\b/i, /\bHELI\b/i];

export function classifyAircraftType(aircraft: Pick<MilitaryAircraft, 'callsign' | 'velocity' | 'altitude'>): AircraftClassifiedResult {
  const callsign = (aircraft.callsign || '').toUpperCase();
  const altitude = aircraft.altitude || 0;
  const velocity = aircraft.velocity || 0;

  if (HELICOPTER_PATTERNS.some((pattern) => pattern.test(callsign)) || (velocity <= 60 && altitude <= 1200)) {
    return { type: 'helicopter', confidence: 'high' };
  }

  if (BOMBER_PATTERNS.some((pattern) => pattern.test(callsign)) || (velocity >= 230 && altitude >= 8000 && callsign.startsWith('B'))) {
    return { type: 'bomber', confidence: 'medium' };
  }

  if (TRANSPORT_PATTERNS.some((pattern) => pattern.test(callsign)) || (velocity >= 160 && velocity <= 280 && altitude >= 4000 && altitude <= 12000 && /C|K/i.test(callsign))) {
    return { type: 'transport', confidence: 'medium' };
  }

  if (FIGHTER_PATTERNS.some((pattern) => pattern.test(callsign)) || (velocity >= 250 && altitude >= 5000)) {
    return { type: 'fighter', confidence: 'medium' };
  }

  return { type: 'unknown', confidence: 'low' };
}

export function getAircraftTypeColor(type: MilitaryAircraftType): string {
  switch (type) {
    case 'bomber':
      return '#ff3b30';
    case 'transport':
      return '#0a84ff';
    case 'fighter':
      return '#ffb000';
    case 'helicopter':
      return '#30d158';
    default:
      return '#8e8e93';
  }
}
