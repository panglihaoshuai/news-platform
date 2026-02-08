# 🚀 并行优化开发方案 - 执行规范 v1.0
**Global Intel Map - Bloomberg Terminal War Room Edition**
**开发模式**: 优化并行 (6个阶段，关键节点串行验证)
**预计总时长**: 4-5小时
**开始时间**: 等待用户批准

---

## ⚠️ **STOP - 开发前必须阅读**

### 📋 批准流程
```
1. 用户阅读本规范 ✓
2. 用户确认理解 ✓  
3. 用户回复"批准开发" ← YOU ARE HERE
4. 开始Phase 1
5. 每个Phase完成后等待验证
6. 用户确认后继续下一阶段
```

**⚠️ 严禁**: 未经用户批准开始任何编码
**⚠️ 必须**: 每个Phase完成后汇报并等待确认

---

## 🎯 开发原则与规范

### 代码质量标准
1. **TypeScript严格模式** - 所有文件必须有完整类型定义
2. **零any类型** - 禁用`any`，使用`unknown`+类型守卫
3. **组件单一职责** - 一个组件只做一件事
4. **设计Token优先** - 所有颜色/间距必须使用设计Token
5. **动画性能优先** - 使用transform/opacity，避免layout触发

### 文件命名规范
```
组件: PascalCase.tsx (如: TickerBar.tsx)
Hooks: camelCase.ts (如: useTheme.ts)
样式: camelCase.ts (如: designTokens.ts)
工具: camelCase.ts (如: formatTime.ts)
```

### 代码提交规范
```
每个文件完成后立即提交
提交消息格式: "[Phase X.Y] 添加/更新/修复: 简要描述"
示例: "[Phase 2.1] 添加: TerminalLayout组件基础结构"
```

### 错误处理规范
```typescript
// 必须处理所有错误
if (error) {
  console.error('[ComponentName] Error:', error);
  return <ErrorFallback />; // 或适当的降级UI
}

// 不使用空的catch块
// ❌ catch (e) {}
// ✅ catch (e) { console.error('具体错误信息:', e); }
```

---

## 🚀 六阶段执行计划

### 📌 阶段间依赖关系图

```
Phase 1 (基础设计系统) [30分钟]
    │
    ▼ 用户验证通过
    
Phase 2A (独立组件) [1.5小时] ← 并行6个agents
    ├── 2.5 InteractiveMap (Web)
    ├── 2.6 NewsFeed (Web)
    ├── 2.7 Filters (Web)
    ├── 3.1 WorldMap (Remotion)
    ├── 3.2 NewsCard (Remotion)
    └── 3.3 PriorityIndicator (Remotion)
    │
    ▼ 用户验证通过
    
Phase 2B (布局基础) [1小时] ← 并行3个agents  
    ├── 2.1 TerminalLayout (基础)
    ├── 4.1 useTheme (Hook)
    └── 4.2 useDisplayMode (Hook)
    │
    ▼ 用户验证通过
    
Phase 2C (布局整合) [30分钟] ← 串行
    ├── 2.2 TickerBar
    ├── 2.3 StatusBar
    └── 2.4 MarketDataPanel
    │
    ▼ 用户验证通过
    
Phase 3 (Remotion整合) [45分钟] ← 串行
    ├── 3.4 TickerBand
    ├── 3.5 NewsVisualization
    └── 3.6 TerminalIntro
    │
    ▼ 用户验证通过
    
Phase 4 (系统整合) [1小时] ← 串行
    ├── 4.3 useKeyboardShortcuts
    ├── 4.4 page.tsx整合
    └── Phase 5 (Tailwind配置)
    │
    ▼ 用户验证通过
    
Phase 5 (测试优化) [1小时]
    └── 全面测试与优化
```

---

## 📋 详细任务清单

### 🔷 Phase 1: 基础设计系统 (30分钟) [阻塞所有后续阶段]

