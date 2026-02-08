import React, { useMemo } from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';
import { WorldMap } from './components/WorldMap';
import { NewsCard } from './components/NewsCard';
import { NewsItem } from '../types/news';

interface NewsVisualizationProps {
    news: NewsItem[];
    focusPoint?: { lat: number; lng: number } | null;
}

export const NewsVisualization: React.FC<NewsVisualizationProps> = ({ news = [], focusPoint: externalFocus }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // Automatic cycling logic: Focus on a different news item every few seconds
    const currentNewsIndex = useMemo(() => {
        if (news.length === 0) return -1;
        const interval = Math.floor(durationInFrames / news.length);
        return Math.floor(frame / interval) % news.length;
    }, [news, durationInFrames, frame]);

    const activeItem = news[currentNewsIndex];

    // Determine focus point: external manual selection takes priority, then automatic cycle
    const currentFocus = externalFocus || (activeItem?.geo_lat && activeItem?.geo_lng ? {
        lat: activeItem.geo_lat,
        lng: activeItem.geo_lng
    } : null);

    return (
        <AbsoluteFill style={{ backgroundColor: '#050505', display: 'flex', flexDirection: 'row' }}>
            {/* Left: Map (60%) */}
            <div style={{ flex: 6, position: 'relative', borderRight: '1px solid #333' }}>
                <WorldMap
                    markers={news.map(n => ({ lat: n.geo_lat!, lng: n.geo_lng!, title: n.title }))}
                    focusPoint={currentFocus}
                />

                {/* Overlay for Progress */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                    height: '2px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    zIndex: 100
                }}>
                    <div style={{
                        height: '100%',
                        width: `${(frame / durationInFrames) * 100}%`,
                        backgroundColor: '#ff4444'
                    }} />
                </div>
            </div>

            {/* Right: News Feed (40%) */}
            <div style={{
                flex: 4,
                padding: '20px',
                overflow: 'hidden',
                backgroundColor: '#0a0a0a',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/* Highlight current item */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    boxShadow: activeItem ? 'inset 0 0 100px rgba(255,0,0,0.05)' : 'none'
                }} />

                {news.map((item, i) => (
                    <div key={item.id || i} style={{
                        boxShadow: i === currentNewsIndex ? '0 0 20px rgba(255,0,0,0.2)' : 'none',
                        border: i === currentNewsIndex ? '1px solid rgba(255,0,0,0.3)' : '1px solid transparent',
                        transform: i === currentNewsIndex ? 'scale(1.02)' : 'scale(1)',
                        transition: 'all 0.3s ease'
                    }}>
                        <NewsCard item={item} index={i} />
                    </div>
                ))}

                {news.length === 0 && (
                    <div style={{ color: '#444', textAlign: 'center', marginTop: '100px' }}>
                        No news items to display
                    </div>
                )}
            </div>
        </AbsoluteFill>
    );
};
