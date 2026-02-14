/**
 * Military Trajectory Analysis Module
 * 
 * Tracks and analyzes movement patterns of US military assets
 * - Stores historical positions for trajectory visualization
 * - Calculates base-to-base transfers
 * - Analyzes global distribution density
 * 
 * @module src/lib/military/trajectory
 */

import type { MilitaryAircraft, MilitaryVessel, USBase, TrajectoryPoint, VesselTrack } from './types';
import { getBaseById } from './us-bases';

// ============================================================================
// Configuration
// ============================================================================

const MAX_HISTORY_POINTS = 100; // Maximum positions to store per vessel
const TRAJECTORY_TIMEOUT = 3600; // 1 hour - positions older than this are stale

// ============================================================================
// In-Memory Storage
// ============================================================================

// Vessel trajectory history (in production, use Redis or database)
const vesselTrajectories = new Map<string, VesselTrack>();

// Aircraft trajectory history
const aircraftTrajectories = new Map<string, { positions: TrajectoryPoint[]; lastUpdated: number }>();

// ============================================================================
// Vessel Trajectory Functions
// ============================================================================

/**
 * Update vessel position in trajectory history
 * 
 * @param vessel - Current vessel position
 */
export function updateVesselTrajectory(vessel: MilitaryVessel): void {
  const now = Date.now();
  
  let track = vesselTrajectories.get(vessel.id);
  
  if (!track) {
    track = {
      mmsi: vessel.id,
      positions: [],
      lastUpdated: now,
    };
    vesselTrajectories.set(vessel.id, track);
  }
  
  // Add new position
  const newPoint: TrajectoryPoint = {
    lat: vessel.latitude,
    lng: vessel.longitude,
    timestamp: vessel.timestamp,
  };
  
  // Check if position has changed significantly (at least 100m)
  const lastPoint = track.positions[track.positions.length - 1];
  if (lastPoint) {
    const distance = calculateDistance(
      lastPoint.lat, lastPoint.lng,
      newPoint.lat, newPoint.lng
    );
    
    if (distance < 0.1) { // Less than 100m change
      return; // Skip redundant position
    }
  }
  
  track.positions.push(newPoint);
  track.lastUpdated = now;
  
  // Trim old positions
  if (track.positions.length > MAX_HISTORY_POINTS) {
    track.positions = track.positions.slice(-MAX_HISTORY_POINTS);
  }
}

/**
 * Get vessel trajectory
 * 
 * @param mmsi - Vessel MMSI
 * @returns Vessel track or undefined
 */
export function getVesselTrajectory(mmsi: string): VesselTrack | undefined {
  return vesselTrajectories.get(mmsi);
}

/**
 * Get all vessel trajectories
 * 
 * @returns Array of all vessel tracks
 */
export function getAllVesselTrajectories(): VesselTrack[] {
  return Array.from(vesselTrajectories.values());
}

/**
 * Clear stale trajectories (older than timeout)
 */
export function clearStaleTrajectories(): void {
  const now = Date.now();
  
  for (const [mmsi, track] of vesselTrajectories.entries()) {
    if (now - track.lastUpdated > TRAJECTORY_TIMEOUT * 1000) {
      vesselTrajectories.delete(mmsi);
    }
  }
}

// ============================================================================
// Aircraft Trajectory Functions
// ============================================================================

/**
 * Update aircraft position in trajectory history
 * 
 * @param aircraft - Current aircraft position
 */
export function updateAircraftTrajectory(aircraft: MilitaryAircraft): void {
  const now = Date.now();
  
  let track = aircraftTrajectories.get(aircraft.id);
  
  if (!track) {
    track = {
      positions: [],
      lastUpdated: now,
    };
    aircraftTrajectories.set(aircraft.id, track);
  }
  
  const newPoint: TrajectoryPoint = {
    lat: aircraft.latitude,
    lng: aircraft.longitude,
    timestamp: aircraft.timestamp,
  };
  
  track.positions.push(newPoint);
  track.lastUpdated = now;
  
  if (track.positions.length > MAX_HISTORY_POINTS) {
    track.positions = track.positions.slice(-MAX_HISTORY_POINTS);
  }
}

/**
 * Get aircraft trajectory
 * 
 * @param icao24 - Aircraft ICAO 24-bit address
 * @returns Aircraft track or undefined
 */
