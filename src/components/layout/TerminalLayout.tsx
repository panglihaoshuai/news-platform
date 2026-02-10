/**
 * TerminalLayout - Main Layout Component
 * Bloomberg Terminal War Room Edition
 * 
 * Layout Structure:
 * ┌─────────────────────────────┐
 * │ TICKER BAR (32px)           │ ← Top fixed
 * ├──────────┬──────────┬──────┤
 * │          │          │MARKET │ ← Main content area
 * │   MAP    │   NEWS  │ PANEL │ 
 * │ (60%)    │  (30%)   │(10%)  │
 * │          │          │       │
 * ├──────────┴──────────┴──────┤
 * │ STATUS BAR (28px)           │ ← Bottom fixed
 * └─────────────────────────────┘
 * 
 * Features:
 * - Responsive to display mode changes
 * - Ticker and status bars are fixed
 * - Market panel is collapsible
 * - Theme-aware styling
 * 
 * @module src/components/layout/TerminalLayout
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { spacing } from '@/styles/spacing';
import { getThemeTokens, Theme } from '@/styles/designTokens';
import { DisplayMode } from '@/types/news';
import { useDisplayMode } from '@/hooks/useDisplayMode';

// ============================================================================
// Props
// ============================================================================

interface TerminalLayoutProps {
  children: {
    ticker?: React.ReactNode;
    map?: React.ReactNode;
    news?: React.ReactNode;
    market?: React.ReactNode;
    status?: React.ReactNode;
  };
  theme?: Theme;
  showTicker?: boolean;
  showStatus?: boolean;
  showMarket?: boolean;
}

// ============================================================================
// Layout Sections
// ============================================================================

/**
 * Ticker Bar Section (fixed height: 32px)
 */
