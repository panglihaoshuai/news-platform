/**
 * Styles Index - Unified Design System Export
 * Bloomberg Terminal War Room Edition
 * 
 * @module src/styles
 */

// Design Tokens
export { 
  designTokens, 
  themes, 
  getThemeTokens, 
  getHeatColor, 
  getHeatLevel, 
  getPriorityColor,
  type Theme, 
  type DesignTokens, 
  type HeatLevel, 
  type MapDisplayMode 
} from './designTokens';

// Typography
export { 
  typography, 
  textPresets, 
  getFontFamily, 
  getTextPresetStyle,
  type Typography, 
  type TextPreset, 
  type FontFamily 
} from './typography';

// Spacing
export { 
  spacing, 
  getMainContentHeight, 
  getMapWidth, 
  getNewsPanelWidth, 
  generateSpacingCSS,
  type Spacing, 
  type LayoutDimension, 
  type ComponentSpacing 
} from './spacing';

// Animations
export { 
  keyframes, 
  animations, 
  remotionSprings, 
  remotionInterpolate, 
  animationPresets,
  getAnimation,
  getHeatAnimation,
  type Animations, 
  type KeyframeName, 
  type SpringConfig 
} from './animations';
