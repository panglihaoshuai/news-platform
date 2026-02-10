# 全球新闻平台 85% 完成度实施方案

**方案版本**: v1.0  
**制定日期**: 2026-02-09  
**目标完成度**: 85%  
**审批状态**: 待审批  
**预计工期**: 5天  

---

## 1. 方案概述

### 1.1 核心目标

在保持现有架构稳定性的前提下，实现：
- ✅ **全球视角**: 6大洲24个权威媒体源
- ✅ **地区平衡**: 每洲3-6个源，摆脱欧美中心
- ✅ **时间切换**: 完整支持（已具备）
- ✅ **地点切换**: 改善地理编码准确性
- ✅ **领域过滤**: 基于NLP关键词的5大领域分类
- ✅ **视角标签**: 基础标签（官方/独立、本地/国际）
- ⚠️ **领域深度**: 85%（有分类但缺少专业垂直源）

### 1.2 85% vs 100% 的差异

| 功能维度 | 85%方案 | 100%方案 | 差异说明 |
|---------|--------|---------|---------|
| **地理平衡** | 24源，6大洲 | 48源，6大洲 | 100%方案源数量翻倍 |
| **领域深度** | 分类标签 | 专业垂直源 | 85%无专门科技/财经RSS |
| **视角多元** | 基础标签 | 政治光谱分析 | 85%无意识形态标签 |
| **地理精度** | 关键词匹配 | AI NLP模型 | 85%用简单规则 |
| **实施周期** | 5天 | 12天 | 100%需重构架构 |

**结论**: 85%方案满足核心需求，投入产出比最优。

---

## 2. 数据源配置（24个地理平衡源）

### 2.1 地理分布

