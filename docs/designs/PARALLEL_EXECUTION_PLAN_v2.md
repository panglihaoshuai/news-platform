# 🚀 更新版并行开发方案 - 执行规范 v2.0
**Global Intel Map - Bloomberg Terminal War Room Edition**
**包含热度算法与地图显示模式**

**开发模式**: 优化并行 (6个阶段，关键节点串行验证)
**预计总时长**: 5-6小时
**状态**: ✅ 计划已完备，等待用户最终批准

---

## ✅ 本次更新内容

### 新增功能模块
1. **热度计算系统** - 基于多源报道共识度的智能热度算法
2. **地图显示模式** - 三种模式切换（全局/重点/热力）
3. **地理聚类系统** - 同区域事件自动聚合成热点

### 关键发现
- ✅ 现有 `importance-scorer.ts` 可作为热度算法基础
- ✅ `NewsItem` 已有 `importance_score` 字段，可扩展热度数据
- ✅ 地图组件已使用 MapLibre 聚类功能，可在此基础上增强

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

## 🎯 核心功能规格

### 1. 热度算法 v2.0

**热度评分公式**:
```typescript
heatScore = min(100,
  sourceCount * 15 +           // 报道源数量 (max 5 sources = 75)
  authorityWeight * 20 +       // 权威性 (Tier1=20, Tier2=15, Tier3=10)
  freshnessScore * 10 +        // 新鲜度 (0-2h=10, decay 1pt/hr)
  geoClusterBonus * 5          // 地理聚集 (3+ events = 5)
)
```

**权威源分级**:
- **Tier 1** (20分): Reuters, BBC, NYT, WSJ, FT
- **Tier 2** (15分): Bloomberg, Guardian, Al Jazeera, 联合早报
- **Tier 3** (10分): RFI, BBC中文, WSJ中文, FT中文
- **Tier 4** (5分): 其他

**聚类规则**:
- 地理半径: 50km
- 时间窗口: 6小时
- 显示: 🔥 N个源报道 + 最高优先级颜色

### 2. 地图显示模式

| 模式 | 快捷键 | 显示内容 | 颜色编码 |
|------|--------|----------|----------|
| **全局视图** | M (cycle) | 所有新闻点 | 按优先级着色 |
| **重点视图** | M (cycle) | 仅P0/P1高优先级 | 红/橙色 |
| **热力视图** | M (cycle) | 聚类热点 | 热度大小+颜色 |

**切换方式**:
- 底部状态栏三个图标按钮
- 快捷键 **M** 循环切换
- 当前模式高亮显示

### 3. 三种主题系统

| 主题 | 快捷键 | 特点 |
|------|--------|------|
| **Terminal** | T | 荧光绿/黑，经典终端风 |
| **Amber** | T (cycle) | 琥珀色护眼，适合夜间 |
| **Light** | T (cycle) | 明亮模式，白天使用 |

### 4. 三种显示模式

| 模式 | 快捷键 | 布局 |
|------|--------|------|
| **标准** | Tab | 地图60% + 新闻30% + 市场10% |
| **紧凑** | Tab | 高密度，所有面板最小化 |
| **沉浸** | Tab | 地图85%，其他最小化 |

---

## 🏗️ 技术架构更新

### 新增文件清单

