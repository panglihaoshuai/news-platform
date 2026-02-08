import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';
import { Theme } from '@/types/news';
import { getThemeTokens, getPriorityColor } from '@/styles/designTokens';

interface PriorityIndicatorProps {
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    theme?: Theme;
    size?: number;
}

export const PriorityIndicator: React.FC<PriorityIndicatorProps> = ({
    priority,
    theme = 'dark',
    size = 16
}) => {
    const frame = useCurrentFrame();
    const tokens = getThemeTokens(theme);
    const color = getPriorityColor(priority, theme);

    // P0: Red pulse animation (scale 1 -> 1.5 -> 1, opacity 1 -> 0)
    if (priority === 'P0') {
        const pulseCycle = 60; // 60 frames = 1 second at 60fps
        const pulseFrame = frame % pulseCycle;
        
        const scale = interpolate(
            pulseFrame,
            [0, 30, 60],
            [1, 1.5, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        
        const opacity = interpolate(
            pulseFrame,
            [0, 30, 60],
            [1, 0.3, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
            <div style={{ position: 'relative', width: size, height: size }}>
                {/* Outer pulse ring */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        backgroundColor: color,
                        transform: `scale(${scale})`,
                        opacity: opacity * 0.5,
                    }}
                />
                {/* Inner solid circle */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 2,
                        borderRadius: '50%',
                        backgroundColor: color,
                        boxShadow: `0 0 ${size}px ${color}`,
                    }}
                />
            </div>
        );
    }

    // P1: Gold breathe animation (scale 1 -> 1.2 -> 1)
    if (priority === 'P1') {
        const breatheCycle = 90; // 90 frames = 1.5 seconds
        const breatheFrame = frame % breatheCycle;
        
        const scale = interpolate(
            breatheFrame,
            [0, 45, 90],
            [1, 1.2, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        const opacity = interpolate(
            breatheFrame,
            [0, 45, 90],
            [0.8, 1, 0.8],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
            <div style={{ position: 'relative', width: size, height: size }}>
                <div
                    style={{
                        width: size,
                        height: size,
                        borderRadius: '50%',
                        backgroundColor: color,
                        transform: `scale(${scale})`,
                        opacity,
                        boxShadow: `0 0 ${size * 0.5}px ${color}`,
                    }}
                />
            </div>
        );
    }

    // P2/P3: Static markers
    return (
        <div
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color,
                opacity: priority === 'P2' ? 0.9 : 0.6,
            }}
        />
    );
};

export default PriorityIndicator;
