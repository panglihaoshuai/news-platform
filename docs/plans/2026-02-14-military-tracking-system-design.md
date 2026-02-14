# 美军全球军事动态追踪系统 - 开发计划

**文档版本**: 1.0  
**创建日期**: 2026-02-14  
**状态**: 待审阅  
**功能模块**: Military Tracking Layer

---

## 1. 功能概述

### 1.1 核心功能

在现有新闻地图可视化平台基础上，新增可选的军事动态追踪层，实现：

1. **美军飞机追踪** - 通过 OpenSky Network API 获取实时航班数据，过滤显示美军飞机
2. **美军舰艇追踪** - 通过 AISHub API 获取船舶数据，过滤显示美军舰艇  
3. **美军海外基地标注** - 静态数据库标注美国主要海外军事基地
4. **轨迹分析** - 观察舰艇在不同基地间的转移轨迹，分析全球分布密度变化

### 1.2 数据源

| 数据源 | 类型 | API 端点 | 免费额度 | 覆盖范围 |
|--------|------|----------|---------|----------|
| OpenSky Network | 航班 ADS-B | `https://opensky-network.org/api/states/all` | 4000次/小时 | 全球 |
| AISHub | 船舶 AIS | `https://www.aishub.net/api` | 有限免费 | 全球 |

---

## 2. 技术架构

### 2.1 与现有系统解耦设计

```
┌─────────────────────────────────────────────────────────────┐
│                      现有系统 (不动)                         │
├─────────────────────────────────────────────────────────────┤
│  NewsFeed │ InteractiveMap │ MapLayersPanel │ useTheme    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (通过 Props 接口接入)
┌─────────────────────────────────────────────────────────────┐
│                    新增: MilitaryLayerModule                 │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ OpenSky      │  │ AISHub       │  │ USBase           │ │
│  │ Service      │  │ Service      │  │ Database         │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                     │           │
│         ▼                 ▼                     ▼           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           MilitaryDataAdapter (数据适配层)            │   │
│  │  - 统一数据格式: MilitaryAircraft | MilitaryVessel   │   │
│  │  - 美军过滤逻辑: ICAO/MMSI 规则匹配                  │   │
│  └──────────────────────────┬───────────────────────────┘   │
│                             │                              │
│                             ▼                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MilitaryMapLayers (独立渲染层)                       │   │
│  │  - AircraftLayer | NavalLayer | BaseLayer           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
src/
├── lib/
│   ├── military/
│   │   ├── opensky-service.ts      # OpenSky API 客户端
│   │   ├── aishub-service.ts       # AISHub API 客户端  
│   │   ├── us-bases.ts            # 海外基地静态数据
│   │   ├── military-filter.ts      # 美军识别过滤规则
│   │   └── types.ts               # 军事数据类型定义
│   └── (现有 lib 内容保持不动)
├── components/
│   ├── military/
│   │   ├── MilitaryLayersPanel.tsx # 军事追踪控制面板
│   │   ├── AircraftMarker.tsx      # 飞机标记组件
│   │   ├── VesselMarker.tsx        # 舰艇标记组件
│   │   └── BaseMarker.tsx         # 基地标记组件
│   └── (现有组件保持不动)
├── hooks/
│   ├── useMilitaryTracking.ts      # 军事追踪状态管理
│   └── (现有 hooks 保持不动)
├── types/
│   └── military.ts                 # 军事数据类型 (扩展)
└── app/
    └── api/
        └── military/
            ├── opensky-proxy.ts    # OpenSky API 代理 (解决 CORS)
            └── aishub-proxy.ts     # AISHub API 代理
```

### 2.3 接口设计

```typescript
// 统一数据格式
interface MilitaryAircraft {
  id: string;              // ICAO24 hex
  callsign: string | null;
  originCountry: string;
  longitude: number;
  latitude: number;
  altitude: number;         //  feet
  velocity: number;        //  m/s
  heading: number;         //  degrees
  timestamp: number;
  isMilitary: boolean;     // 是否识别为美军
}

interface MilitaryVessel {
  id: string;              // MMSI
  name: string | null;
  flag: string;
  longitude: number;
  latitude: number;
  speed: number;           //  knots
  heading: number;
  shipType: string;
  timestamp: number;
  isMilitary: boolean;
}

interface USBase {
  id: string;
  name: string;
  nameCn: string;
  location: {
    lat: number;
    lng: number;
  };
  region: 'pacific' | 'middleeast' | 'europe' | 'americas' | 'india';
  country: string;
  type: ('air' | 'naval' | 'combined');
}
```

---

## 3. 开发阶段

### Phase 1: 基础设施搭建 (1小时)

**目标**: 建立独立的军事追踪模块，与现有系统解耦

**任务清单**:

| 序号 | 任务 | 文件 | 验证方式 |
|------|------|------|----------|
| 1.1 | 创建 `src/lib/military/` 目录 | - | 目录存在 |
| 1.2 | 定义军事数据类型 | `types.ts` | TypeScript 编译通过 |
| 1.3 | 创建美军过滤规则模块 | `military-filter.ts` | 单元测试: 已知 ICAO 应识别为美军 |
| 1.4 | 创建海外基地静态数据 | `us-bases.ts` | 数据包含 ≥20 个基地 |

