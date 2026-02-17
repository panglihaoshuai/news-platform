/**
 * useHotspotTracking Hook
 * 
 * Manages news-flight hotspot tracking:
 * - Maintains flight trajectories over time
 * - Analyzes news to find active hotspots
 * - Matches aircraft flying towards hotspots
 * - Provides highlighted aircraft and statistics
 * 
 * @module src/hooks/useHotspotTracking
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { NewsItem } from '@/types/news';
import type { MilitaryAircraft, TrajectoryPoint } from '@/lib/military/types';
import { analyzeHotspots, getActiveHotspots, clearActiveHotspots } from '@/lib/military/hotspot-matcher';
import { updateAircraftTrajectory, getAircraftTrajectory } from '@/lib/military/trajectory';

// ============================================================================
// Types
// ============================================================================

export interface HotspotInfo {
  destinationId: string;
  destinationName: string;
  destinationNameZh: string;
  totalAircraft: number;
  byType: Record<string, number>;
  byConfidence: Record<string, number>;
}

export interface UseHotspotTrackingReturn {
  // State
  activeHotspots: HotspotInfo[];
  highlightedAircraft: MilitaryAircraft[];
  isTracking: boolean;
  isAnalyzing: boolean; // Whether hotspot analysis is in progress
  
  // Actions
  updateAircraft: (aircraft: MilitaryAircraft[]) => void;
  setNews: (news: NewsItem[]) => void;
  clearHotspots: () => void;
  
  // Stats
  totalHighlighted: number;
  hotspotCount: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useHotspotTracking(): UseHotspotTrackingReturn {
  // Store aircraft with their trajectories
  const [aircraftWithTrajectories, setAircraftWithTrajectories] = useState<
    Array<{ aircraft: MilitaryAircraft; trajectory: TrajectoryPoint[] }>
  >([]);
  
  // Store news items
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  
  // Active hotspots (derived from news)
  const [activeHotspots, setActiveHotspots] = useState<HotspotInfo[]>([]);
  
  // Highlighted aircraft (flying towards hotspots)
  const [highlightedAircraft, setHighlightedAircraft] = useState<MilitaryAircraft[]>([]);
  
  // Track if we're actively tracking
  const [isTracking, setIsTracking] = useState(false);
  
  // Track if hotspot analysis is in progress
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Refs for callbacks
  const aircraftRef = useRef<MilitaryAircraft[]>([]);
  const newsRef = useRef<NewsItem[]>([]);

  // Update aircraft ref when prop changes
  const updateAircraft = useCallback((aircraft: MilitaryAircraft[]) => {
    aircraftRef.current = aircraft;
    setIsTracking(true);
    
    // Update trajectories for each aircraft
    const updated = aircraft.map(ac => {
      // Update trajectory in the trajectory module
      updateAircraftTrajectory(ac);
      
      // Get updated trajectory
      const trajectory = getAircraftTrajectory(ac.id) || [];
      
      return {
        aircraft: ac,
        trajectory,
      };
    });
    
    setAircraftWithTrajectories(updated);
  }, []);

  // Update news ref when prop changes
  const setNews = useCallback((news: NewsItem[]) => {
    newsRef.current = news;
    setNewsItems(news);
  }, []);

  // Analyze hotspots when news or aircraft changes
  useEffect(() => {
    if (!isTracking || aircraftWithTrajectories.length === 0) {
      return;
    }

    // Set analyzing state
    setIsAnalyzing(true);
    
    // Run hotspot analysis
    const analysis = analyzeHotspots(newsItems, aircraftWithTrajectories);
    
    // Convert to UI-friendly format
    const hotspotInfos: HotspotInfo[] = Object.entries(analysis.hotspotStats).map(
      ([destId, stats]) => ({
        destinationId: destId,
        destinationName: stats.destination?.name || destId,
        destinationNameZh: stats.destination?.nameZh || destId,
        totalAircraft: stats.totalAircraft,
        byType: stats.byType,
        byConfidence: stats.byConfidence,
      })
    );
    
    setActiveHotspots(hotspotInfos);
    setHighlightedAircraft(analysis.highlightedAircraft);
    setIsAnalyzing(false);
  }, [newsItems, aircraftWithTrajectories, isTracking]);

  // Clear all hotspots
  const clearHotspots = useCallback(() => {
    clearActiveHotspots();
    setActiveHotspots([]);
    setHighlightedAircraft([]);
    setAircraftWithTrajectories([]);
    setIsTracking(false);
  }, []);

  return {
    activeHotspots,
    highlightedAircraft,
    isTracking,
    isAnalyzing,
    updateAircraft,
    setNews,
    clearHotspots,
    totalHighlighted: highlightedAircraft.length,
    hotspotCount: activeHotspots.length,
  };
}

export default useHotspotTracking;
