/**
 * useMilitaryTracking Hook - Military Tracking State Management
 * 
 * Manages state for US military aircraft and base tracking:
 * - Fetches data from OpenSky Network (aircraft - free, real-time)
 * - Provides toggle controls for each layer type
 * - Auto-refresh with configurable interval
 * - Persists layer visibility to localStorage
 * 
 * Note: Vessel tracking disabled - no free real-time AIS data available
 * 
 * @module src/hooks/useMilitaryTracking
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { 
  MilitaryAircraft, 
  USBase,
  MilitaryTrackingConfig 
} from '@/lib/military/types';
import { US_OVERSEAS_BASES } from '@/lib/military/us-bases';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'militaryTrackingConfig';

/**
 * Default configuration
 * Note: navalLayer disabled - no free AIS data
 */
const DEFAULT_CONFIG: MilitaryTrackingConfig = {
  showAirLayer: false,
  showNavalLayer: false, // Disabled - no free AIS data
  showBasesLayer: false,
  refreshInterval: 60,
  enableTrajectories: false, // Disabled without vessel tracking
};

// ============================================================================
// Types
// ============================================================================

export interface MilitaryTrackingState {
  // Configuration
  config: MilitaryTrackingConfig;
  
  // Data - aircraft from OpenSky (free, real-time)
  aircraft: MilitaryAircraft[];
  vessels: never[]; // Empty - disabled for compatibility
  
  // Bases - local data
  bases: USBase[];
  
  // Status
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  
  // Selected items
  selectedAircraft: MilitaryAircraft | null;
  selectedVessel: null;
  selectedBase: USBase | null;
}

export interface UseMilitaryTrackingReturn extends MilitaryTrackingState {
  // Layer toggles
  toggleAirLayer: () => void;
  toggleNavalLayer: () => void;
  toggleBasesLayer: () => void;
  setShowAirLayer: (show: boolean) => void;
  setShowNavalLayer: (show: boolean) => void;
  setShowBasesLayer: (show: boolean) => void;
  
  // Configuration
  setRefreshInterval: (interval: number) => void;
  setEnableTrajectories: (enable: boolean) => void;
  resetConfig: () => void;
  
  // Data fetching
  refresh: () => Promise<void>;
  
  // Selection
  selectAircraft: (aircraft: MilitaryAircraft | null) => void;
  selectVessel: (vessel: null) => void;
  selectBase: (base: USBase | null) => void;
  
