/**
 * useKeyboardShortcuts Hook - Keyboard Shortcut Management
 * Bloomberg Terminal War Room Edition
 * 
 * Provides keyboard shortcuts for:
 * - Tab: Cycle display mode (standard/compact/immersive)
 * - Space: Pause/resume auto-pilot
 * - F: Toggle fullscreen
 * - T: Cycle theme (terminal/amber/light)
 * - M: Cycle map mode (all/priority/heatmap)
 * - R: Refresh data
 * - ?: Show help panel
 * 
 * Features:
 * - Global keyboard event listeners
 * - Configurable shortcuts
 * - Help panel with all shortcuts
 * - Prevent default browser actions
 * 
 * @module src/hooks/useKeyboardShortcuts
 */

'use client';

import { useEffect, useCallback, useState } from 'react';
import { useTheme } from './useTheme';
import { useDisplayMode } from './useDisplayMode';
import { useMapDisplayMode } from './useMapDisplayMode';

// ============================================================================
// Types
// ============================================================================

export interface KeyboardShortcut {
  key: string;
  modifier?: 'ctrl' | 'alt' | 'shift' | 'meta';
  description: string;
  category: 'navigation' | 'display' | 'data' | 'help';
  action: () => void;
}

export interface KeyboardShortcutsState {
  isHelpVisible: boolean;
  toggleHelp: () => void;
  hideHelp: () => void;
  registeredShortcuts: KeyboardShortcut[];
}

// ============================================================================
// Default Shortcuts Configuration
// ============================================================================

export const DEFAULT_SHORTCUTS: Omit<KeyboardShortcut, 'action'>[] = [
  {
    key: 'Tab',
    description: 'Switch display mode (Standard/Compact/Immersive)',
    category: 'display',
  },
  {
    key: ' ',
    description: 'Pause/Resume auto-pilot',
    category: 'navigation',
  },
  {
    key: 'f',
    modifier: undefined,
    description: 'Toggle fullscreen',
    category: 'display',
  },
  {
    key: 't',
    description: 'Switch theme (Terminal/Amber/Light)',
    category: 'display',
  },
  {
    key: 'm',
    description: 'Switch map mode (All/Priority/Heatmap)',
    category: 'display',
  },
  {
    key: 'r',
    description: 'Refresh data',
    category: 'data',
  },
  {
    key: '?',
    description: 'Show keyboard shortcuts help',
    category: 'help',
  },
];

// ============================================================================
// Hook Implementation
// ============================================================================

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  helpEnabled?: boolean;
  onRefetch?: () => void;
  onToggleFullscreen?: () => void;
  onToggleAutoPilot?: () => void;
}

export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions = {}
): KeyboardShortcutsState {
  const {
    enabled = true,
    preventDefault = true,
    helpEnabled = true,
    onRefetch,
    onToggleFullscreen,
    onToggleAutoPilot,
  } = options;

  const [isHelpVisible, setIsHelpVisible] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { cycleDisplayMode } = useDisplayMode();
  const { cycleMapDisplayMode } = useMapDisplayMode();

  // Toggle help panel
  const toggleHelp = useCallback(() => {
    setIsHelpVisible(prev => !prev);
  }, []);

  const hideHelp = useCallback(() => {
    setIsHelpVisible(false);
  }, []);

  // Keyboard event handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || 
                   target.tagName === 'TEXTAREA' || 
                   target.isContentEditable;

    if (isInput && e.key !== 'Escape') return;

    // Handle help toggle
    if (helpEnabled && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
      e.preventDefault();
      setIsHelpVisible(prev => !prev);
      return;
    }

    // Handle Escape to close help
    if (e.key === 'Escape' && isHelpVisible) {
      setIsHelpVisible(false);
      return;
    }

    // Navigation shortcuts
    if (e.key === 'Tab') {
      if (preventDefault) e.preventDefault();
      cycleDisplayMode();
      return;
    }

    if (e.key === ' ' || e.code === 'Space') {
      if (preventDefault) e.preventDefault();
      onToggleAutoPilot?.();
      return;
    }

    // Display shortcuts
    if (e.key.toLowerCase() === 'f') {
      if (preventDefault) e.preventDefault();
      onToggleFullscreen?.();
      return;
    }

    if (e.key.toLowerCase() === 't') {
      if (preventDefault) e.preventDefault();
      toggleTheme();
      return;
    }

    if (e.key.toLowerCase() === 'm') {
      if (preventDefault) e.preventDefault();
      cycleMapDisplayMode();
      return;
    }

    // Data shortcuts
    if (e.key.toLowerCase() === 'r') {
      if (preventDefault) e.preventDefault();
      onRefetch?.();
      return;
    }
  }, [
    enabled,
    preventDefault,
    helpEnabled,
    isHelpVisible,
    cycleDisplayMode,
    cycleMapDisplayMode,
    toggleTheme,
    onToggleAutoPilot,
    onToggleFullscreen,
    onRefetch,
  ]);

  // Attach event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Build registered shortcuts list for help display
  const registeredShortcuts: KeyboardShortcut[] = [
    {
      key: 'Tab',
      description: 'Cycle display mode',
      category: 'display',
      action: cycleDisplayMode,
    },
    {
      key: 'Space',
      description: 'Pause/Resume auto-pilot',
      category: 'navigation',
      action: onToggleAutoPilot || (() => {}),
    },
    {
      key: 'F',
      description: 'Toggle fullscreen',
      category: 'display',
      action: onToggleFullscreen || (() => {}),
    },
    {
      key: 'T',
      description: 'Cycle theme',
      category: 'display',
      action: toggleTheme,
    },
    {
      key: 'M',
      description: 'Cycle map mode',
      category: 'display',
      action: cycleMapDisplayMode,
    },
    {
      key: 'R',
      description: 'Refresh data',
      category: 'data',
      action: onRefetch || (() => {}),
    },
    {
      key: '?',
      description: 'Show help',
      category: 'help',
      action: toggleHelp,
    },
  ];

  return {
    isHelpVisible,
    toggleHelp,
    hideHelp,
    registeredShortcuts,
  };
}

// ============================================================================
// Help Panel Component Helper
// ============================================================================

/**
 * Get shortcuts grouped by category for help display
 */
export function getShortcutsByCategory(
  shortcuts: KeyboardShortcut[]
): Record<string, KeyboardShortcut[]> {
  return shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);
}

/**
 * Format shortcut key for display
 */
export function formatShortcutKey(key: string, modifier?: string): string {
  const parts: string[] = [];
  
  if (modifier) {
    parts.push(modifier.charAt(0).toUpperCase() + modifier.slice(1));
  }
  
  if (key === ' ') {
    parts.push('Space');
  } else if (key.length === 1) {
    parts.push(key.toUpperCase());
  } else {
    parts.push(key);
  }
  
  return parts.join(' + ');
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  useKeyboardShortcuts,
  DEFAULT_SHORTCUTS,
  getShortcutsByCategory,
  formatShortcutKey,
};
