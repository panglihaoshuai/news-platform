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
  Info,
  Shield
} from 'lucide-react';
import { getThemeTokens } from '@/styles/designTokens';
import type { Theme } from '@/styles/designTokens';

interface MilitaryLayersPanelProps {
  theme?: Theme;
  militaryModeEnabled: boolean;
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
  onToggleMilitaryMode: () => void;
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
  theme = 'dark',
  militaryModeEnabled,
  showAirLayer,
  showBasesLayer,
  aircraftCount,
  basesCount,
  isLoading,
  lastUpdated,
  error,
  onToggleMilitaryMode,
  onToggleAirLayer,
  onToggleBasesLayer,
  onRefresh,
  className = '',
  onClose,
}) => {
  const tokens = getThemeTokens(theme);
  const hasActiveLayers = militaryModeEnabled && (showAirLayer || showBasesLayer);
  
  return (
    <div 
      className={`
        backdrop-blur-sm rounded-lg 
        overflow-hidden transition-all duration-300
        ${className}
      `}
      style={{ 
        width: '260px',
        backgroundColor: tokens.bg.secondary,
        border: `1px solid ${tokens.border.default}`,
        boxShadow: tokens.shadow.panel,
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 transition-colors duration-200"
        style={{ 
          borderBottom: `1px solid ${tokens.border.default}`,
        }}
      >
        <div className="flex items-center gap-2">
          <Landmark 
            className="w-4 h-4 transition-colors duration-200" 
            style={{ color: tokens.accent.up }} 
          />
          <span 
            className="text-sm font-semibold transition-colors duration-200"
            style={{ color: tokens.text.primary }}
          >
            Military Tracking
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded transition-all duration-200 hover:scale-110"
            style={{ 
              color: tokens.text.muted,
              backgroundColor: 'transparent',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div 
        className="px-3 py-2"
        style={{ borderBottom: `1px solid ${tokens.border.default}` }}
      >
        <button
          type="button"
          onClick={onToggleMilitaryMode}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded
            transition-all duration-200 hover:scale-[1.01]
            ${militaryModeEnabled ? 'border' : 'border'}
          `}
          style={{ 
            borderColor: militaryModeEnabled ? tokens.accent.down : tokens.border.default,
            backgroundColor: militaryModeEnabled ? `${tokens.accent.down}15` : tokens.bg.input,
          }}
        >
          <span 
            className="flex items-center gap-2 text-sm transition-colors duration-200"
            style={{ color: tokens.text.primary }}
          >
            <Shield 
              className={`w-4 h-4 transition-colors duration-200 ${militaryModeEnabled ? 'animate-pulse' : ''}`}
              style={{ color: militaryModeEnabled ? tokens.accent.down : tokens.text.muted }} 
            />
            Military Mode
          </span>
          <span 
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all duration-200`}
            style={{ 
              color: militaryModeEnabled ? tokens.accent.down : tokens.text.muted,
              backgroundColor: militaryModeEnabled ? `${tokens.accent.down}20` : 'transparent',
            }}
          >
            {militaryModeEnabled ? 'ON' : 'OFF'}
          </span>
        </button>
      </div>
      
      {/* Layer Toggles */}
      <div className="p-3 space-y-2">
        {/* Air Layer - Real-time via OpenSky */}
        <button
          type="button"
          onClick={onToggleAirLayer}
          disabled={!militaryModeEnabled}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded
            transition-all duration-200 hover:scale-[1.01]
            ${!militaryModeEnabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={{ 
            borderColor: showAirLayer ? tokens.accent.down : tokens.border.default,
            backgroundColor: showAirLayer ? `${tokens.accent.down}15` : tokens.bg.input,
            opacity: !militaryModeEnabled ? 0.5 : 1,
          }}
        >
          <div className="flex items-center gap-2">
            <Plane 
              className={`w-4 h-4 transition-colors duration-200 ${showAirLayer ? 'animate-pulse' : ''}`}
              style={{ color: showAirLayer ? tokens.accent.down : tokens.text.muted }} 
            />
            <span 
              className="text-sm transition-colors duration-200"
              style={{ color: showAirLayer ? tokens.text.primary : tokens.text.secondary }}
            >
              Aircraft
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showAirLayer && (
              <span 
                className="text-xs font-mono px-1.5 py-0.5 rounded animate-fade-in-scale"
                style={{ 
                  color: tokens.accent.down,
                  backgroundColor: `${tokens.accent.down}20`,
                }}
              >
                {aircraftCount}
              </span>
            )}
            <div 
              className={`
                w-8 h-4 rounded-full transition-colors duration-200 relative
                ${showAirLayer ? 'animate-pulse' : ''}
              `}
              style={{ 
                backgroundColor: showAirLayer ? tokens.accent.down : tokens.border.active,
              }}
            >
              <div 
                className={`
                  absolute top-0.5 w-3 h-3 rounded-full bg-white
                  transition-transform duration-200 shadow-sm
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
          disabled={!militaryModeEnabled}
          className={`
            w-full flex items-center justify-between px-3 py-2 rounded
            transition-all duration-200 hover:scale-[1.01]
            ${!militaryModeEnabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={{ 
            borderColor: showBasesLayer ? tokens.accent.up : tokens.border.default,
            backgroundColor: showBasesLayer ? `${tokens.accent.up}15` : tokens.bg.input,
            opacity: !militaryModeEnabled ? 0.5 : 1,
          }}
        >
          <div className="flex items-center gap-2">
            <Landmark 
              className="w-4 h-4 transition-colors duration-200"
              style={{ color: showBasesLayer ? tokens.accent.up : tokens.text.muted }} 
            />
            <span 
              className="text-sm transition-colors duration-200"
              style={{ color: showBasesLayer ? tokens.text.primary : tokens.text.secondary }}
            >
              Bases
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showBasesLayer && (
              <span 
                className="text-xs font-mono px-1.5 py-0.5 rounded animate-fade-in-scale"
                style={{ 
                  color: tokens.accent.up,
                  backgroundColor: `${tokens.accent.up}20`,
                }}
              >
                {basesCount}
              </span>
            )}
            <div 
              className="w-8 h-4 rounded-full transition-colors duration-200 relative"
              style={{ 
                backgroundColor: showBasesLayer ? tokens.accent.up : tokens.border.active,
              }}
            >
              <div 
                className={`
                  absolute top-0.5 w-3 h-3 rounded-full bg-white
                  transition-transform duration-200 shadow-sm
                  ${showBasesLayer ? 'left-4' : 'left-0.5'}
                `}
              />
            </div>
          </div>
        </button>
      </div>

      <div className="px-3 pb-2">
        <div 
          className="text-[10px] mb-1"
          style={{ color: tokens.text.muted }}
        >
          Aircraft Types
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <span style={{ color: '#ff3b30' }}>■ Bomber</span>
          <span style={{ color: '#0a84ff' }}>■ Transport</span>
          <span style={{ color: '#ffb000' }}>■ Fighter</span>
          <span style={{ color: '#30d158' }}>■ Helicopter</span>
        </div>
      </div>
      
      {/* Status Bar */}
      {hasActiveLayers && (
        <div 
          className="px-3 py-2 border-t transition-colors duration-200"
          style={{ borderColor: tokens.border.default }}
        >
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1 rounded transition-all duration-200 hover:scale-110 hover:rotate-180"
                style={{ 
                  color: tokens.text.muted,
                }}
              >
                <RefreshCw 
                  className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} 
                />
              </button>
              <span style={{ color: tokens.text.muted }}>
                {isLoading ? 'Updating...' : `Updated ${formatLastUpdated(lastUpdated)}`}
              </span>
            </div>
            
            {error && (
              <div 
                className="flex items-center gap-1 animate-pulse" 
                style={{ color: tokens.accent.down }}
                title={error}
              >
                <Info className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Info Text */}
      {!hasActiveLayers && (
        <div 
          className="px-3 py-2 border-t transition-colors duration-200"
          style={{ borderColor: tokens.border.default }}
        >
          <p 
            className="text-xs text-center transition-colors duration-200"
            style={{ color: tokens.text.muted }}
          >
            Toggle layers to track US military
          </p>
        </div>
      )}
    </div>
  );
};

export default MilitaryLayersPanel;