```
src/
├── lib/
│   ├── heat-calculator.ts          # 热度计算核心
│   ├── geo-clustering.ts           # 地理聚类算法
│   └── importance-scorer.ts        # 已存在，需扩展热度字段
│
├── hooks/
│   ├── useTheme.ts                 # 主题切换
│   ├── useDisplayMode.ts           # 显示模式切换
│   ├── useMapDisplayMode.ts        # 地图显示模式切换 [新增]
│   └── useKeyboardShortcuts.ts     # 快捷键
│
├── components/
│   ├── layout/
│   │   ├── TerminalLayout.tsx      # 终端布局
│   │   ├── TickerBar.tsx           # 滚动新闻条
│   │   ├── StatusBar.tsx           # 底部状态栏 (含地图模式切换)
│   │   └── MarketDataPanel.tsx     # 市场数据面板
│   │
│   ├── map/
│   │   ├── InteractiveMap.tsx      # 现有，需升级
│   │   ├── MapModeSwitcher.tsx     # 地图模式切换按钮组 [新增]
│   │   └── HeatmapLayer.tsx        # 热力图层 [新增]
│   │
│   ├── NewsFeed.tsx                # 现有，需升级样式
│   └── Filters.tsx                 # 现有，需添加主题切换
│
├── styles/
│   ├── designTokens.ts             # 设计令牌
│   ├── typography.ts               # 字体系统
│   ├── spacing.ts                  # 间距系统
│   ├── animations.ts               # 动画系统
│   └── index.ts                    # 统一导出
│
├── remotion/
│   ├── components/
│   │   ├── WorldMap.tsx            # 更新
│   │   ├── NewsCard.tsx            # 更新
│   │   ├── PriorityIndicator.tsx   # 新增
│   │   └── TickerBand.tsx          # 新增
│   │
│   ├── compositions/
│   │   └── TerminalIntro.tsx       # 新增
│   │
│   ├── NewsVisualization.tsx       # 更新
│   └── Root.tsx                    # 更新
│
└── types/
    └── news.ts                     # 扩展热度相关字段
```

### 数据库更新

**news 表新增字段**:
```sql
ALTER TABLE news ADD COLUMN IF NOT EXISTS (
  heat_score INTEGER DEFAULT 0,
  source_tier VARCHAR(10),
  cluster_id VARCHAR(50),
  related_news_ids JSONB DEFAULT '[]',
  reported_by_count INTEGER DEFAULT 1
);
```

---

## 🚀 六阶段执行计划（更新版）

### 📌 阶段间依赖关系图

```
Phase 1 (基础设计系统) [45分钟] ← 新增热度类型定义
    │
    ▼ 用户验证通过
    
Phase 2A (独立组件并行) [2小时] ← 新增热度计算组件
    ├── 2.5 InteractiveMap (Web) - 含地图模式切换
    ├── 2.6 NewsFeed (Web)
    ├── 2.7 Filters (Web) - 添加主题切换
    ├── 3.1 WorldMap (Remotion)
    ├── 3.2 NewsCard (Remotion)
    ├── 3.3 PriorityIndicator (Remotion)
    └── 3.7 HeatCalculator (Lib) [新增]
    │
    ▼ 用户验证通过
    
Phase 2B (布局基础并行) [1小时]
    ├── 2.1 TerminalLayout
    ├── 4.1 useTheme
    ├── 4.2 useDisplayMode
    └── 4.5 useMapDisplayMode [新增]
    │
    ▼ 用户验证通过
    
Phase 2C (布局整合) [45分钟] ← 新增地图模式切换
    ├── 2.2 TickerBar
    ├── 2.3 StatusBar - 含地图模式按钮
    ├── 2.4 MarketDataPanel
    └── 2.8 MapModeSwitcher [新增]
    │
    ▼ 用户验证通过
    
Phase 3 (Remotion整合) [45分钟]
    ├── 3.4 TickerBand
    ├── 3.5 NewsVisualization
    └── 3.6 TerminalIntro
    │
    ▼ 用户验证通过
    
Phase 4 (系统整合) [1小时]
    ├── 4.3 useKeyboardShortcuts
    ├── 4.4 page.tsx整合
    ├── 5.1 Tailwind配置
    └── 6.6 数据库迁移 [新增]
    │
    ▼ 用户验证通过
    
Phase 5 (测试优化) [1.5小时]
    ├── 6.1 主题切换测试
    ├── 6.2 显示模式测试
    ├── 6.3 键盘快捷键测试
    ├── 6.4 Remotion视频测试
    ├── 6.5 性能优化
    └── 6.7 热度算法测试 [新增]
```

---

## 📋 详细任务清单（35个任务）

### 🔷 Phase 1: 基础设计系统 (45分钟) [阻塞所有后续阶段]

