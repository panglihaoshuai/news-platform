/**
 * Military Layers Panel UI Component
 * 
 * Control panel for toggling military tracking layers
 * Note: Vessel tracking requires paid API - currently disabled
 * 
 * @module src/components/military/MilitaryLayersPanel
 */

'use client';

import React from 'react';
import { 
  Plane, 
  Landmark, 
  RefreshCw, 
  X,
  Info
} from 'lucide-react';

interface MilitaryLayersPanelProps {
  // Layer visibility
  showAirLayer: boolean;
  showBasesLayer: boolean;
  
  // Counts
  aircraftCount: number;
  basesCount: number;
  
  // Loading state
  isLoading: boolean;
  lastUpdated: number | null;
  
  // Error state
  error: string | null;
  
  // Callbacks
  onToggleAirLayer: () => void;
  onToggleBasesLayer: () => void;
  onRefresh: () => void;
  
  // Optional props
  className?: string;
  onClose?: () => void;
}

/**
 * Format timestamp for display
 */
function formatLastUpdated(timestamp: number | null): string {
  if (!timestamp) return 'Never';
  
  const now = Date.now();
  const diff = Math.floor((now - timestamp) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export const MilitaryLayersPanel: React.FC<MilitaryLayersPanelProps> = ({
  showAirLayer,
  showBasesLayer,
  aircraftCount,
  basesCount,
  isLoading,
  lastUpdated,
  error,
  onToggleAirLayer,
  onToggleBasesLayer,
  onRefresh,
  className = '',
  onClose,
}) => {
  const hasActiveLayers = showAirLayer || showBasesLayer;
  
  return (
    <div 
      className={`
        bg-gray-900/95 backdrop-blur-sm 
        border border-gray-700 rounded-lg 
        shadow-xl overflow-hidden
        ${className}
      `}
      style={{ width: '260px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-green-400" />
          <span className="text-sm font-semibold text-white">
            Military Tracking
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
      
      {/* Layer Toggles */}
      <div className="p-3 space-y-2">
        {/* Air Layer - Real-time via OpenSky */}
        <button
          type="button"
          onClick={onToggleAirLayer}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded
            transition-all duration-200
            ${showAirLayer 
              ? 'bg-red-500/20 border border-red-500/50' 
              : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-700'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Plane className={`w-4 h-4 ${showAirLayer ? 'text-red-400' : 'text-gray-400'}`} />
            <span className={`text-sm ${showAirLayer ? 'text-white' : 'text-gray-300'}`}>
              Aircraft
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showAirLayer && (
              <span className="text-xs text-red-400 font-mono">
                {aircraftCount}
              </span>
            )}
            <div 
              className={`
                w-8 h-4 rounded-full transition-colors relative
                ${showAirLayer ? 'bg-red-500' : 'bg-gray-600'}
              `}
            >
              <div 
                className={`
                  absolute top-0.5 w-3 h-3 rounded-full bg-white
                  transition-transform duration-200
                  ${showAirLayer ? 'left-4' : 'left-0.5'}
                `}
              />
            </div>
          </div>
        </button>
        
        {/* Bases Layer */}
        <button
          type="button"
          onClick={onToggleBasesLayer}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded
            transition-all duration-200
            ${showBasesLayer 
              ? 'bg-green-500/20 border border-green-500/50' 
              : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-700'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <Landmark className={`w-4 h-4 ${showBasesLayer ? 'text-green-400' : 'text-gray-400'}`} />
            <span className={`text-sm ${showBasesLayer ? 'text-white' : 'text-gray-300'}`}>
              Bases
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showBasesLayer && (
              <span className="text-xs text-green-400 font-mono">
                {basesCount}
              </span>
            )}
            <div 
              className={`
                w-8 h-4 rounded-full transition-colors relative
                ${showBasesLayer ? 'bg-green-500' : 'bg-gray-600'}
              `}
            >
              <div 
                className={`
                  absolute top-0.5 w-3 h-3 rounded-full bg-white
                  transition-transform duration-200
                  ${showBasesLayer ? 'left-4' : 'left-0.5'}
                `}
              />
            </div>
          </div>
        </button>
      </div>
      
      {/* Status Bar */}
      {hasActiveLayers && (
        <div className="px-3 py-2 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <span className="text-gray-500">
                {isLoading ? 'Updating...' : `Updated ${formatLastUpdated(lastUpdated)}`}
              </span>
            </div>
            
            {error && (
              <div className="flex items-center gap-1 text-red-400" title={error}>
                <Info className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Info Text */}
      {!hasActiveLayers && (
        <div className="px-3 py-2 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            Toggle layers to track US military
          </p>
        </div>
      )}
    </div>
  );
};

export default MilitaryLayersPanel;