```
┌─────────────────────────────────────────────────────────────┐
│                    地理分布（每洲3-6个源）                    │
├─────────────────────────────────────────────────────────────┤
│  北美洲 (4个)    ████████                                    │
│  欧洲 (4个)      ████████                                    │
│  亚太地区 (6个)  ████████████  ← 重点补充！                   │
│  中东 (3个)      ██████                                      │
│  非洲 (4个)      ████████                                    │
│  拉丁美洲 (3个)  ██████                                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 完整源列表

#### 北美洲 - 4个

| # | ID | 媒体名称 | 域名 | 视角标签 | 领域权重 |
|---|----|---------|------|---------|---------|
| 1 | `gdelt-cnn` | CNN | cnn.com | 美国主流, 国际视角 | 综合:40%, 政治:30% |
| 2 | `gdelt-nytimes` | New York Times | nytimes.com | 美国自由派, 深度分析 | 政治:35%, 国际:25% |
| 3 | `gdelt-bloomberg` | Bloomberg | bloomberg.com | 美国财经, 全球商业 | 财经:50%, 科技:20% |
| 4 | `gdelt-wsj` | Wall Street Journal | wsj.com | 美国保守派, 商业 | 财经:45%, 政治:25% |

#### 欧洲 - 4个

| # | ID | 媒体名称 | 域名 | 视角标签 | 领域权重 |
|---|----|---------|------|---------|---------|
| 5 | `gdelt-bbc` | BBC World | bbc.com | 英国全球, 国际视角 | 综合:50%, 国际:30% |
| 6 | `gdelt-reuters` | Reuters | reuters.com | 英国通讯社, 中立 | 财经:35%, 综合:30% |
| 7 | `gdelt-afp` | AFP | afp.com | 法国视角, 欧洲 | 综合:40%, 国际:25% |
| 8 | `gdelt-dw` | Deutsche Welle | dw.com | 德国视角, 德语区 | 综合:40%, 欧洲:25% |

#### 亚太地区 - 6个 ⭐ 核心补充

| # | ID | 媒体名称 | 域名 | 视角标签 | 领域权重 |
|---|----|---------|------|---------|---------|
| 9 | `gdelt-japantimes` | Japan Times | japantimes.co.jp | 日本视角, 东亚 | 综合:35%, 科技:20% |
| 10 | `gdelt-koreaherald` | Korea Herald | koreaherald.com | 韩国视角, 科技强国 | 科技:30%, 综合:30% |
| 11 | `gdelt-straitstimes` | Straits Times | straitstimes.com | 新加坡视角, 东盟 | 综合:40%, 商业:20% |
| 12 | `gdelt-timesofindia` | Times of India | timesofindia.com | 印度视角, 南亚 | 综合:40%, 科技:15% |
| 13 | `gdelt-abc-au` | ABC Australia | abc.net.au | 澳洲视角, 大洋洲 | 综合:45%, 亚太:20% |
| 14 | `gdelt-zaobao` | Lianhe Zaobao | zaobao.com.sg | 华人视角, 中国相关 | 中国:40%, 东南亚:20% |

#### 中东 - 3个

| # | ID | 媒体名称 | 域名 | 视角标签 | 领域权重 |
|---|----|---------|------|---------|---------|
| 15 | `gdelt-aljazeera` | Al Jazeera | aljazeera.com | 阿拉伯视角, 中东 | 中东:45%, 国际:25% |
| 16 | `gdelt-haaretz` | Haaretz | haaretz.com | 以色列自由派, 批评政府 | 中东:40%, 以色列:25% |
| 17 | `gdelt-jpost` | Jerusalem Post | jpost.com | 以色列保守派, 官方近 | 中东:40%, 以色列:25% |

#### 非洲 - 4个

| # | ID | 媒体名称 | 域名 | 视角标签 | 领域权重 |
|---|----|---------|------|---------|---------|
| 18 | `gdelt-africanews` | African News | africanews.com | 泛非视角, 西非 | 非洲:50%, 综合:25% |
| 19 | `gdelt-news24` | News24 | news24.com | 南非视角, 南部非洲 | 非洲:45%, 商业:20% |
| 20 | `gdelt-eastafrican` | The East African | theeastafrican.co.ke | 东非视角, 肯尼亚 | 非洲:45%, 东非:25% |
| 21 | `gdelt-ahram` | Al-Ahram | english.ahram.org.eg | 埃及视角, 北非 | 非洲:40%, 中东:25% |

#### 拉丁美洲 - 3个

| # | ID | 媒体名称 | 域名 | 视角标签 | 领域权重 |
|---|----|---------|------|---------|---------|
| 22 | `gdelt-globo` | Globo | globo.com | 巴西视角, 拉美最大 | 拉美:50%, 巴西:25% |
| 23 | `gdelt-clarin` | Clarín | clarin.com | 阿根廷视角, 西语 | 拉美:45%, 阿根廷:25% |
| 24 | `gdelt-reforma` | Reforma | reforma.com | 墨西哥视角, 北美联系 | 拉美:40%, 北美:20% |

---

## 3. 领域分类系统

### 3.1 五大领域定义

基于标题关键词自动分类：

```typescript
export const DOMAIN_KEYWORDS = {
  // 政治/国际事务
  politics: {
    en: ['election', 'vote', 'government', 'minister', 'president', 'parliament', 
         'sanction', 'treaty', 'diplomatic', 'war', 'conflict', 'summit', 'nato', 'un'],
    zh: ['选举', '投票', '政府', '部长', '总统', '议会', '制裁', '条约', '外交', 
         '战争', '冲突', '峰会'],
    weight: 1.0
  },
  
  // 财经/商业
  finance: {
    en: ['stock', 'market', 'economy', 'gdp', 'inflation', 'trade', 'tariff', 
         'investment', 'bank', 'fed', 'ecb', 'oil price', 'currency', 'billion'],
    zh: ['股票', '市场', '经济', '通胀', '贸易', '关税', '投资', '银行', '石油', '货币'],
    weight: 1.0
  },
  
  // 科技
  technology: {
    en: ['ai', 'artificial intelligence', 'tech', 'software', 'chip', 'semiconductor',
         'cyber', 'digital', 'internet', 'google', 'apple', 'microsoft', 'tesla', 'spacex'],
    zh: ['人工智能', 'AI', '科技', '软件', '芯片', '半导体', '网络', '数字', '互联网'],
    weight: 1.0
  },
  
  // 体育
  sports: {
    en: ['football', 'soccer', 'basketball', 'olympics', 'world cup', 'championship',
         'tennis', 'f1', 'race', 'match', 'score', 'team', 'player'],
    zh: ['足球', '篮球', '奥运', '世界杯', '锦标赛', '网球', '比赛', '球队', '运动员'],
    weight: 1.0
  },
  
  // 社会/文化/其他
  society: {
    en: ['climate', 'environment', 'health', 'covid', 'pandemic', 'education',
         'culture', 'art', 'film', 'music', 'celebrity', 'weather', 'disaster'],
    zh: ['气候', '环境', '健康', '疫情', '教育', '文化', '艺术', '电影', '音乐', '天气', '灾难'],
    weight: 1.0
  }
};
```

### 3.2 分类规则

```typescript
// 分类逻辑
function classifyDomain(title: string, content?: string): Domain {
  const text = (title + ' ' + (content || '')).toLowerCase();
  let maxScore = 0;
  let bestDomain: Domain = 'society';
  
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.en.filter(kw => text.includes(kw.toLowerCase())).length * keywords.weight;
    if (score > maxScore) {
      maxScore = score;
      bestDomain = domain as Domain;
    }
  }
  
  // 最少需要匹配2个关键词才确定分类
  return maxScore >= 2 ? bestDomain : 'general';
}
```

### 3.3 数据库更新

```sql
-- 新增领域字段
ALTER TABLE news_items ADD COLUMN domain VARCHAR(20) DEFAULT 'general';