#### 1.1 designTokens.ts (8分钟)
**路径**: `src/styles/designTokens.ts`
**状态**: ⏳ 待开始
**必须实现**:
```typescript
export const designTokens = {
  bg: { primary: '#000000', secondary: '#0a0a0f', tertiary: '#111118', hover: '#1a1a24', map: '#0a0a0a' },
  text: { primary: '#e0e0e0', secondary: '#8b8b9a', muted: '#5a5a6b', disabled: '#3a3a4a' },
  accent: { up: '#00ff41', down: '#ff3333', info: '#00d4ff', warning: '#ffaa00', neutral: '#888888' },
  priority: { p0: '#ff0000', p1: '#ff6600', p2: '#ffcc00', p3: '#666666' },
  heat: {                              // [新增] 热度颜色
    low: '#3b82f6',                    // 蓝色 - 低热度
    medium: '#f59e0b',                 // 橙色 - 中热度  
    high: '#ef4444',                   // 红色 - 高热度
    critical: '#dc2626',               // 深红 - 极高
  },
  border: { default: '#1a1a24', active: '#333340', highlight: 'rgba(255,255,255,0.1)' },
  shadow: { glowUp: '0 0 10px rgba(0, 255, 65, 0.5)', glowDown: '0 0 10px rgba(255, 51, 51, 0.5)', panel: '0 4px 20px rgba(0, 0, 0, 0.5)' },
} as const;
```

#### 1.2 typography.ts (6分钟)
**路径**: `src/styles/typography.ts`
**状态**: ⏳ 待开始

#### 1.3 spacing.ts (5分钟)
**路径**: `src/styles/spacing.ts`
**状态**: ⏳ 待开始

#### 1.4 animations.ts (8分钟)
**路径**: `src/styles/animations.ts`
**状态**: ⏳ 待开始
**新增热度脉冲动画**:
```typescript
heatPulse: `
  @keyframes heat-pulse {
    0% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 5px currentColor; }
    50% { transform: scale(1.3); opacity: 1; box-shadow: 0 0 20px currentColor; }
    100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 5px currentColor; }
  }
`,
```

#### 1.5 index.ts (3分钟)
**路径**: `src/styles/index.ts`
**状态**: ⏳ 待开始

#### 1.6 类型定义扩展 (15分钟) [新增]
**路径**: `src/types/news.ts`
**状态**: ⏳ 待开始
**必须实现**:
```typescript
// 扩展现有 NewsItem
export interface NewsItem {
  // ... existing fields ...
  heat_score: number;              // 热度评分 0-100
  source_tier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  cluster_id?: string;             // 所属聚类ID
  related_news_ids: string[];      // 相关新闻ID
  reported_by_count: number;       // 报道源数量
}

// 新增地图显示模式
export type MapDisplayMode = 'all' | 'priority' | 'heatmap';

// 新增热度等级
export type HeatLevel = 'low' | 'medium' | 'high' | 'critical';

// 地理聚类
export interface GeoCluster {
  id: string;
  center_lat: number;
  center_lng: number;
  news_count: number;
  sources: string[];
  max_priority: 'P0' | 'P1' | 'P2' | 'P3';
  heat_score: number;
  news_ids: string[];
}
```

**Phase 1 完成检查清单**:
- [ ] 所有6个文件创建完成
- [ ] TypeScript编译无错误
- [ ] 热度类型定义完整
- [ ] 可以从其他文件正确导入

---

### 🔷 Phase 2A: 独立组件并行开发 (2小时) [并行7个agents]

**状态**: ⏳ 等待Phase 1完成
**并行度**: 7个agents同时工作

#### 2.5 InteractiveMap.tsx - Web地图升级 (40分钟)
**Agent**: A
**路径**: `src/components/map/InteractiveMap.tsx` (更新)
**状态**: ⏳ 待开始
**依赖**: Phase 1
**必须实现**:
- 应用设计Token色彩
- 添加P0红色脉冲标记动画
- 添加P1橙色呼吸标记动画
- **新增**: 支持三种地图显示模式切换
- **新增**: 热度聚类显示
- 更新地图标记样式为Bloomberg风格

#### 2.6 NewsFeed.tsx - Web新闻列表升级 (25分钟)
**Agent**: B
**路径**: `src/components/NewsFeed.tsx` (更新)
**状态**: ⏳ 待开始
**依赖**: Phase 1

