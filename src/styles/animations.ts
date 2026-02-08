/**
 * Animation System - Bloomberg Terminal War Room Edition
 * Web + Remotion Shared Animations
 * 
 * @module src/styles/animations
 */

// ============================================================================
// CSS Keyframes for Web
// ============================================================================

export const keyframes = {
  // Priority Pulse - P0 Critical
  pulseRing: `
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(3); opacity: 0; }
    }
  `,
  
  // Breathe Animation - P1 Major
  breathe: `
    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
    }
  `,
  
  // Heat Pulse - High Heat Areas [新增]
  heatPulse: `
    @keyframes heat-pulse {
      0% { 
        transform: scale(1); 
        opacity: 0.8; 
        box-shadow: 0 0 5px currentColor;
      }
      50% { 
        transform: scale(1.4); 
        opacity: 1; 
        box-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
      }
      100% { 
        transform: scale(1); 
        opacity: 0.8; 
        box-shadow: 0 0 5px currentColor;
      }
    }
  `,
  
  // Heat Wave - Critical Heat [新增]
  heatWave: `
    @keyframes heat-wave {
      0% { 
        transform: scale(1) rotate(0deg); 
        opacity: 0.9;
      }
      25% { 
        transform: scale(1.2) rotate(90deg); 
        opacity: 1;
      }
      50% { 
        transform: scale(1.1) rotate(180deg); 
        opacity: 0.95;
      }
      75% { 
        transform: scale(1.3) rotate(270deg); 
        opacity: 1;
      }
      100% { 
        transform: scale(1) rotate(360deg); 
        opacity: 0.9;
      }
    }
  `,
  
  // Flash Effects
  flashGreen: `
    @keyframes flash-green {
      0% { background-color: rgba(0, 255, 65, 0.3); }
      100% { background-color: transparent; }
    }
  `,
  
  flashRed: `
    @keyframes flash-red {
      0% { background-color: rgba(255, 51, 51, 0.3); }
      100% { background-color: transparent; }
    }
  `,
  
  // Entrance Animations
  fadeIn: `
    @keyframes fade-in {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
  `,
  
  fadeInUp: `
    @keyframes fade-in-up {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `,
  
  fadeInDown: `
    @keyframes fade-in-down {
      0% { opacity: 0; transform: translateY(-10px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `,
  
  fadeInLeft: `
    @keyframes fade-in-left {
      0% { opacity: 0; transform: translateX(-10px); }
      100% { opacity: 1; transform: translateX(0); }
    }
  `,
  
  fadeInRight: `
    @keyframes fade-in-right {
      0% { opacity: 0; transform: translateX(10px); }
      100% { opacity: 1; transform: translateX(0); }
    }
  `,
  
  scaleIn: `
    @keyframes scale-in {
      0% { opacity: 0; transform: scale(0.9); }
      100% { opacity: 1; transform: scale(1); }
    }
  `,
  
  // Ticker Animation
  ticker: `
    @keyframes ticker {
      0% { transform: translateX(100%); }
      100% { transform: translateX(-100%); }
    }
  `,
  
  // Slide Animations
  slideUp: `
    @keyframes slide-up {
      0% { transform: translateY(100%); }
      100% { transform: translateY(0); }
    }
  `,
  
  slideDown: `
    @keyframes slide-down {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(0); }
    }
  `,
  
  // Terminal Cursor Blink
  blink: `
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `,
  
  // Scan Line Effect
  scanLine: `
    @keyframes scan-line {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100%); }
    }
  `,
  
  // Glitch Effect
  glitch: `
    @keyframes glitch {
      0% { transform: translate(0); }
      20% { transform: translate(-2px, 2px); }
      40% { transform: translate(-2px, -2px); }
      60% { transform: translate(2px, 2px); }
      80% { transform: translate(2px, -2px); }
      100% { transform: translate(0); }
    }
  `,
  
  // Spin
  spin: `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `,
  
  // Pulse (generic)
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  
  // Shake
  shake: `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
      20%, 40%, 60%, 80% { transform: translateX(2px); }
    }
  `,
} as const;