-- 创建领域索引
CREATE INDEX idx_news_domain ON news_items(domain, created_at DESC);
```

---

## 4. 视角标签系统

### 4.1 标签维度

每个新闻源预设标签，自动继承到新闻条目：

```typescript
export interface PerspectiveTags {
  // 地域视角
  geographic: 'local' | 'regional' | 'international' | 'global';
  
  // 媒体性质
  affiliation: 'official' | 'independent' | 'opposition' | 'neutral';
  
  // 政治倾向（仅用于西方媒体）
  ideology?: 'progressive' | 'centrist' | 'conservative';
  
  // 受众定位
  audience: 'domestic' | 'diaspora' | 'international';
}

// 示例：NYT的标签
const nytTags: PerspectiveTags = {
  geographic: 'global',
  affiliation: 'independent',
  ideology: 'progressive',
  audience: 'international'
};

// 示例：Al Jazeera的标签
const alJazeeraTags: PerspectiveTags = {
  geographic: 'international',
  affiliation: 'semi-official',
  ideology: undefined, // 不适用西方光谱
  audience: 'international'
};
```

### 4.2 标签应用

```typescript
// 在数据入库时自动打上源标签
function enrichWithPerspective(
  newsItem: NewsItem, 
  sourceConfig: NewsSourceConfig
): EnrichedNewsItem {
  return {
    ...newsItem,
    perspective: sourceConfig.perspectiveTags,
    region: sourceConfig.region,
    sourceTier: sourceConfig.tier
  };
}
```

---

## 5. 地理位置改进

### 5.1 当前问题

GDELT返回的地理位置不准确：
- 一篇"美国制裁中国"的新闻，可能被标记为"中国"
- 缺少"事件发生地"vs"报道来源地"区分

### 5.2 改进方案

```typescript
// 新增地理字段
interface GeoLocation {
  // 事件发生地（从标题NLP提取）
  eventLocation?: {
    country: string;
    region: string;
    city?: string;
    lat: number;
    lng: number;
    confidence: number; // 0-1
  };
  
  // 报道来源地（媒体所在地）
  sourceLocation: {
    country: string;
    region: string;
    lat: number;
    lng: number;
  };
}

// 简单的地点关键词映射
const LOCATION_KEYWORDS: Record<string, GeoLocation> = {
  'beijing': { country: 'CN', region: 'AS', lat: 39.9, lng: 116.4 },
  'tokyo': { country: 'JP', region: 'AS', lat: 35.6, lng: 139.6 },
  'moscow': { country: 'RU', region: 'EU', lat: 55.7, lng: 37.6 },
  'gaza': { country: 'PS', region: 'ME', lat: 31.5, lng: 34.4 },
  'kyiv': { country: 'UA', region: 'EU', lat: 50.4, lng: 30.5 },
  // ... 更多地点
};

