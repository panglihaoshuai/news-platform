'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { NewsItem, MapDisplayMode, Theme } from '@/types/news';
import { getThemeTokens, getPriorityColor } from '@/styles/designTokens';
import { REGION_CONFIG, getCountryByCode } from '@/config/region-mapping';

interface InteractiveMapProps {
    news: NewsItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    theme?: Theme;
    displayMode?: MapDisplayMode;
    focusRegion?: string;
    focusCountry?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
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
    const userInteracted = useRef(false);
    const interactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tokens = getThemeTokens(theme);

    // Auto-Pilot Logic
    useEffect(() => {
        if (!news.length) return;

        const interval = setInterval(() => {
            if (userInteracted.current) return;

            const sorted = [...news].sort(
                (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
            );

            const currentIndex = sorted.findIndex(n => n.id === selectedId);
            const nextIndex = (currentIndex + 1) % sorted.length;
            if (sorted[nextIndex]) {
                console.log('Auto-Pilot switching to:', sorted[nextIndex].title);
                onSelect(sorted[nextIndex].id);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [news, selectedId, onSelect]);

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

        // Interaction listeners
        const onInteraction = () => {
            userInteracted.current = true;
            if (interactionTimer.current) {
                clearTimeout(interactionTimer.current);
            }
            interactionTimer.current = setTimeout(() => {
                userInteracted.current = false;
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

    // Data Source Management (Clusters & Points)
    useEffect(() => {
        if (!isLoaded || !map.current) return;

        const sourceId = 'news-source';
        const features = news
            .filter(n => n.geo_lat && n.geo_lng)
            .map(n => ({
                type: 'Feature',
                properties: {
                    id: n.id,
                    title: n.title,
                    country: n.country_code
                },
                geometry: {
                    type: 'Point',
                    coordinates: [n.geo_lng!, n.geo_lat!] // Ensure numbers
                }
            }));

        const geoJsonData: any = { type: 'FeatureCollection', features };

        // Update or Add Source
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

            // 1. Clusters Layer (Heat Color Circles)
            map.current.addLayer({
                id: 'clusters',
                type: 'circle',
                source: sourceId,
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color': tokens.heat.high, // Use heat color for clusters
                    'circle-radius': 20,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': tokens.bg.primary
                }
            });

            // 2. Cluster Count Text
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

            // 3. Unclustered Points (Individual News) - Color by Priority
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

            // Click Cluster -> Zoom
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

            // Click Point -> Select
            map.current.on('click', 'unclustered-point', (e) => {
                const id = e.features?.[0].properties.id;
                onSelect(id);
                userInteracted.current = true;
            });

            // Cursor Pointers
            const setPointer = () => {
                if (map.current) {
                    map.current.getCanvas().style.cursor = 'pointer';
                }
            };
            const resetPointer = () => {
                if (map.current) {
                    map.current.getCanvas().style.cursor = '';
                }
            };
            map.current.on('mouseenter', 'clusters', setPointer);
            map.current.on('mouseleave', 'clusters', resetPointer);
            map.current.on('mouseenter', 'unclustered-point', setPointer);
            map.current.on('mouseleave', 'unclustered-point', resetPointer);
        }
    }, [news, isLoaded, onSelect, tokens]);

    // Camera Synchronization (FlyTo) - Independent Effect
    useEffect(() => {
        if (!isLoaded || !map.current || !selectedId) return;

        const item = news.find(n => n.id === selectedId);
        if (item && item.geo_lng && item.geo_lat) {
            console.log('Flying to:', item.title, item.geo_lat, item.geo_lng);
            map.current.flyTo({
                center: [item.geo_lng, item.geo_lat],
                zoom: 5,
                speed: 0.8, // Smooth speed
                curve: 1.4, // Cinematic curve
                essential: true
            });

            // Optional: Highlight styling could go here
        }
    }, [selectedId, isLoaded, news]); // Only run when selection changes

    // Camera focus by selected region/country filter
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

            {/* Auto-Pilot Indicator */}
            <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2 pointer-events-none">
                <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ 
                        backgroundColor: userInteracted.current ? tokens.text.disabled : '#ef4444' 
                    }} 
                />
                <span 
                    className="text-[10px] uppercase font-mono"
                    style={{ color: tokens.text.muted }}
                >
                    {userInteracted.current ? 'Manual Control' : 'Auto-Pilot Engaged'}
                </span>
            </div>
        </div>
    );
};
