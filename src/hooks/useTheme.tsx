/**
 * useTheme Hook - Theme Management
 * Bloomberg Terminal War Room Edition
 * 
 * Manages theme switching between:
 * - terminal: Dark terminal style (default)
 * - amber: Eye-care amber theme
 * - light: Bright day theme
 * 
 * Features:
 * - State management with localStorage persistence
 * - Syncs with system preference on first load
 * - Smooth transition animations
 * 
 * @module src/hooks/useTheme
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { Theme } from '@/types/news';

// ============================================================================
// Theme Context (for global theme access)
// ============================================================================

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Theme Provider Component
 */
export function ThemeProvider({ 
  children,
  defaultTheme = 'dark' as Theme
}: { 
  children: ReactNode;
  defaultTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true);
    
    // Try localStorage first
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored && (stored === 'dark' || stored === 'amber' || stored === 'light')) {
      setThemeState(stored);
      return;
    }

    // Fall back to system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState('dark');
    } else {
      setThemeState('light');
    }
  }, []);

  // Persist theme to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme class to document body for global styling
    document.body.classList.remove('theme-dark', 'theme-amber', 'theme-light');
    document.body.classList.add(`theme-${newTheme}`);
  }, []);

  // Toggle to next theme
  const toggleTheme = useCallback(() => {
    const themes: Theme[] = ['dark', 'amber', 'light'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  }, [theme, setTheme]);

  const value: ThemeContextValue = {
    theme: mounted ? theme : defaultTheme,
    setTheme,
    toggleTheme,
    availableThemes: ['dark', 'amber', 'light'],
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook - Use theme in components
 * 
 * @returns {ThemeContextValue} - Theme state and setters
 * 
 * @example
 * const { theme, setTheme, toggleTheme } = useTheme();
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * useThemeClassNames Hook - Get Tailwind class names for theme
 * 
 * @returns {Record<Theme, string>} - Class names for each theme
 */
export function useThemeClassNames(): Record<Theme, string> {
  const { theme } = useTheme();
  
  return {
    dark: theme === 'dark' ? 'bg-terminal text-terminal' : '',
    amber: theme === 'amber' ? 'bg-amber text-amber' : '',
    light: theme === 'light' ? 'bg-light text-light' : '',
  };
}

// ============================================================================
// Default Export (for convenience)
// ============================================================================

export default {
  Provider: ThemeProvider,
  useTheme,
  useThemeClassNames,
};