export function getAircraftTrajectory(icao24: string): TrajectoryPoint[] | undefined {
  return aircraftTrajectories.get(icao24)?.positions;
}

// ============================================================================
// Base Transfer Analysis
// ============================================================================

/**
 * Find nearest base to a position
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Nearest base or undefined
 */
export function findNearestBase(lat: number, lng: number): USBase | undefined {
  const bases = getAllBases();
  let nearestBase: USBase | undefined;
  let minDistance = Infinity;
  
  for (const base of bases) {
    const distance = calculateDistance(
      lat, lng,
      base.location.lat, base.location.lng
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestBase = base;
    }
  }
  
  return nearestBase;
}

/**
 * Analyze base-to-base transfers
 * 
 * @param vesselId - Vessel ID (MMSI)
 * @returns Transfer analysis
 */
export function analyzeBaseTransfers(vesselId: string): {
  transfers: Array<{ from: string; to: string; timestamp: number }>;
  currentBase: string | null;
} {
  const track = vesselTrajectories.get(vesselId);
  
  if (!track || track.positions.length < 2) {
    return { transfers: [], currentBase: null };
  }
  
  const transfers: Array<{ from: string; to: string; timestamp: number }> = [];
  let currentBase: string | null = null;
  
  for (let i = 0; i < track.positions.length; i++) {
    const pos = track.positions[i];
    const nearestBase = findNearestBase(pos.lat, pos.lng);
    
    if (nearestBase && nearestBase.id !== currentBase) {
      if (currentBase) {
        transfers.push({
          from: currentBase,
          to: nearestBase.id,
          timestamp: pos.timestamp,
        });
      }
      currentBase = nearestBase.id;
    }
  }
  
  return { 
    transfers, 
    currentBase: currentBase || null 
  };
}

// ============================================================================
// Density Analysis
// ============================================================================

/**
 * Calculate density of military assets by region
 * 
 * @param vessels - Array of vessels
 * @param bases - Array of bases
 * @returns Density by region
 */
export function calculateDensityByRegion(
  vessels: MilitaryVessel[],
  bases: USBase[]
): Record<string, { vessels: number; bases: number; density: number }> {
  const regions = [
    'pacific', 'middleeast', 'europe', 'india', 'americas', 'africa'
  ];
  
  const density: Record<string, { vessels: number; bases: number; density: number }> = {};
  
  for (const region of regions) {
    const regionBases = bases.filter(b => b.region === region);
    const regionVessels = vessels.filter(v => {
      const nearestBase = findNearestBase(v.latitude, v.longitude);
      return nearestBase?.region === region;
    });
    
    density[region] = {
      vessels: regionVessels.length,
      bases: regionBases.length,
      density: regionBases.length > 0 
        ? regionVessels.length / regionBases.length 
        : 0,
    };
  }
  
  return density;
}

/**
 * Get global distribution summary
 * 
 * @param vessels - Array of vessels
 * @returns Distribution summary
 */
export function getGlobalDistribution(vessels: MilitaryVessel[]): {
  totalVessels: number;
  byRegion: Record<string, number>;
  byStatus: Record<string, number>;
} {
  const byRegion: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  
  for (const vessel of vessels) {
    // Count by nearest region
    const nearestBase = findNearestBase(vessel.latitude, vessel.longitude);
    const region = nearestBase?.region || 'unknown';
    byRegion[region] = (byRegion[region] || 0) + 1;
    
    // Count by status
    const status = vessel.navigationStatus || 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
  }
  
  return {
    totalVessels: vessels.length,
    byRegion,
    byStatus,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate distance between two points (Haversine formula)
 * 
 * @param lat1 - Latitude 1
 * @param lng1 - Longitude 1
 * @param lat2 - Latitude 2
 * @param lng2 - Longitude 2
 * @returns Distance in kilometers
 */
function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ============================================================================
// Re-export types and functions
// ============================================================================

export type { TrajectoryPoint, VesselTrack } from './types';

// Helper to get all bases (circular import workaround)
function getAllBases(): USBase[] {
  // This will be imported from us-bases
  const { US_OVERSEAS_BASES } = require('./us-bases');
  return US_OVERSEAS_BASES;
}
