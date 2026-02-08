# Global Intel Map - Frontend Implementation Plan
## Bloomberg Terminal War Room Edition

---

## Phase 1: 基础架构升级

### 1.1 主题系统实现
**文件**: `src/contexts/ThemeContext.tsx`

功能:
- 三种主题切换 (Terminal / Amber / Light)
- CSS Variables 动态更新
- localStorage 保存偏好
- 平滑过渡动画

### 1.2 布局系统重构
**文件**: `src/components/layout/TerminalLayout.tsx`

结构:
```
<TerminalLayout>
  <TickerBar />
  <MainContent mode={displayMode}>
    <MapPanel />
    <NewsPanel />
    <MarketDataPanel />
  </MainContent>
  <StatusBar />
</TerminalLayout>
```

---

## Phase 2: 核心组件开发

### 2.1 Ticker Bar (滚动新闻条)
**文件**: `src/components/TickerBar.tsx`

功能:
- 水平滚动显示最新P0/P1事件
- 优先级颜色编码
- 点击跳转到地图位置
- 自动更新

样式:
- 高度: 32px
- 背景: terminal-bg-secondary
- 文字: terminal-text-primary
- 优先级: P0红色闪烁, P1橙色

### 2.2 地图区域增强
**文件**: `src/components/InteractiveMap.tsx` (升级)

增强功能:
- 热点脉冲动画 (P0红色, P1橙色呼吸)
- 区域热力着色
- 航线/流向动画
- 主题适配

### 2.3 新闻列表优化
**文件**: `src/components/NewsFeed.tsx` (升级)

优化:
- 卡片 Bloomberg 风格
- 优先级图标
- 时间格式化
- 新条目淡入动画
- 紧凑模式适配

### 2.4 市场数据面板
**文件**: `src/components/MarketDataPanel.tsx` (新建)

功能:
- 可折叠侧边栏
- 实时价格显示
- 涨跌颜色编码
- 与新闻的相关性高亮

数据:
- S&P 500, NASDAQ
- GOLD, OIL
- BTC
- USD/CNY

### 2.5 状态栏
**文件**: `src/components/StatusBar.tsx` (新建)

显示:
- 在线状态
- 最后更新时间 (UTC)
- 本地时区时间
- 事件计数
- 网络延迟
- 主题切换按钮

---

## Phase 3: 显示模式系统

### 3.1 三种布局模式
**文件**: `src/hooks/useDisplayMode.ts`

**标准模式** (默认):
- 地图 60% + 新闻 30% + 市场数据 10%(可折叠)
- 适合主动筛选阅读

**紧凑模式**:
- 更高信息密度
- 市场数据固定显示
- 适合副屏监控

**沉浸模式**:
- 地图最大化 (85%)
- 新闻列表悬浮/最小化
- 适合大屏展示

切换: `Tab` 键或界面按钮

---

## Phase 4: 动画与交互

### 4.1 动画系统
**文件**: `src/styles/animations.css`

- 脉冲动画 (P0热点)
- 呼吸动画 (P1热点)
- 数据更新闪烁
- 新条目淡入
- Ticker滚动

### 4.2 键盘快捷键
**文件**: `src/hooks/useKeyboardShortcuts.ts`

| 按键 | 功能 |
|------|------|
| Tab | 切换显示模式 |
| Space | 暂停/恢复 Auto-Pilot |
| F | 全屏切换 |
| T | 主题切换 |
| M | 展开/折叠市场数据 |
| ? | 快捷键帮助 |

---

## Phase 5: 响应式优化

### 5.1 断点适配
- ≥1440px: 完整布局
- 1024-1439px: 紧凑布局
- <1024px: 仅列表/地图切换

### 5.2 副屏优化
- 默认紧凑模式
- 减少动画
- 延长刷新间隔

---

## Implementation Order

1. ✅ 设计规范文档
2. ✅ Tailwind配置
3. ⏳ 主题系统 (ThemeContext)
4. ⏳ 布局重构 (TerminalLayout)
5. ⏳ Ticker Bar
6. ⏳ Status Bar
7. ⏳ Market Data Panel
8. ⏳ 地图增强
9. ⏳ 新闻列表优化
10. ⏳ 显示模式系统
11. ⏳ 动画系统
12. ⏳ 键盘快捷键
13. ⏳ 响应式适配

---

## Success Criteria

### 视觉
- [ ] 看起来像专业金融终端
- [ ] 深色主题不刺眼
- [ ] 信息密度高但不混乱
- [ ] 动效流畅

### 功能
- [ ] 3种主题正常切换
- [ ] 3种显示模式正常切换
- [ ] Ticker滚动正常
- [ ] 地图热点动画正常
- [ ] 键盘快捷键正常工作

### 性能
- [ ] 首屏 < 3秒
- [ ] 60fps 动画
- [ ] 无内存泄漏

---

**Created**: 2026-02-08
**Status**: Design Complete, Ready for Implementation
