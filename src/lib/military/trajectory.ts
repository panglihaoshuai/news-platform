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
import { getDestinationById, type HotspotDestination } from './destinations';
import { militaryConfig } from './config';

// ============================================================================
// Configuration (using centralized config)
// ============================================================================

const MAX_HISTORY_POINTS = militaryConfig.trajectory.maxHistoryPoints;
const TRAJECTORY_TIMEOUT = militaryConfig.trajectory.trajectoryTimeout;
const MIN_FLIGHT_DISTANCE_KM = militaryConfig.trajectory.minFlightDistanceKm;
const DIRECTION_TOLERANCE_DEG = militaryConfig.trajectory.directionToleranceDeg;

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
// Flight Direction Analysis (Plan B)
// ============================================================================

/**
 * Calculate heading from point A to point B
 * Properly handles the antimeridian (180°/-180° boundary)
 * 
 * @param from - Origin position {lat, lng}
 * @param to - Destination position {lat, lng}
 * @returns Heading in degrees (0-360, 0=North, 90=East)
 */
export function calculateHeading(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  // Handle antimeridian crossing - use shortest path
  let dLng = to.lng - from.lng;
  
  // If longitude difference > 180°, go the other way
  if (dLng > 180) {
    dLng = dLng - 360;
  } else if (dLng < -180) {
    dLng = dLng + 360;
  }
  
  dLng = toRad(dLng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - 
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

/**
 * Calculate angle difference between two headings
 * 
 * @param heading1 - First heading in degrees
 * @param heading2 - Second heading in degrees
 * @returns Minimum angle difference (0-180)
 */
function angleDifference(heading1: number, heading2: number): number {
  let diff = Math.abs(heading1 - heading2) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/**
 * Check if aircraft trajectory is flying towards a destination
 * 
 * @param trajectory - Array of position history (chronological)
 * @param destination - Target destination coordinates [lat, lng]
 * @returns Object with analysis results
 */
export function analyzeFlightDirection(
  trajectory: TrajectoryPoint[],
  destination: [number, number]
): {
  isFlyingTowards: boolean;
  confidence: 'high' | 'medium' | 'low';
  distanceCoveredKm: number;
  heading: number;
  targetHeading: number;
  angleDiff: number;
} | null {
  if (!trajectory || trajectory.length < 2) {
    return null;
  }
  
  const start = trajectory[0];
  const end = trajectory[trajectory.length - 1];
  
  // Calculate distance covered
  const distanceCoveredKm = calculateDistance(
    start.lat, start.lng,
    end.lat, end.lng
  );
  
  // Need minimum distance to determine direction (not taxiing/parked)
  if (distanceCoveredKm < MIN_FLIGHT_DISTANCE_KM) {
    return {
      isFlyingTowards: false,
      confidence: 'low',
      distanceCoveredKm,
      heading: 0,
      targetHeading: 0,
      angleDiff: 180,
    };
  }
  
  // Calculate actual flight heading
  const heading = calculateHeading(
    { lat: start.lat, lng: start.lng },
    { lat: end.lat, lng: end.lng }
  );
  
  // Calculate heading to target
  const targetHeading = calculateHeading(
    { lat: start.lat, lng: start.lng },
    { lat: destination[0], lng: destination[1] }
  );
  
  // Calculate angle difference
  const angleDiff = angleDifference(heading, targetHeading);
  
  // Determine confidence based on distance and angle
  let confidence: 'high' | 'medium' | 'low';
  if (distanceCoveredKm >= 50 && angleDiff <= 30) {
    confidence = 'high';
  } else if (distanceCoveredKm >= 25 && angleDiff <= 45) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  return {
    isFlyingTowards: angleDiff <= DIRECTION_TOLERANCE_DEG,
    confidence,
    distanceCoveredKm,
    heading,
    targetHeading,
    angleDiff,
  };
}

/**
 * Get all aircraft flying towards a specific destination
 * 
 * @param aircraftList - Array of aircraft with their trajectories
 * @param destinationId - Destination ID from destinations config
 * @returns Filtered aircraft flying towards the destination
 */
export function getAircraftFlyingToDestination(
  aircraftList: Array<{ aircraft: MilitaryAircraft; trajectory: TrajectoryPoint[] }>,
  destinationId: string
): Array<{
  aircraft: MilitaryAircraft;
  trajectory: TrajectoryPoint[];
  analysis: ReturnType<typeof analyzeFlightDirection>;
}> {
  const destination = getDestinationById(destinationId);
  if (!destination) {
    return [];
  }
  
  return aircraftList
    .map(({ aircraft, trajectory }) => {
      const analysis = analyzeFlightDirection(trajectory, destination.center);
      return { aircraft, trajectory, analysis };
    })
    .filter(item => item.analysis?.isFlyingTowards)
    .sort((a, b) => {
      // Sort by confidence (high first), then by distance
      const confidenceOrder = { high: 0, medium: 1, low: 2 };
      const diff = confidenceOrder[a.analysis!.confidence] - confidenceOrder[b.analysis!.confidence];
      if (diff !== 0) return diff;
      return (b.analysis!.distanceCoveredKm || 0) - (a.analysis!.distanceCoveredKm || 0);
    });
}

/**
 * Calculate hotspot statistics for a destination
 * 
 * @param aircraftList - Array of aircraft with their trajectories
 * @param destinationId - Destination ID
 * @returns Statistics for the hotspot
 */
export function getHotspotStats(
  aircraftList: Array<{ aircraft: MilitaryAircraft; trajectory: TrajectoryPoint[] }>,
  destinationId: string
): {
  destination: HotspotDestination | undefined;
  totalAircraft: number;
  byType: Record<string, number>;
  byConfidence: Record<string, number>;
  aircraft: Array<{
    aircraft: MilitaryAircraft;
    trajectory: TrajectoryPoint[];
    analysis: ReturnType<typeof analyzeFlightDirection>;
  }>;
} {
  const destination = getDestinationById(destinationId);
  const matching = getAircraftFlyingToDestination(aircraftList, destinationId);
  
  const byType: Record<string, number> = {};
  const byConfidence: Record<string, number> = {};
  
  for (const item of matching) {
    const type = item.aircraft.aircraftType || 'unknown';
    const confidence = item.analysis?.confidence || 'low';
    
    byType[type] = (byType[type] || 0) + 1;
    byConfidence[confidence] = (byConfidence[confidence] || 0) + 1;
  }
  
  return {
    destination,
    totalAircraft: matching.length,
    byType,
    byConfidence,
    aircraft: matching,
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