export function TickerSection({ 
  children, 
  theme = 'dark' 
}: { 
  children: React.ReactNode;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);
  
  return (
    <div
      style={{
        height: spacing.layout.tickerHeight,
        backgroundColor: tokens.bg.secondary,
        borderBottom: `1px solid ${tokens.border.default}`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Main Content Section (flex grow)
 */
export function MainContent({ 
  children,
  className = '',
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div 
      className={`flex-1 flex overflow-hidden ${className}`}
      style={{ 
        height: `calc(100vh - ${spacing.layout.tickerHeight}px - ${spacing.layout.statusHeight}px)`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Map Section (variable width based on display mode)
 */
export function MapSection({ 
  children, 
  width = 0.6,
  theme = 'dark',
}: { 
  children: React.ReactNode;
  width?: number;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);
  
  return (
    <div
      style={{
        flex: `0 0 ${Math.max(10, Math.min(85, width * 100))}%`,
        borderRight: `1px solid ${tokens.border.default}`,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {children}
    </div>
  );
}

/**
 * News Section (variable width based on display mode)
 */
export function NewsSection({ 
  children, 
  width = 0.3,
  theme = 'dark',
}: { 
  children: React.ReactNode;
  width?: number;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);
  
  return (
    <div
      style={{
        flex: `0 0 ${Math.max(10, Math.min(85, width * 100))}%`,
        borderRight: `1px solid ${tokens.border.default}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: tokens.bg.secondary,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Market Panel Section (fixed or collapsible width: 280px)
 */
export function MarketSection({ 
  children, 
  collapsed = false,
  width = spacing.layout.panelWidth,
  theme = 'dark',
}: { 
  children: React.ReactNode;
  collapsed?: boolean;
  width?: number;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);
  
  return (
    <div
      style={{
        width: collapsed ? 0 : width,
        borderLeft: `1px solid ${tokens.border.default}`,
        overflow: collapsed ? 'hidden' : 'auto',
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: tokens.bg.tertiary,
        flexShrink: 0,
      }}
    >
      {collapsed ? null : children}
    </div>
  );
}

/**
 * Status Bar Section (fixed height: 28px)
 */
export function StatusSection({ 
  children, 
  theme = 'dark' 
}: { 
  children: React.ReactNode;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);
  
  return (
    <div
      style={{
        height: spacing.layout.statusHeight,
        backgroundColor: tokens.bg.secondary,
        borderTop: `1px solid ${tokens.border.default}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        fontSize: 11,
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TerminalLayout({
  children,
  theme = 'dark',
  showTicker = true,
  showStatus = true,
  showMarket = true,
}: TerminalLayoutProps) {
  const { displayMode, config } = useDisplayMode();
  const [marketCollapsed, setMarketCollapsed] = useState(false);
  const [mapWidth, setMapWidth] = useState<number>(0.6);
  const [newsWidth, setNewsWidth] = useState<number>(0.3);
  const [marketWidth, setMarketWidth] = useState<number>(spacing.layout.panelWidth);
  const [dragging, setDragging] = useState<'map-news' | 'news-market' | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const tokens = getThemeTokens(theme);

  // Calculate section widths based on display mode
  const getWidths = (): { map: number; news: number; market: number } => {
    switch (displayMode) {
      case 'immersive':
        return { map: 0.85, news: 0.15, market: 0 };
      case 'compact':
        return { map: 0.7, news: 0.25, market: 0.05 };
      case 'standard':
      default:
        return { map: 0.6, news: 0.3, market: 0.1 };
    }
  };

  const widths = getWidths();

  useEffect(() => {
    setMapWidth(widths.map);
    setNewsWidth(widths.news);
    setMarketWidth(spacing.layout.panelWidth);
  }, [widths.map, widths.news]);

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (event: MouseEvent) => {
      const container = mainRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));

      if (dragging === 'map-news') {
        const available = Math.max(1, rect.width - (showMarket ? marketWidth : 0));
        const nextMap = Math.max(0.35, Math.min(0.8, x / available));
        const nextNews = Math.max(0.15, 1 - nextMap);
        setMapWidth(nextMap);
        setNewsWidth(nextNews);
      }

      if (dragging === 'news-market' && showMarket) {
        const nextMarket = Math.max(220, Math.min(460, rect.width - x));
        const available = Math.max(1, rect.width - nextMarket);
        const total = mapWidth + newsWidth;
        const ratio = total > 0 ? mapWidth / total : 0.6;
        setMarketWidth(nextMarket);
        setMapWidth(Math.max(0.3, Math.min(0.8, ratio)));
        setNewsWidth(Math.max(0.15, Math.min(0.7, 1 - ratio)));
      }
    };

    const onMouseUp = () => setDragging(null);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, mapWidth, newsWidth, marketWidth, showMarket]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: tokens.bg.primary,
        color: tokens.text.primary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      {/* Ticker Bar */}
      {showTicker && (
        <TickerSection theme={theme}>
          {children.ticker}
        </TickerSection>
      )}

      {/* Main Content */}
      <MainContent>
        <div ref={mainRef} style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* Map Area */}
        <MapSection width={mapWidth} theme={theme}>
          {children.map}
        </MapSection>

        <button
          type="button"
          onMouseDown={() => setDragging('map-news')}
          style={{
            width: 6,
            cursor: 'col-resize',
            backgroundColor: dragging === 'map-news' ? tokens.accent.info : tokens.border.default,
            opacity: 0.8,
            flexShrink: 0,
            border: 'none',
            padding: 0,
          }}
          aria-label="Resize map and news panels"
        />

        {/* News Area */}
        <NewsSection width={newsWidth} theme={theme}>
          {children.news}
        </NewsSection>

        {/* Market Panel */}
        {showMarket && widths.market > 0 && (
          <>
          <button
            type="button"
            onMouseDown={() => setDragging('news-market')}
            style={{
              width: 6,
              cursor: 'col-resize',
              backgroundColor: dragging === 'news-market' ? tokens.accent.info : tokens.border.default,
              opacity: 0.8,
              flexShrink: 0,
              border: 'none',
              padding: 0,
            }}
            aria-label="Resize news and market panels"
          />
          <MarketSection 
            collapsed={marketCollapsed}
            width={marketWidth}
            theme={theme}
          >
            {children.market}
          </MarketSection>
          </>
        )}
        </div>
      </MainContent>

      {/* Status Bar */}
      {showStatus && (
        <StatusSection theme={theme}>
          {children.status}
        </StatusSection>
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default TerminalLayout;