// ============================================================================
// Animation Configuration
// ============================================================================

export const animations = {
  // Duration (ms)
  duration: {
    instant: 50,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
    pulse: 2000,        // 2秒脉冲周期
    breathe: 3000,      // 3秒呼吸周期
    ticker: 30000,      // 30秒滚动周期
    heatPulse: 2500,    // [新增] 热度脉冲
    heatWave: 4000,     // [新增] 热度波动
  },
  
  // Easing Functions
  easing: {
    linear: 'linear',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    snappy: 'cubic-bezier(0.2, 0, 0, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  
  // Animation Classes for Tailwind
  classes: {
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    spin: 'animate-spin',
    ping: 'animate-ping',
  },
} as const;

// ============================================================================
// Remotion Spring Configs
// ============================================================================

export const remotionSprings = {
  // Gentle spring for smooth movements
  gentle: {
    damping: 15,
    stiffness: 120,
    mass: 1,
  },
  
  // Snappy spring for quick responses
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
  
  // Smooth spring for natural feel
  smooth: {
    damping: 25,
    stiffness: 200,
    mass: 1,
  },
  
  // Bouncy spring for playful animations
  bouncy: {
    damping: 10,
    stiffness: 400,
    mass: 0.8,
  },
  
  // Heat pulse spring [新增]
  heatPulse: {
    damping: 12,
    stiffness: 150,
    mass: 1.2,
  },
} as const;

// ============================================================================
// Remotion Interpolate Configs
// ============================================================================

export const remotionInterpolate = {
  clamp: { 
    extrapolateLeft: 'clamp' as const, 
    extrapolateRight: 'clamp' as const 
  },
  extend: { 
    extrapolateLeft: 'extend' as const, 
    extrapolateRight: 'extend' as const 
  },
  identity: { 
    extrapolateLeft: 'identity' as const, 
    extrapolateRight: 'identity' as const 
  },
} as const;

// ============================================================================
// Animation Presets
// ============================================================================

export const animationPresets = {
  // Priority Indicators
  p0Pulse: {
    animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    transformOrigin: 'center',
  },
  
  p1Breathe: {
    animation: 'breathe 3s ease-in-out infinite',
    transformOrigin: 'center',
  },
  
  // Heat Animations [新增]
  heatPulse: {
    animation: 'heat-pulse 2.5s ease-in-out infinite',
    transformOrigin: 'center',
  },
  
  heatWave: {
    animation: 'heat-wave 4s ease-in-out infinite',
    transformOrigin: 'center',
  },
  
  // Entrance
  fadeIn: {
    animation: 'fade-in 200ms ease-out forwards',
  },
  
  fadeInUp: {
    animation: 'fade-in-up 200ms ease-out forwards',
  },
  
  scaleIn: {
    animation: 'scale-in 150ms ease-out forwards',
  },
  
  // Ticker
  ticker: {
    animation: 'ticker 30s linear infinite',
  },
  
  // Interactive
  hover: {
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  focus: {
    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get CSS animation string
 */
export function getAnimation(
  name: keyof typeof keyframes,
  duration: number,
  easing: string = 'ease',
  iterations: number | 'infinite' = 1
): string {
  return `${name} ${duration}ms ${easing} ${iterations}`;
}

/**
 * Get heat animation based on level [新增]
 */
export function getHeatAnimation(level: 'low' | 'medium' | 'high' | 'critical'): string {
  switch (level) {
    case 'critical':
      return 'heat-wave 4s ease-in-out infinite';
    case 'high':
      return 'heat-pulse 2s ease-in-out infinite';
    case 'medium':
      return 'heat-pulse 3s ease-in-out infinite';
    case 'low':
    default:
      return 'none';
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type Animations = typeof animations;
export type KeyframeName = keyof typeof keyframes;
export type SpringConfig = keyof typeof remotionSprings;
export type AnimationPreset = keyof typeof animationPresets;

export default animations;
