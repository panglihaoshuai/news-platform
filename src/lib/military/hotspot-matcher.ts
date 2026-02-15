/**
 * News-Flight Hotspot Matcher
 * 
 * Links news content to aircraft tracking destinations.
 * When military deployment news is detected, activates hotspot tracking.
 * 
 * @module src/lib/military/hotspot-matcher
 */

import type { NewsItem } from '@/types/news';
import { findDestinationsByNews, HOTSPOT_DESTINATIONS, type HotspotDestination } from './destinations';
import { getHotspotStats, type analyzeFlightDirection } from './trajectory';
import type { MilitaryAircraft, TrajectoryPoint } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Active hotspot derived from news
 */
export interface ActiveHotspot {
  /** Destination config */
  destination: HotspotDestination;
  /** Matching news items that triggered this hotspot */
  newsItems: NewsItem[];
  /** When the hotspot was first activated */
  activatedAt: number;
  /** Confidence level based on news count */
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Complete hotspot analysis including aircraft stats
 */
export interface HotspotAnalysis {
  /** Active hotspots from news */
  activeHotspots: ActiveHotspot[];
  /** Aircraft stats for each hotspot */
  hotspotStats: Record<string, {
    destination: HotspotDestination | undefined;
    totalAircraft: number;
    byType: Record<string, number>;
    byConfidence: Record<string, number>;
    aircraft: Array<{
      aircraft: MilitaryAircraft;
      trajectory: TrajectoryPoint[];
      analysis: ReturnType<typeof analyzeFlightDirection>;
    }>;
  }>;
  /** All aircraft that match any active hotspot */
  highlightedAircraft: MilitaryAircraft[];
}

// ============================================================================
// Configuration
// ============================================================================

const MIN_NEWS_COUNT_FOR_HIGH_CONFIDENCE = 3;
const MIN_NEWS_COUNT_FOR_MEDIUM_CONFIDENCE = 1;
const HOTSPOT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// ============================================================================
// In-Memory Storage
// ============================================================================

// Active hotspots (keyed by destination ID)
const activeHotspots = new Map<string, ActiveHotspot>();

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Analyze news items to determine active hotspots
 * 
 * @param newsItems - Array of news items to analyze
 * @returns Array of active hotspots
 */
export function analyzeNewsHotspots(newsItems: NewsItem[]): ActiveHotspot[] {
  // Group news by destination
  const newsByDestination = new Map<string, NewsItem[]>();
  
  for (const item of newsItems) {
    const destinations = findDestinationsByNews(item.title, item.summary || undefined);
    
    for (const dest of destinations) {
      const existing = newsByDestination.get(dest.id) || [];
      existing.push(item);
      newsByDestination.set(dest.id, existing);
    }
  }
  
  // Create active hotspots
  const now = Date.now();
  const newActiveHotspots: ActiveHotspot[] = [];
  
  for (const [destId, items] of newsByDestination) {
    const destination = HOTSPOT_DESTINATIONS.find(d => d.id === destId);
    if (!destination) continue;
    
    // Determine confidence based on news count
    let confidence: 'high' | 'medium' | 'low';
    if (items.length >= MIN_NEWS_COUNT_FOR_HIGH_CONFIDENCE) {
      confidence = 'high';
    } else if (items.length >= MIN_NEWS_COUNT_FOR_MEDIUM_CONFIDENCE) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }
    
    const hotspot: ActiveHotspot = {
      destination,
      newsItems: items,
      activatedAt: now,
      confidence,
    };
    
    newActiveHotspots.push(hotspot);
    activeHotspots.set(destId, hotspot);
  }
  
  // Clean up old hotspots (not in current news)
  for (const [destId, hotspot] of activeHotspots) {
    if (!newsByDestination.has(destId)) {
      // Check if still within timeout
      if (now - hotspot.activatedAt > HOTSPOT_TIMEOUT_MS) {
        activeHotspots.delete(destId);
      }
    }
  }
  
  return newActiveHotspots;
}

/**
 * Get current active hotspots
 * 
 * @returns Array of currently active hotspots
 */
export function getActiveHotspots(): ActiveHotspot[] {
  const now = Date.now();
  const valid: ActiveHotspot[] = [];
  
  for (const [_, hotspot] of activeHotspots) {
    if (now - hotspot.activatedAt <= HOTSPOT_TIMEOUT_MS) {
      valid.push(hotspot);
    }
  }
  
  return valid.sort((a, b) => {
    // Sort by confidence, then by news count
    const confidenceOrder = { high: 0, medium: 1, low: 2 };
    const diff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    if (diff !== 0) return diff;
    return b.newsItems.length - a.newsItems.length;
  });
}

/**
 * Get aircraft trajectory from trajectory module
 * This is a placeholder - actual implementation needs integration with trajectory storage
 */
function getAircraftTrajectories(): Array<{ aircraft: MilitaryAircraft; trajectory: TrajectoryPoint[] }> {
  // TODO: Integrate with actual trajectory storage
  // For now, return empty - will be called from the hook with real data
  return [];
}

/**
 * Complete hotspot analysis combining news and flight data
 * 
 * @param newsItems - News items to analyze
 * @param aircraftList - Aircraft with their trajectories
 * @returns Complete hotspot analysis
 */
export function analyzeHotspots(
  newsItems: NewsItem[],
  aircraftList: Array<{ aircraft: MilitaryAircraft; trajectory: TrajectoryPoint[] }>
): HotspotAnalysis {
  // Analyze news to get active hotspots
  const activeHotspots = analyzeNewsHotspots(newsItems);
  
  // Get stats for each hotspot
  const hotspotStats: HotspotAnalysis['hotspotStats'] = {};
  const highlightedAircraftIds = new Set<string>();
  
  for (const hotspot of activeHotspots) {
    const stats = getHotspotStats(aircraftList, hotspot.destination.id);
    hotspotStats[hotspot.destination.id] = stats;
    
    // Collect highlighted aircraft IDs
    for (const item of stats.aircraft) {
      highlightedAircraftIds.add(item.aircraft.id);
    }
  }
  
  // Get full aircraft objects for highlighted
  const highlightedAircraft = aircraftList
    .filter(item => highlightedAircraftIds.has(item.aircraft.id))
    .map(item => item.aircraft);
  
  return {
    activeHotspots,
    hotspotStats,
    highlightedAircraft,
  };
}

/**
 * Check if an aircraft is highlighted (flying towards an active hotspot)
 * 
 * @param aircraftId - Aircraft ID to check
 * @returns Whether the aircraft is highlighted
 */
export function isAircraftHighlighted(aircraftId: string): boolean {
  const active = getActiveHotspots();
  // This would need to check against actual aircraft data
  // Placeholder - will be implemented in the hook
  return false;
}

/**
 * Clear all active hotspots (for testing or reset)
 */
export function clearActiveHotspots(): void {
  activeHotspots.clear();
}

/**
 * Force activate a hotspot (for manual testing)
 * 
 * @param destinationId - Destination ID to activate
 * @param newsItem - Optional news item that triggered it
 */
export function forceActivateHotspot(destinationId: string, newsItem?: NewsItem): ActiveHotspot | null {
  const destination = HOTSPOT_DESTINATIONS.find(d => d.id === destinationId);
  if (!destination) return null;
  
  const hotspot: ActiveHotspot = {
    destination,
    newsItems: newsItem ? [newsItem] : [],
    activatedAt: Date.now(),
    confidence: 'high',
  };
  
  activeHotspots.set(destinationId, hotspot);
  return hotspot;
}
