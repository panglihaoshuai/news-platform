/**
 * Design Tokens - Bloomberg Terminal War Room Edition
 * Web + Remotion Shared Design Language
 * 
 * 主题系统:
 * - Dark (默认): 黑金专业配色，Bloomberg Terminal风格
 * - Light: 纯白极简，Apple/Linear风格
 * - Amber: 米黄护眼纸，Solarized Light风格
 * 
 * @module src/styles/designTokens
 */

// Dark Theme (Default) - 黑金专业
export const darkTokens = {
  bg: {
    primary: '#0a0a0b',
    secondary: '#141415',
    tertiary: '#1c1c1e',
    hover: '#252527',
    map: '#0d0d0e',
    input: '#1a1a1c',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#a0a0a5',
    muted: '#6e6e73',
    disabled: '#48484a',
  },
  accent: {
    up: '#ffb000',
    down: '#ff3b30',
    info: '#0a84ff',
    warning: '#ff9500',
    neutral: '#8e8e93',
  },
  priority: {
    p0: '#ff0000',
    p1: '#ffb000',
    p2: '#ffcc00',
    p3: '#636366',
  },
  heat: {
    low: '#0a84ff',
    medium: '#ff9500',
    high: '#ff3b30',
    critical: '#dc2626',
  },
  mapMode: {
    all: '#ffb000',
    priority: '#ff9500',
    heatmap: '#ff3b30',
  },
  border: {
    default: '#2c2c2e',
    active: '#3a3a3c',
    highlight: 'rgba(255, 176, 0, 0.15)',
    glow: 'rgba(255, 176, 0, 0.3)',
  },
  shadow: {
    glowUp: '0 0 10px rgba(255, 176, 0, 0.5)',
    glowDown: '0 0 10px rgba(255, 59, 48, 0.5)',
    glowInfo: '0 0 10px rgba(10, 132, 255, 0.5)',
    glowHeat: '0 0 15px rgba(255, 59, 48, 0.6)',
    panel: '0 4px 20px rgba(0, 0, 0, 0.6)',
    dropdown: '0 10px 40px rgba(0, 0, 0, 0.9)',
  },
  opacity: {
    hover: 0.8,
    disabled: 0.4,
    backdrop: 0.7,
    glass: 0.1,
  },
} as const;

// Light Theme - 纯白极简
export const lightTokens = {
  bg: {
    primary: '#ffffff',
    secondary: '#f5f5f7',
    tertiary: '#ffffff',
    hover: '#e8e8ed',
    map: '#fafafa',
    input: '#ffffff',
  },
  text: {
    primary: '#1d1d1f',
    secondary: '#6e6e73',
    muted: '#9e9ea3',
    disabled: '#c7c7cc',
  },
  accent: {
    up: '#0066cc',
    down: '#dc2626',
    info: '#0066cc',
    warning: '#f59e0b',
    neutral: '#6b7280',
  },
  priority: {
    p0: '#dc2626',
    p1: '#ea580c',
    p2: '#ca8a04',
    p3: '#9ca3af',
  },
  heat: {
    low: '#2563eb',
    medium: '#d97706',
    high: '#dc2626',
    critical: '#991b1b',
  },
  mapMode: {
    all: '#0066cc',
    priority: '#ea580c',
    heatmap: '#dc2626',
  },
  border: {
    default: '#e5e5ea',
    active: '#d1d1d6',
    highlight: 'rgba(0, 102, 204, 0.15)',
    glow: 'rgba(0, 102, 204, 0.2)',
  },
  shadow: {
    glowUp: '0 0 10px rgba(0, 102, 204, 0.3)',
    glowDown: '0 0 10px rgba(220, 38, 38, 0.3)',
    glowInfo: '0 0 10px rgba(0, 102, 204, 0.3)',
    glowHeat: '0 0 15px rgba(220, 38, 38, 0.4)',
    panel: '0 4px 20px rgba(0, 0, 0, 0.08)',
    dropdown: '0 10px 40px rgba(0, 0, 0, 0.12)',
  },
  opacity: {
    hover: 0.8,
    disabled: 0.4,
    backdrop: 0.5,
    glass: 0.05,
  },
} as const;

// Amber Theme - 米黄护眼纸
export const amberTokens = {
  bg: {
    primary: '#fdf6e3',
    secondary: '#eee8d5',
    tertiary: '#f5efd6',
    hover: '#e6dfc8',
    map: '#f8f1dc',
    input: '#fffdf5',
  },
  text: {
    primary: '#433422',
    secondary: '#73634d',
    muted: '#a3947d',
    disabled: '#c4b8a8',
  },
  accent: {
    up: '#859900',
    down: '#dc322f',
    info: '#268bd2',
    warning: '#b58900',
    neutral: '#93a1a1',
  },
  priority: {
    p0: '#dc322f',
    p1: '#cb4b16',
    p2: '#b58900',
    p3: '#839496',
  },
  heat: {
    low: '#268bd2',
    medium: '#b58900',
    high: '#dc322f',
    critical: '#990000',
  },
  mapMode: {
    all: '#859900',
    priority: '#cb4b16',
    heatmap: '#dc322f',
  },
  border: {
    default: '#dcd3c3',
    active: '#cbbfa8',
    highlight: 'rgba(133, 153, 0, 0.2)',
    glow: 'rgba(133, 153, 0, 0.25)',
  },
  shadow: {
    glowUp: '0 0 10px rgba(133, 153, 0, 0.4)',
    glowDown: '0 0 10px rgba(220, 50, 47, 0.4)',
    glowInfo: '0 0 10px rgba(38, 139, 210, 0.4)',
    glowHeat: '0 0 15px rgba(220, 50, 47, 0.5)',
    panel: '0 4px 20px rgba(67, 52, 34, 0.1)',
    dropdown: '0 10px 40px rgba(67, 52, 34, 0.15)',
  },
  opacity: {
    hover: 0.8,
    disabled: 0.4,
    backdrop: 0.6,
    glass: 0.08,
  },
} as const;

// Theme Exports
export const themes = {
  dark: darkTokens,
  light: lightTokens,
  amber: amberTokens,
} as const;

// Default theme
export const designTokens = darkTokens;

// Type Exports
export type Theme = keyof typeof themes;
export type DesignTokens = typeof darkTokens;
export type HeatLevel = 'low' | 'medium' | 'high' | 'critical';
export type MapDisplayMode = 'all' | 'priority' | 'heatmap';

// Utility Functions
export function getThemeTokens(theme: Theme): DesignTokens {
  return themes[theme] as DesignTokens;
}

export function getHeatColor(score: number, theme: Theme = 'dark'): string {
  const tokens = getThemeTokens(theme);
  if (score >= 76) return tokens.heat.critical;
  if (score >= 51) return tokens.heat.high;
  if (score >= 26) return tokens.heat.medium;
  return tokens.heat.low;
}

export function getHeatLevel(score: number): HeatLevel {
  if (score >= 76) return 'critical';
  if (score >= 51) return 'high';
  if (score >= 26) return 'medium';
  return 'low';
}

export function getPriorityColor(priority: 'P0' | 'P1' | 'P2' | 'P3', theme: Theme = 'dark'): string {
  const tokens = getThemeTokens(theme);
  switch (priority) {
    case 'P0': return tokens.priority.p0;
    case 'P1': return tokens.priority.p1;
    case 'P2': return tokens.priority.p2;
    case 'P3': return tokens.priority.p3;
    default: return tokens.priority.p3;
  }
}

export function isDarkTheme(theme: Theme): boolean {
  return theme === 'dark' || theme === 'amber';
}

export default designTokens;
