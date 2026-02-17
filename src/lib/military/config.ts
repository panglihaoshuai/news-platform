/**
 * Military Tracking Configuration
 * 
 * Centralized configuration for military tracking features.
 * Adjust these values to tune behavior without code changes.
 * 
 * @module src/lib/military/config
 */

export const militaryConfig = {
  /**
   * Trajectory tracking settings
   */
  trajectory: {
    /** Maximum positions to store per aircraft/vessel */
    maxHistoryPoints: 100,
    /** Positions older than this (seconds) are considered stale */
    trajectoryTimeout: 3600,
    /** Minimum distance (km) to consider as actual flight vs taxiing */
    minFlightDistanceKm: 15,
    /** Angle tolerance (degrees) for "flying towards" detection */
    directionToleranceDeg: 60,
  },

  /**
   * Hotspot analysis settings
   */
  hotspot: {
    /** Minimum news count for high confidence hotspot */
    minNewsCountHigh: 3,
    /** Minimum news count for medium confidence hotspot */
    minNewsCountMedium: 1,
    /** Hotspot timeout (ms) - how long to keep hotspot active without news */
    hotspotTimeoutMs: 30 * 60 * 1000, // 30 minutes
    /** Minimum confidence level to highlight aircraft */
    minConfidenceHighlight: 'low' as const,
  },

  /**
   * API settings
   */
  api: {
    /** OpenSky API refresh interval (ms) */
    refreshIntervalMs: 60000,
    /** Request timeout (ms) */
    requestTimeoutMs: 10000,
  },
} as const;

export type MilitaryConfig = typeof militaryConfig;
