/**
 * useMapDisplayMode Hook - Map Display Mode Management
 * Bloomberg Terminal War Room Edition
 * 
 * Manages map display mode switching between:
 * - all: Show all news points (colored by priority)
 * - priority: Show only P0/P1 high-priority events
 * - heatmap: Show clustered hotspots with heat colors
 * 
 * Features:
 * - State management with localStorage persistence
 * - Sync with keyboard shortcut (M)
 * - Integration with InteractiveMap component
 * 
 * @module src/hooks/useMapDisplayMode
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapDisplayMode, Priority } from '@/types/news';

// ============================================================================
// Constants
// ============================================================================

export const MAP_DISPLAY_MODES: MapDisplayMode[] = ['all', 'priority', 'heatmap'];

export interface MapModeConfig {
  name: string;
  icon: string;
  description: string;
  priorityFilter: Priority[];
  showClusters: boolean;
  heatVisualization: boolean;
  colorBy: 'priority' | 'heat';
}

export const MAP_MODE_CONFIG: Record<MapDisplayMode, MapModeConfig> = {
  all: {
    name: 'All Events',
    icon: 'Globe',
    description: 'Show all news points',
    priorityFilter: [],
    showClusters: true,
    heatVisualization: false,
    colorBy: 'priority',
  },
  priority: {
    name: 'Priority Only',
    icon: 'AlertTriangle',
    description: 'Show only P0/P1 events',
    priorityFilter: ['P0', 'P1'],
    showClusters: true,
    heatVisualization: false,
    colorBy: 'priority',
  },
  heatmap: {
    name: 'Heatmap',
    icon: 'Flame',
    description: 'Show clustered hotspots',
    priorityFilter: [],
    showClusters: true,
    heatVisualization: true,
    colorBy: 'heat',
  },
};

// ============================================================================
// Hook Implementation
// ============================================================================

interface UseMapDisplayModeReturn {
  mapDisplayMode: MapDisplayMode;
  setMapDisplayMode: (mode: MapDisplayMode) => void;
  cycleMapDisplayMode: () => void;
  config: MapModeConfig;
  showAll: boolean;
  showPriorityOnly: boolean;
  showHeatmap: boolean;
  shouldFilterByPriority: boolean;
  shouldShowHeatmap: boolean;
  getColorBy: () => 'priority' | 'heat';
}

export function useMapDisplayMode(
  defaultMode: MapDisplayMode = 'all',
  options?: {
    persist?: boolean;
    syncWithKeyboard?: boolean;
  }
): UseMapDisplayModeReturn {
  const { persist = true, syncWithKeyboard = true } = options || {};

  const [mapDisplayMode, setMapDisplayModeState] = useState<MapDisplayMode>(defaultMode);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    setMounted(true);
    
    if (persist) {
      const stored = localStorage.getItem('mapDisplayMode') as MapDisplayMode | null;
      if (stored && MAP_DISPLAY_MODES.includes(stored)) {
        setMapDisplayModeState(stored);
      }
    }
  }, [persist]);

  // Set map display mode with persistence
  const setMapDisplayMode = useCallback((mode: MapDisplayMode) => {
    setMapDisplayModeState(mode);
    
    if (persist) {
      localStorage.setItem('mapDisplayMode', mode);
    }

    // Dispatch custom event for map component
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mapDisplayModeChange', { detail: mode }));
    }
  }, [persist]);

  // Cycle to next map display mode
  const cycleMapDisplayMode = useCallback(() => {
    const currentIndex = MAP_DISPLAY_MODES.indexOf(mapDisplayMode);
    const nextIndex = (currentIndex + 1) % MAP_DISPLAY_MODES.length;
    setMapDisplayMode(MAP_DISPLAY_MODES[nextIndex]);
  }, [mapDisplayMode, setMapDisplayMode]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!syncWithKeyboard || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // M key cycles through map modes
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        cycleMapDisplayMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [syncWithKeyboard, cycleMapDisplayMode]);

  // Computed values
  const config = MAP_MODE_CONFIG[mapDisplayMode];
  const showAll = mapDisplayMode === 'all';
  const showPriorityOnly = mapDisplayMode === 'priority';
  const showHeatmap = mapDisplayMode === 'heatmap';
  const shouldFilterByPriority = mapDisplayMode === 'priority';
  const shouldShowHeatmap = mapDisplayMode === 'heatmap';
  const getColorBy = (): 'priority' | 'heat' => {
    return config.colorBy;
  };

  return {
    mapDisplayMode: mounted ? mapDisplayMode : defaultMode,
    setMapDisplayMode,
    cycleMapDisplayMode,
    config,
    showAll,
    showPriorityOnly,
    showHeatmap,
    shouldFilterByPriority,
    shouldShowHeatmap,
    getColorBy,
  };
}

// ============================================================================
// Filter Utilities
// ============================================================================

/**
 * Filter news items based on current map display mode
 */
export function filterNewsForMapMode<T extends { priority: string }>(
  news: T[],
  mapDisplayMode: MapDisplayMode
): T[] {
  const config = MAP_MODE_CONFIG[mapDisplayMode];
  
  if (config.priorityFilter.length === 0) {
    return news;
  }

  return news.filter(item => 
    config.priorityFilter.includes(item.priority as Priority)
  );
}

/**
 * Get heat color for a news item
 */
export function getNewsHeatColor(
  heatScore: number,
  _theme: 'terminal' | 'amber' | 'light' = 'terminal'
): string {
  // Heat colors based on score ranges
  if (heatScore >= 75) {
    return '#ff0000'; // Critical - Red
  } else if (heatScore >= 50) {
    return '#ff6600'; // High - Orange
  } else if (heatScore >= 25) {
    return '#ffcc00'; // Medium - Yellow
  } else {
    return '#666666'; // Low - Gray
  }
}

// ============================================================================
// Component Integration
// ============================================================================

/**
 * Map mode button props generator
 */
export function getMapModeButtonProps(
  currentMode: MapDisplayMode,
  mode: MapDisplayMode,
  onClick: () => void
): React.HTMLAttributes<HTMLButtonElement> {
  const isActive = currentMode === mode;
  
  return {
    'data-mode': mode,
    'data-active': isActive,
    onClick,
    className: isActive ? 'active' : '',
    title: MAP_MODE_CONFIG[mode].description,
  } as React.HTMLAttributes<HTMLButtonElement>;
};

// ============================================================================
// Default Export
// ============================================================================

export default {
  useMapDisplayMode,
  MAP_DISPLAY_MODES,
  MAP_MODE_CONFIG,
  filterNewsForMapMode,
  getNewsHeatColor,
  getMapModeButtonProps,
};
