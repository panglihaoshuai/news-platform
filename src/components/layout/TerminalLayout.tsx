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

import React from 'react';
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
    left?: React.ReactNode;
    map?: React.ReactNode;
    news?: React.ReactNode;
    market?: React.ReactNode;
    bottom?: React.ReactNode;
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
      style={{ minHeight: 0 }}
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
        flex: `${Math.max(0.2, Math.min(0.8, width))} 1 0%`,
        minWidth: 320,
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
        flex: `${Math.max(0.15, Math.min(0.7, width))} 1 0%`,
        minWidth: 300,
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
  width = spacing.layout.panelWidth,
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
        width,
        minWidth: 220,
        maxWidth: 460,
        borderLeft: `1px solid ${tokens.border.default}`,
        overflow: 'auto',
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: tokens.bg.tertiary,
        flexShrink: 0,
      }}
    >
      {children}
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
  const { displayMode } = useDisplayMode();
  const tokens = getThemeTokens(theme);

  const modeLayout =
    displayMode === 'immersive'
      ? { leftWidth: 240, rightWidth: 400, bottomHeight: 280 }
      : displayMode === 'compact'
        ? { leftWidth: 220, rightWidth: 360, bottomHeight: 240 }
        : { leftWidth: 248, rightWidth: 390, bottomHeight: 280 };

  const hasBottomDeck = Boolean(children.bottom);
  const hasLeftPanel = Boolean(children.left);
  const hasRightMarket = showMarket && Boolean(children.market);

  return (
    <div
      style={{
        width: '100%',
        height: '100dvh',
        minHeight: '100dvh',
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
        <div
          style={{
            display: 'grid',
            width: '100%',
            height: '100%',
            minHeight: 0,
            gridTemplateRows: hasBottomDeck
              ? `minmax(0, 1fr) minmax(220px, ${modeLayout.bottomHeight}px)`
              : 'minmax(0, 1fr)',
            gap: 8,
            padding: 8,
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              minHeight: 0,
              display: 'grid',
              gap: 8,
              gridTemplateColumns: hasLeftPanel
                ? `${modeLayout.leftWidth}px minmax(0, 1fr) minmax(320px, ${modeLayout.rightWidth}px)`
                : `minmax(0, 1fr) minmax(320px, ${modeLayout.rightWidth}px)`,
            }}
          >
            {hasLeftPanel && (
              <div style={{ minHeight: 0, overflow: 'auto' }}>
                {children.left}
              </div>
            )}

            <div
              style={{
                minHeight: 0,
                border: `1px solid ${tokens.border.default}`,
                borderRadius: 8,
                overflow: 'hidden',
                backgroundColor: tokens.bg.map,
              }}
            >
              {children.map}
            </div>

            <div
              style={{
                minHeight: 0,
                display: 'grid',
                gap: 8,
                gridTemplateRows: hasRightMarket ? 'minmax(0, 1fr) minmax(180px, 38%)' : 'minmax(0, 1fr)',
              }}
            >
              <div
                style={{
                  minHeight: 0,
                  border: `1px solid ${tokens.border.default}`,
                  borderRadius: 8,
                  overflow: 'hidden',
                  backgroundColor: tokens.bg.secondary,
                }}
              >
                {children.news}
              </div>

              {hasRightMarket && (
                <div
                  style={{
                    minHeight: 0,
                    border: `1px solid ${tokens.border.default}`,
                    borderRadius: 8,
                    overflow: 'hidden',
                    backgroundColor: tokens.bg.tertiary,
                  }}
                >
                  {children.market}
                </div>
              )}
            </div>
          </div>

          {hasBottomDeck && (
            <div style={{ minHeight: 0, overflow: 'hidden' }}>
              {children.bottom}
            </div>
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
