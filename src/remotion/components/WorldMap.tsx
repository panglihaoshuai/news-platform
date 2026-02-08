import React, { useEffect, useRef, useState } from 'react';
import { AbsoluteFill, useCurrentFrame, delayRender, continueRender } from 'remotion';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Theme } from '@/types/news';
import { getThemeTokens } from '@/styles/designTokens';

interface WorldMapProps {
    markers?: { lat: number; lng: number; title: string; priority?: 'P0' | 'P1' | 'P2' | 'P3' }[];
    focusPoint?: { lat: number; lng: number } | null;
    theme?: Theme;
}

export const WorldMap: React.FC<WorldMapProps> = ({ markers = [], focusPoint, theme = 'dark' }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const frame = useCurrentFrame();
    const [handle, setHandle] = useState<number | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const tokens = getThemeTokens(theme);

    useEffect(() => {
        if (!mapContainer.current) return;

        // Start delay
        const h = delayRender('Loading MapLibre');
        setHandle(h);

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
            center: [0, 20],
            zoom: 1.5,
            interactive: false,
        });

        map.current.on('load', () => {
            setIsLoaded(true);
            if (h !== null) continueRender(h);
        });

        return () => {
            map.current?.remove();
        };
    }, []);

    // Handle markers and camera
    useEffect(() => {
        if (!isLoaded || !map.current) return;

        // Clear and redraw markers with priority colors
        markers.forEach((marker) => {
            if (marker.lat && marker.lng) {
                const color = marker.priority === 'P0' ? tokens.priority.p0 :
                    marker.priority === 'P1' ? tokens.priority.p1 :
                    marker.priority === 'P2' ? tokens.priority.p2 :
                    tokens.priority.p3;
                new maplibregl.Marker({ color })
                    .setLngLat([marker.lng, marker.lat])
                    .addTo(map.current!);
            }
        });
    }, [isLoaded, markers, tokens]);

    // Camera Focus Animation
    useEffect(() => {
        if (!isLoaded || !map.current || !focusPoint) return;

        map.current.flyTo({
            center: [focusPoint.lng, focusPoint.lat],
            zoom: 4,
            duration: 2000,
            essential: true
        });
    }, [isLoaded, focusPoint]);

    // Frame-driven animation for rotation
    useEffect(() => {
        if (!isLoaded || !map.current) return;
        map.current.setBearing(frame * 0.1);
    }, [frame, isLoaded]);

    return (
        <AbsoluteFill>
            <div
                ref={mapContainer}
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: tokens.bg.map
                }}
            />
        </AbsoluteFill>
    );
};