**状态**: ⏳ 等待开始
**阻塞**: 无
**完成后解锁**: Phase 2A, Phase 2B

#### 1.1 designTokens.ts (8分钟)
**路径**: `src/styles/designTokens.ts`
**必须实现**:
```typescript
export const designTokens = {
  bg: { primary: '#000000', secondary: '#0a0a0f', tertiary: '#111118', hover: '#1a1a24', map: '#0a0a0a' },
  text: { primary: '#e0e0e0', secondary: '#8b8b9a', muted: '#5a5a6b', disabled: '#3a3a4a' },
  accent: { up: '#00ff41', down: '#ff3333', info: '#00d4ff', warning: '#ffaa00', neutral: '#888888' },
  priority: { p0: '#ff0000', p1: '#ff6600', p2: '#ffcc00', p3: '#666666' },
  border: { default: '#1a1a24', active: '#333340', highlight: 'rgba(255,255,255,0.1)' },
  shadow: { 
    glowUp: '0 0 10px rgba(0, 255, 65, 0.5)', 
    glowDown: '0 0 10px rgba(255, 51, 51, 0.5)',
    panel: '0 4px 20px rgba(0, 0, 0, 0.5)' 
  },
} as const;

export const themes = { terminal: designTokens, amber: {...}, light: {...} } as const;
export type Theme = keyof typeof themes;
```
**验证点**: TypeScript编译无错误，类型推断正确

#### 1.2 typography.ts (6分钟)
**路径**: `src/styles/typography.ts`
**必须实现**:
```typescript
export const typography = {
  fontFamily: {
    mono: '"JetBrains Mono", "IBM Plex Mono", "Fira Code", monospace',
    sans: '"Inter", "SF Pro Display", system-ui, sans-serif',
    chinese: '"Source Han Sans CN", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  size: { ticker: 12, label: 11, data: 13, body: 14, title: 16, heading: 20, display: 24 },
  weight: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeight: { tight: 1.2, normal: 1.4, relaxed: 1.6 },
} as const;
```

#### 1.3 spacing.ts (5分钟)
**路径**: `src/styles/spacing.ts`
**必须实现**:
```typescript
export const spacing = {
  layout: { tickerHeight: 32, statusHeight: 28, panelWidth: 280, sidebarWidth: 320 },
  component: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
  radius: { none: 0, sm: 2, md: 4, lg: 8 },
  zIndex: { base: 0, map: 10, panel: 30, status: 40, ticker: 50 },
} as const;
```

#### 1.4 animations.ts (8分钟)
**路径**: `src/styles/animations.ts`
**必须实现**:
```typescript
export const animations = {
  duration: { fast: 150, normal: 200, slow: 300, pulse: 2000, breathe: 3000, ticker: 30000 },
  easing: { smooth: 'cubic-bezier(0.4, 0, 0.2, 1)', bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  remotion: {
    spring: { gentle: { damping: 15, stiffness: 120 }, snappy: { damping: 20, stiffness: 300 } },
  },
} as const;
```

#### 1.5 index.ts (3分钟)
**路径**: `src/styles/index.ts`
**必须实现**:
```typescript
export { designTokens, themes } from './designTokens';
export { typography } from './typography';
export { spacing } from './spacing';
export { animations } from './animations';
```

**Phase 1 完成检查清单**:
- [ ] 所有5个文件创建完成
- [ ] TypeScript编译无错误
- [ ] 可以从其他文件正确导入
- [ ] 类型推断正确

**Phase 1 完成后汇报内容**:
1. 每个文件是否成功创建
2. TypeScript编译结果
3. 示例导入测试是否通过
4. 遇到的问题和解决方案

---

### 🔷 Phase 2A: 独立组件并行开发 (1.5小时) [并行6个agents]

**状态**: ⏳ 等待Phase 1完成
**阻塞**: Phase 1必须完成
**并行度**: 6个agents同时工作
**完成后解锁**: Phase 2B

**⚠️ 重要**: 这6个任务完全独立，互不影响！

