# Unified Design System: Global Intel Map
## Bloomberg Terminal War Room Edition
## Web + Remotion Shared Design Language

---

## 🎯 统一设计目标

### 核心原则
- **Single Source of Truth**: 一套设计Token，Web和Remotion共享
- **Visual Consistency**: 视频和实时界面视觉完全一致
- **Professional Bloomberg Terminal Aesthetic**: 金融终端专业感
- **War Room Impact**: 战情室的实时态势感知

---

## 📐 共享设计Token

### 1. 色彩系统 (Design Tokens)

```typescript
// src/styles/designTokens.ts
export const designTokens = {
  // Background Colors
  bg: {
    primary: '#000000',      // 主背景 - 纯黑
    secondary: '#0a0a0f',    // 次背景 - 极深蓝黑
    tertiary: '#111118',     // 卡片背景
    hover: '#1a1a24',        // 悬停背景
    map: '#0a0a0a',          // 地图背景
  },
  
  // Text Colors
  text: {
    primary: '#e0e0e0',      // 主文字 - 灰白
    secondary: '#8b8b9a',    // 次文字 - 中灰
    muted: '#5a5a6b',        // 弱化文字 - 深灰
    disabled: '#3a3a4a',     // 禁用文字
  },
  
  // Bloomberg Terminal Accents
  accent: {
    up: '#00ff41',           // 上涨/正面 - 荧光绿
    down: '#ff3333',         // 下跌/负面 - 警示红
    info: '#00d4ff',         // 信息/中性 - 电光蓝
    warning: '#ffaa00',      // 警告 - 琥珀黄
    neutral: '#888888',      // 中性灰
  },
  
  // Priority Colors (Critical for both Web & Remotion)
  priority: {
    p0: '#ff0000',           // 紧急 - 纯红 + 脉冲
    p1: '#ff6600',           // 重大 - 橙色 + 呼吸
    p2: '#ffcc00',           // 关注 - 黄色
    p3: '#666666',           // 一般 - 灰色
  },
  
  // Borders
  border: {
    default: '#1a1a24',
    active: '#333340',
    highlight: 'rgba(255,255,255,0.1)',
  },
  
  // Shadows
  shadow: {
    glowUp: '0 0 10px rgba(0, 255, 65, 0.5)',
    glowDown: '0 0 10px rgba(255, 51, 51, 0.5)',
    glowInfo: '0 0 10px rgba(0, 212, 255, 0.5)',
    panel: '0 4px 20px rgba(0, 0, 0, 0.5)',
  },
} as const;

// 三种主题变体
export const themes = {
  terminal: designTokens, // 默认
  
  amber: {
    ...designTokens,
    bg: {
      primary: '#1a1a1a',
      secondary: '#242424',
      tertiary: '#2a2a2a',
      hover: '#333333',
      map: '#242424',
    },
    text: {
      primary: '#e8dcc0',
      secondary: '#b8a880',
      muted: '#8a7a60',
      disabled: '#5a5030',
    },
    accent: {
      up: '#ffb347',
      down: '#ff6b6b',
      info: '#87ceeb',
      warning: '#ffd700',
      neutral: '#a09070',
    },
  },
  
  light: {
    ...designTokens,
    bg: {
      primary: '#f5f5f5',
      secondary: '#ffffff',
      tertiary: '#f0f0f0',
      hover: '#e8e8e8',
      map: '#fafafa',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#4a4a4a',
      muted: '#7a7a7a',
      disabled: '#aaaaaa',
    },
    accent: {
      up: '#22c55e',
      down: '#ef4444',
      info: '#3b82f6',
      warning: '#eab308',
      neutral: '#6b7280',
    },
  },
} as const;

export type Theme = keyof typeof themes;
export type DesignTokens = typeof designTokens;
```

---

### 2. 字体系统

```typescript
// src/styles/typography.ts
export const typography = {
  // Font Families
  fontFamily: {
    mono: '"JetBrains Mono", "IBM Plex Mono", "Fira Code", monospace',
    sans: '"Inter", "SF Pro Display", "Segoe UI", system-ui, sans-serif',
    chinese: '"Source Han Sans CN", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  
  // Font Sizes (px)
  size: {
    ticker: 12,      // 滚动新闻
    label: 11,       // 标签
    data: 13,        // 数据
    body: 14,        // 正文
    title: 16,       // 标题
    heading: 20,     // 大标题
    display: 24,     // 展示
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
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  // Letter Spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
  },
} as const;
```

---

### 3. 间距系统

