import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { NewsItem } from '../../types/news';

interface NewsCardProps {
    item: NewsItem;
    index: number;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, index }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Entrance animation
    const delay = index * 5;
    const opacity = interpolate(frame - delay, [0, 20], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    const translateY = interpolate(frame - delay, [0, 20], [20, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    return (
        <div
            style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                padding: '16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(20,20,20,0.5)',
                marginBottom: '4px',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
            }}
        >
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.source_id}</span>
                <span>{new Date(item.published_at).toLocaleTimeString()}</span>
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', lineHeight: '1.2' }}>
                {item.title}
            </h3>
            <p style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {item.summary}
            </p>
        </div>
    );
};