**测试用例 (Phase 1)**:

```typescript
// military-filter.test.ts
describe('US Military Aircraft Filter', () => {
  test('should identify US military ICAO hex', () => {
    expect(isUSMilitaryAircraft('AE1234')).toBe(true);
  });
  
  test('should identify civilian aircraft', () => {
    expect(isUSMilitaryAircraft('ABCDEF')).toBe(false);
  });
  
  test('should filter by callsign pattern RCH', () => {
    expect(isUSMilitaryCallsign('RCH123')).toBe(true);
  });
});
```

---

### Phase 2: 数据服务层 (2小时)

**目标**: 实现 OpenSky 和 AISHub API 客户端

**任务清单**:

| 序号 | 任务 | 文件 | 验证方式 |
|------|------|------|----------|
| 2.1 | 实现 OpenSky API 客户端 | `opensky-service.ts` | 调用返回航班数据 |
| 2.2 | 实现 AISHub API 客户端 | `aishub-service.ts` | 调用返回船舶数据 |
| 2.3 | 创建 API 代理路由 (解决 CORS) | `api/military/opensky-proxy.ts` | 浏览器可访问 |
| 2.4 | 实现美军过滤逻辑 | `military-filter.ts` | 单元测试验证 |

**注意事项**:
- OpenSky 匿名用户每小时 4000 次请求，需实现请求节流
- AISHub 免费版有频率限制，需实现缓存策略（TTL: 60秒）
- 所有 API 代理需添加错误处理和降级逻辑
- 不在客户端直接调用外部 API，通过服务端代理

**测试用例 (Phase 2)**:

```typescript
// opensky-service.test.ts
describe('OpenSky Service', () => {
  test('should fetch aircraft states', async () => {
    const states = await fetchOpenSkyStates();
    expect(states).toBeDefined();
    expect(Array.isArray(states)).toBe(true);
  });
  
  test('should handle API errors gracefully', async () => {
    const result = await fetchOpenSkyStates().catch(e => null);
    expect(result).toBeDefined(); // 即使失败也应返回空数组而非抛出
  });
});
```

---

### Phase 3: 状态管理 (1小时)

**目标**: 创建独立的军事追踪状态管理，与现有 useMapDisplayMode 解耦

**任务清单**:

| 序号 | 任务 | 文件 | 验证方式 |
|------|------|------|----------|
| 3.1 | 创建 useMilitaryTracking hook | `useMilitaryTracking.ts` | 状态正确切换 |
| 3.2 | 实现数据缓存和刷新逻辑 | hook 内 | 数据更新触发重新渲染 |
| 3.3 | 集成 localStorage 记住用户选择 | - | 刷新后保持选择 |

**接口设计**:

```typescript
interface UseMilitaryTrackingReturn {
  // 显示状态
  showAirLayer: boolean;
  showNavalLayer: boolean;
  showBasesLayer: boolean;
  
  // 数据
  aircraft: MilitaryAircraft[];
  vessels: MilitaryVessel[];
  bases: USBase[];
  
  // 加载状态
  isLoadingAir: boolean;
  isLoadingNaval: boolean;
  isLoadingBases: boolean;
  
  // 操作
  toggleAirLayer: () => void;
  toggleNavalLayer: () => void;
  toggleBasesLayer: () => void;
  refresh: () => void;
}
```

---

### Phase 4: 地图渲染层 (2小时)

**目标**: 实现军事目标的地图标记渲染

**任务清单**:

| 序号 | 任务 | 文件 | 验证方式 |
|------|------|------|----------|
| 4.1 | 创建飞机标记组件 | `AircraftMarker.tsx` | 标记正确显示 |
| 4.2 | 创建舰艇标记组件 | `VesselMarker.tsx` | 标记正确显示 |
| 4.3 | 创建基地标记组件 | `BaseMarker.tsx` | 标记正确显示 |
| 4.4 | 创建军事图层控制面板 | `MilitaryLayersPanel.tsx` | 面板正确渲染 |

**标记设计**:

