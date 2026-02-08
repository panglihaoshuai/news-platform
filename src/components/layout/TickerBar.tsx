/**
 * TickerBar Component - Top Scrolling News Ticker
 * Bloomberg Terminal War Room Edition
 * 
 * Features:
 * - Horizontal scrolling display of P0/P1 news
 * - Priority color coding (P0: Red, P1: Orange)
 * - Smooth marquee animation
 * - JetBrains Mono font for terminal feel
 * - Click to navigate to news on map
 * 
 * @module src/components/layout/TickerBar
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { spacing } from '@/styles/spacing';
import { typography, textPresets } from '@/styles/typography';
import { getThemeTokens, getPriorityColor } from '@/styles/designTokens';
import { NewsItem, Theme, Priority } from '@/types/news';
import { Pause, Play, ChevronRight } from 'lucide-react';

// ============================================================================
// Props
// ============================================================================

interface TickerBarProps {
  news: NewsItem[];
  theme?: Theme;
  onNewsSelect?: (newsId: string) => void;
  autoPlay?: boolean;
  speed?: number; // px per second
}

// ============================================================================
// Priority Badge Component
// ============================================================================

function PriorityBadge({ 
  priority, 
  theme = 'dark' 
}: { 
  priority: Priority;
  theme?: Theme;
}) {
  const color = getPriorityColor(priority, theme);
  const isP0 = priority === 'P0';
  const isP1 = priority === 'P1';
  
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 2,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: '"JetBrains Mono", monospace',
        backgroundColor: isP0 ? `${color}20` : `${color}15`,
        color: color,
        border: `1px solid ${color}40`,
        marginRight: 8,
        animation: isP0 
          ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' 
          : isP1 
            ? 'breathe 3s ease-in-out infinite' 
            : 'none',
      }}
    >
      {priority}
      {isP0 && (
        <span 
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            backgroundColor: color,
            animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
      )}
    </span>
  );
}

// ============================================================================
// News Item Component
// ============================================================================

function TickerNewsItem({ 
  news, 
  theme = 'dark',
  onClick 
}: { 
  news: NewsItem;
  theme?: Theme;
  onClick?: () => void;
}) {
  const tokens = getThemeTokens(theme);
  const priority = news.importance_score >= 80 ? 'P0' 
    : news.importance_score >= 60 ? 'P1' 
    : news.importance_score >= 40 ? 'P2' 
    : 'P3';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 0',
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap' as const,
      }}
    >
      <PriorityBadge priority={priority as Priority} theme={theme} />
      <span
        style={{
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.size.ticker,
          fontWeight: typography.weight.medium,
          color: priority === 'P0' ? tokens.priority.p0 
            : priority === 'P1' ? tokens.priority.p1 
            : tokens.text.primary,
          letterSpacing: typography.letterSpacing.wider,
        }}
      >
        {news.title}
      </span>
      <span
        style={{
          marginLeft: 8,
          color: tokens.text.muted,
          fontSize: 10,
        }}
      >
        {news.source_name}
      </span>
      <ChevronRight 
        size={12} 
        style={{ 
          marginLeft: 8, 
          color: tokens.text.disabled,
          flexShrink: 0,
        }} 
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TickerBar({
  news,
  theme = 'dark',
  onNewsSelect,
  autoPlay = true,
  speed = 30,
}: TickerBarProps) {
  const tokens = getThemeTokens(theme);
  const [isPaused, setIsPaused] = useState(!autoPlay);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Filter to only P0/P1 news for ticker
  const tickerNews = news
    .filter(n => n.importance_score >= 60)
    .sort((a, b) => b.importance_score - a.importance_score)
    .slice(0, 20);

  // Measure container and content widths
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    if (contentRef.current) {
      setContentWidth(contentRef.current.scrollWidth);
    }
  }, [tickerNews, theme]);

  // Animation loop
  useEffect(() => {
    if (isPaused || contentWidth <= containerWidth) {
      setScrollProgress(0);
      return;
    }

    const duration = (contentWidth + containerWidth) / speed * 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed / duration) % 1;
      setScrollProgress(progress);
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, contentWidth, containerWidth, speed]);

  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const handleNewsClick = useCallback((newsId: string) => {
    onNewsSelect?.(newsId);
  }, [onNewsSelect]);

  if (tickerNews.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: spacing.layout.tickerHeight,
        backgroundColor: tokens.bg.primary,
        borderBottom: `1px solid ${tokens.border.default}`,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative' as const,
      }}
    >
      {/* Live Indicator */}
      <div
        style={{
          position: 'absolute' as const,
          left: 12,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 8px',
          backgroundColor: tokens.bg.secondary,
          borderRight: `1px solid ${tokens.border.default}`,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: isPaused ? tokens.text.muted : tokens.accent.up,
            animation: isPaused ? 'none' : 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
          {isPaused ? 'PAUSED' : 'LIVE'}
        </span>
      </div>

      {/* Ticker Content */}
      <div
        ref={contentRef}
        style={{
          marginLeft: 100,
          whiteSpace: 'nowrap' as const,
          transform: `translateX(${-scrollProgress * (contentWidth + containerWidth)}px)`,
          transition: isPaused ? 'transform 300ms ease-out' : 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {tickerNews.map((news) => (
          <TickerNewsItem
            key={news.id}
            news={news}
            theme={theme}
            onClick={() => handleNewsClick(news.id)}
          />
        ))}
        {/* Duplicate for seamless loop */}
        {tickerNews.map((news) => (
          <TickerNewsItem
            key={`${news.id}-dup`}
            news={news}
            theme={theme}
            onClick={() => handleNewsClick(news.id)}
          />
        ))}
      </div>

      {/* Controls */}
      <div
        style={{
          position: 'absolute' as const,
          right: 12,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <button
          onClick={handleTogglePause}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            backgroundColor: tokens.bg.secondary,
            border: `1px solid ${tokens.border.default}`,
            borderRadius: 4,
            cursor: 'pointer',
            color: tokens.text.muted,
            transition: 'all 150ms ease',
          }}
          title={isPaused ? 'Resume (Space)' : 'Pause (Space)'}
        >
          {isPaused ? (
            <Play size={12} />
          ) : (
            <Pause size={12} />
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default TickerBar;
