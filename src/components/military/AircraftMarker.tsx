/**
 * Military Aircraft Marker Component
 * 
 * Renders markers for US military aircraft on the map
 * 
 * @module src/components/military/AircraftMarker
 */

'use client';

import React from 'react';
import type { MilitaryAircraft } from '@/lib/military/types';

interface AircraftMarkerProps {
  aircraft: MilitaryAircraft;
  isSelected: boolean;
  onClick: (aircraft: MilitaryAircraft) => void;
}

/**
 * Get aircraft icon based on callsign type
 */
function getAircraftIcon(callsign: string | null): string {
  if (!callsign) return '✈️';
  
  const cs = callsign.toUpperCase();
  
  if (cs.includes('RCH') || cs.includes('REACH')) return '🛫'; // Transport
  if (cs.includes('VFA') || cs.includes('F18')) return '✈️'; // Fighter
  if (cs.includes('C130') || cs.includes('C17')) return '🛬'; // Cargo
  
  return '✈️';
}

/**
 * Format altitude for display
 */
function formatAltitude(altitude: number): string {
  if (altitude >= 1000) {
    return `${(altitude / 1000).toFixed(1)}k ft`;
  }
  return `${altitude} ft`;
}

/**
 * Format speed for display
 */
function formatSpeed(velocity: number): string {
  const knots = velocity * 1.944; // m/s to knots
  return `${Math.round(knots)} kts`;
}

export const AircraftMarker: React.FC<AircraftMarkerProps> = ({ 
  aircraft, 
  isSelected, 
  onClick 
}) => {
  const icon = getAircraftIcon(aircraft.callsign);
  
  return (
    <div
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
        onClick(aircraft);
      }}
      title={`${aircraft.callsign || 'Unknown'} - ${formatAltitude(aircraft.altitude)}`}
    >
      <div 
        className={`
          w-3 h-3 rounded-sm border border-white shadow-lg
          ${isSelected ? 'bg-red-500' : 'bg-red-400'}
        `}
        style={{ 
          transform: `rotate(${aircraft.heading}deg)`,
          boxShadow: isSelected 
            ? '0 0 0 4px rgba(239,68,68,0.4), 0 4px 12px rgba(0,0,0,0.5)' 
            : '0 2px 6px rgba(0,0,0,0.3)'
        }}
      >
        <div 
          className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-red-500 absolute -top-1 left-1/2 -translate-x-1/2"
          style={{ transform: `rotate(${aircraft.heading}deg)` }}
        />
      </div>
      
      {isSelected && (
        <div className="absolute left-1/2 transform -translate-x-1/2 mt-3 whitespace-nowrap">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
            <div className="font-semibold">{aircraft.callsign || 'Unknown'}</div>
            <div className="text-gray-400 text-[10px]">
              {formatAltitude(aircraft.altitude)} | {formatSpeed(aircraft.velocity)}
            </div>
            <div className="text-gray-400 text-[10px]">
              {aircraft.originCountry}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Create marker element for MapLibre
 */
export function createAircraftMarkerElement(
  aircraft: MilitaryAircraft,
  isSelected: boolean,
  onClick: (aircraft: MilitaryAircraft) => void
): HTMLDivElement {
  const el = document.createElement('div');
  
  el.className = 'military-aircraft-marker';
  el.style.cssText = `
    width: 12px;
    height: 12px;
    background-color: ${isSelected ? '#EF4444' : '#F87171'};
    border: 1px solid white;
    border-radius: 2px;
    cursor: pointer;
    box-shadow: ${isSelected 
      ? '0 0 0 4px rgba(239,68,68,0.4), 0 4px 12px rgba(0,0,0,0.5)' 
      : '0 2px 6px rgba(0,0,0,0.3)'
    };
    transition: all 0.2s ease;
    transform: rotate(${aircraft.heading}deg);
  `;
  
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(aircraft);
  });
  
  return el;
}

export default AircraftMarker;