#### 2.5 InteractiveMap.tsx - Web地图升级 (25分钟)
**Agent**: A
**路径**: `src/components/InteractiveMap.tsx` (更新)
**依赖**: 仅依赖Phase 1的设计Token
**不影响**: 任何其他文件
**变更范围**: 仅样式和动画更新，不改动逻辑
**必须实现**:
- 应用设计Token色彩
- 添加P0红色脉冲标记动画
- 添加P1橙色呼吸标记动画
- 更新地图标记样式为Bloomberg风格

**代码规范**:
```typescript
// 使用设计Token
import { designTokens, animations } from '@/styles';

// 标记颜色
const markerColor = priority === 'P0' ? designTokens.priority.p0 : designTokens.priority.p1;

// 脉冲动画CSS
const pulseAnimation = `${animations.duration.pulse}ms pulse-ring infinite`;
```

**验证点**:
- [ ] 地图正常加载
- [ ] 脉冲动画流畅(60fps)
- [ ] 色彩符合设计Token

#### 2.6 NewsFeed.tsx - Web新闻列表升级 (25分钟)
**Agent**: B
**路径**: `src/components/NewsFeed.tsx` (更新)
**依赖**: 仅Phase 1
**不影响**: 其他文件
**变更范围**: 仅样式更新
**必须实现**:
- Bloomberg风格卡片设计
- 优先级颜色编码(P0红/P1橙/P2黄/P3灰)
- 时间格式化显示
- 新条目淡入动画
- 紧凑模式适配

**代码规范**:
```typescript
// 卡片样式使用Tailwind + 设计Token
className="p-4 border-b border-terminal-border bg-terminal-bg-tertiary/50"
// 优先级颜色
const priorityColor = {
  P0: 'text-priority-p0',
  P1: 'text-priority-p1',
  // ...
}[priority];
```

#### 2.7 Filters.tsx - Web筛选器升级 (20分钟)
**Agent**: C
**路径**: `src/components/Filters.tsx` (更新)
**依赖**: 仅Phase 1
**不影响**: 其他文件
**变更范围**: 添加主题切换按钮
**必须实现**:
- 添加主题切换按钮组(Terminal/Amber/Light)
- 添加显示模式切换按钮
- 应用Bloomberg风格样式

#### 3.1 WorldMap.tsx - Remotion地图更新 (20分钟)
**Agent**: D
**路径**: `src/remotion/components/WorldMap.tsx` (更新)
**依赖**: 仅Phase 1
**不影响**: 其他文件
**变更范围**: 仅inline styles更新
**必须实现**:
```typescript
import { designTokens } from '@/styles';

// 背景色更新
style={{ backgroundColor: designTokens.bg.map }}

// 标记颜色更新  
new maplibregl.Marker({ color: designTokens.priority.p0 })
```

#### 3.2 NewsCard.tsx - Remotion新闻卡片更新 (20分钟)
**Agent**: E
**路径**: `src/remotion/components/NewsCard.tsx` (更新)
**依赖**: 仅Phase 1
**不影响**: 其他文件
**变更范围**: 仅inline styles更新
**必须实现**:
```typescript
style={{
  backgroundColor: `${designTokens.bg.tertiary}80`, // 50% opacity
  borderBottom: `1px solid ${designTokens.border.default}`,
  color: designTokens.text.primary,
  fontFamily: typography.fontFamily.sans,
}}
```

#### 3.3 PriorityIndicator.tsx - Remotion优先级动画 (30分钟)
**Agent**: F
**路径**: `src/remotion/components/PriorityIndicator.tsx` (新建)
**依赖**: 仅Phase 1
**不影响**: 其他文件
**必须实现**:
```typescript
import { useCurrentFrame, interpolate } from 'remotion';
import { designTokens, animations } from '@/styles';

// P0脉冲动画
const pulseScale = interpolate(frame % 60, [0, 30], [1, 3], { extrapolateRight: 'clamp' });
const pulseOpacity = interpolate(frame % 60, [0, 30], [1, 0], { extrapolateRight: 'clamp' });

// P1呼吸动画  
const breatheScale = interpolate(frame % 90, [0, 45], [1, 1.2], { extrapolateRight: 'clamp' });
```