  // Computed
  isAirLayerActive: boolean;
  isNavalLayerActive: boolean;
  isBasesLayerActive: boolean;
  hasActiveLayers: boolean;
  aircraftCount: number;
  vesselsCount: number;
  basesCount: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMilitaryTracking(): UseMilitaryTrackingReturn {
  const [config, setConfig] = useState<MilitaryTrackingConfig>(DEFAULT_CONFIG);
  const [aircraft, setAircraft] = useState<MilitaryAircraft[]>([]);
  const [vessels] = useState<never[]>([]);
  const [bases] = useState<USBase[]>(US_OVERSEAS_BASES);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  const [selectedAircraft, setSelectedAircraft] = useState<MilitaryAircraft | null>(null);
  const [selectedVessel] = useState<null>(null);
  const [selectedBase, setSelectedBase] = useState<USBase | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  // Load config
  useEffect(() => {
    mountedRef.current = true;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<MilitaryTrackingConfig>;
        setConfig(prev => ({ 
          ...prev, 
          ...parsed,
          showNavalLayer: false,
          enableTrajectories: false 
        }));
      }
    } catch (e) {
      console.error('[MilitaryTracking] Failed to load config:', e);
    }
    return () => { mountedRef.current = false; };
  }, []);

  // Save config
  useEffect(() => {
    if (!mountedRef.current) return;
    try {
      const configToSave = { ...config, showNavalLayer: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
    } catch (e) {
      console.error('[MilitaryTracking] Failed to save config:', e);
    }
  }, [config]);

  // Fetch aircraft
  const fetchAircraft = useCallback(async (): Promise<MilitaryAircraft[]> => {
    try {
      const response = await fetch('/api/military/aircraft');
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch aircraft');
      }
      return data.data || [];
    } catch (e) {
      console.error('[MilitaryTracking] Fetch aircraft error:', e);
      return [];
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const aircraftData = config.showAirLayer ? await fetchAircraft() : [];
      if (mountedRef.current) {
        setAircraft(aircraftData);
        setLastUpdated(Date.now());
      }
    } catch (e) {
      if (mountedRef.current) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [config.showAirLayer, fetchAircraft]);

  // Auto-refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (config.showAirLayer && config.refreshInterval > 0) {
      intervalRef.current = setInterval(() => { refresh(); }, config.refreshInterval * 1000);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [config.showAirLayer, config.refreshInterval, refresh]);

  // Initial fetch
  useEffect(() => {
    if (config.showAirLayer && !isLoading && aircraft.length === 0) {
      refresh();
    }
  }, [config.showAirLayer, isLoading, aircraft.length, refresh]);

  // Layer toggles
  const toggleAirLayer = useCallback(() => {
    setConfig(prev => ({ ...prev, showAirLayer: !prev.showAirLayer }));
  }, []);

  const toggleNavalLayer = useCallback(() => {
    console.warn('[MilitaryTracking] Naval layer disabled - no free AIS data available');
  }, []);

  const toggleBasesLayer = useCallback(() => {
    setConfig(prev => ({ ...prev, showBasesLayer: !prev.showBasesLayer }));
  }, []);

  const setShowAirLayer = useCallback((show: boolean) => {
    setConfig(prev => ({ ...prev, showAirLayer: show }));
  }, []);

  const setShowNavalLayer = useCallback((_show: boolean) => {
    console.warn('[MilitaryTracking] Naval layer disabled');
  }, []);

  const setShowBasesLayer = useCallback((show: boolean) => {
    setConfig(prev => ({ ...prev, showBasesLayer: show }));
  }, []);

  const setRefreshInterval = useCallback((interval: number) => {
    setConfig(prev => ({ ...prev, refreshInterval: Math.max(10, Math.min(300, interval)) }));
  }, []);

  const setEnableTrajectories = useCallback((_enable: boolean) => {
    console.warn('[MilitaryTracking] Trajectories disabled');
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const selectAircraft = useCallback((aircraft: MilitaryAircraft | null) => {
    setSelectedAircraft(aircraft);
    if (aircraft) setSelectedBase(null);
  }, []);

  const selectVessel = useCallback((_vessel: null) => { }, []);
  const selectBase = useCallback((base: USBase | null) => {
    setSelectedBase(base);
    if (base) setSelectedAircraft(null);
  }, []);

  // Computed
  const isAirLayerActive = config.showAirLayer;
  const isNavalLayerActive = false;
  const isBasesLayerActive = config.showBasesLayer;
  const hasActiveLayers = isAirLayerActive || isBasesLayerActive;
  const aircraftCount = aircraft.length;
  const vesselsCount = 0;
  const basesCount = isBasesLayerActive ? bases.length : 0;

  return {
    config,
    aircraft,
    vessels,
    bases,
    isLoading,
    error,
    lastUpdated,
    selectedAircraft,
    selectedVessel,
    selectedBase,
    toggleAirLayer,
    toggleNavalLayer,
    toggleBasesLayer,
    setShowAirLayer,
    setShowNavalLayer,
    setShowBasesLayer,
    setRefreshInterval,
    setEnableTrajectories,
    resetConfig,
    refresh,
    selectAircraft,
    selectVessel,
    selectBase,
    isAirLayerActive,
    isNavalLayerActive,
    isBasesLayerActive,
    hasActiveLayers,
    aircraftCount,
    vesselsCount,
    basesCount,
  };
}

export default useMilitaryTracking;