#### 2.7 Filters.tsx - Web筛选器升级 (25分钟)
**Agent**: C
**路径**: `src/components/Filters.tsx` (更新)
**状态**: ⏳ 待开始
**依赖**: Phase 1
**必须实现**:
- 添加主题切换按钮组(Terminal/Amber/Light)
- **新增**: 添加地图显示模式切换按钮
- 应用Bloomberg风格样式

#### 3.1 WorldMap.tsx - Remotion地图更新 (20分钟)
**Agent**: D
**路径**: `src/remotion/components/WorldMap.tsx` (更新)
**状态**: ⏳ 待开始
**依赖**: Phase 1

#### 3.2 NewsCard.tsx - Remotion新闻卡片更新 (20分钟)
**Agent**: E
**路径**: `src/remotion/components/NewsCard.tsx` (更新)
**状态**: ⏳ 待开始
**依赖**: Phase 1

#### 3.3 PriorityIndicator.tsx - Remotion优先级动画 (30分钟)
**Agent**: F
**路径**: `src/remotion/components/PriorityIndicator.tsx` (新建)
**状态**: ⏳ 待开始
**依赖**: Phase 1

#### 3.7 heat-calculator.ts - 热度计算核心 [新增] (35分钟)
**Agent**: G
**路径**: `src/lib/heat-calculator.ts` (新建)
**状态**: ⏳ 待开始
**依赖**: Phase 1
**必须实现**:
```typescript
export interface HeatCalculationInput {
  newsItems: NewsItem[];
  timeWindow?: number;  // 小时，默认6
  geoRadius?: number;   // km，默认50
}

export interface HeatCalculationResult {
  clusters: GeoCluster[];
  itemHeatScores: Map<string, number>;
}

export function calculateHeatScore(
  item: NewsItem,
  clusterNews?: NewsItem[]
): number;

export function clusterNewsByLocation(
  input: HeatCalculationInput
): HeatCalculationResult;

export function getHeatLevel(score: number): HeatLevel;
```

**Phase 2A 完成检查清单**:
- [ ] 7个文件全部完成
- [ ] 热度计算逻辑正确
- [ ] 每个文件独立测试通过
- [ ] 没有文件冲突

---

### 🔷 Phase 2B: 布局基础并行开发 (1小时) [并行4个agents]

**状态**: ⏳ 等待Phase 2A完成

#### 2.1 TerminalLayout.tsx - 终端布局基础 (30分钟)
**Agent**: H
**路径**: `src/components/layout/TerminalLayout.tsx` (新建)
**状态**: ⏳ 待开始

#### 4.1 useTheme.ts - 主题切换Hook (20分钟)
**Agent**: I
**路径**: `src/hooks/useTheme.ts` (新建)
**状态**: ⏳ 待开始

#### 4.2 useDisplayMode.ts - 显示模式Hook (15分钟)
**Agent**: J
**路径**: `src/hooks/useDisplayMode.ts` (新建)
**状态**: ⏳ 待开始

#### 4.5 useMapDisplayMode.ts - 地图显示模式Hook [新增] (15分钟)
**Agent**: K
**路径**: `src/hooks/useMapDisplayMode.ts` (新建)
**状态**: ⏳ 待开始
**必须实现**:
```typescript
export type MapDisplayMode = 'all' | 'priority' | 'heatmap';

export function useMapDisplayMode() {
  const [mode, setMode] = useState<MapDisplayMode>('all');
  // 快捷键 M 切换
  // localStorage持久化
  // 返回 { mode, setMode, cycleMode }
}
```

**Phase 2B 完成检查清单**:
- [ ] TerminalLayout基础结构完成
- [ ] useTheme Hook完成
- [ ] useDisplayMode Hook完成
- [ ] useMapDisplayMode Hook完成

---

### 🔷 Phase 2C: 布局组件整合 (45分钟) [串行]

**状态**: ⏳ 等待Phase 2B完成
**串行度**: 4个任务串行

#### 2.2 TickerBar.tsx (15分钟)
**路径**: `src/components/layout/TickerBar.tsx`
**状态**: ⏳ 待开始
**依赖**: TerminalLayout

