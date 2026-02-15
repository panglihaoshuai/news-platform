/**
 * Military Base Marker Component
 * 
 * Renders markers for US overseas military bases on the map
 * 
 * @module src/components/military/BaseMarker
 */

'use client';

import React from 'react';
import type { USBase } from '@/lib/military/types';

interface BaseMarkerProps {
  base: USBase;
  isSelected: boolean;
  onClick: (base: USBase) => void;
}

/**
 * Get marker color based on base type
 */
function getBaseColor(type: string[]): string {
  if (type.includes('naval')) return '#3B82F6'; // Blue for naval
  if (type.includes('air')) return '#22C55E'; // Green for air
  if (type.includes('ground')) return '#F59E0B'; // Amber for ground
  return '#8B5CF6'; // Purple for combined
}

/**
 * Get branch icon
 */
function getBranchIcon(branch: string[]): string {
  if (branch.includes('airforce')) return '✈️';
  if (branch.includes('navy')) return '⚓';
  if (branch.includes('army')) return '🎖️';
  if (branch.includes('marines')) return '🦅';
  return '🎯';
}

export const BaseMarker: React.FC<BaseMarkerProps> = ({ 
  base, 
  isSelected, 
  onClick 
}) => {
  const color = getBaseColor(base.type);
  
  return (
    <button
      type="button"
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2 
        cursor-pointer transition-all duration-200
        ${isSelected ? 'z-50 scale-125' : 'z-10 hover:scale-110'}
      `}
      style={{
        left: 0,
        top: 0,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(base);
      }}
      title={`${base.nameCn} (${base.name})`}
    >
      <div 
        className={`
          w-4 h-4 rounded-full border-2 shadow-lg
          ${isSelected ? 'border-white' : 'border-gray-300'}
        `}
        style={{ 
          backgroundColor: color,
          boxShadow: isSelected 
            ? `0 0 0 4px ${color}40, 0 4px 12px rgba(0,0,0,0.5)` 
            : '0 2px 6px rgba(0,0,0,0.3)'
        }}
      />
      {isSelected && (
        <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
            <div className="font-semibold">{base.nameCn}</div>
            <div className="text-gray-400 text-[10px]">{base.name}</div>
            <div className="text-gray-400 text-[10px]">{base.country}</div>
          </div>
        </div>
      )}
    </button>
  );
};

/**
 * Create marker element for MapLibre
 */
export function createBaseMarkerElement(
  base: USBase,
  isSelected: boolean,
  onClick: (base: USBase) => void
): HTMLDivElement {
  const el = document.createElement('div');
  const color = getBaseColor(base.type);
  
  el.className = 'military-base-marker';
  el.style.cssText = `
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: ${color};
    border: ${isSelected ? '2px solid white' : '2px solid #9CA3AF'};
    cursor: pointer;
    box-shadow: ${isSelected 
      ? `0 0 0 4px ${color}40, 0 4px 12px rgba(0,0,0,0.5)` 
      : '0 2px 6px rgba(0,0,0,0.3)'
    };
    transition: all 0.2s ease;
  `;
  
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(base);
  });
  
  return el;
}

export default BaseMarker;