// 提取函数
function extractEventLocation(title: string): GeoLocation | null {
  const lowerTitle = title.toLowerCase();
  for (const [keyword, location] of Object.entries(LOCATION_KEYWORDS)) {
    if (lowerTitle.includes(keyword)) {
      return { ...location, confidence: 0.7 };
    }
  }
  return null;
}
```

---

## 6. 实施阶段

### Phase 1: 数据源重构（Day 1-2）

**目标**: 替换 `gdelt-sources.ts` 为24个地理平衡源

**任务清单**:
- [ ] 重写 `src/config/gdelt-sources.ts`
  - 删除原有的14个源
  - 添加新的24个源配置
  - 添加 perspectiveTags 字段
  - 添加 domainWeights 字段
- [ ] 更新 `src/types/unified-news.ts`
  - 添加 PerspectiveTags 类型
  - 添加 Domain 类型
- [ ] 测试单个源查询
  - 确保24个源都能正常返回数据

**交付物**:
```typescript
// gdelt-sources.ts 新结构
export const GDELT_SOURCES: NewsSourceConfig[] = [
  {
    id: 'gdelt-bbc',
    name: 'BBC World',
    type: 'gdelt',
    enabled: true,
    priority: 1,
    tier: 'tier1',
    language: 'en',
    region: 'EU',
    config: { domain: 'bbc.com' },
    perspectiveTags: {
      geographic: 'global',
      affiliation: 'independent',
      audience: 'international'
    },
    domainWeights: { general: 50, politics: 30, international: 20 }
  },
  // ... 24个源
];
```

### Phase 2: 分类系统实现（Day 3）

**目标**: 实现领域分类和视角标签

**任务清单**:
- [ ] 创建 `src/lib/domain-classifier.ts`
  - 实现关键词匹配分类
  - 支持中英文关键词
- [ ] 创建 `src/lib/perspective-tagger.ts`
  - 根据源配置自动打标签
- [ ] 更新 `src/lib/gdelt-transformer.ts`
  - 入库前调用分类器
  - 添加 domain 和 perspective 字段
- [ ] 数据库迁移
  - 添加 domain, perspective_tags, event_location 字段

**核心代码**:
```typescript
// domain-classifier.ts
export function classifyDomain(title: string): Domain {
  const scores = {
    politics: countKeywords(title, DOMAIN_KEYWORDS.politics),
    finance: countKeywords(title, DOMAIN_KEYWORDS.finance),
    technology: countKeywords(title, DOMAIN_KEYWORDS.technology),
    sports: countKeywords(title, DOMAIN_KEYWORDS.sports),
    society: countKeywords(title, DOMAIN_KEYWORDS.society)
  };
  
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] >= 2 ? (best[0] as Domain) : 'general';
}
```

### Phase 3: 地理改进（Day 4）

**目标**: 改进地理位置准确性

**任务清单**:
- [ ] 创建 `src/lib/geo-extractor.ts`
  - 从标题提取地点关键词
  - 映射到经纬度
- [ ] 更新数据表结构
  - 新增 event_location 字段
  - 保留 source_location 字段
- [ ] 更新前端地图组件
  - 支持按 event_location 显示
  - 支持按 source_location 显示（切换按钮）

### Phase 4: 测试验证（Day 5）

**目标**: 验证系统功能

**测试清单**:
- [ ] 数据量测试
  - 运行24小时，统计各源数据量
  - 预期: 每源 5-15条/小时
- [ ] 分类准确性测试
  - 抽样100条新闻，人工验证领域分类
  - 目标: 80%准确率
- [ ] 地理覆盖测试
  - 验证6大洲都有数据
  - 验证亚太源正常工作
- [ ] 过滤功能测试
  - 按领域过滤
  - 按地区过滤
  - 组合过滤

**验证SQL**:
```sql
-- 验证地理分布
SELECT 
  region,
  COUNT(*) as count,
  COUNT(DISTINCT source_name) as sources
FROM news_items 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY region;

-- 验证领域分布
SELECT 
  domain,
  COUNT(*) as count
FROM news_items 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY domain;

-- 预期结果:
-- region | count | sources
-- AS     | 150   | 6       (亚太)
-- EU     | 100   | 4       (欧洲)
-- NA     | 120   | 4       (北美)
-- AF     | 80    | 4       (非洲)
-- ME     | 60    | 3       (中东)
-- LA     | 60    | 3       (拉美)
```

---

## 7. 前端过滤界面

### 7.1 新增过滤选项

```typescript
// 过滤参数接口
interface NewsFilters {
  // 时间范围
  timeRange: '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';
  
