/**
 * TerminalIntro Component - Remotion Terminal Startup Animation
 * Bloomberg Terminal War Room Edition
 * 
 * Features:
 * - Terminal boot sequence animation
 * - Typing text effect
 * - Logo reveal animation
 * - Grid background effect
 * - 3-5 second duration
 * 
 * @module src/remotion/compositions/TerminalIntro
 */

import React, { useState, useEffect } from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing, spring } from 'remotion';
import { Theme } from '@/types/news';
import { getThemeTokens } from '@/styles/designTokens';

// ============================================================================
// Props
// ============================================================================

interface TerminalIntroProps {
  theme?: Theme;
  duration?: number;
  companyName?: string;
}

// ============================================================================
// Typing Text Component
// ============================================================================

function TypingText({
  text,
  frame,
  startFrame,
  duration = 30,
  theme = 'dark',
}: {
  text: string;
  frame: number;
  startFrame: number;
  duration?: number;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);
  const progress = (frame - startFrame) / duration;
  const visibleChars = Math.floor(progress * text.length);

  return (
    <span
      style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: 18,
        color: tokens.text.primary,
        letterSpacing: '0.1em',
      }}
    >
      {text.slice(0, visibleChars)}
      <span
        style={{
          animation: 'blink 1s step-end infinite',
        }}
      >
        |
      </span>
    </span>
  );
}

// ============================================================================
// Grid Background Component
// ============================================================================

function GridBackground({
  theme = 'dark',
  opacity = 0.1,
}: {
  theme?: Theme;
  opacity?: number;
}) {
  const tokens = getThemeTokens(theme);
  
  return (
    <div
      style={{
        position: 'absolute' as const,
        inset: 0,
        backgroundImage: `
          linear-gradient(${tokens.border.default}${opacity} 1px, transparent 1px),
          linear-gradient(90deg, ${tokens.border.default}${opacity} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        transform: 'perspective(500px) rotateX(60deg)',
        transformOrigin: 'center 80%',
      }}
    />
  );
}

// ============================================================================
// Logo Component
// ============================================================================

function TerminalLogo({
  frame,
  startFrame,
  theme = 'dark',
}: {
  frame: number;
  startFrame: number;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);
  
  const progress = (frame - startFrame) / 45;
  const scale = spring({
    fps: 30,
    frame: frame - startFrame,
    from: 0,
    to: 1,
    config: {
      damping: 15,
      stiffness: 150,
    },
  });

  const opacity = interpolate(progress, [0, 0.3], [0, 1]);

  return (
    <div
      style={{
        position: 'absolute' as const,
        top: '25%',
        left: '50%',
        transform: `translate(-50%, -50%) scale(${scale * 0.8})`,
        opacity,
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: 20,
      }}
    >
      {/* Globe Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: `2px solid ${tokens.accent.up}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 30px ${tokens.accent.up}40`,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: `1px solid ${tokens.text.muted}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: tokens.accent.up,
              opacity: 0.3,
              animation: 'pulse 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          fontFamily: '"JetBrains Mono", monospace',
          color: tokens.text.primary,
          letterSpacing: '0.2em',
          textTransform: 'uppercase' as const,
        }}
      >
        GLOBAL INTEL MAP
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 12,
          fontFamily: '"JetBrains Mono", monospace',
          color: tokens.text.muted,
          letterSpacing: '0.1em',
        }}
      >
        REAL-TIME GLOBAL INTELLIGENCE
      </div>
    </div>
  );
}

// ============================================================================
// System Status Lines
// ============================================================================

function SystemStatusLine({
  label,
  status,
  frame,
  startFrame,
  delay = 15,
  theme = 'dark',
}: {
  label: string;
  status: string;
  frame: number;
  startFrame: number;
  delay?: number;
  theme?: Theme;
}) {
  const tokens = getThemeTokens(theme);
  const progress = Math.max(0, (frame - startFrame - delay) / 15);
  const visible = progress > 0 && progress < 1;
  const opacity = visible ? progress : 1;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        opacity,
        transition: 'opacity 100ms ease',
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontFamily: '"JetBrains Mono", monospace',
          color: tokens.text.muted,
          width: 120,
          textAlign: 'right' as const,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          fontFamily: '"JetBrains Mono", monospace',
          color: status === 'READY' || status === 'CONNECTED' ? tokens.accent.up : tokens.accent.warning,
        }}
      >
        {visible ? status : ''}
        {visible && status === 'LOADING...' && (
          <span
            style={{
              animation: 'blink 1s step-end infinite',
            }}
          >
            _
          </span>
        )}
      </span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export const TerminalIntro: React.FC<TerminalIntroProps> = ({
  theme = 'dark',
  duration = 180, // 6 seconds at 30fps
  companyName = 'GLOBAL INTEL MAP',
}) => {
  const frame = useCurrentFrame();
  const tokens = getThemeTokens(theme);

  // Phase timing (in frames at 30fps)
  const logoStart = 0;
  const statusStart = 60;
  const typingStart = 90;
  const completeStart = 150;

  // Overall opacity for fade out at end
  const overallOpacity = interpolate(
    frame,
    [completeStart + 30, completeStart + 60],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: tokens.bg.primary,
        overflow: 'hidden',
      }}
    >
      {/* Grid Background */}
      <GridBackground theme={theme} />

      {/* Scan Line Effect */}
      <div
        style={{
          position: 'absolute' as const,
          inset: 0,
          background: `linear-gradient(
            transparent 50%,
            ${tokens.bg.primary}10 50%
          )`,
          backgroundSize: '100% 4px',
          pointerEvents: 'none' as const,
        }}
      />

      {/* Logo */}
      <TerminalLogo
        frame={frame}
        startFrame={logoStart}
        theme={theme}
      />

      {/* System Status Lines */}
      <div
        style={{
          position: 'absolute' as const,
          bottom: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column' as const,
          gap: 8,
        }}
      >
        <SystemStatusLine
          label="INITIALIZING..."
          status="LOADING..."
          frame={frame}
          startFrame={statusStart}
          theme={theme}
          delay={0}
        />
        <SystemStatusLine
          label="CONNECTING TO"
          status="DATABASE"
          frame={frame}
          startFrame={statusStart}
          theme={theme}
          delay={20}
        />
        <SystemStatusLine
          label="FEED STATUS"
          status="CONNECTED"
          frame={frame}
          startFrame={statusStart}
          theme={theme}
          delay={40}
        />
        <SystemStatusLine
          label="SYSTEM"
          status="READY"
          frame={frame}
          startFrame={statusStart}
          theme={theme}
          delay={60}
        />
      </div>

      {/* Version Info */}
      <div
        style={{
          position: 'absolute' as const,
          bottom: 20,
          right: 30,
          fontSize: 10,
          fontFamily: '"JetBrains Mono", monospace',
          color: tokens.text.disabled,
        }}
      >
        V1.0.0 • BLOOMBERG TERMINAL EDITION
      </div>

      {/* Overall Fade Out */}
      <div
        style={{
          position: 'absolute' as const,
          inset: 0,
          backgroundColor: tokens.bg.primary,
          opacity: overallOpacity,
          pointerEvents: 'none' as const,
        }}
      />
    </AbsoluteFill>
  );
};

export default TerminalIntro;