```typescript
// src/styles/spacing.ts
export const spacing = {
  // Layout
  layout: {
    tickerHeight: 32,        // px
    statusHeight: 28,        // px
    panelWidth: 280,         // px
    sidebarWidth: 320,       // px
  },
  
  // Component
  component: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  
  // Border Radius
  radius: {
    none: 0,
    sm: 2,
    md: 4,
    lg: 8,
  },
  
  // Z-Index Scale
  zIndex: {
    base: 0,
    map: 10,
    panel: 30,
    status: 40,
    ticker: 50,
    modal: 100,
  },
} as const;
```

---

### 4. 动画系统

```typescript
// src/styles/animations.ts
export const animations = {
  // Duration (ms)
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    pulse: 2000,      // 2秒脉冲周期
    breathe: 3000,    // 3秒呼吸周期
    ticker: 30000,    // 30秒滚动周期
  },
  
  // Easing
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    linear: 'linear',
  },
  
  // CSS Keyframes for Web
  keyframes: {
    pulseRing: `
      @keyframes pulse-ring {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(3); opacity: 0; }
      }
    `,
    breathe: `
      @keyframes breathe {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.2); opacity: 1; }
      }
    `,
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
    fadeInDown: `
      @keyframes fade-in-down {
        0% { opacity: 0; transform: translateY(-10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
    `,
    ticker: `
      @keyframes ticker {
        0% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
    `,
  },
  
  // Remotion-specific spring configs
  remotion: {
    // Spring animations for Remotion
    spring: {
      gentle: { damping: 15, stiffness: 120, mass: 1 },
      snappy: { damping: 20, stiffness: 300, mass: 0.8 },
      smooth: { damping: 25, stiffness: 200, mass: 1 },
    },
    
    // Interpolate configs
    interpolate: {
      clamp: { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const,
      extend: { extrapolateLeft: 'extend', extrapolateRight: 'extend' } as const,
    },
  },
} as const;
```

---

## 🎨 组件规范

### 1. NewsCard (统一设计)

**Web Version (Tailwind)**:
```tsx
<div className="p-4 border-b border-terminal-border bg-terminal-bg-tertiary/50 mb-1 text-terminal-text-primary">
  <div className="text-label text-terminal-text-secondary mb-1 flex justify-between">
    <span>{source}</span>
    <span>{time}</span>
  </div>
  <h3 className="text-title font-semibold mb-2 leading-tight text-terminal-text-primary">
    {title}
  </h3>
  <p className="text-body text-terminal-text-secondary leading-relaxed line-clamp-3">
    {summary}
  </p>
</div>
```

**Remotion Version (Inline Styles)**:
```tsx
<div style={{
  padding: spacing.component.lg,
  borderBottom: `1px solid ${designTokens.border.default}`,
  backgroundColor: `${designTokens.bg.tertiary}80`, // 50% opacity
  marginBottom: spacing.component.xs,
  color: designTokens.text.primary,
  fontFamily: typography.fontFamily.sans,
}}>
  {/* Same structure */}
</div>
```

---

### 2. Priority Indicators

**P0 - Critical (Red Pulse)**:
```tsx
// Web
<div className="relative">
  <div className="absolute inset-0 animate-pulse-ring rounded-full bg-priority-p0/30" />
  <div className="relative w-4 h-4 rounded-full bg-priority-p0" />
</div>

// Remotion
const pulseScale = interpolate(frame % 60, [0, 30], [1, 3], { extrapolateRight: 'clamp' });
const pulseOpacity = interpolate(frame % 60, [0, 30], [1, 0], { extrapolateRight: 'clamp' });
<div style={{ position: 'relative' }}>
  <div style={{
    position: 'absolute',
    inset: 0,
    transform: `scale(${pulseScale})`,
    opacity: pulseOpacity,
    borderRadius: '50%',
    backgroundColor: `${designTokens.priority.p0}30`,
  }} />
  <div style={{
    position: 'relative',
    width: 16,
    height: 16,
    borderRadius: '50%',
    backgroundColor: designTokens.priority.p0,
  }} />
</div>
```

---

## 🔧 技术实现架构

### 文件结构

```
src/
├── styles/
│   ├── designTokens.ts          # 共享设计Token
│   ├── typography.ts            # 字体系统
│   ├── spacing.ts               # 间距系统
│   ├── animations.ts            # 动画系统
│   └── index.ts                 # 统一导出
│
├── components/
│   ├── ui/                      # 共享UI组件
│   │   ├── NewsCard.tsx         # Web版本
│   │   ├── PriorityBadge.tsx    # 优先级标记
│   │   └── TickerText.tsx       # 滚动文字
│   │
│   ├── layout/
│   │   ├── TerminalLayout.tsx   # 终端布局
│   │   ├── TickerBar.tsx        # 顶部滚动条
│   │   ├── StatusBar.tsx        # 底部状态栏
│   │   └── MarketDataPanel.tsx  # 市场数据面板
│   │
│   └── map/
│       ├── InteractiveMap.tsx   # Web地图
│       └── MapMarkers.tsx       # 地图标记
│
├── remotion/
│   ├── components/
│   │   ├── WorldMap.tsx         # Remotion地图 (更新)
│   │   ├── NewsCard.tsx         # Remotion卡片 (更新)
│   │   ├── PriorityIndicator.tsx # 优先级动画
│   │   └── TickerBand.tsx       # 滚动条动画
│   │
│   ├── compositions/
│   │   ├── TerminalIntro.tsx    # 开场动画
│   │   ├── NewsVisualization.tsx # 主合成 (更新)
│   │   └── DailyDigest.tsx      # 每日摘要
│   │
│   └── Root.tsx                 # 入口
│
└── hooks/
    ├── useTheme.ts              # 主题切换
    ├── useDisplayMode.ts        # 显示模式
    └── useKeyboardShortcuts.ts  # 快捷键
```

---

## 📋 详细TODO列表

### Phase 1: 基础架构 (共享设计系统)

- [ ] **1.1** 创建 `src/styles/designTokens.ts` - 色彩Token
- [ ] **1.2** 创建 `src/styles/typography.ts` - 字体系统  
- [ ] **1.3** 创建 `src/styles/spacing.ts` - 间距系统
- [ ] **1.4** 创建 `src/styles/animations.ts` - 动画系统
- [ ] **1.5** 创建 `src/styles/index.ts` - 统一导出

### Phase 2: Web前端组件

- [ ] **2.1** 创建 `src/components/layout/TerminalLayout.tsx` - 终端布局
- [ ] **2.2** 创建 `src/components/layout/TickerBar.tsx` - 顶部滚动条
- [ ] **2.3** 创建 `src/components/layout/StatusBar.tsx` - 底部状态栏
- [ ] **2.4** 创建 `src/components/layout/MarketDataPanel.tsx` - 市场数据
- [ ] **2.5** 更新 `src/components/InteractiveMap.tsx` - 地图脉冲标记
- [ ] **2.6** 更新 `src/components/NewsFeed.tsx` - Bloomberg卡片风格
- [ ] **2.7** 更新 `src/components/Filters.tsx` - 主题切换按钮

### Phase 3: Remotion组件更新

- [ ] **3.1** 更新 `src/remotion/components/WorldMap.tsx` - 应用设计Token
- [ ] **3.2** 更新 `src/remotion/components/NewsCard.tsx` - Bloomberg风格
- [ ] **3.3** 创建 `src/remotion/components/PriorityIndicator.tsx` - 脉冲动画
- [ ] **3.4** 创建 `src/remotion/components/TickerBand.tsx` - 滚动条
- [ ] **3.5** 更新 `src/remotion/NewsVisualization.tsx` - 整合新组件
- [ ] **3.6** 创建 `src/remotion/compositions/TerminalIntro.tsx` - 开场动画

### Phase 4: 交互系统

- [ ] **4.1** 创建 `src/hooks/useTheme.ts` - 主题切换hook
- [ ] **4.2** 创建 `src/hooks/useDisplayMode.ts` - 显示模式hook
- [ ] **4.3** 创建 `src/hooks/useKeyboardShortcuts.ts` - 快捷键hook
- [ ] **4.4** 更新 `src/app/[locale]/page.tsx` - 整合所有组件

### Phase 5: Tailwind配置更新

- [ ] **5.1** 更新 `tailwind.config.ts` - 添加设计Token
- [ ] **5.2** 创建 `src/styles/globals.css` - 全局样式+CSS变量
- [ ] **5.3** 添加主题切换CSS类

### Phase 6: 测试与优化

- [ ] **6.1** 测试三种主题切换
- [ ] **6.2** 测试三种显示模式
- [ ] **6.3** 测试键盘快捷键
- [ ] **6.4** 测试Remotion视频生成
- [ ] **6.5** 性能优化

---

## ✅ 成功标准

### 视觉一致性
- [ ] Web和Remotion色彩完全一致
- [ ] 字体系统统一
- [ ] 间距系统统一
- [ ] 动画风格统一

### 功能完整
- [ ] 三种主题正常切换 (Terminal/Amber/Light)
- [ ] 三种显示模式正常 (标准/紧凑/沉浸)
- [ ] Ticker滚动正常
- [ ] 地图脉冲动画正常
- [ ] 键盘快捷键正常
- [ ] Remotion视频生成正常

### Bloomberg终端感
- [ ] 看起来像专业金融终端
- [ ] 深色主题不刺眼
- [ ] 信息密度高但不混乱
- [ ] 荧光绿/红强调色正确使用
- [ ] 等宽字体用于数据

---

**Total Tasks**: 30
**Estimated Time**: 2-3 days
**Priority**: High

**Ready to start implementation?** 🚀