**Phase 2A 完成检查清单**:
- [ ] 6个文件全部完成
- [ ] 每个文件独立测试通过
- [ ] 没有文件冲突
- [ ] 样式符合设计Token

**Phase 2A 完成后汇报内容**:
1. 每个agent的完成情况
2. 每个文件的测试结果
3. 遇到的问题汇总
4. 建议的优化点

---

### 🔷 Phase 2B: 布局基础并行开发 (1小时) [并行3个agents]

**状态**: ⏳ 等待Phase 2A完成
**阻塞**: Phase 2A必须完成
**并行度**: 3个agents
**完成后解锁**: Phase 2C

#### 2.1 TerminalLayout.tsx - 终端布局基础 (30分钟)
**Agent**: G
**路径**: `src/components/layout/TerminalLayout.tsx` (新建)
**依赖**: Phase 1
**阻塞**: 2.2, 2.3, 2.4依赖此文件
**必须实现**:
```typescript
interface TerminalLayoutProps {
  mode: 'standard' | 'compact' | 'immersive';
  ticker: React.ReactNode;
  main: React.ReactNode;
  status: React.ReactNode;
}

// 三种模式布局
// Standard: 地图60% + 新闻30% + 市场10%
// Compact: 高密度，市场数据固定
// Immersive: 地图85%，其他最小化
```

#### 4.1 useTheme.ts - 主题切换Hook (20分钟)
**Agent**: H
**路径**: `src/hooks/useTheme.ts` (新建)
**依赖**: Phase 1
**不影响**: 其他文件
**必须实现**:
```typescript
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('terminal');
  // localStorage持久化
  // CSS类切换
  // 平滑过渡
  return { theme, setTheme, toggleTheme };
}
```

#### 4.2 useDisplayMode.ts - 显示模式Hook (15分钟)
**Agent**: I
**路径**: `src/hooks/useDisplayMode.ts` (新建)
**依赖**: Phase 1
**不影响**: 其他文件
**必须实现**:
```typescript
export type DisplayMode = 'standard' | 'compact' | 'immersive';
export function useDisplayMode() {
  const [mode, setMode] = useState<DisplayMode>('standard');
  // Tab键切换
  // 状态持久化
  return { mode, setMode, cycleMode };
}
```

**Phase 2B 完成检查清单**:
- [ ] TerminalLayout基础结构完成
- [ ] useTheme Hook完成
- [ ] useDisplayMode Hook完成

---

### 🔷 Phase 2C: 布局组件整合 (30分钟) [串行]

**状态**: ⏳ 等待Phase 2B完成
**阻塞**: Phase 2B必须完成
**串行度**: 3个任务串行(有依赖)
**完成后解锁**: Phase 3

**⚠️ 注意**: 这3个任务必须串行，因为都依赖TerminalLayout

#### 2.2 TickerBar.tsx (15分钟)
**路径**: `src/components/layout/TickerBar.tsx`
**依赖**: TerminalLayout, useTheme
**必须实现**:
- 水平滚动P0/P1事件
- 优先级颜色编码
- 点击跳转功能

#### 2.3 StatusBar.tsx (10分钟)
**路径**: `src/components/layout/StatusBar.tsx`
**依赖**: TerminalLayout
**必须实现**:
- 在线状态指示器
- 最后更新时间(UTC)
- 本地时区时间
- 事件计数
- 网络延迟
- 主题切换按钮

#### 2.4 MarketDataPanel.tsx (15分钟)
**路径**: `src/components/layout/MarketDataPanel.tsx`
**依赖**: TerminalLayout
**必须实现**:
- 可折叠侧边栏
- 实时市场数据显示
- 涨跌颜色编码