#### 2.3 StatusBar.tsx (15分钟)
**路径**: `src/components/layout/StatusBar.tsx`
**状态**: ⏳ 待开始
**依赖**: TerminalLayout, useTheme, useMapDisplayMode
**必须实现**:
- 显示在线状态指示器
- 显示最后更新时间(UTC)和本地时间
- 显示事件计数和网络延迟
- **新增**: 显示当前地图模式图标按钮组
- 主题切换按钮

#### 2.4 MarketDataPanel.tsx (15分钟)
**路径**: `src/components/layout/MarketDataPanel.tsx`
**状态**: ⏳ 待开始
**依赖**: TerminalLayout

#### 2.8 MapModeSwitcher.tsx - 地图模式切换组件 [新增] (15分钟)
**路径**: `src/components/map/MapModeSwitcher.tsx`
**状态**: ⏳ 待开始
**依赖**: useMapDisplayMode
**必须实现**:
```typescript
interface MapModeSwitcherProps {
  mode: MapDisplayMode;
  onChange: (mode: MapDisplayMode) => void;
}

// 三个按钮: 全局(Globe图标) / 重点(Alert图标) / 热力(Flame图标)
// Bloomberg风格样式
// 当前选中状态高亮
```

**Phase 2C 完成检查清单**:
- [ ] TickerBar完成
- [ ] StatusBar完成（含地图模式按钮）
- [ ] MarketDataPanel完成
- [ ] MapModeSwitcher完成

---

### 🔷 Phase 3: Remotion整合 (45分钟) [串行]

**状态**: ⏳ 等待Phase 2C完成

#### 3.4 TickerBand.tsx (15分钟)
**路径**: `src/remotion/components/TickerBand.tsx`
**状态**: ⏳ 待开始

#### 3.5 NewsVisualization.tsx (20分钟)
**路径**: `src/remotion/NewsVisualization.tsx` (更新)
**状态**: ⏳ 待开始

#### 3.6 TerminalIntro.tsx (15分钟)
**路径**: `src/remotion/compositions/TerminalIntro.tsx`
**状态**: ⏳ 待开始

---

### 🔷 Phase 4: 系统整合 (1小时) [串行]

**状态**: ⏳ 等待Phase 3完成

#### 4.3 useKeyboardShortcuts.ts (25分钟)
**路径**: `src/hooks/useKeyboardShortcuts.ts`
**状态**: ⏳ 待开始
**依赖**: useTheme, useDisplayMode, useMapDisplayMode
**快捷键映射**:
```typescript
const SHORTCUTS = {
  TAB: '切换显示模式 (标准/紧凑/沉浸)',
  SPACE: '暂停/恢复自动飞行',
  F: '切换全屏',
  T: '切换主题 (Terminal/Amber/Light)',
  M: '切换地图模式 (全局/重点/热力)',  // [新增]
  R: '刷新数据',
  '?': '显示帮助面板',
};
```

#### 4.4 page.tsx整合 (30分钟)
**路径**: `src/app/[locale]/page.tsx` (更新)
**状态**: ⏳ 待开始
**依赖**: 所有组件完成

#### Phase 5: Tailwind配置 (15分钟)
**路径**: `tailwind.config.ts`, `src/styles/globals.css`
**状态**: ⏳ 待开始

#### 6.6 数据库迁移脚本 [新增] (15分钟)
**路径**: `scripts/migrate-heat-fields.sql`
**状态**: ⏳ 待开始
**SQL**:
```sql
ALTER TABLE news ADD COLUMN IF NOT EXISTS heat_score INTEGER DEFAULT 0;
ALTER TABLE news ADD COLUMN IF NOT EXISTS source_tier VARCHAR(10) DEFAULT 'tier4';
ALTER TABLE news ADD COLUMN IF NOT EXISTS cluster_id VARCHAR(50);
ALTER TABLE news ADD COLUMN IF NOT EXISTS related_news_ids JSONB DEFAULT '[]';
ALTER TABLE news ADD COLUMN IF NOT EXISTS reported_by_count INTEGER DEFAULT 1;

-- 创建聚类表
CREATE TABLE IF NOT EXISTS geo_clusters (
  id VARCHAR(50) PRIMARY KEY,
  center_lat FLOAT NOT NULL,
  center_lng FLOAT NOT NULL,
  news_count INTEGER DEFAULT 0,
  sources JSONB DEFAULT '[]',
  max_priority VARCHAR(5),
  heat_score INTEGER DEFAULT 0,
  news_ids JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_news_cluster_id ON news(cluster_id);
CREATE INDEX IF NOT EXISTS idx_news_heat_score ON news(heat_score DESC);
CREATE INDEX IF NOT EXISTS idx_geo_clusters_heat ON geo_clusters(heat_score DESC);
```

