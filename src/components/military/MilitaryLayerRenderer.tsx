/**
 * Military Layer Renderer Component
 *
 * Renders aircraft, bases, trajectories and surge highlights.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Feature, FeatureCollection, LineString, Point } from 'geojson';
import type { MilitaryAircraft, MilitaryVessel, USBase } from '@/lib/military/types';
import { createBaseMarkerElement } from './BaseMarker';
import { createAircraftMarkerElement } from './AircraftMarker';
import { calculateBaseActivity } from '@/lib/military/density-calculator';

interface MilitaryLayerRendererProps {
  map: maplibregl.Map | null;
  showAirLayer: boolean;
  showNavalLayer: boolean;
  showBasesLayer: boolean;
  aircraft: MilitaryAircraft[];
  vessels: MilitaryVessel[];
  bases: USBase[];
  selectedAircraft: MilitaryAircraft | null;
  selectedVessel: MilitaryVessel | null;
  selectedBase: USBase | null;
  onSelectAircraft: (aircraft: MilitaryAircraft | null) => void;
  onSelectVessel: (vessel: MilitaryVessel | null) => void;
  onSelectBase: (base: USBase | null) => void;
}

const TRAJECTORY_SOURCE_ID = 'military-aircraft-trajectories';
const TRAJECTORY_LAYER_ID = 'military-aircraft-trajectories-line';
const START_SOURCE_ID = 'military-aircraft-start-points';
const START_LAYER_ID = 'military-aircraft-start-points-layer';
const SURGE_SOURCE_ID = 'military-base-surges';
const SURGE_LAYER_ID = 'military-base-surges-layer';

export const MilitaryLayerRenderer: React.FC<MilitaryLayerRendererProps> = ({
  map,
  showAirLayer,
  showBasesLayer,
  aircraft,
  bases,
  selectedAircraft,
  selectedBase,
  onSelectAircraft,
  onSelectBase,
}) => {
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const trajectoryRef = useRef<Map<string, Array<[number, number]>>>(new Map());
  const baselineRef = useRef<Record<string, number>>({});

  const surgeFeatures = useMemo(() => {
    const { activity, nextBaseline } = calculateBaseActivity(aircraft, bases, baselineRef.current);
    baselineRef.current = nextBaseline;
    return activity
      .filter((item) => item.isSurge)
      .map((item) => {
        const base = bases.find((b) => b.id === item.baseId);
        if (!base) return null;
        const feature: Feature<Point, { ratio: number; count: number; baseId: string }> = {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [base.location.lng, base.location.lat] },
          properties: {
            ratio: item.ratio,
            count: item.count,
            baseId: item.baseId,
          },
        };
        return feature;
      })
      .filter((f): f is Feature<Point, { ratio: number; count: number; baseId: string }> => Boolean(f));
  }, [aircraft, bases]);

  const clearMarkerClass = useCallback((className: string): void => {
    markersRef.current = markersRef.current.filter((m) => {
      const match = m.getElement().classList.contains(className);
      if (match) {
        m.remove();
      }
      return !match;
    });
  }, []);

  useEffect(() => {
    if (!map || !showAirLayer) {
      clearMarkerClass('military-aircraft-marker');
      return;
    }

    clearMarkerClass('military-aircraft-marker');

    aircraft.forEach((aircraftItem) => {
      if (aircraftItem.latitude === 0 && aircraftItem.longitude === 0) return;
      const isSelected = selectedAircraft?.id === aircraftItem.id;
      const el = createAircraftMarkerElement(aircraftItem, isSelected, onSelectAircraft);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([aircraftItem.longitude, aircraftItem.latitude])
        .addTo(map);
      markersRef.current.push(marker);

      const history = trajectoryRef.current.get(aircraftItem.id) || [];
      const next = [...history, [aircraftItem.longitude, aircraftItem.latitude] as [number, number]];
      trajectoryRef.current.set(aircraftItem.id, next.slice(-24));
    });
  }, [aircraft, clearMarkerClass, map, onSelectAircraft, selectedAircraft, showAirLayer]);

  useEffect(() => {
    if (!map || !showBasesLayer) {
      clearMarkerClass('military-base-marker');
      return;
    }

    clearMarkerClass('military-base-marker');
    bases.forEach((base) => {
      const isSelected = selectedBase?.id === base.id;
      const el = createBaseMarkerElement(base, isSelected, onSelectBase);
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([base.location.lng, base.location.lat])
        .addTo(map);
      markersRef.current.push(marker);
    });
  }, [bases, clearMarkerClass, map, onSelectBase, selectedBase, showBasesLayer]);

  useEffect(() => {
    if (!map) return;

    const lines: Feature<LineString>[] = [];
    const starts: Feature<Point>[] = [];
    trajectoryRef.current.forEach((coords, id) => {
      if (coords.length < 2) return;
      lines.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: { id },
      });
      starts.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coords[0] },
        properties: { id },
      });
    });

    const lineCollection: FeatureCollection<LineString> = { type: 'FeatureCollection', features: showAirLayer ? lines : [] };
    const startCollection: FeatureCollection<Point> = { type: 'FeatureCollection', features: showAirLayer ? starts : [] };

    const trajectorySource = map.getSource(TRAJECTORY_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (trajectorySource) {
      trajectorySource.setData(lineCollection);
    } else {
      map.addSource(TRAJECTORY_SOURCE_ID, { type: 'geojson', data: lineCollection });
      map.addLayer({
        id: TRAJECTORY_LAYER_ID,
        type: 'line',
        source: TRAJECTORY_SOURCE_ID,
        paint: {
          'line-color': '#ffb000',
          'line-width': 2,
          'line-opacity': 0.75,
        },
      });
    }

    const startSource = map.getSource(START_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (startSource) {
      startSource.setData(startCollection);
    } else {
      map.addSource(START_SOURCE_ID, { type: 'geojson', data: startCollection });
      map.addLayer({
        id: START_LAYER_ID,
        type: 'circle',
        source: START_SOURCE_ID,
        paint: {
          'circle-color': '#ffffff',
          'circle-radius': 3,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#111827',
        },
      });
    }

    const surgeCollection: FeatureCollection<Point, { ratio: number; count: number; baseId: string }> = {
      type: 'FeatureCollection',
      features: showAirLayer && showBasesLayer ? surgeFeatures : [],
    };
    const surgeSource = map.getSource(SURGE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (surgeSource) {
      surgeSource.setData(surgeCollection);
    } else {
      map.addSource(SURGE_SOURCE_ID, { type: 'geojson', data: surgeCollection });
      map.addLayer({
        id: SURGE_LAYER_ID,
        type: 'circle',
        source: SURGE_SOURCE_ID,
        paint: {
          'circle-color': '#ff3b30',
          'circle-opacity': 0.28,
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            4,
            18,
            12,
            30,
          ],
          'circle-stroke-color': '#ff3b30',
          'circle-stroke-width': 2,
        },
      });
    }
  }, [map, showAirLayer, showBasesLayer, surgeFeatures]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => {
        m.remove();
      });
      markersRef.current = [];

      if (!map) return;
      [TRAJECTORY_LAYER_ID, START_LAYER_ID, SURGE_LAYER_ID].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      [TRAJECTORY_SOURCE_ID, START_SOURCE_ID, SURGE_SOURCE_ID].forEach((id) => {
        if (map.getSource(id)) map.removeSource(id);
      });
    };
  }, [map]);

  return null;
};

export default MilitaryLayerRenderer;