  // 领域
  domains: Domain[]; // ['politics', 'finance', 'technology']
  
  // 地区（6大洲）
  regions: string[]; // ['AS', 'EU', 'NA', 'AF', 'ME', 'LA']
  
  // 视角
  perspective: {
    geographic?: ('local' | 'regional' | 'international' | 'global')[];
    affiliation?: ('official' | 'independent' | 'opposition')[];
    audience?: ('domestic' | 'diaspora' | 'international')[];
  };
  
  // 源等级
  tiers: ('tier1' | 'tier2')[];
}
```

### 7.2 UI组件设计

```
┌─────────────────────────────────────────────────────────────┐
│  🌍 全球新闻平台          [时间▼] [领域▼] [地区▼] [视角▼]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  时间范围: [1小时] [6小时] [24小时] [7天] [30天]            │
│                                                             │
│  领域筛选: ☑️全部 ☑️政治 ☑️财经 ☐科技 ☐体育 ☑️社会          │
│                                                             │
│  地区视角:                                                 │
│   ┌──────────┬──────────┬──────────┐                       │
│   │  亚洲    │  欧洲    │  北美洲  │                       │
│   │  6个源   │  4个源   │  4个源   │                       │
│   │  ☑️启用  │  ☑️启用  │  ☑️启用  │                       │
│   ├──────────┼──────────┼──────────┤                       │
│   │  非洲    │  中东    │  拉美    │                       │
│   │  4个源   │  3个源   │  3个源   │                       │
│   │  ☑️启用  │  ☑️启用  │  ☑️启用  │                       │
│   └──────────┴──────────┴──────────┘                       │
│                                                             │
│  媒体性质: ☑️官方媒体 ☑️独立媒体 ☐反对媒体                   │
│                                                             │
│  受众定位: ☑️本地受众 ☑️国际受众 ☐海外侨民                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [应用筛选] [重置]                          显示 128 条新闻 │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| **亚太源数据量低** | 高 | 中 | 监控24小时，如<50条/天则更换域名或降级为Tier 2 |
| **领域分类不准确** | 中 | 中 | 阈值设为2个关键词，未达阈值标记为"general"，不强行分类 |
| **地理关键词缺失** | 中 | 低 | 先实现Top 50常见地点，后续迭代补充 |
| **数据库性能下降** | 低 | 中 | 新增索引，监控查询时间，必要时归档旧数据 |
| **RSS精简后丢失科技快讯** | 中 | 高 | 科技分类依赖GDELT，如不足则考虑保留TechCrunch RSS作为补充 |

---

## 9. 成功标准

### 9.1 技术指标

- [ ] 24个GDELT源全部正常工作（24小时测试）
- [ ] 领域分类准确率 ≥ 80%（人工抽样）
- [ ] 6大洲每小时均有数据入库
- [ ] 数据库查询响应 < 500ms（过滤后）
- [ ] GitHub Actions无失败

### 9.2 业务指标

- [ ] 日数据量: ~1,200条（24源 × 50条/天）
- [ ] 地理分布: 每洲占比 10-30%
- [ ] 领域分布: 综合50%, 财经20%, 政治15%, 科技10%, 体育5%
- [ ] 用户可通过时间+地点+领域+视角四维度自由筛选

### 9.3 用户体验指标

- [ ] 筛选后结果加载 < 2秒
- [ ] 地图可切换"事件地点"vs"媒体来源"视角
- [ ] 每条新闻显示领域标签和视角标签

---

## 10. 审批记录

| 角色 | 姓名 | 审批意见 | 日期 |
|------|------|----------|------|
| 方案提出 | AI Assistant | 建议实施 | 2026-02-09 |
| 业务审批 | ____________ | ____________ | ________ |
| 技术审批 | ____________ | ____________ | ________ |

**审批意见**:
- [ ] 同意实施此85%方案
- [ ] 需要调整（请说明）
- [ ] 不同意，需要100%方案（请说明原因）

---

## 11. 下一步行动

**如审批通过**:
1. 生成 Phase 1 详细任务清单
2. 创建功能分支 `feature/global-balanced-sources`
3. 开始实施数据重构

**如需要调整**:
1. 标注具体修改意见
2. 重新生成方案文档

---

**方案制定**: AI Assistant  
**最后更新**: 2026-02-09  
**版本**: v1.0