**Phase 2C 完成后汇报**:
- 三个组件整合情况
- 布局显示是否正确

---

### 🔷 Phase 3: Remotion整合 (45分钟) [串行]

**状态**: ⏳ 等待Phase 2C完成
**阻塞**: Phase 2C
**完成后解锁**: Phase 4

#### 3.4 TickerBand.tsx (15分钟)
**路径**: `src/remotion/components/TickerBand.tsx`
**依赖**: 3.1-3.3完成
**必须实现**: 水平滚动新闻条动画

#### 3.5 NewsVisualization.tsx (20分钟)
**路径**: `src/remotion/NewsVisualization.tsx` (更新)
**依赖**: 3.4完成
**必须实现**: 整合所有Remotion组件

#### 3.6 TerminalIntro.tsx (15分钟)
**路径**: `src/remotion/compositions/TerminalIntro.tsx`
**依赖**: 3.5完成
**必须实现**: 开场动画

---

### 🔷 Phase 4: 系统整合 (1小时) [串行]

**状态**: ⏳ 等待Phase 3完成
**阻塞**: Phase 3
**完成后解锁**: Phase 5

#### 4.3 useKeyboardShortcuts.ts (20分钟)
**路径**: `src/hooks/useKeyboardShortcuts.ts`
**依赖**: 4.1, 4.2
**必须实现**: 所有快捷键

#### 4.4 page.tsx整合 (25分钟)
**路径**: `src/app/[locale]/page.tsx` (更新)
**依赖**: 所有组件完成
**必须实现**: 整合所有新组件和hooks

#### Phase 5: Tailwind配置 (15分钟)
**路径**: `tailwind.config.ts`, `src/styles/globals.css`
**必须实现**: 添加设计Token到Tailwind

---

### 🔷 Phase 5: 测试优化 (1小时)

**状态**: ⏳ 等待Phase 4完成
**阻塞**: Phase 4
**最终阶段**

#### 6.1-6.5 全面测试
- 主题切换测试
- 显示模式测试
- 键盘快捷键测试
- Remotion视频测试
- 性能优化

---

## 📊 质量门禁

### 每个Phase的通过标准

**Phase 1 (设计系统)**:
- [ ] TypeScript编译0错误
- [ ] 所有设计Token正确定义
- [ ] 可以从其他模块正确导入

**Phase 2A (独立组件)**:
- [ ] 每个组件独立渲染测试通过
- [ ] 样式符合设计Token
- [ ] 无文件冲突

**Phase 2B-C (布局)**:
- [ ] 页面布局正确显示
- [ ] 三种模式切换正常
- [ ] 响应式适配正确

**Phase 3 (Remotion)**:
- [ ] 视频生成成功
- [ ] 视觉与Web一致
- [ ] 动画流畅60fps

**Phase 4-5 (整合)**:
- [ ] 所有功能集成正常
- [ ] 快捷键工作正常
- [ ] 主题切换无闪烁

**Phase 6 (测试)**:
- [ ] 所有测试用例通过
- [ ] 性能指标达标
- [ ] 无内存泄漏

---

## 🚫 开发禁令

1. **禁止**: 未经用户批准开始任何Phase
2. **禁止**: 跳过质量门禁
3. **禁止**: 使用`any`类型
4. **禁止**: 硬编码颜色/间距(必须用设计Token)
5. **禁止**: 删除现有功能
6. **禁止**: 修改不相关的文件

---

## ✅ 准备完毕，等待批准

**当前状态**: ✅ 方案就绪，等待用户批准

**批准前确认**:
1. 你理解并行开发方案吗？
2. 你同意六阶段执行计划吗？
3. 你接受每个Phase完成后汇报的模式吗？
4. 还有其他问题或调整吗？

**请回复**: 
- "批准开发" - 开始Phase 1
- 或提出修改意见

**预计开始时间**: 收到批准后立即开始
**预计完成时间**: 批准后4-5小时
