/**
 * Spacing System - Bloomberg Terminal War Room Edition
 * Web + Remotion Shared Spacing
 * 
 * @module src/styles/spacing
 */

export const spacing = {
  // Layout Dimensions (px)
  layout: {
    tickerHeight: 32,        // 顶部滚动条高度
    statusHeight: 28,        // 底部状态栏高度
    panelWidth: 280,         // 侧边栏宽度
    sidebarWidth: 320,       // 右侧新闻栏宽度
    minContentWidth: 1024,   // 最小内容宽度
    maxContentWidth: 1920,   // 最大内容宽度
  },
  
  // Component Spacing (px)
  component: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // Section Spacing (px)
  section: {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 100,
  },
  
  // Border Radius (px)
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    full: 9999,
  },
  
  // Z-Index Scale
  zIndex: {
    base: 0,
    below: -1,
    map: 10,
    panel: 20,
    floating: 30,
    status: 40,
    ticker: 50,
    overlay: 60,
    modal: 70,
    tooltip: 80,
    toast: 90,
    max: 100,
  },
  
  // Animation Timing (ms)
  duration: {
    instant: 50,
    fast: 150,
    normal: 200,
    slow: 300,
    slower: 500,
    pulse: 2000,      // 2秒脉冲周期
    breathe: 3000,    // 3秒呼吸周期
    ticker: 30000,    // 30秒滚动周期
    heatPulse: 2500,  // [新增] 热度脉冲周期
  },
  
  // Easing Functions
  easing: {
    linear: 'linear',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    snappy: 'cubic-bezier(0.2, 0, 0, 1)',
  },
} as const;

// ============================================================================
// Layout Calculations
// ============================================================================

/**
 * Calculate main content height
 */
export function getMainContentHeight(viewportHeight: number): number {
  return viewportHeight - spacing.layout.tickerHeight - spacing.layout.statusHeight;
}

/**
 * Calculate map width based on display mode
 */
export function getMapWidth(mode: 'standard' | 'compact' | 'immersive', containerWidth: number): number {
  switch (mode) {
    case 'immersive':
      return containerWidth * 0.85;
    case 'compact':
      return containerWidth * 0.7;
    case 'standard':
    default:
      return containerWidth * 0.6;
  }
}

/**
 * Calculate news panel width based on display mode
 */
export function getNewsPanelWidth(mode: 'standard' | 'compact' | 'immersive', containerWidth: number): number {
  switch (mode) {
    case 'immersive':
      return containerWidth * 0.15;
    case 'compact':
      return containerWidth * 0.25;
    case 'standard':
    default:
      return containerWidth * 0.3;
  }
}

// ============================================================================
// CSS Variable Generation for Tailwind
// ============================================================================

/**
 * Generate CSS custom properties for spacing
 */
export function generateSpacingCSS(): string {
  const lines: string[] = [];
  
  // Layout
  Object.entries(spacing.layout).forEach(([key, value]) => {
    lines.push(`  --spacing-layout-${key}: ${value}px;`);
  });
  
  // Component
  Object.entries(spacing.component).forEach(([key, value]) => {
    lines.push(`  --spacing-component-${key}: ${value}px;`);
  });
  
  // Radius
  Object.entries(spacing.radius).forEach(([key, value]) => {
    lines.push(`  --radius-${key}: ${value}px;`);
  });
  
  // Duration
  Object.entries(spacing.duration).forEach(([key, value]) => {
    lines.push(`  --duration-${key}: ${value}ms;`);
  });
  
  return `:root {\n${lines.join('\n')}\n}`;
}

// ============================================================================
// Type Exports
// ============================================================================

export type Spacing = typeof spacing;
export type LayoutDimension = keyof typeof spacing.layout;
export type ComponentSpacing = keyof typeof spacing.component;
export type BorderRadius = keyof typeof spacing.radius;
export type ZIndex = keyof typeof spacing.zIndex;
export type Duration = keyof typeof spacing.duration;
export type Easing = keyof typeof spacing.easing;

export default spacing;
