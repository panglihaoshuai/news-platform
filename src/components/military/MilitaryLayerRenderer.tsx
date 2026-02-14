/**
 * Military Layer Renderer Component
 * 
 * Renders all military tracking layers (aircraft, vessels, bases) on the map
 * 
 * @module src/components/military/MilitaryLayerRenderer
 */

'use client';

import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { MilitaryAircraft, MilitaryVessel, USBase } from '@/lib/military/types';
import { createBaseMarkerElement } from './BaseMarker';
import { createAircraftMarkerElement } from './AircraftMarker';
import { createVesselMarkerElement } from './VesselMarker';

interface MilitaryLayerRendererProps {
  // Map instance
  map: maplibregl.Map | null;
  
  // Layer visibility
  showAirLayer: boolean;
  showNavalLayer: boolean;
  showBasesLayer: boolean;
  
  // Data
  aircraft: MilitaryAircraft[];
  vessels: MilitaryVessel[];
  bases: USBase[];
  
  // Selected items
  selectedAircraft: MilitaryAircraft | null;
  selectedVessel: MilitaryVessel | null;
  selectedBase: USBase | null;
  
  // Callbacks
  onSelectAircraft: (aircraft: MilitaryAircraft | null) => void;
  onSelectVessel: (vessel: MilitaryVessel | null) => void;
  onSelectBase: (base: USBase | null) => void;
}

// Source IDs
const AIRCRAFT_SOURCE_ID = 'military-aircraft';
const VESSELS_SOURCE_ID = 'military-vessels';
const BASES_SOURCE_ID = 'military-bases';

// Layer IDs
const AIRCRAFT_LAYER_ID = 'military-aircraft-layer';
const VESSELS_LAYER_ID = 'military-vessels-layer';
const BASES_LAYER_ID = 'military-bases-layer';

export const MilitaryLayerRenderer: React.FC<MilitaryLayerRendererProps> = ({
  map,
  showAirLayer,
  showNavalLayer,
  showBasesLayer,
  aircraft,
  vessels,
  bases,
  selectedAircraft,
  selectedVessel,
  selectedBase,
  onSelectAircraft,
  onSelectVessel,
  onSelectBase,
}) => {
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // ==========================================================================
  // Cleanup markers
  // ==========================================================================
  
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  // ==========================================================================
  // Handle aircraft markers
  // ==========================================================================
  
  useEffect(() => {
    if (!map || !showAirLayer) return;

    // Clear existing aircraft markers
    const existingMarkers = markersRef.current.filter(m => 
      m.getElement().classList.contains('military-aircraft-marker')
    );
    existingMarkers.forEach(m => m.remove());
    markersRef.current = markersRef.current.filter(m => 
      !m.getElement().classList.contains('military-aircraft-marker')
    );

    // Add new aircraft markers
    aircraft.forEach(aircraftItem => {
      if (aircraftItem.latitude === 0 && aircraftItem.longitude === 0) return;
      
      const isSelected = selectedAircraft?.id === aircraftItem.id;
      
      const el = createAircraftMarkerElement(
        aircraftItem,
        isSelected,
        onSelectAircraft
      );
      
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([aircraftItem.longitude, aircraftItem.latitude])
        .addTo(map);
      
      markersRef.current.push(marker);
    });

    return () => {
      // Cleanup handled by showAirLayer dependency
    };
  }, [map, showAirLayer, aircraft, selectedAircraft, onSelectAircraft]);

  // ==========================================================================
  // Handle vessel markers
  // ==========================================================================
  
  useEffect(() => {
    if (!map || !showNavalLayer) return;

    // Clear existing vessel markers
    const existingMarkers = markersRef.current.filter(m => 
      m.getElement().classList.contains('military-vessel-marker')
    );
    existingMarkers.forEach(m => m.remove());
    markersRef.current = markersRef.current.filter(m => 
      !m.getElement().classList.contains('military-vessel-marker')
    );

    // Add new vessel markers
    vessels.forEach(vessel => {
      if (vessel.latitude === 0 && vessel.longitude === 0) return;
      
      const isSelected = selectedVessel?.id === vessel.id;
      
      const el = createVesselMarkerElement(
        vessel,
        isSelected,
        onSelectVessel
      );
      
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([vessel.longitude, vessel.latitude])
        .addTo(map);
      
      markersRef.current.push(marker);
    });

    return () => {
      // Cleanup handled by showNavalLayer dependency
    };
  }, [map, showNavalLayer, vessels, selectedVessel, onSelectVessel]);

  // ==========================================================================
  // Handle base markers
  // ==========================================================================
  
  useEffect(() => {
    if (!map || !showBasesLayer) return;

    // Clear existing base markers
    const existingMarkers = markersRef.current.filter(m => 
      m.getElement().classList.contains('military-base-marker')
    );
    existingMarkers.forEach(m => m.remove());
    markersRef.current = markersRef.current.filter(m => 
      !m.getElement().classList.contains('military-base-marker')
    );

    // Add new base markers
    bases.forEach(base => {
      const isSelected = selectedBase?.id === base.id;
      
      const el = createBaseMarkerElement(
        base,
        isSelected,
        onSelectBase
      );
      
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([base.location.lng, base.location.lat])
        .addTo(map);
      
      markersRef.current.push(marker);
    });

    return () => {
      // Cleanup handled by showBasesLayer dependency
    };
  }, [map, showBasesLayer, bases, selectedBase, onSelectBase]);

  // ==========================================================================
  // Cleanup on unmount
  // ==========================================================================
  
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, []);

  // This component doesn't render anything
  // It manages markers directly on the map
  return null;
};

export default MilitaryLayerRenderer;