| 类型 | 标记样式 | 颜色 | 弹出信息 |
|------|----------|------|----------|
| 军机 | 三角形 + 方向 | 红色 (#EF4444) | 机型、速度、高度、目的地 |
| 军舰 | 船形 + 方向 | 蓝色 (#3B82F6) | 船名、速度、航向、目的地 |
| 基地 | 圆形 | 橙色 (#F97316) | 基地名称、位置、类型 |

**注意事项**:
- 地图使用现有的 MapLibre GL JS，标记使用 GeoJSON Source + Layer
- 军机/军舰使用动态方向箭头表示航向
- 大量标记时需实现聚类 (clustering)
- 弹出信息需简洁，完整信息通过点击展开

---

### Phase 5: 轨迹分析功能 (2小时)

**目标**: 实现舰艇轨迹可视化和密度分析

**任务清单**:

| 序号 | 任务 | 验证方式 |
|------|------|----------|
| 5.1 | 存储历史位置数据 (内存缓存) | 重现轨迹线 |
| 5.2 | 绘制轨迹线 (Polyline) | 轨迹正确连接 |
| 5.3 | 计算基地间转移频次 | 统计准确 |
| 4.4 | 密度热力图渲染 | 热力图正确显示 |

**轨迹存储设计** (内存中，刷新清除):

```typescript
interface VesselTrack {
  mmsi: string;
  positions: Array<{
    lat: number;
    lng: number;
    timestamp: number;
  }>;
}
```

---

## 4. 用户交互设计

### 4.1 控制面板

在现有 `MapLayersPanel` 下方新增独立面板:

```
┌─────────────────────────────────────┐
│  MILITARY TRACKING          [?]   │
├─────────────────────────────────────┤
│  ☑ US Military Air                 │
│    ↳ Show aircraft with US origin │
│                                     │
│  ☑ US Military Naval               │
│    ↳ Show vessels with US flag     │
│                                     │
│  ☐ US Overseas Bases               │
│    ↳ Show major US military bases │
├─────────────────────────────────────┤
│  Last updated: 12:34:56           │
│  [Refresh Now]                     │
└─────────────────────────────────────┘
```

### 4.2 标记交互

| 操作 | 效果 |
|------|------|
| 悬停标记 | 显示简要信息 (类型、速度) |
| 点击标记 | 展开详情面板 |
| 点击轨迹线 | 显示历史轨迹详情 |

---

## 5. 测试计划

### 5.1 单元测试

| 模块 | 测试文件 | 覆盖率目标 |
|------|----------|-----------|
| 美军过滤规则 | `military-filter.test.ts` | ≥90% |
| 数据适配器 | `military-adapter.test.ts` | ≥80% |
| Hook 状态 | `useMilitaryTracking.test.ts` | ≥70% |

### 5.2 集成测试

| 场景 | 验证方式 |
|------|----------|
| 开启军机层 → 地图显示飞机标记 | Playwright 截图验证 |
| 开启舰艇层 → 地图显示舰艇标记 | Playwright 截图验证 |
| 开启基地层 → 地图显示基地标记 | Playwright 截图验证 |
| 切换主题 → 标记颜色正确变化 | Playwright 截图验证 |
| 刷新数据 → 标记更新 | Playwright 截图验证 |

### 5.3 测试驱动开发流程

```
1. 编写失败测试 (RED)
2. 编写最小实现代码 (GREEN)  
3. 重构优化 (REFACTOR)
4. 提交测试通过证据
5. 继续下一个任务
```

---

## 6. 风险与限制

### 6.1 数据限制

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 美军飞机 ADS-B 覆盖率 ~50% | 部分飞机不可见 | 明确告知用户"显示已开启 ADS-B 的飞机" |
| 敏感任务关闭 ADS-B | 高价值目标不可见 | 无法解决，属于设计限制 |
| AISHub 免费版限流 | 数据更新延迟 | 实现客户端缓存，最小化请求 |

### 6.2 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 大量标记性能问题 | 地图卡顿 | 实现聚类 + 视口内渲染 |
| API 响应超时 | 数据不更新 | 降级显示缓存数据 |
| CORS 限制 | 浏览器无法直接调用 | 使用服务端代理 |

### 6.3 法律/使用条款

| 数据源 | 使用条款 |
|--------|----------|
| OpenSky | 仅限非商业用途研究 |
| AISHub | 需遵守使用条款 |
| 军事追踪仅供个人/研究目的 | 请勿用于敏感用途 |

---

## 7. 实施检查点

### 7.1 完成标准

| 阶段 | 通过条件 |
|------|----------|
| Phase 1 | 目录结构创建完成，类型定义编译通过 |
| Phase 2 | API 代理可访问，返回数据格式正确 |
| Phase 3 | 状态切换正常，数据流正确 |
| Phase 4 | 三种标记类型均正确显示在地图上 |
| Phase 5 | 轨迹线可绘制，密度分析可计算 |

### 7.2 提交要求

每个 Phase 完成后:
1. 测试全部通过 (`npm run test`)
2. 类型检查通过 (`npx tsc --noEmit`)
3. 构建通过 (`npm run build`)
4. 浏览器验证 (Playwright 截图)
5. 提交 commit

---

## 8. 后续扩展

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 多军种过滤 | P2 | 区分海军/空军/陆军 |
| 历史轨迹回放 | P2 | 时间轴控制回放 |
| 基地访问统计 | P3 | 分析各基地活跃度 |
| 自定义区域告警 | P3 | 进入区域时提醒 |
| 数据导出 | P3 | 导出为 CSV/JSON |

---

## 9. 审阅确认

请确认以下内容:

- [ ] 功能范围是否符合预期
- [ ] 解耦设计是否合理
- [ ] 测试驱动开发流程是否清晰
- [ ] 风险评估是否完整
- [ ] 实施计划是否可行

**审阅意见**: ________________________________

**批准开始实施**: ☐ 是 / ☐ 否

---

*文档创建: 2026-02-14*  
*最后更新: 2026-02-14*