---

### 🔷 Phase 5: 测试优化 (1.5小时)

**状态**: ⏳ 等待Phase 4完成

#### 6.1 主题切换测试 (15分钟)
- 测试Terminal主题
- 测试Amber主题
- 测试Light主题
- 测试切换动画

#### 6.2 显示模式测试 (10分钟)
- 测试标准模式
- 测试紧凑模式
- 测试沉浸模式
- 测试快捷键切换

#### 6.3 键盘快捷键测试 (15分钟)
- 测试Tab切换显示模式
- 测试Space暂停
- 测试F全屏
- 测试T主题切换
- 测试M地图模式切换 [新增]
- 测试R刷新

#### 6.4 Remotion视频测试 (25分钟)
- 测试视频生成
- 检查视觉一致性
- 检查动画流畅度
- 导出样本视频

#### 6.5 性能优化 (25分钟)
- 首屏加载优化
- 动画性能检查
- 内存泄漏检查
- 最终代码清理

#### 6.7 热度算法测试 [新增] (20分钟)
**测试用例**:
```typescript
// 测试用例1: 加沙冲突模拟
const testNews = [
  { id: '1', title: 'Gaza conflict escalates', source_name: 'BBC', geo_lat: 31.5, geo_lng: 34.47, published_at: new Date().toISOString() },
  { id: '2', title: 'Israel Gaza war continues', source_name: 'Reuters', geo_lat: 31.51, geo_lng: 34.48, published_at: new Date().toISOString() },
  { id: '3', title: 'Gaza humanitarian crisis', source_name: 'NYT', geo_lat: 31.49, geo_lng: 34.46, published_at: new Date().toISOString() },
];
// 期望: 形成聚类，热度评分 > 80

// 测试用例2: 单源报道
const singleSourceNews = [
  { id: '4', title: 'Local event', source_name: 'Small Blog', geo_lat: 40.7, geo_lng: -74.0 },
];
// 期望: 低热度，不形成聚类
```

**测试项目**:
- [ ] 热度计算准确性
- [ ] 聚类算法正确性
- [ ] 三种地图模式切换
- [ ] 聚类点击展开
- [ ] 热度颜色编码正确

---

## 📊 质量门禁（每个Phase）

### Phase 1 (设计系统):
- [ ] TypeScript编译0错误
- [ ] 热度类型定义完整
- [ ] 设计Token正确定义

### Phase 2A (独立组件):
- [ ] 热度计算逻辑正确
- [ ] 每个组件独立渲染测试通过
- [ ] 样式符合设计Token

### Phase 2B-C (布局):
- [ ] 页面布局正确显示
- [ ] 地图模式切换正常
- [ ] 三种主题切换无闪烁

### Phase 3 (Remotion):
- [ ] 视频生成成功
- [ ] 视觉与Web一致

### Phase 4-5 (整合):
- [ ] 热度数据正确显示
- [ ] 聚类功能正常
- [ ] 快捷键工作正常
- [ ] 数据库迁移成功

### Phase 6 (测试):
- [ ] 热度算法测试用例通过
- [ ] 性能指标达标

---

## 🚫 开发禁令

1. **禁止**: 未经用户批准开始任何Phase
2. **禁止**: 跳过质量门禁
3. **禁止**: 使用`any`类型
4. **禁止**: 硬编码颜色/间距(必须用设计Token)
5. **禁止**: 删除现有功能
6. **禁止**: 修改不相关的文件
7. **禁止**: 忽略数据库迁移

---

## ✅ 计划完备性检查清单

