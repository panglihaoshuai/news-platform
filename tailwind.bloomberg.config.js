/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Bloomberg Terminal Color System
      colors: {
        // Theme 1: Bloomberg Terminal (Default Dark)
        terminal: {
          bg: {
            primary: '#000000',
            secondary: '#0a0a0f',
            tertiary: '#111118',
            hover: '#1a1a24',
          },
          text: {
            primary: '#e0e0e0',
            secondary: '#8b8b9a',
            muted: '#5a5a6b',
          },
          accent: {
            green: '#00ff41',    // Up/Positive
            red: '#ff3333',      // Down/Negative
            blue: '#00d4ff',     // Info/Neutral
            yellow: '#ffaa00',   // Warning
            orange: '#ff6600',   // P1 Major
          },
          priority: {
            p0: '#ff0000',       // Critical + pulse
            p1: '#ff6600',       // Major + breathe
            p2: '#ffcc00',       // Attention
            p3: '#666666',       // Normal
          },
          border: '#1a1a24',
        },
        
        // Theme 2: Eye-care Amber Mode
        amber: {
          bg: {
            primary: '#1a1a1a',
            secondary: '#242424',
            tertiary: '#2a2a2a',
          },
          text: {
            primary: '#e8dcc0',
            secondary: '#b8a880',
            muted: '#8a7a60',
          },
          accent: {
            green: '#ffb347',
            red: '#ff6b6b',
            blue: '#87ceeb',
            yellow: '#ffd700',
          },
        },
        
        // Theme 3: Light Professional
        light: {
          bg: {
            primary: '#f5f5f5',
            secondary: '#ffffff',
            tertiary: '#f0f0f0',
          },
          text: {
            primary: '#1a1a1a',
            secondary: '#4a4a4a',
            muted: '#7a7a7a',
          },
          accent: {
            green: '#22c55e',
            red: '#ef4444',
            blue: '#3b82f6',
            yellow: '#eab308',
          },
        },
      },
      
      // Typography System
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        chinese: ['Source Han Sans CN', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      
      fontSize: {
        'ticker': ['12px', { lineHeight: '1.2', letterSpacing: '0.02em' }],
        'data': ['13px', { lineHeight: '1.4', fontFamily: 'JetBrains Mono, monospace' }],
        'label': ['11px', { lineHeight: '1.2', letterSpacing: '0.05em' }],
        'title': ['24px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      
      // Animation Timing
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
        'pulse': '2000ms',
        'breathe': '3000ms',
      },
      
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      
      // Spacing System
      spacing: {
        'ticker': '32px',
        'status': '28px',
        'panel': '280px',
      },
      
      // Z-Index Scale
      zIndex: {
        'ticker': '50',
        'status': '40',
        'panel': '30',
        'map': '10',
        'base': '0',
      },
      
      // Custom Animations
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'ticker': 'ticker 30s linear infinite',
        'flash-green': 'flash-green 500ms ease-out',
        'flash-red': 'flash-red 500ms ease-out',
        'fade-in-down': 'fade-in-down 200ms ease-out',
      },
      
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(3)', opacity: '0' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.2)', opacity: '1' },
        },
        'ticker': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'flash-green': {
          '0%': { backgroundColor: 'rgba(0, 255, 65, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'flash-red': {
          '0%': { backgroundColor: 'rgba(255, 51, 51, 0.3)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      
      // Box Shadows
      boxShadow: {
        'glow-green': '0 0 10px rgba(0, 255, 65, 0.5)',
        'glow-red': '0 0 10px rgba(255, 51, 51, 0.5)',
        'glow-blue': '0 0 10px rgba(0, 212, 255, 0.5)',
        'panel': '0 4px 20px rgba(0, 0, 0, 0.5)',
      },
      
      // Border Radius
      borderRadius: {
        'panel': '4px',
        'card': '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
