/**
 * MarketDataPanel Component - Real-time Market Data Display
 * Bloomberg Terminal War Room Edition
 * 
 * Features:
 * - Real-time market data from Alpha Vantage API
 * - Support for indices, forex, crypto, and commodities
 * - Color-coded price changes (green up/red down)
 * - Expandable/collapsible panel
 * - Auto-refresh every 60 seconds
 * 
 * @module src/components/layout/MarketDataPanel
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { getThemeTokens, Theme } from '@/styles/designTokens';
import { 
  MarketSymbol, 
  MarketData, 
  getAllMarketData, 
  formatPrice, 
  formatChange, 
  formatChangePercent,
  getChangeColor,
  MARKET_SYMBOLS
} from '@/lib/market-data';
import { RefreshCw, ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';

// ============================================================================
// Props
// ============================================================================

interface MarketDataPanelProps {
  theme?: Theme;
  expanded?: boolean;
  onToggleExpand?: () => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// ============================================================================
// Category Group Component
// ============================================================================

function MarketCategoryGroup({
  title,
  items,
  theme = 'dark',
  symbols,
}: {
  title: string;
  items: MarketData[];
  theme?: Theme;
  symbols: typeof MARKET_SYMBOLS;
}) {
  const tokens = getThemeTokens(theme);
  
  if (items.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          color: tokens.text.muted,
          textTransform: 'uppercase' as const,
          letterSpacing: 1,
          marginBottom: 8,
          paddingBottom: 4,
          borderBottom: `1px solid ${tokens.border.default}`,
        }}
      >
        {title}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
        {items.map((item) => {
          const symbol = symbols[item.symbol as keyof typeof symbols];
          const quote = item.quote;
          
          if (!quote) {
            return (
              <div
                key={item.symbol}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px',
                  backgroundColor: tokens.bg.hover,
                  borderRadius: 4,
                }}
              >
                <span style={{ color: tokens.text.muted, fontSize: 11 }}>
                  {symbol?.name || item.symbol}
                </span>
                <span style={{ color: tokens.text.disabled, fontSize: 10 }}>
                  --
                </span>
              </div>
            );
          }

          const changeColor = getChangeColor(quote.changePercent, tokens);
          const isPositive = quote.changePercent >= 0;

          return (
            <div
              key={item.symbol}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                backgroundColor: tokens.bg.hover,
                borderRadius: 4,
                transition: 'background-color 150ms ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isPositive ? (
                  <TrendingUp size={12} style={{ color: tokens.accent.up }} />
                ) : (
                  <TrendingDown size={12} style={{ color: tokens.accent.down }} />
                )}
                <div>
                  <div style={{ 
                    color: tokens.text.primary, 
                    fontSize: 11, 
                    fontWeight: 600,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}>
                    {symbol?.name || item.symbol}
                  </div>
                  {symbol?.unit && (
                    <div style={{ 
                      color: tokens.text.muted, 
                      fontSize: 9,
                    }}>
                      {symbol.unit}
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ textAlign: 'right' as const }}>
                <div style={{ 
                  color: tokens.text.primary, 
                  fontSize: 12, 
                  fontWeight: 600,
                  fontFamily: '"JetBrains Mono", monospace',
                }}>
                  {formatPrice(quote.price, quote.price > 1000 ? 0 : 2)}
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end',
                  gap: 4,
                }}>
                  <span style={{ 
                    color: changeColor, 
                    fontSize: 10, 
                    fontWeight: 500,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}>
                    {formatChange(quote.change)}
                  </span>
                  <span style={{ 
                    color: changeColor, 
                    fontSize: 10,
                    fontWeight: 500,
                    fontFamily: '"JetBrains Mono", monospace',
                  }}>
                    {formatChangePercent(quote.changePercent)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function LoadingSkeleton({ theme = 'dark' }: { theme?: Theme }) {
  const tokens = getThemeTokens(theme);
  
  return (
    <div style={{ padding: 12 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            height: 32,
            backgroundColor: tokens.bg.hover,
            borderRadius: 4,
            marginBottom: 4,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MarketDataPanel({
  theme = 'dark',
  expanded = true,
  onToggleExpand,
  autoRefresh = true,
  refreshInterval = 60000,
}: MarketDataPanelProps) {
  const tokens = getThemeTokens(theme);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch market data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllMarketData();
      setMarketData(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to fetch market data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, autoRefresh, refreshInterval]);

  // Group data by category
  const groupedData = {
    bonds: marketData.filter(d => MARKET_SYMBOLS[d.symbol as keyof typeof MARKET_SYMBOLS]?.category === 'bonds'),
    indices: marketData.filter(d => MARKET_SYMBOLS[d.symbol as keyof typeof MARKET_SYMBOLS]?.category === 'indices'),
    forex: marketData.filter(d => MARKET_SYMBOLS[d.symbol as keyof typeof MARKET_SYMBOLS]?.category === 'forex'),
    commodities: marketData.filter(d => MARKET_SYMBOLS[d.symbol as keyof typeof MARKET_SYMBOLS]?.category === 'commodities'),
  };

  // Don't render if collapsed
  if (!expanded) {
    return (
      <button
        type="button"
        style={{
          width: 40,
          height: '100%',
          backgroundColor: tokens.bg.tertiary,
          borderLeft: `1px solid ${tokens.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: 'none',
        }}
        onClick={onToggleExpand}
      >
        <ChevronRight size={16} style={{ color: tokens.text.muted }} />
      </button>
    );
  }

  return (
    <div
      style={{
        width: spacing.layout.panelWidth,
        height: '100%',
        backgroundColor: tokens.bg.tertiary,
        borderLeft: `1px solid ${tokens.border.default}`,
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${tokens.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: tokens.bg.secondary,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={14} style={{ color: tokens.accent.up }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: '"JetBrains Mono", monospace',
              color: tokens.text.primary,
              textTransform: 'uppercase' as const,
              letterSpacing: 1,
            }}
          >
            MARKET DATA
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 9,
              color: tokens.text.muted,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            type="button"
            onClick={fetchData}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              backgroundColor: 'transparent',
              border: `1px solid ${tokens.border.default}`,
              borderRadius: 4,
              cursor: 'pointer',
              color: tokens.text.muted,
              transition: 'all 150ms ease',
            }}
            title="Refresh (R)"
          >
            <RefreshCw size={10} />
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              backgroundColor: 'transparent',
              border: `1px solid ${tokens.border.default}`,
              borderRadius: 4,
              cursor: 'pointer',
              color: tokens.text.muted,
              transition: 'all 150ms ease',
            }}
            title="Collapse"
          >
            <ChevronLeft size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto' as const,
          padding: 12,
        }}
      >
        {isLoading ? (
          <LoadingSkeleton theme={theme} />
        ) : (
          <>
            <MarketCategoryGroup
              title="US Treasuries"
              items={groupedData.bonds}
              theme={theme}
              symbols={MARKET_SYMBOLS}
            />
            <MarketCategoryGroup
              title="Indices"
              items={groupedData.indices}
              theme={theme}
              symbols={MARKET_SYMBOLS}
            />
            <MarketCategoryGroup
              title="Forex"
              items={groupedData.forex}
              theme={theme}
              symbols={MARKET_SYMBOLS}
            />
            <MarketCategoryGroup
              title="Commodities"
              items={groupedData.commodities}
              theme={theme}
              symbols={MARKET_SYMBOLS}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: `1px solid ${tokens.border.default}`,
          backgroundColor: tokens.bg.secondary,
          fontSize: 9,
          color: tokens.text.muted,
          textAlign: 'center' as const,
        }}
      >
        DATA DELAYED 15-20 MIN • FREE TIER
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default MarketDataPanel;
