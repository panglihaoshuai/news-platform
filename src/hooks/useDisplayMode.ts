/**
 * useDisplayMode Hook - Display Mode Management
 * Bloomberg Terminal War Room Edition
 * 
 * Manages display mode switching between:
 * - standard: Standard layout (60% map + 30% news + 10% market)
 * - compact: High-density layout for secondary monitors
 * - immersive: Full-screen map (85%) for presentations
 * 
 * Features:
 * - State management with localStorage persistence
 * - Sync with keyboard shortcut (Tab)
 * - Responsive to screen size
 * 
 * @module src/hooks/useDisplayMode
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DisplayMode } from '@/types/news';

// ============================================================================
// Constants
// ============================================================================

export const DISPLAY_MODES: DisplayMode[] = ['standard', 'compact', 'immersive'];

export interface DisplayModeConfig {
  name: string;
  description: string;
  mapWidth: number;
  newsWidth: number;
  marketWidth: number;
  showLabels: boolean;
  reducedSpacing?: boolean;
  floatingPanels?: boolean;
}

export const DISPLAY_MODE_CONFIG: Record<DisplayMode, DisplayModeConfig> = {
  standard: {
    name: 'Standard',
    description: 'Balanced layout for daily use',
    mapWidth: 0.6,
    newsWidth: 0.3,
    marketWidth: 0.1,
    showLabels: true,
  },
  compact: {
    name: 'Compact',
    description: 'High-density for secondary monitors',
    mapWidth: 0.65,
    newsWidth: 0.25,
    marketWidth: 0.1,
    showLabels: true,
    reducedSpacing: true,
  },
  immersive: {
    name: 'Immersive',
    description: 'Full-screen map for presentations',
    mapWidth: 0.85,
    newsWidth: 0.15,
    marketWidth: 0,
    showLabels: false,
    floatingPanels: true,
  },
};

// ============================================================================
// Hook Implementation
// ============================================================================

interface UseDisplayModeReturn {
  displayMode: DisplayMode;
  setDisplayMode: (mode: DisplayMode) => void;
  cycleDisplayMode: () => void;
  config: DisplayModeConfig;
  isStandard: boolean;
  isCompact: boolean;
  isImmersive: boolean;
}

export function useDisplayMode(
  defaultMode: DisplayMode = 'standard',
  options?: {
    persist?: boolean;
    syncWithKeyboard?: boolean;
  }
): UseDisplayModeReturn {
  const { persist = true, syncWithKeyboard = true } = options || {};

  const [displayMode, setDisplayModeState] = useState<DisplayMode>(defaultMode);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    setMounted(true);
    
    if (persist) {
      const stored = localStorage.getItem('displayMode') as DisplayMode | null;
      if (stored && DISPLAY_MODES.includes(stored)) {
        setDisplayModeState(stored);
        return;
      }
    }

    // Auto-detect based on screen size
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 1024) {
        setDisplayModeState('compact');
      } else if (window.innerWidth > 1920) {
        setDisplayModeState('immersive');
      }
    }
  }, [persist]);

  // Set display mode with persistence
  const setDisplayMode = useCallback((mode: DisplayMode) => {
    setDisplayModeState(mode);
    
    if (persist) {
      localStorage.setItem('displayMode', mode);
    }

    // Dispatch custom event for other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('displayModeChange', { detail: mode }));
    }
  }, [persist]);

  // Cycle to next display mode
  const cycleDisplayMode = useCallback(() => {
    const currentIndex = DISPLAY_MODES.indexOf(displayMode);
    const nextIndex = (currentIndex + 1) % DISPLAY_MODES.length;
    setDisplayMode(DISPLAY_MODES[nextIndex]);
  }, [displayMode, setDisplayMode]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!syncWithKeyboard || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab cycles through display modes
      if (e.key === 'Tab') {
        e.preventDefault();
        cycleDisplayMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [syncWithKeyboard, cycleDisplayMode]);

  // Computed values
  const config = DISPLAY_MODE_CONFIG[displayMode];
  const isStandard = displayMode === 'standard';
  const isCompact = displayMode === 'compact';
  const isImmersive = displayMode === 'immersive';

  return {
    displayMode: mounted ? displayMode : defaultMode,
    setDisplayMode,
    cycleDisplayMode,
    config,
    isStandard,
    isCompact,
    isImmersive,
  };
}

// ============================================================================
// Width Calculation Utilities
// ============================================================================

/**
 * Calculate actual pixel widths based on container and display mode
 */
export function calculateLayoutWidths(
  containerWidth: number,
  displayMode: DisplayMode
): { map: number; news: number; market: number } {
  const config = DISPLAY_MODE_CONFIG[displayMode];
  
  return {
    map: Math.floor(containerWidth * config.mapWidth),
    news: Math.floor(containerWidth * config.newsWidth),
    market: Math.floor(containerWidth * config.marketWidth),
  };
}

/**
 * Check if market panel should be visible
 */
export function isMarketPanelVisible(displayMode: DisplayMode): boolean {
  return displayMode !== 'immersive';
}

/**
 * Check if panel should float (immersive mode)
 */
export function shouldFloatPanels(displayMode: DisplayMode): boolean {
  return DISPLAY_MODE_CONFIG[displayMode].floatingPanels === true;
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useDisplayMode,
  DISPLAY_MODES,
  DISPLAY_MODE_CONFIG,
  calculateLayoutWidths,
  isMarketPanelVisible,
  shouldFloatPanels,
};
