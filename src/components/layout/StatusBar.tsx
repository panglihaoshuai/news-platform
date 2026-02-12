/**
 * StatusBar Component - Bottom Status Bar
 * Bloomberg Terminal War Room Edition
 *
 * Features:
 * - Online status indicator
 * - UTC time and local time display
 * - Event count
 * - Network latency
 * - Theme switcher
 * - Auto-pilot status
 *
 * @module src/components/layout/StatusBar
 */

'use client';

import React, { useState, useEffect } from 'react';
import { spacing } from '@/styles/spacing';
import { typography } from '@/styles/typography';
import { getThemeTokens, Theme } from '@/styles/designTokens';
import { useTheme } from '@/hooks/useTheme';
import {
  Wifi,
  WifiOff,
  Clock,
  Globe,
  Activity,
  Zap,
  Sun,
  Moon,
  Eye,
} from 'lucide-react';

// ============================================================================
// Props
// ============================================================================

interface StatusBarProps {
  theme?: Theme;
  newsCount?: number;
  lastUpdated?: string;
  latency?: number;
  isOnline?: boolean;
  autoPilotEnabled?: boolean;
  onToggleTheme?: () => void;
}

// ============================================================================
// Time Display Component
// ============================================================================

function TimeDisplay({
  utcTime,
  localTime,
  timezone,
  theme = 'dark'
}: {
  utcTime: string;
  localTime: string;
  timezone: string;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <Clock size={12} style={{ color: tokens.text.muted }} />
      <span style={{ color: tokens.text.secondary, fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}>
        {utcTime} UTC
      </span>
      <span style={{ color: tokens.text.disabled, margin: '0 4px' }}>|</span>
      <Globe size={12} style={{ color: tokens.text.muted }} />
      <span style={{ color: tokens.text.secondary, fontSize: 11, fontFamily: '"JetBrains Mono", monospace' }}>
        {localTime} {timezone}
      </span>
    </div>
  );
}

// ============================================================================
// Status Indicator Component
// ============================================================================

function StatusIndicator({
  isOnline = true,
  latency,
  theme = 'dark'
}: {
  isOnline?: boolean;
  latency?: number;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {isOnline ? (
          <Wifi size={12} style={{ color: tokens.accent.up }} />
        ) : (
          <WifiOff size={12} style={{ color: tokens.accent.down }} />
        )}
        <span style={{
          color: isOnline ? tokens.accent.up : tokens.accent.down,
          fontSize: 10,
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          textTransform: 'uppercase' as const,
        }}>
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {latency !== undefined && (
        <>
          <span style={{ color: tokens.text.disabled, margin: '0 4px' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Activity size={12} style={{ color: latency < 100 ? tokens.accent.up : tokens.accent.warning }} />
            <span style={{
              color: latency < 100 ? tokens.text.secondary : tokens.accent.warning,
              fontSize: 10,
              fontFamily: '"JetBrains Mono", monospace',
            }}>
              {latency}ms
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Theme Switcher Component
// ============================================================================

function ThemeSwitcher({
  currentTheme,
  onSetTheme,
  theme = 'dark'
}: {
  currentTheme: 'dark' | 'amber' | 'light';
  onSetTheme: (theme: 'dark' | 'amber' | 'light') => void;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);
  const themeConfig = [
    { value: 'dark' as const, icon: Moon, label: 'Terminal' },
    { value: 'amber' as const, icon: Sun, label: 'Amber' },
    { value: 'light' as const, icon: Eye, label: 'Light' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {themeConfig.map((t) => {
        const Icon = t.icon;
        const isActive = t.value === currentTheme;

        return (
          <button
            type="button"
            key={t.value}
            onClick={() => onSetTheme(t.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 20,
              height: 20,
              backgroundColor: isActive ? tokens.accent.neutral : 'transparent',
              border: `1px solid ${isActive ? tokens.accent.neutral : tokens.border.default}`,
              borderRadius: 2,
              cursor: 'pointer',
              color: isActive ? tokens.bg.primary : tokens.text.muted,
              transition: 'all 150ms ease',
            }}
            title={`Switch to ${t.label} theme (T)`}
          >
            <Icon size={10} />
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function StatusBar({
  theme = 'dark',
  newsCount = 0,
  lastUpdated,
  latency,
  isOnline = true,
  autoPilotEnabled = false,
  onToggleTheme,
}: StatusBarProps) {
  const tokens = getThemeTokens(theme);
  const [localTime, setLocalTime] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update local time every second
  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      setLocalTime(now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
      setCurrentTime(now.toISOString().slice(11, 19));
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, []);

  const { setTheme, theme: contextTheme } = useTheme();
  const effectiveTheme = theme || contextTheme;

  return (
    <div
      style={{
        width: '100%',
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
      {/* Left Section: Status & Time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <StatusIndicator
          isOnline={isOnline}
          latency={latency}
          theme={theme}
        />
        <TimeDisplay
          utcTime={currentTime}
          localTime={localTime}
          timezone="CST"
          theme={theme}
        />
      </div>

      {/* Center Section: Event Count & Auto-Pilot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: tokens.text.muted }}>EVENTS:</span>
          <span style={{
            color: tokens.text.primary,
            fontWeight: 600,
            minWidth: 40,
            textAlign: 'right' as const,
          }}>
            {newsCount.toString().padStart(3, '0')}
          </span>
        </div>

        {autoPilotEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Zap size={12} style={{ color: tokens.accent.warning }} />
            <span style={{
              color: tokens.accent.warning,
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase' as const,
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              AUTO
            </span>
          </div>
        )}
      </div>

      {/* Right Section: Theme Switcher & Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ThemeSwitcher
          currentTheme={effectiveTheme}
          onSetTheme={setTheme}
          theme={theme}
        />

        {lastUpdated && (
          <span style={{
            color: tokens.text.muted,
            fontSize: 10,
          }}>
            UPDATED: {lastUpdated.slice(11, 19)}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default StatusBar;
