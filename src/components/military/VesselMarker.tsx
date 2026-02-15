/**
 * Military Vessel Marker Component
 * 
 * Renders markers for US military vessels on the map
 * 
 * @module src/components/military/VesselMarker
 */

'use client';

import React from 'react';
import type { MilitaryVessel } from '@/lib/military/types';

interface VesselMarkerProps {
  vessel: MilitaryVessel;
  isSelected: boolean;
  onClick: (vessel: MilitaryVessel) => void;
}

/**
 * Get vessel icon based on ship type
 */
function getVesselIcon(shipType: string): string {
  const type = shipType.toLowerCase();
  
  if (type.includes('warship') || type.includes('combat')) return '⚓';
  if (type.includes('auxiliary')) return '🚤';
  if (type.includes('carrier')) return '🏗️';
  if (type.includes('submarine')) return '🔻';
  
  return '🚢';
}

/**
 * Get vessel color based on status
 */
function getVesselColor(speed: number, status?: string): string {
  if (speed === 0 || status === 'at anchor' || status === 'moored') {
    return '#6B7280'; // Gray for stationary
  }
  return '#3B82F6'; // Blue for moving
}

/**
 * Format speed for display
 */
function formatSpeed(speed: number): string {
  if (speed === 0) return '0 kts';
  return `${speed.toFixed(1)} kts`;
}

export const VesselMarker: React.FC<VesselMarkerProps> = ({ 
  vessel, 
  isSelected, 
  onClick 
}) => {
  const color = getVesselColor(vessel.speed, vessel.navigationStatus);
  const icon = getVesselIcon(vessel.shipType);
  
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
        onClick(vessel);
      }}
      title={vessel.name || 'Unknown Vessel'}
    >
      <div 
        className={`
          w-4 h-4 rounded border border-white shadow-lg
          flex items-center justify-center text-xs
          ${isSelected ? 'bg-blue-600' : 'bg-blue-500'}
        `}
        style={{ 
          backgroundColor: color,
          transform: `rotate(${vessel.heading}deg)`,
          boxShadow: isSelected 
            ? '0 0 0 4px rgba(59,130,246,0.4), 0 4px 12px rgba(0,0,0,0.5)' 
            : '0 2px 6px rgba(0,0,0,0.3)'
        }}
      >
        <span style={{ transform: `rotate(-${vessel.heading}deg)` }}>
          {icon}
        </span>
      </div>
      
      {isSelected && (
        <div className="absolute left-1/2 transform -translate-x-1/2 mt-3 whitespace-nowrap">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
            <div className="font-semibold">{vessel.name || 'Unknown'}</div>
            <div className="text-gray-400 text-[10px]">
              {formatSpeed(vessel.speed)} | {vessel.heading}°
            </div>
            <div className="text-gray-400 text-[10px]">
              {vessel.flag} | {vessel.shipType}
            </div>
            {vessel.destination && (
              <div className="text-gray-400 text-[10px]">
                → {vessel.destination}
              </div>
            )}
          </div>
        </div>
      )}
    </button>
  );
};

/**
 * Create marker element for MapLibre
 */
export function createVesselMarkerElement(
  vessel: MilitaryVessel,
  isSelected: boolean,
  onClick: (vessel: MilitaryVessel) => void
): HTMLDivElement {
  const el = document.createElement('div');
  const color = getVesselColor(vessel.speed, vessel.navigationStatus);
  
  el.className = 'military-vessel-marker';
  el.style.cssText = `
    width: 16px;
    height: 16px;
    background-color: ${color};
    border: 1px solid white;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: ${isSelected 
      ? '0 0 0 4px rgba(59,130,246,0.4), 0 4px 12px rgba(0,0,0,0.5)' 
      : '0 2px 6px rgba(0,0,0,0.3)'
    };
    transition: all 0.2s ease;
    transform: rotate(${vessel.heading}deg);
  `;
  
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(vessel);
  });
  
  return el;
}

export default VesselMarker;
