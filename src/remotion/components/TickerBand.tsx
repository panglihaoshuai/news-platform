/**
 * TickerBand Component - Remotion Video Scrolling Ticker
 * Bloomberg Terminal War Room Edition
 * 
 * Features:
 * - Horizontal scrolling marquee animation for video
 * - Priority color coding (P0: Red, P1: Orange)
 * - Infinite seamless loop
 * - 30-second full cycle duration
 * - JetBrains Mono font for terminal feel
 * 
 * @module src/remotion/components/TickerBand
 */

import React, { useRef, useEffect, useState } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { Theme } from '@/types/news';
import { getThemeTokens, getPriorityColor } from '@/styles/designTokens';
import { NewsItem } from '@/types/news';

// ============================================================================
// Props
// ============================================================================

interface TickerBandProps {
  news: NewsItem[];
  theme?: Theme;
  duration?: number; // seconds
  height?: number;
}

// ============================================================================
// News Item Component
// ============================================================================

function TickerNewsItem({
  news,
  theme = 'dark',
}: {
  news: NewsItem;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);
  
  const priority = news.importance_score >= 80 ? 'P0'
    : news.importance_score >= 60 ? 'P1'
    : news.importance_score >= 40 ? 'P2'
    : 'P3';

  const priorityColor = getPriorityColor(priority as 'P0' | 'P1' | 'P2' | 'P3', theme);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 12px',
        borderRight: `1px solid ${tokens.border.default}`,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {/* Priority Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 6px',
          borderRadius: 2,
          fontSize: 10,
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          backgroundColor: `${priorityColor}20`,
          color: priorityColor,
          border: `1px solid ${priorityColor}40`,
          marginRight: 8,
        }}
      >
        {priority}
        {priority === 'P0' && (
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: priorityColor,
            }}
          />
        )}
      </div>

      {/* News Title */}
      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 12,
          fontWeight: 500,
          color: tokens.text.primary,
          letterSpacing: '0.05em',
        }}
      >
        {news.title}
      </span>

      {/* Source */}
      <span
        style={{
          marginLeft: 8,
          fontSize: 10,
          color: tokens.text.muted,
        }}
      >
        {news.source_name}
      </span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export const TickerBand: React.FC<TickerBandProps> = ({
  news,
  theme = 'dark',
  duration = 30,
  height = 32,
}) => {
  const frame = useCurrentFrame();
  const fps = 30; // Assuming 30fps
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1920);
  const [contentWidth, setContentWidth] = useState(0);

  // Filter P0/P1 news for ticker
  const tickerNews = news
    .filter(n => n.importance_score >= 60)
    .sort((a, b) => b.importance_score - a.importance_score)
    .slice(0, 15);

  // Measure widths on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setContainerWidth(window.innerWidth);
    }
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.scrollWidth);
    }
  }, [tickerNews]);

  // Calculate scroll progress
  const totalDurationFrames = duration * fps;
  const progress = (frame % totalDurationFrames) / totalDurationFrames;

  // Interpolate X position for smooth scrolling
  // Scroll from right to left, then pause, then repeat
  const scrollDistance = contentWidth + containerWidth;
  const x = interpolate(
    progress,
    [0, 0.8, 1],
    [-scrollDistance, 0, 0],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.linear,
    }
  );

  const tokens = getThemeTokens(theme);

  // Duplicate content for seamless loop
  const allNews = [...tickerNews, ...tickerNews];

  return (
    <AbsoluteFill
      style={{
        height,
        backgroundColor: tokens.bg.primary,
        borderTop: `1px solid ${tokens.border.default}`,
        borderBottom: `1px solid ${tokens.border.default}`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Live Indicator */}
      <div
        style={{
          position: 'absolute' as const,
          left: 20,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 12px',
          backgroundColor: tokens.bg.secondary,
          borderRight: `1px solid ${tokens.border.default}`,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: tokens.accent.up,
            animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: '"JetBrains Mono", monospace',
            color: tokens.text.muted,
            textTransform: 'uppercase' as const,
            letterSpacing: 1,
          }}
        >
          LIVE
        </span>
      </div>

      {/* Scrolling Content */}
      <div
        ref={contentRef}
        style={{
          display: 'flex',
          transform: `translateX(${x}px)`,
          transition: 'transform 100ms linear',
        }}
      >
        {allNews.map((item, index) => (
          <TickerNewsItem
            key={`${item.id}-${index}`}
            news={item}
            theme={theme}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default TickerBand;
