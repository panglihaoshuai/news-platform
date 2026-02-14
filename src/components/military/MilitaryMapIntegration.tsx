/**
 * Military Map Integration Component
 * 
 * Wraps InteractiveMap with military tracking layers
 * Provides complete military tracking functionality integrated with news map
 * 
 * @module src/components/military/MilitaryMapIntegration
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { NewsItem, MapDisplayMode, Theme } from '@/types/news';
import { getThemeTokens } from '@/styles/designTokens';
import { REGION_CONFIG, getCountryByCode } from '@/config/region-mapping';
import { useMilitaryTracking } from '@/hooks/useMilitaryTracking';
import { MilitaryLayersPanel } from './MilitaryLayersPanel';
import { MilitaryLayerRenderer } from './MilitaryLayerRenderer';

interface MilitaryMapIntegrationProps {
    news: NewsItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    theme?: Theme;
    displayMode?: MapDisplayMode;
    focusRegion?: string;
    focusCountry?: string;
}

function getPriority(importanceScore: number): 'P0' | 'P1' | 'P2' | 'P3' {
    if (importanceScore >= 80) return 'P0';
    if (importanceScore >= 60) return 'P1';
    if (importanceScore >= 40) return 'P2';
    return 'P3';
}

export const MilitaryMapIntegration: React.FC<MilitaryMapIntegrationProps> = ({ 
    news, 
    selectedId, 
    onSelect,
    theme = 'dark',
    displayMode = 'all',
    focusRegion = 'global',
    focusCountry = 'all',
}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [userInteracted, setUserInteracted] = useState(false);
    const interactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tokens = getThemeTokens(theme);

    // Military tracking hook
    const military = useMilitaryTracking();
    
    // Handle selection from both news and military
    const handleSelect = (id: string) => {
        onSelect(id);
    };

    // Handle military selections
    const handleSelectAircraft = (aircraft: any) => {
        if (aircraft && map.current) {
            map.current.flyTo({
                center: [aircraft.longitude, aircraft.latitude],
                zoom: 6,
                speed: 0.8,
                curve: 1.4,
                essential: true
            });
        }
    };

    const handleSelectVessel = (vessel: any) => {
        if (vessel && map.current) {
            map.current.flyTo({
                center: [vessel.longitude, vessel.latitude],
                zoom: 8,
                speed: 0.8,
                curve: 1.4,
                essential: true
            });
        }
    };

    const handleSelectBase = (base: any) => {
        if (base && map.current) {
            map.current.flyTo({
                center: [base.location.lng, base.location.lat],
                zoom: 8,
                speed: 0.8,
                curve: 1.4,
                essential: true
            });
        }
    };

    // Auto-Pilot Logic
    useEffect(() => {
        if (!news.length) return;

        const interval = setInterval(() => {
            if (userInteracted) return;

            const sorted = [...news].sort(
                (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
            );

            const currentIndex = sorted.findIndex(n => n.id === selectedId);
            const nextIndex = (currentIndex + 1) % sorted.length;
            if (sorted[nextIndex]) {
                onSelect(sorted[nextIndex].id);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [news, selectedId, onSelect, userInteracted]);

    // Map Initialization
    useEffect(() => {
        if (!mapContainer.current) return;
        if (map.current) return;

        const apiKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
        const styleUrl = apiKey
            ? `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${apiKey}`
            : 'https://demotiles.maplibre.org/style.json';

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: styleUrl,
            center: [10, 20],
            zoom: 1.5,
            attributionControl: false,
            maxBounds: [[-179, -60], [179, 85]],
            renderWorldCopies: false,
        });

        map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

        map.current.on('load', () => {
            console.log('Map loaded');
            setIsLoaded(true);
        });

        const onInteraction = () => {
            setUserInteracted(true);
            if (interactionTimer.current) {
                clearTimeout(interactionTimer.current);
            }
            interactionTimer.current = setTimeout(() => {
                setUserInteracted(false);
            }, 30000);
        };

        map.current.on('mousedown', onInteraction);
        map.current.on('wheel', onInteraction);
        map.current.on('touchstart', onInteraction);

        return () => {
            if (interactionTimer.current) {
                clearTimeout(interactionTimer.current);
            }
            map.current?.remove();
            map.current = null;
        };
    }, []);

    // News Data Source
    useEffect(() => {
        if (!isLoaded || !map.current) return;

        const sourceId = 'news-source';
        const isPriorityMode = displayMode === 'priority';
        const isHeatmapMode = displayMode === 'heatmap';

        const features: GeoJSON.Feature[] = news
            .filter(n => n.geo_lat && n.geo_lng)
            .filter((item) => !isPriorityMode || item.importance_score >= 60)
            .map(n => ({
                type: 'Feature' as const,
                properties: {
                    id: n.id,
                    title: n.title,
                    country: n.country_code,
                    priority: getPriority(n.importance_score),
                },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [n.geo_lng!, n.geo_lat!]
                }
            }));

        const geoJsonData: GeoJSON.FeatureCollection = { 
            type: 'FeatureCollection', 
            features 
        };

        const source = map.current.getSource(sourceId) as maplibregl.GeoJSONSource;
        if (source) {
            source.setData(geoJsonData);
        } else {
            map.current.addSource(sourceId, {
                type: 'geojson',
                data: geoJsonData,
                cluster: true,
                clusterMaxZoom: 4,
                clusterRadius: 50
            });

            map.current.addLayer({
                id: 'clusters',
                type: 'circle',
                source: sourceId,
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': tokens.heat.high,
                    'circle-radius': 20,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': tokens.bg.primary
                }
            });

            map.current.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: sourceId,
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 14,
                },
                paint: {
                    'text-color': tokens.text.primary
                }
            });

            map.current.addLayer({
                id: 'unclustered-point',
                type: 'circle',
                source: sourceId,
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': [
                        'match',
                        ['get', 'priority'],
                        'P0', tokens.priority.p0,
                        'P1', tokens.priority.p1,
                        'P2', tokens.priority.p2,
                        tokens.priority.p3
                    ],
                    'circle-radius': [
                        'match',
                        ['get', 'priority'],
                        'P0', 12,
                        'P1', 10,
                        8
                    ],
                    'circle-stroke-width': 2,
                    'circle-stroke-color': tokens.bg.primary,
                    'circle-opacity': 0.95
                }
            });

            map.current.addLayer({
                id: 'breaking-label',
                type: 'symbol',
                source: sourceId,
                filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'priority'], 'P0']],
                layout: {
                    'text-field': 'BREAKING',
                    'text-size': 10,
                    'text-offset': [0, -1.8],
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                },
                paint: {
                    'text-color': tokens.priority.p0,
                    'text-halo-color': tokens.bg.primary,
                    'text-halo-width': 1,
                },
            });

            map.current.on('click', 'clusters', async (e) => {
                const features = map.current?.queryRenderedFeatures(e.point, { layers: ['clusters'] });
                const clusterId = features?.[0].properties.cluster_id;
                const src = map.current?.getSource(sourceId) as maplibregl.GeoJSONSource;
                if (src && clusterId) {
                    const zoom = await src.getClusterExpansionZoom(clusterId);
                    map.current?.flyTo({
                        center: (features?.[0].geometry as any).coordinates,
                        zoom: zoom
                    });
                }
            });

            map.current.on('click', 'unclustered-point', (e) => {
                const id = e.features?.[0].properties.id;
                onSelect(id);
                setUserInteracted(true);
            });

            map.current.on('mouseenter', 'clusters', () => {
                if (map.current) map.current.getCanvas().style.cursor = 'pointer';
            });
            map.current.on('mouseleave', 'clusters', () => {
                if (map.current) map.current.getCanvas().style.cursor = '';
            });
            map.current.on('mouseenter', 'unclustered-point', () => {
                if (map.current) map.current.getCanvas().style.cursor = 'pointer';
            });
            map.current.on('mouseleave', 'unclustered-point', () => {
                if (map.current) map.current.getCanvas().style.cursor = '';
            });
        }

        if (map.current.getLayer('clusters')) {
            const clusterColor = isHeatmapMode
                ? [
                    'step',
                    ['get', 'point_count'],
                    tokens.heat.low,
                    10,
                    tokens.heat.medium,
                    25,
                    tokens.heat.high,
                    50,
                    tokens.heat.critical,
                ]
                : tokens.heat.high;

            map.current.setPaintProperty('clusters', 'circle-color', clusterColor);
        }

        if (map.current.getLayer('unclustered-point')) {
            map.current.setLayoutProperty('unclustered-point', 'visibility', isHeatmapMode ? 'none' : 'visible');
        }

        if (map.current.getLayer('breaking-label')) {
            map.current.setLayoutProperty('breaking-label', 'visibility', isHeatmapMode ? 'none' : 'visible');
        }
    }, [news, isLoaded, onSelect, tokens, displayMode]);

    // FlyTo selection
    useEffect(() => {
        if (!isLoaded || !map.current || !selectedId) return;

        const item = news.find(n => n.id === selectedId);
        if (item && item.geo_lng && item.geo_lat) {
            map.current.flyTo({
                center: [item.geo_lng, item.geo_lat],
                zoom: 5,
                speed: 0.8,
                curve: 1.4,
                essential: true
            });
        }
    }, [selectedId, isLoaded, news]);

    // FlyTo region/country
    useEffect(() => {
        if (!isLoaded || !map.current) return;

        if (focusCountry && focusCountry !== 'all') {
            const country = getCountryByCode(focusCountry);
            if (country) {
                map.current.flyTo({
                    center: [country.longitude, country.latitude],
                    zoom: 4.2,
                    speed: 0.8,
                    curve: 1.35,
                    essential: true,
                });
                return;
            }
        }

        if (focusRegion && focusRegion !== 'global') {
            const region = REGION_CONFIG.find(
                (r) => r.code.toLowerCase() === focusRegion.toLowerCase()
            );
            if (region) {
                map.current.flyTo({
                    center: [region.longitude, region.latitude],
                    zoom: region.zoom,
                    speed: 0.8,
                    curve: 1.35,
                    essential: true,
                });
            }
        }
    }, [focusRegion, focusCountry, isLoaded]);

    return (
        <div className="relative w-full h-full" style={{ backgroundColor: tokens.bg.map }}>
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Military Layer Renderer */}
            <MilitaryLayerRenderer
                map={map.current}
                showAirLayer={military.isAirLayerActive}
                showNavalLayer={military.isNavalLayerActive}
                showBasesLayer={military.isBasesLayerActive}
                aircraft={military.aircraft}
                vessels={military.vessels}
                bases={military.bases}
                selectedAircraft={military.selectedAircraft}
                selectedVessel={military.selectedVessel}
                selectedBase={military.selectedBase}
                onSelectAircraft={handleSelectAircraft}
                onSelectVessel={handleSelectVessel}
                onSelectBase={handleSelectBase}
            />

            {/* Military Control Panel */}
            <div className="absolute top-4 right-4 z-20">
                <MilitaryLayersPanel
                    showAirLayer={military.isAirLayerActive}
                    showBasesLayer={military.isBasesLayerActive}
                    aircraftCount={military.aircraftCount}
                    basesCount={military.basesCount}
                    isLoading={military.isLoading}
                    lastUpdated={military.lastUpdated}
                    error={military.error}
                    onToggleAirLayer={military.toggleAirLayer}
                    onToggleBasesLayer={military.toggleBasesLayer}
                    onRefresh={military.refresh}
                />
            </div>

            {/* Auto-Pilot Indicator */}
            <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 pointer-events-none">
                <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ 
                        backgroundColor: userInteracted ? tokens.text.disabled : '#ef4444' 
                    }} 
                />
                <span 
                    className="text-[10px] uppercase font-mono"
                    style={{ color: tokens.text.muted }}
                >
                    {userInteracted ? 'Manual Control' : 'Auto-Pilot Engaged'}
                </span>
            </div>
        </div>
    );
};

export default MilitaryMapIntegration;