### 需求覆盖
- [x] Bloomberg Terminal 视觉风格
- [x] 三种主题 (Terminal/Amber/Light)
- [x] 三种显示模式 (标准/紧凑/沉浸)
- [x] 地图三种显示模式 (全局/重点/热力) [新增]
- [x] 热度算法与聚类系统 [新增]
- [x] Web + Remotion 统一设计
- [x] 键盘快捷键系统
- [x] 实时数据更新

### 技术实现
- [x] 设计Token系统
- [x] TypeScript严格类型
- [x] 组件架构清晰
- [x] Hook设计完整
- [x] 数据库Schema更新 [新增]
- [x] 测试策略

### 交付物
- [x] 35个任务详细定义
- [x] 6阶段执行计划
- [x] 依赖关系图
- [x] 质量门禁
- [x] 代码规范

### 风险评估
- [x] Phase 1阻塞性任务识别
- [x] 并行任务安全评估
- [x] 数据库迁移计划 [新增]
- [x] 回滚方案

---

## ✅ 准备完毕，等待最终批准

**当前状态**: ✅ 方案已完备清晰

**计划要点**:
1. **35个任务**（原30个 + 5个热度相关）
2. **6个阶段**执行
3. **热度算法** - 基于多源报道共识度
4. **地图显示模式** - 三种模式 + 快捷键M
5. **并行开发** - Phase 2A 7个agents同时工作
6. **质量门禁** - 每个Phase必须通过

**批准前确认**:
1. ✅ 热度算法公式是否满意？
2. ✅ 地图显示模式切换方案是否满意？
3. ✅ 混合方案（后端+前端）是否满意？
4. ✅ 35个任务分解是否清晰？
5. ✅ 6阶段执行计划是否可行？

**请回复**: 
- **"批准开发"** - 立即开始Phase 1
- 或提出修改意见

**预计开始时间**: 收到批准后立即开始
**预计完成时间**: 批准后5-6小时

---

**计划文档位置**:
- 本文件: `docs/designs/PARALLEL_EXECUTION_PLAN_v2.md`
- 设计系统: `docs/designs/unified-design-system.md`
- 任务清单: `docs/designs/IMPLEMENTATION_TODO.md`

**计划版本**: v2.0 (2026-02-08)
**更新内容**: 新增热度算法与地图显示模式系统

---

## 📡 RSS 数据源策略更新 (2026-02-08)

### 问题背景

GitHub Actions 网络环境对国际 RSS 源有限制：
- BBC World, NYT World, Reuters → 超时/被屏蔽
- 13 个 Google News RSS → 全部失败
- RSSHub Vercel 实例 → 无响应

### 测试结果

| RSS 源 | 状态 | 新闻数 |
|--------|------|--------|
| Africa News | ✅ 工作 | 50 |
| France 24 | ✅ 工作 | 23 |
| Solidot | ✅ 工作 | 20 |
| BBC World | ❌ 超时 | - |
| Reuters | ❌ 404 | - |
| 联合早报 | ❌ 解析错误 | - |
| Al Jazeera | ❌ 超时 | - |
| DW News | ❌ 超时 | - |

### 当前解决方案

**执行的操作**:
1. ✅ 禁用 13 个 Google News RSS 源
2. ✅ 启用 18 个权威直接 RSS 源
3. ✅ 更新 fetch-rss.ts 添加 RSSHub.app 代理支持
4. ✅ 添加降级策略（直接失败时尝试代理）

**当前启用的源 (18个)**:
- 国际: Africa News, France 24, Solidot, DW News, CNA, ABC Australia, Kyodo News, Guardian
- 中文: 联合早报, BBC 中文, FT 中文, RFI 中文, WSJ 中文, NYT 中文, 路透中文

### 已知问题

1. **网络限制**: 部分国际源在国内网络环境不可访问
2. **解决方案**: 依赖可访问的源，或部署私有 RSSHub

### 后续优化建议

1. 部署私有 RSSHub 到可访问的服务器
2. 使用代理服务器获取被屏蔽的 RSS
3. 扩展可用源列表（添加更多可访问的源）
4. 添加 RSS 源健康检查和自动降级
