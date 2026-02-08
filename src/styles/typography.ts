/**
 * Typography System - Bloomberg Terminal War Room Edition
 * Web + Remotion Shared Typography
 * 
 * @module src/styles/typography
 */

export const typography = {
  // Font Families
  fontFamily: {
    // Monospace for data and terminal feel
    mono: '"JetBrains Mono", "IBM Plex Mono", "Fira Code", "SF Mono", monospace',
    // Sans-serif for UI and general text
    sans: '"Inter", "SF Pro Display", "Segoe UI", system-ui, -apple-system, sans-serif',
    // Chinese fonts with fallback
    chinese: '"Source Han Sans CN", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    // Combined for mixed content
    mixed: '"Inter", "Source Han Sans CN", "PingFang SC", system-ui, sans-serif',
  },
  
  // Font Sizes (px)
  size: {
    ticker: 12,      // 滚动新闻 - 紧凑信息
    label: 11,       // 标签 - 最小可读
    data: 13,        // 数据 - 等宽数字
    body: 14,        // 正文 - 舒适阅读
    title: 16,       // 标题 - 新闻标题
    heading: 20,     // 大标题 - 区块标题
    display: 24,     // 展示 - 重要数据
    hero: 32,        // 英雄 - 大屏展示
  },
  
  // Font Weights
  weight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,      // 紧凑 - 标签、数据
    snug: 1.3,       // 略紧凑 - 新闻列表
    normal: 1.5,     // 标准 - 正文
    relaxed: 1.7,    // 宽松 - 长文本
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
    widest: '0.1em',  // Ticker text
  },
  
  // Text Transform
  textTransform: {
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    capitalize: 'capitalize',
    none: 'none',
  },
} as const;

// ============================================================================
// Typography Presets - Common Combinations
// ============================================================================

export const textPresets = {
  // Ticker text - 滚动新闻条
  ticker: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.size.ticker,
    fontWeight: typography.weight.medium,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: typography.textTransform.uppercase,
  },
  
  // Data text - 数值显示
  data: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.size.data,
    fontWeight: typography.weight.semibold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  // Label - 小标签
  label: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.size.label,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: typography.textTransform.uppercase,
  },
  
  // Body - 正文
  body: {
    fontFamily: typography.fontFamily.mixed,
    fontSize: typography.size.body,
    fontWeight: typography.weight.normal,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.normal,
  },
  
  // News Title - 新闻标题
  newsTitle: {
    fontFamily: typography.fontFamily.mixed,
    fontSize: typography.size.title,
    fontWeight: typography.weight.semibold,
    lineHeight: typography.lineHeight.snug,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  // Section Heading - 区块标题
  heading: {
    fontFamily: typography.fontFamily.sans,
    fontSize: typography.size.heading,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tight,
  },
  
  // Display - 大屏数据
  display: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.size.display,
    fontWeight: typography.weight.bold,
    lineHeight: typography.lineHeight.tight,
    letterSpacing: typography.letterSpacing.tighter,
  },
} as const;

// ============================================================================
// CSS-in-JS Helpers for Remotion
// ============================================================================

/**
 * Get font family string for inline styles
 */
export function getFontFamily(type: 'mono' | 'sans' | 'chinese' | 'mixed' = 'sans'): string {
  return typography.fontFamily[type];
}

/**
 * Get CSS style object for text preset
 */
export function getTextPresetStyle(
  preset: keyof typeof textPresets
): React.CSSProperties {
  const p = textPresets[preset];
  const style: React.CSSProperties = {
    fontFamily: p.fontFamily,
    fontSize: p.fontSize,
    fontWeight: p.fontWeight,
    lineHeight: p.lineHeight,
    letterSpacing: p.letterSpacing,
  };
  
  // Only add textTransform if it exists on the preset
  if ('textTransform' in p) {
    style.textTransform = p.textTransform as string;
  }
  
  return style;
}

// ============================================================================
// Type Exports
// ============================================================================

export type Typography = typeof typography;
export type TextPreset = keyof typeof textPresets;
export type FontFamily = keyof typeof typography.fontFamily;
export type FontSize = keyof typeof typography.size;
export type FontWeight = keyof typeof typography.weight;
export type LineHeight = keyof typeof typography.lineHeight;

export default typography;
