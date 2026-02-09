# NewsData.io + RSSHub 混合方案设计文档

**版本**: v1.0  
**日期**: 2026-02-08  
**作者**: AI Assistant  
**状态**: 待审批

---

## 1. 执行摘要

本文档描述了 Bloomberg Terminal War Room 项目的新闻数据源混合架构方案。该方案结合 NewsData.io API（覆盖 BBC、Reuters 等权威媒体）和直接 RSS 源（TechCrunch、Wired 等可访问源），实现：
- 15+ 权威媒体覆盖
- 实时数据获取（无 24 小时延迟）
- 零成本运维
- 数据一致性保证

---

## 2. 背景与目标

### 2.1 问题陈述

当前系统面临以下挑战：

| 问题 | 影响 | 根本原因 |
|------|------|----------|
| RSS 源被 IP 封锁 | BBC、Reuters、NYT 无法抓取 | 主流媒体有严格的 IP 地理限制 |
| RSSHub.app 不可用 | 代理方案失败 | Cloudflare IP 段同样被封锁 |
| NewsAPI.org 延迟 24h | 时效性差 | 免费版限制 |
| 数据源单一 | 仅 6 个可用 RSS 源 | 地理封锁限制 |

### 2.2 解决方案概述

采用混合架构：

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions (每小时)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────────┐    ┌─────────────────────┐      │
│   │   NewsData.io API    │    │    直接 RSS 源       │      │
│   │  (100+ 权威媒体)      │    │   (TechCrunch 等)    │      │
│   │                      │    │                      │      │
│   │ • BBC World          │    │ • TechCrunch         │      │
│   │ • Reuters            │    │ • Wired              │      │
│   │ • AFP               │    │ • The Verge          │      │
│   │ • NYT               │    │ • Africa News        │      │
│   │ • Guardian          │    │ • France 24          │      │
│   │ • Bloomberg        │    │                      │      │
│   └─────────────────────┘    └─────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    数据处理管道                               │
│  ┌─────────┐  ┌─────────────┐  ┌─────────┐  ┌──────────┐  │
│  │ 数据清洗 │→│ 格式标准化  │→│ 去重    │→│ 分类     │  │
│  └─────────┘  └─────────────┘  └─────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase 数据库                            │
│                  (统一存储，统一查询)                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 目标

| 目标 | 指标 | 当前状态 |
|------|------|----------|
| 权威媒体覆盖 | 15+ 源 | 6 源 |
| 数据时效性 | 实时 | 部分延迟 24h |
| 数据量 | 200+ 条/天 | ~100 条/天 |
| 运维成本 | $0 | $0 |

---

## 3. 数据源架构

### 3.1 新闻源分类

#### A. NewsData.io API 源（优先级 1）

| 媒体 | 权威等级 | 语言 | 类别 | 预计条数/次 |
|------|----------|------|------|------------|
| BBC World | Tier 1 | EN | World | 20 |
| Reuters | Tier 1 | EN | World | 25 |
| AFP | Tier 1 | FR/EN | World | 20 |
| NYT World | Tier 1 | EN | World | 15 |
| Guardian | Tier 1 | EN | World | 15 |
| Bloomberg | Tier 1 | EN | Finance | 15 |
| CNN | Tier 1 | EN | World | 20 |
| Al Jazeera | Tier 1 | EN | World | 15 |
| Washington Post | Tier 1 | EN | Politics | 10 |
| Wall Street Journal | Tier 1 | EN | Finance | 12 |

**免费版限制**: 200 次/天 = 每小时 8 次请求

**使用策略**:
```typescript
// 每小时抓取计划（8 次请求）
const hourlyPlan = [
  { source: 'bbc-news', category: 'world', priority: 1 },
  { source: 'reuters', category: 'business', priority: 2 },
  { source: 'the-guardian', category: 'world', priority: 3 },
  { source: 'nytimes', category: 'world', priority: 4 },
  { source: 'bloomberg', category: 'business', priority: 5 },
  { source: 'cnn', category: 'world', priority: 6 },
  { source: 'al-jazeera', category: 'world', priority: 7 },
  { source: 'news-api-org', category: 'general', priority: 8 },
];
```

#### B. 直接 RSS 源（优先级 2）

| 媒体 | 权威等级 | 语言 | 状态 |
|------|----------|------|------|
| TechCrunch | Tier 2 | EN | ✅ 可访问 |
| Wired | Tier 2 | EN | ✅ 可访问 |
| The Verge | Tier 2 | EN | ✅ 可访问 |
| Africa News | Tier 2 | EN | ✅ 可访问 |
| France 24 | Tier 2 | EN/FR | ✅ 可访问 |
| Solidot | Tier 3 | ZH | ✅ 可访问 |

### 3.2 源配置结构

```typescript
// src/config/news-sources.ts

export interface NewsSourceConfig {
  id: string;
  name: string;
  type: 'newsdata' | 'rss' | 'rsshub';
  enabled: boolean;
  priority: number; // 1 = 优先使用
  config: {
    // NewsData.io 配置
    sourceId?: string;
    category?: string;
    language?: string;
    
    // RSS 配置
    feedUrl?: string;
    
    // RSSHub 配置
    route?: string;
  };
  rateLimit: {
    maxRequests: number;
    windowMinutes: number;
  };
}

export const NEWS_SOURCES: NewsSourceConfig[] = [
  // === NewsData.io API 源 ===
  {
    id: 'bbc-news',
    name: 'BBC World',
    type: 'newsdata',
    enabled: true,
    priority: 1,
    config: {
      sourceId: 'bbc-news',
      category: 'world',
      language: 'en',
    },
    rateLimit: { maxRequests: 1, windowMinutes: 60 },
  },
  {
    id: 'reuters',
    name: 'Reuters',
    type: 'newsdata',
    enabled: true,
    priority: 2,
    config: {
      sourceId: 'reuters',
      category: 'business',
      language: 'en',
    },
    rateLimit: { maxRequests: 1, windowMinutes: 60 },
  },
  {
    id: 'afp',
    name: 'AFP',
    type: 'newsdata',
    enabled: true,
    priority: 3,
    config: {
      sourceId: 'afp',
      category: 'world',
      language: 'en',
    },
    rateLimit: { maxRequests: 1, windowMinutes: 60 },
  },
  
  // === 直接 RSS 源 ===
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    type: 'rss',
    enabled: true,
    priority: 10,
    config: {
      feedUrl: 'https://techcrunch.com/feed/',
    },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
  },
  {
    id: 'wired',
    name: 'Wired',
    type: 'rss',
    enabled: true,
    priority: 11,
    config: {
      feedUrl: 'https://www.wired.com/feed/rss',
    },
    rateLimit: { maxRequests: 5, windowMinutes: 60 },
  },
];
```

---

## 4. 数据处理管道

### 4.1 管道架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      数据源层                                      │
├─────────────────────────────────────────────────────────────────┤
│  NewsData.io API → RSS Parser → 统一数据格式                    │
│  直接 RSS 源     → RSS Parser → 统一数据格式                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     数据清洗层                                    │
├─────────────────────────────────────────────────────────────────┤
│  • HTML 标签移除                                                 │
│  • 特殊字符清理                                                  │
│  • 字段映射                                                      │
│  • 数据验证                                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     数据标准化层                                  │
├─────────────────────────────────────────────────────────────────┤
│  • 统一字段命名                                                  │
│  • 统一时间格式                                                  │
│  • 统一 URL 格式                                                 │
│  • 来源标识标准化                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     去重处理层                                    │
├─────────────────────────────────────────────────────────────────┤
│  • URL 去重                                                      │
│  • 标题相似度去重 (阈值 0.5)                                     │
│  • 时间窗口去重 (48 小时)                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      分类处理层                                   │
├─────────────────────────────────────────────────────────────────┤
│  • 语言分类 (EN/ZH)                                             │
│  • 区域分类 (GLOBAL/NA/EU/AS/AF/ME)                            │
│  • 主题分类 (World/Finance/Tech/Politics)                        │
│  • 优先级分类 (P0/P1/P2/P3)                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     存储层                                        │
├─────────────────────────────────────────────────────────────────┤
│  Supabase (news_items 表)                                        │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 统一数据格式

```typescript
// src/types/unified-news.ts

/**
 * 统一新闻数据格式
 * 适配所有数据源（NewsData.io、RSS、RSSHub）
 *
 * 设计原则：
 * - 轻量化：不存储图片，专注文本内容
 * - 可追溯：保留 original_url 供用户点击跳转原文
 * - 可分析：保留分类、地理、优先级等元数据
 */
export interface UnifiedNewsItem {
  // === 核心字段 ===
  id: string;                    // 内部 ID (UUID)
  external_id: string;           // 外部源 ID (用于去重)
  title: string;                // ✅ 标题 (清洗后完整保留)
  summary: string;               // ✅ 摘要 (清洗后, 800 字限制, 足够了解新闻要点)
  original_url: string;          // ✅ 原文链接 (用户可点击跳转原始页面)
  source_name: string;           // 来源名称
  source_type: 'newsdata' | 'rss' | 'rsshub';  // 来源类型
  source_id: string;              // 来源标识符

  // === 时间字段 ===
  published_at: string;          // 发布时间 (ISO 8601)
  fetched_at: string;             // 抓取时间 (ISO 8601)

  // === 地理字段 ===
  geo_lat: number | null;        // 纬度
  geo_lng: number | null;        // 经度
  region_code: string | null;    // 区域代码
  country_code: string | null;   // 国家代码

  // === 分类字段 ===
  language: 'en' | 'zh' | 'other';
  categories: string[];           // 主题分类
  priority: 'P0' | 'P1' | 'P2' | 'P3';

  // === 质量字段 ===
  importance_score: number;       // 重要性评分
  importance_factors: {
    mediaWeight: number;        // 媒体权重
    freshnessScore: number;       // 新鲜度评分
    keywordScore: number;        // 关键词评分
    contentBonus: number;         // 内容加分
  };

  // === 设计说明 ===
  // ❌ 不存储 image_url - 图片会干扰前端显示效果
  // ✅ 用户可以通过 original_url 访问原文查看图片
}

/**
 * 新闻源元数据
 */
export interface NewsSourceMetadata {
  id: string;
  name: string;
  type: 'newsdata' | 'rss' | 'rsshub';
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  language: 'en' | 'zh' | 'other';
  region: string;
  last_fetched_at?: string;
  fetch_count: number;
  success_rate: number;
}
```

### 4.3 数据清洗处理器

> **设计决定：不提取图片**
> 
> - ✅ 不存储 `image_url` 字段
> - ✅ 轻量化设计，减少存储和传输开销
> - ✅ 前端专注显示文本内容，不被图片干扰
> - ✅ 用户通过 `original_url` 访问原文查看图片

```typescript
// src/lib/data-cleaner.ts

import * as cheerio from 'cheerio';

export class DataCleaner {
  /**
   * 清洗标题
   */
  cleanTitle(title: string): string {
    return title
      .replace(/<[^>]*>/g, '')                    // 移除 HTML
      .replace(/&nbsp;/g, ' ')                      // 替换空格
      .replace(/&amp;/g, '&')                       // 替换实体
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }

  /**
   * 清洗摘要
   */
  cleanSummary(summary: string, maxLength: number = 800): string {
    // 移除 HTML 标签
    const $ = cheerio.load(summary);
    const text = $('body').text();
    
    return text
      .replace(/\s+/g, ' ')                        // 规范化空格
      .substring(0, maxLength)                     // 限制长度
      .trim();
  }

  /**
   * 清洗 HTML 内容
   */
  cleanHtml(html: string): string {
    const $ = cheerio.load(html);
    
    // 移除脚本和样式
    $('script').remove();
    $('style').remove();
    $('iframe').remove();
    
    return $('body').html() || '';
  }

  /**
   * 标准化 URL
   */
  standardizeUrl(url: string, baseUrl?: string): string {
    try {
      // 处理相对 URL
      if (baseUrl && url.startsWith('/')) {
        const urlObj = new URL(baseUrl);
        return `${urlObj.origin}${url}`;
      }
      return url;
    } catch {
      return '';
    }
  }

  /**
   * 标准化发布时间
   */
  standardizeDate(dateString: string): string {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString();
    }
    return date.toISOString();
  }
}

/**
 * 新闻数据转换器
 */
export class NewsDataTransformer {
  private cleaner = new DataCleaner();
  
/**
    * 从 NewsData.io 格式转换
    * 注意：不提取图片，专注文本内容
    */
  transformNewsData(item: any, source: NewsSourceMetadata): UnifiedNewsItem {
    return {
      id: crypto.randomUUID(),
      external_id: item.article_id,
      title: this.cleaner.cleanTitle(item.title),
      summary: this.cleaner.cleanSummary(item.description || ''),
      original_url: this.cleaner.standardizeUrl(item.link),
      source_name: source.name,
      source_type: 'newsdata',
      source_id: source.id,
      published_at: this.cleaner.standardizeDate(item.pubDate),
      fetched_at: new Date().toISOString(),
      geo_lat: null,  // 后续地理编码填充
      geo_lng: null,
      region_code: null,
      country_code: null,
      language: this.detectLanguage(item.title),
      categories: [item.category].flat().filter(Boolean),
      priority: this.calculatePriority(item),
      importance_score: 0,
      importance_factors: {
        mediaWeight: this.getMediaWeight(source.tier),
        freshnessScore: this.calculateFreshness(item.pubDate),
        keywordScore: 0,
        contentBonus: 0,
      },
      // ✅ 不提取 image_url - 轻量化设计
    };
  }

  /**
   * 从 RSS 格式转换
   * 注意：不提取图片，专注文本内容
   */
  transformRss(item: any, source: NewsSourceMetadata): UnifiedNewsItem {
    return {
      id: crypto.randomUUID(),
      external_id: item.guid || item.link,
      title: this.cleaner.cleanTitle(item.title),
      summary: this.cleaner.cleanSummary(item.contentSnippet || item.summary || item.content),
      original_url: this.cleaner.standardizeUrl(item.link),
      source_name: source.name,
      source_type: 'rss',
      source_id: source.id,
      published_at: this.cleaner.standardizeDate(item.isoDate || item.pubDate),
      fetched_at: new Date().toISOString(),
      geo_lat: null,
      geo_lng: null,
      region_code: null,
      country_code: null,
      language: this.detectLanguage(item.title),
      categories: [item.categories].flat().filter(Boolean),
      priority: this.calculatePriority(item),
      importance_score: 0,
      importance_factors: {
        mediaWeight: this.getMediaWeight(source.tier),
        freshnessScore: this.calculateFreshness(item.isoDate || item.pubDate),
        keywordScore: 0,
        contentBonus: 0,
      },
      // ✅ 不提取 image_url - 轻量化设计
    };
  }

  /**
   * 检测语言
   */
  private detectLanguage(text: string): 'en' | 'zh' | 'other' {
    const chinesePattern = /[\u4e00-\u9fa5]/;
    if (chinesePattern.test(text)) return 'zh';
    return 'en';
  }

  /**
   * 获取媒体权重
   */
  private getMediaWeight(tier: string): number {
    const weights: Record<string, number> = {
      tier1: 20,
      tier2: 15,
      tier3: 10,
      tier4: 5,
    };
    return weights[tier] || 10;
  }

  /**
   * 计算新鲜度评分
   */
  private calculateFreshness(pubDate: string): number {
    const hoursAgo = (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60);
    if (hoursAgo <= 2) return 10;
    if (hoursAgo <= 6) return 8;
    if (hoursAgo <= 12) return 6;
    if (hoursAgo <= 24) return 4;
    return 2;
  }

  /**
   * 计算优先级
   */
  private calculatePriority(item: any): 'P0' | 'P1' | 'P2' | 'P3' {
    // 简化逻辑：基于类别和来源
    const categories = [item.category].flat().map(c => c?.toLowerCase());
    if (categories.includes('breaking') || categories.includes('top')) {
      return 'P0';
    }
    return 'P2';
  }
}
```

---

## 5. 分类系统设计

### 5.1 多维度分类

```typescript
// src/lib/classifier.ts

export interface ClassificationResult {
  language: 'en' | 'zh' | 'other';
  region: string | null;
  categories: string[];
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  keywords: string[];
}

export class NewsClassifier {
  /**
   * 多维度分类
   */
  async classify(
    item: UnifiedNewsItem,
    context: ClassificationContext
  ): Promise<ClassificationResult> {
    // 1. 语言分类
    const language = this.classifyLanguage(item);

    // 2. 区域分类
    const region = await this.classifyRegion(item, context);

    // 3. 主题分类
    const categories = this.classifyCategory(item);

    // 4. 优先级分类
    const priority = this.classifyPriority(item, categories, context);

    // 5. 关键词提取
    const keywords = this.extractKeywords(item);

    return { language, region, categories, priority, keywords };
  }

  /**
   * 语言分类
   */
  private classifyLanguage(item: UnifiedNewsItem): 'en' | 'zh' | 'other' {
    // 基于来源语言
    if (item.language) return item.language;
    
    // 基于标题内容
    const chinesePattern = /[\u4e00-\u9fa5]/;
    if (chinesePattern.test(item.title)) return 'zh';
    return 'en';
  }

  /**
   * 区域分类
   */
  private async classifyRegion(
    item: UnifiedNewsItem,
    context: ClassificationContext
  ): Promise<string | null> {
    // 1. 首先尝试从来源映射
    const sourceRegion = this.getSourceRegion(item.source_id);
    if (sourceRegion) return sourceRegion;

    // 2. 使用关键词匹配
    const regionKeywords: Record<string, string[]> = {
      'NA': ['america', 'united states', 'us ', ' usa', 'washington', 'new york', 'wall street'],
      'EU': ['europe', 'european', 'britain', 'uk ', 'london', 'paris', 'berlin', 'brussels'],
      'AS': ['china', 'chinese', 'japan', 'japanese', 'korea', 'korean', 'asia', 'beijing', 'tokyo', 'seoul'],
      'ME': ['middle east', 'israel', 'palestine', 'iran', 'iraq', 'saudi', 'uae', 'gaza'],
      'AF': ['africa', 'niger', 'nigeria', 'south africa', 'egypt', 'kenya'],
      'OC': ['australia', 'sydney', 'melbourne', 'oceania', 'new zealand'],
    };

    const titleLower = item.title.toLowerCase();
    for (const [region, keywords] of Object.entries(regionKeywords)) {
      if (keywords.some(kw => titleLower.includes(kw))) {
        return region;
      }
    }

    // 3. 使用 LLM 智能分类（如果有配置）
    if (context.useLLM && context.deepseekKey) {
      return await this.classifyWithLLM(item);
    }

    return null;
  }

  /**
   * 主题分类
   */
  private classifyCategory(item: UnifiedNewsItem): string[] {
    const categories: string[] = [];
    const titleLower = item.title.toLowerCase();
    const summaryLower = item.summary.toLowerCase();

    const categoryPatterns: Record<string, RegExp[]> = {
      'Finance': [
        /market|stock|economy|inflation|interest|rate|federal reserve|fed /i,
        /reuters business|bloomberg|wall street journal financial/i,
      ],
      'Technology': [
        /tech|ai|artificial intelligence|machine learning|software|hardware|startup/i,
        /techcrunch|wired|verge technology/i,
      ],
      'Politics': [
        /president|election|congress|government|policy|democrat|republican|vote/i,
      ],
      'World': [
        /war|conflict|terrorism|diplomatic|international relations|global/i,
      ],
      'Business': [
        /company|corporation|merger|acquisition|ipo|startup|business|ceo/i,
      ],
      'Science': [
        /science|research|discovery|space|nasa|scientist|study/i,
      ],
      'Health': [
        /health|covid|pandemic|medical|disease|vaccine|hospital|doctor/i,
      ],
      'Sports': [
        /sports|football|soccer|basketball|olympics|championship|tournament/i,
      ],
      'Entertainment': [
        /movie|film|music|celebrity|hollywood|netflix|streaming/i,
      ],
    };

    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      if (patterns.some(p => p.test(titleLower) || p.test(summaryLower))) {
        categories.push(category);
      }
    }

    // 默认分类
    if (categories.length === 0) {
      categories.push('General');
    }

    return categories;
  }

  /**
   * 优先级分类
   */
  private classifyPriority(
    item: UnifiedNewsItem,
    categories: string[],
    context: ClassificationContext
  ): 'P0' | 'P1' | 'P2' | 'P3' {
    // 1. 基于来源 tier
    const tierPriority: Record<string, number> = {
      tier1: 1,
      tier2: 2,
      tier3: 3,
      tier4: 4,
    };

    // 2. 基于新鲜度
    const hoursAgo = (Date.now() - new Date(item.published_at).getTime()) / (1000 * 60 * 60);
    let freshnessScore = 4;
    if (hoursAgo <= 2) freshnessScore = 1;
    else if (hoursAgo <= 6) freshnessScore = 2;
    else if (hoursAgo <= 12) freshnessScore = 3;

    // 3. 基于紧急类别
    const urgentCategories = ['Breaking', 'World', 'Politics'];
    const hasUrgent = categories.some(c => urgentCategories.includes(c));

    // 4. 综合计算
    let priority = tierPriority.tier4 || 4;
    
    if (hasUrgent || freshnessScore <= 2) {
      priority = Math.min(priority, 1);  // P0/P1
    } else if (freshnessScore <= 3) {
      priority = Math.min(priority, 2);  // P1/P2
    }

    return `P${priority}` as 'P0' | 'P1' | 'P2' | 'P3';
  }

  /**
   * 提取关键词
   */
  private extractKeywords(item: UnifiedNewsItem): string[] {
    // 使用 NLP 库提取关键词
    // 简化实现：基于规则提取
    const words = item.title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);

    return [...new Set(words)].slice(0, 10);
  }
}
```

### 5.2 区域分类映射

```typescript
// src/config/region-mapping.ts

export interface RegionConfig {
  code: string;
  name: string;
  countries: string[];
  keywords: string[];
}

export const REGION_CONFIG: RegionConfig[] = [
  {
    code: 'GLOBAL',
    name: 'Global',
    countries: [],
    keywords: ['world', 'international', 'global'],
  },
  {
    code: 'NA',
    name: 'North America',
    countries: ['US', 'CA', 'MX'],
    keywords: ['america', 'united states', 'us ', 'usa', 'washington', 'new york', 'wall street'],
  },
  {
    code: 'EU',
    name: 'Europe',
    countries: ['GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'PL', 'SE', 'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'HU', 'RO', 'BG', 'SK', 'HR', 'SI', 'LT', 'LV', 'EE'],
    keywords: ['europe', 'european', 'britain', 'uk ', 'london', 'paris', 'berlin', 'brussels'],
  },
  {
    code: 'AS',
    name: 'Asia',
    countries: ['CN', 'JP', 'KR', 'IN', 'SG', 'HK', 'TW', 'TH', 'VN', 'ID', 'MY', 'PH', 'PK', 'BD', 'LK', 'NP', 'MM', 'KH', 'LA'],
    keywords: ['asia', 'asian', 'china', 'chinese', 'japan', 'japanese', 'korea', 'korean', 'india', 'indian', 'beijing', 'tokyo', 'seoul'],
  },
  {
    code: 'ME',
    name: 'Middle East',
    countries: ['IL', 'PS', 'JO', 'LB', 'SY', 'IQ', 'IR', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'TR', 'EG'],
    keywords: ['middle east', 'israel', 'palestine', 'gaza', 'iran', 'iraq', 'saudi', 'uae', 'gulf'],
  },
  {
    code: 'AF',
    name: 'Africa',
    countries: ['ZA', 'NG', 'EG', 'KE', 'ET', 'MA', 'GH', 'TZ', 'UG', 'CM', 'SN', 'CI', 'DZ', 'SD', 'RW', 'SO', 'MZ', 'ZM', 'ZW', 'BW', 'NA', 'LS', 'MU', 'MG', 'ML'],
    keywords: ['africa', 'african', 'niger', 'nigeria', 'south africa', 'egypt', 'kenya', 'ethiopia'],
  },
  {
    code: 'OC',
    name: 'Oceania',
    countries: ['AU', 'NZ', 'PG', 'FJ', 'WS', 'SB', 'VU', 'TO', 'KI', 'NR', 'TV', 'MF', 'PY', 'CW', 'SX', 'BQ', 'CW'],
    keywords: ['australia', 'sydney', 'melbourne', 'oceania', 'new zealand', 'pacific'],
  },
  {
    code: 'SA',
    name: 'South America',
    countries: ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR', 'GF'],
    keywords: ['south america', 'brazil', 'argentina', 'chile', 'colombia', 'peru'],
  },
];
```

---

## 6. 程序变动

### 6.1 文件结构变更

```
src/
├── scripts/
│   ├── fetch-rss.ts              # 修改：支持混合数据源
│   ├── fetch-newsdata.ts          # 新增：NewsData.io API 抓取
│   └── fetch-hybrid.ts            # 新增：统一抓取入口
│
├── lib/
│   ├── data-cleaner.ts            # 新增：数据清洗
│   ├── data-transformer.ts        # 新增：数据转换
│   ├── classifier.ts              # 修改：增强分类
│   └── source-config.ts            # 新增：源配置
│
├── config/
│   ├── news-sources.ts           # 新增：数据源配置
│   └── region-mapping.ts          # 新增：区域映射
│
└── types/
    ├── unified-news.ts            # 新增：统一数据格式
    └── news.ts                    # 修改：适配新格式
```

### 6.2 核心脚本变更

#### A. 新增 fetch-newsdata.ts

```typescript
// src/scripts/fetch-newsdata.ts

import dotenv from 'dotenv';
import path from 'path';
import { NEWS_SOURCES } from '@/config/news-sources';
import { NewsDataTransformer } from '@/lib/data-transformer';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const newsdataKey = process.env.NEWS_DATA_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const transformer = new NewsDataTransformer();

const RATE_LIMIT = 8; // 免费版每小时 8 次请求

/**
 * 从 NewsData.io API 抓取新闻
 */
async function fetchFromNewsData(sourceId: string, category?: string): Promise<any[]> {
  const url = new URL('https://newsdata.io/api/1/news');
  url.searchParams.set('apikey', newsdataKey);
  url.searchParams.set('source', sourceId);
  if (category) {
    url.searchParams.set('category', category);
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`NewsData.io API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}

/**
 * 主函数
 */
async function fetchAllNewsData() {
  console.log('📡 Starting NewsData.io fetch...');
  
  // 获取 NewsData.io 源
  const newsdataSources = NEWS_SOURCES.filter(s => s.type === 'newsdata' && s.enabled);
  
  let totalFetched = 0;
  let totalInserted = 0;
  const requestCount = Math.min(newsdataSources.length, RATE_LIMIT);

  for (let i = 0; i < requestCount; i++) {
    const source = newsdataSources[i];
    
    try {
      console.log(`  📰 Fetching ${source.name}...`);
      
      const articles = await fetchFromNewsData(
        source.config.sourceId!,
        source.config.category
      );

      // 转换格式
      const items = articles.map((article: any) => 
        transformer.transformNewsData(article, {
          id: source.id,
          name: source.name,
          type: 'newsdata',
          tier: 'tier1', // 默认 tier1
          language: source.config.language as 'en' | 'zh',
          region: 'GLOBAL',
          fetch_count: 0,
          success_rate: 100,
        })
      );

      // 批量插入
      const { data: inserted, error } = await supabase
        .from('news_items')
        .upsert(items, { onConflict: 'external_id', ignoreDuplicates: true });

      if (error) {
        console.error(`  ❌ Insert error: ${error.message}`);
      } else {
        console.log(`  ✅ Inserted ${inserted?.length || items.length} items`);
        totalInserted += inserted?.length || items.length;
      }
      
      totalFetched += articles.length;

      // 遵守速率限制：每次请求后等待
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error: any) {
      console.error(`  ❌ Failed ${source.name}: ${error.message}`);
    }
  }

  console.log(`\n📊 NewsData.io Summary:`);
  console.log(`   Total fetched: ${totalFetched}`);
  console.log(`   Total inserted: ${totalInserted}`);
}

// 运行
fetchAllNewsData().catch(console.error);
```

#### B. 修改 fetch-rss.ts

```typescript
// src/scripts/fetch-rss.ts (增量修改)

// 新增：导入数据清洗
import { DataCleaner } from '@/lib/data-cleaner';

// 修改：统一数据转换器
import { NewsDataTransformer } from '@/lib/data-transformer';

const cleaner = new DataCleaner();
const transformer = new NewsDataTransformer();

// 修改：processNewsItem 函数适配多种数据源
async function processNewsItem(
  title: string,
  source: RSSSource | NewsDataSource,
  item: any,
  recentTitles: string[],
  keywords: KeywordEntry[],
  synonymMap: Map<string, any>
) {
  // ... 现有逻辑 ...

  // 适配 NewsData.io 数据
  if (source.type === 'newsdata') {
    const unifiedItem = transformer.transformNewsData(item, source);
    // 使用 unifiedItem 进行后续处理
  }
}

// 新增：RSSHub 降级逻辑
async function fetchWithFallback(source: RSSSource) {
  // 1. 尝试直接 RSS
  try {
    return await parser.parseURL(source.feed_url);
  } catch (directError) {
    console.log(`   └─ Direct RSS failed, trying RSSHub.app...`);
  }

  // 2. 尝试 RSSHub.app
  try {
    const rsshubUrl = getRSSHubUrl(source);
    return await parser.parseURL(rsshubUrl);
  } catch (rsshubError) {
    console.log(`   └─ RSSHub.app also failed`);
  }

  // 3. 返回 null，由主函数处理
  return null;
}
```

#### C. 新增统一抓取入口

```typescript
// src/scripts/fetch-hybrid.ts

import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { loadActiveKeywords, buildSynonymMap } from '@/lib/keyword-matcher';
import { classifyNews } from '@/lib/smart-classifier';
import { NEWS_SOURCES } from '@/config/news-sources';
import { NewsDataTransformer } from '@/lib/data-transformer';
import Parser from 'rss-parser';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const parser = new Parser({ timeout: 30000 });
const transformer = new NewsDataTransformer();

/**
 * 统一抓取入口
 * 同时处理 NewsData.io 和 RSS 源
 */
async function fetchAll() {
  console.log('🚀 === HYBRID NEWS FETCH STARTED ===\n');

  // 加载关键词库
  const keywords = await loadActiveKeywords();
  console.log(`📚 Loaded ${keywords.length} keywords`);

  // 获取去重用 recent titles
  const { data: recentNews } = await supabase
    .from('news_items')
    .select('title')
    .gt('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  const recentTitles = recentNews?.map(n => n.title) || [];

  // 统计
  let totalProcessed = 0;
  let totalFromNewsData = 0;
  let totalFromRSS = 0;

  // === 阶段 1: NewsData.io ===
  console.log('📡 === Phase 1: NewsData.io API ===');
  const newsdataSources = NEWS_SOURCES.filter(s => s.type === 'newsdata' && s.enabled);
  
  for (const source of newsdataSources) {
    try {
      const articles = await fetchFromNewsDataApi(source);
      console.log(`  📰 ${source.name}: ${articles.length} articles`);
      
      for (const article of articles) {
        const item = transformer.transformNewsData(article, {
          id: source.id,
          name: source.name,
          type: 'newsdata',
          tier: 'tier1',
          language: source.config.language as 'en' | 'zh',
          region: 'GLOBAL',
          fetch_count: 0,
          success_rate: 100,
        });

        // 去重 & 分类 & 插入
        if (await insertNewsItem(item, recentTitles)) {
          totalProcessed++;
          totalFromNewsData++;
        }
      }

      // 速率限制
      await sleep(5000); // 每次请求间隔 5 秒
      
    } catch (error: any) {
      console.error(`  ❌ ${source.name}: ${error.message}`);
    }
  }

  // === 阶段 2: 直接 RSS ===
  console.log('\n📡 === Phase 2: Direct RSS ===');
  const rssSources = NEWS_SOURCES.filter(s => s.type === 'rss' && s.enabled);

  for (const source of rssSources) {
    try {
      const feed = await parser.parseURL(source.config.feedUrl!);
      console.log(`  📰 ${source.name}: ${feed.items.length} items`);

      for (const item of feed.items) {
        const unifiedItem = transformer.transformRss(item, {
          id: source.id,
          name: source.name,
          type: 'rss',
          tier: 'tier2',
          language: source.config.language as 'en' | 'zh',
          region: 'GLOBAL',
          fetch_count: 0,
          success_rate: 100,
        });

        if (await insertNewsItem(unifiedItem, recentTitles)) {
          totalProcessed++;
          totalFromRSS++;
        }
      }
      
    } catch (error: any) {
      console.error(`  ❌ ${source.name}: ${error.message}`);
    }
  }

  // === 完成 ===
  console.log('\n📊 === FETCH SUMMARY ===');
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   From NewsData.io: ${totalFromNewsData}`);
  console.log(`   From RSS: ${totalFromRSS}`);
  console.log('🚀 === HYBRID NEWS FETCH COMPLETE ===\n');
}

/**
 * 从 NewsData.io API 获取
 */
async function fetchFromNewsDataApi(source: any): Promise<any[]> {
  const url = new URL('https://newsdata.io/api/1/news');
  url.searchParams.set('apikey', process.env.NEWS_DATA_API_KEY!);
  url.searchParams.set('source', source.config.sourceId!);
  if (source.config.category) {
    url.searchParams.set('category', source.config.category);
  }

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  
  const data = await response.json();
  return data.results || [];
}

/**
 * 插入新闻项
 */
async function insertNewsItem(item: any, recentTitles: string[]): Promise<boolean> {
  // 1. 去重检查
  const { data: existing } = await supabase
    .from('news_items')
    .select('id')
    .eq('external_id', item.external_id)
    .single();

  if (existing) return false;

  // 2. 地理编码
  const geo = geocode(item.title, null);

  // 3. LLM 分类
  const classification = await classifyNews(item, []);

  // 4. 计算重要性评分
  const importanceScore = calculateImportance(item, classification);

  // 5. 插入
  const { error } = await supabase
    .from('news_items')
    .insert({
      ...item,
      geo_lat: geo.lat,
      geo_lng: geo.lng,
      region_code: geo.region,
      country_code: geo.code,
      importance_score: importanceScore,
      priority: classification.priority,
      categories: classification.categories,
    });

  if (error) {
    console.error(`   ❌ Insert error: ${error.message}`);
    return false;
  }

  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行
fetchAll().catch(console.error);
```

### 6.3 环境变量变更

```bash
# .env.local (新增)

# === NewsData.io API ===
NEWS_DATA_API_KEY=your_newsdata_api_key_here

# === RSSHub (备用) ===
RSSHUB_APP_URL=https://rsshub.app
# RSSHUB_APP_KEY=your_rsshub_key_if_needed

# === 现有配置 ===
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
DEEPSEEK_API_KEY=...
```

---

## 7. GitHub Actions 工作流

```yaml
# .github/workflows/fetch-news-hybrid.yml

name: Fetch Hybrid News

on:
  schedule:
    - cron: '0 * * * *'  # 每小时运行
  workflow_dispatch:  # 手动触发

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Hybrid Fetcher
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEWS_DATA_API_KEY: ${{ secrets.NEWS_DATA_API_KEY }}
          DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
        run: npx tsx scripts/fetch-hybrid.ts

      - name: Report Status
        if: always()
        run: |
          echo "News fetch completed at $(date)"
          echo "Status: ${{ job.status }}"
```

---

## 8. 数据库变更

### 8.1 新增字段

```sql
-- news_items 表新增字段
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS external_id VARCHAR(255) UNIQUE;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'rss';
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE news_items ADD COLUMN IF NOT EXISTS source_tier VARCHAR(10);
```

### 8.2 新增表

```sql
-- 新闻源配置表
CREATE TABLE IF NOT EXISTS news_sources (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL,  -- 'newsdata', 'rss', 'rsshub'
  tier VARCHAR(10),
  language VARCHAR(10),
  region_code VARCHAR(10),
  feed_url TEXT,
  config JSONB,  -- 源特定配置
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  rate_limit INTEGER DEFAULT 10,
  last_fetched_at TIMESTAMP WITH TIME ZONE,
  fetch_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API 使用统计表
CREATE TABLE IF NOT EXISTS newsdata_usage (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  hour INTEGER NOT NULL,
  request_count INTEGER DEFAULT 0,
  articles_fetched INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, hour)
);
```

---

## 9. 监控与告警

### 9.1 关键指标

```typescript
// src/lib/monitoring.ts

export interface FetchMetrics {
  totalFetched: number;
  totalInserted: number;
  totalDuplicates: number;
  failedSources: string[];
  apiUsage: {
    newsdata: { used: number; limit: number };
    rss: { used: number; success: number; failed: number };
  };
  processingTime: number;
}

export async function recordMetrics(metrics: FetchMetrics) {
  // 记录到 Supabase
  await supabase.from('fetch_metrics').insert({
    ...metrics,
    timestamp: new Date().toISOString(),
  });

  // 告警检查
  if (metrics.failedSources.length > 5) {
    await sendAlert(`⚠️ High failure rate: ${metrics.failedSources.length} sources failed`);
  }

  if (metrics.apiUsage.newsdata.used >= metrics.apiUsage.newsdata.limit - 2) {
    await sendAlert(`⚠️ NewsData.io API limit reached: ${metrics.apiUsage.newsdata.used}/${metrics.apiUsage.newsdata.limit}`);
  }
}
```

### 9.2 健康检查

```typescript
// src/scripts/health-check.ts

export async function healthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'down';
  issues: string[];
  metrics: any;
}> {
  const issues: string[] = [];
  const metrics: any = {};

  // 1. 检查 NewsData.io API
  try {
    const response = await fetch('https://newsdata.io/api/1/news?apikey=test');
    if (!response.ok) {
      issues.push('NewsData.io API unavailable');
    }
  } catch {
    issues.push('NewsData.io API connection failed');
  }

  // 2. 检查 RSS 源可用性
  const rssSources = await getEnabledRssSources();
  const unavailableRss = await checkRssAvailability(rssSources);
  if (unavailableRss.length > 0) {
    issues.push(`RSS sources unavailable: ${unavailableRss.join(', ')}`);
  }

  // 3. 检查数据库连接
  try {
    await supabase.from('news_items').select('count()').single();
  } catch {
    issues.push('Supabase connection failed');
  }

  // 4. 检查 API 使用量
  const usage = await getDailyUsage();
  metrics.apiUsage = usage;

  return {
    status: issues.length === 0 ? 'healthy' : issues.length > 5 ? 'down' : 'degraded',
    issues,
    metrics,
  };
}
```

---

## 10. 测试策略

### 10.1 测试用例

```typescript
// tests/hybrid-fetcher.test.ts

describe('Hybrid News Fetcher', () => {
  describe('Data Cleaning', () => {
    it('should clean HTML tags from title', () => {
      const cleaner = new DataCleaner();
      expect(cleaner.cleanTitle('Test <b>Title</b>')).toBe('Test Title');
    });

    it('should standardize URLs', () => {
      const cleaner = new DataCleaner();
      expect(cleaner.standardizeUrl('/article/123', 'https://bbc.com'))
        .toBe('https://bbc.com/article/123');
    });
  });

  describe('Data Transformation', () => {
    it('should transform NewsData.io format correctly', () => {
      const transformer = new NewsDataTransformer();
      const newsdataItem = {
        article_id: 'abc123',
        title: 'Test Article',
        description: 'This is a test article',
        link: 'https://bbc.com/article/123',
        pubDate: '2026-02-08 12:00:00',
        category: ['world'],
      };

      const result = transformer.transformNewsData(newsdataItem, {
        id: 'bbc-news',
        name: 'BBC World',
        type: 'newsdata',
        tier: 'tier1',
        language: 'en',
        region: 'GLOBAL',
        fetch_count: 0,
        success_rate: 100,
      });

      expect(result.external_id).toBe('abc123');
      expect(result.source_type).toBe('newsdata');
      expect(result.importance_factors.mediaWeight).toBe(20); // tier1
    });

    it('should transform RSS format correctly', () => {
      // RSS 测试
    });
  });

  describe('Classification', () => {
    it('should classify language correctly', () => {
      const classifier = new NewsClassifier();
      expect(classifier.classifyLanguage({ title: '习近平主席访问美国' } as any))
        .toBe('zh');
      expect(classifier.classifyLanguage({ title: 'Xi Jinping visits US' } as any))
        .toBe('en');
    });

    it('should classify category correctly', () => {
      const classifier = new NewsClassifier();
      const result = classifier.classifyCategory({
        title: 'Stock market reaches all-time high',
        summary: '',
      } as any);

      expect(result).toContain('Finance');
    });

    it('should classify priority correctly', () => {
      // 优先级测试
    });
  });

  describe('Integration', () => {
    it('should fetch from multiple sources', async () => {
      // 集成测试
    });

    it('should handle API errors gracefully', async () => {
      // 错误处理测试
    });
  });
});
```

### 10.2 端到端测试

```bash
# 测试命令
npm test                    # 单元测试
npm run test:e2e          # 端到端测试
npm run test:integration    # 集成测试
npm run test:newsdata      # NewsData.io API 测试
npm run test:rss           # RSS 源测试
```

---

## 11. 实施计划

### Phase 1: 基础设施准备 (1 天)

| 任务 | 负责人 | 依赖 |
|------|--------|------|
| 注册 NewsData.io 账号 | 用户 | - |
| 获取 API Key | 用户 | - |
| 创建 news_sources 表 | AI | - |
| 更新 fetch-rss.ts | AI | - |

### Phase 2: 核心开发 (2 天)

| 任务 | 负责人 | 依赖 |
|------|--------|------|
| 创建 data-cleaner.ts | AI | Phase 1 |
| 创建 data-transformer.ts | AI | Phase 1 |
| 创建 fetch-newsdata.ts | AI | Phase 1 |
| 更新 classifier.ts | AI | Phase 1 |
| 创建 fetch-hybrid.ts | AI | Phase 1 |

### Phase 3: 测试与部署 (1 天)

| 任务 | 负责人 | 依赖 |
|------|--------|------|
| 单元测试 | AI | Phase 2 |
| 集成测试 | AI | Phase 2 |
| 更新 GitHub Actions | AI | Phase 2 |
| 部署到生产 | 用户 | 测试通过 |

### Phase 4: 监控与优化 (进行中)

| 任务 | 负责人 | 依赖 |
|------|--------|------|
| 设置告警 | AI | Phase 3 |
| 优化分类器 | AI | 实际运行数据 |
| 扩展数据源 | 用户 | Phase 3 |

---

## 12. 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| NewsData.io API 不可用 | 数据源减少 70% | 低 | 保留直接 RSS 源 |
| 免费额度用尽 | 数据量减少 | 中 | 优化抓取频率 |
| 数据格式变更 | 管道失败 | 低 | 添加数据验证 |
| 源被封锁 | 数据减少 | 中 | 准备备用源 |
| API 限流 | 部分请求失败 | 中 | 实现重试逻辑 |

---

## 13. 成本分析

| 项目 | 成本 | 说明 |
|------|------|------|
| NewsData.io | $0 | 免费版 200 次/天 |
| 直接 RSS | $0 | 无需付费 |
| Supabase | $0 | 免费额度足够 |
| GitHub Actions | $0 | 免费额度 2000 分钟/月 |
| **总计** | **$0/月** | 完全免费 |

---

## 14. 成功指标

| 指标 | 目标 | 当前 | 改进 |
|------|------|------|------|
| 权威媒体覆盖 | 15+ 源 | 6 源 | +150% |
| 每小时数据量 | 200+ 条 | ~100 条 | +100% |
| 数据时效性 | 实时 | 部分 24h | 实时 |
| 系统可用性 | 99% | 未知 | - |

---

## 15. 附录

### A. 完整源配置

见 `src/config/news-sources.ts`

### B. API 文档链接

- [NewsData.io API Docs](https://newsdata.io/documentation)
- [RSSHub 文档](https://docs.rsshub.app/)
- [Supabase Docs](https://supabase.com/docs)

### C. 联系人

- **技术支持**: 用户提供
- **API 支持**: NewsData.io 支持团队

---

## 16. 数据字段说明

### 16.1 保留的字段

清洗后的新闻数据包含以下核心字段：

| 字段 | 类型 | 说明 | 用户可见性 |
|------|------|------|-----------|
| `title` | string | ✅ **完整保留** 标题 | ✅ 显示 |
| `summary` | string | ✅ **800字摘要**，足够了解要点 | ✅ 显示 |
| `original_url` | string | ✅ **原文链接**，可点击跳转 | ✅ 可点击 |
| `source_name` | string | 来源标识 (BBC, Reuters) | ✅ 显示 |
| `published_at` | string | 发布时间 | ✅ 显示 |
| `priority` | enum | P0/P1/P2/P3 | ✅ 显示 |
| `importance_score` | number | 重要性评分 | ✅ 显示 |
| `geo_lat/lng` | number | 地图定位 | ✅ 地图 |
| `region_code` | string | 区域分类 | ✅ 过滤 |

### 16.2 移除的字段

| 字段 | 原因 |
|------|------|
| `image_url` | ❌ **已移除** - 会干扰前端显示效果 |
| `author` | ❌ 不需要 |
| `read_time` | ❌ 不需要 |

### 16.3 设计理念

```
┌─────────────────────────────────────────────────────────────┐
│                    数据设计原则                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ 轻量化 - 不存储图片，专注文本内容                          │
│  ✅ 可追溯 - original_url 供用户访问原文                       │
│  ✅ 可分析 - 保留分类、地理、优先级等元数据                    │
│  ✅ 简洁 - 减少存储和传输开销                                 │
│                                                              │
│  ❌ 不存储图片 - 前端专注文本，不被图片干扰                    │
│  ❌ 不需要封面 - 用户点击原文可查看                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 16.4 用户界面展示

```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 P0  │ Israel and Hamas Reach Ceasefire Agreement       │
│        │ 📰 BBC World · 🕐 2小时前 · 🌍 中东              │
├─────────────────────────────────────────────────────────────┤
│  📝 摘要:                                                   │
│  Israeli officials announced today that a ceasefire          │
│  agreement has been reached with Hamas, ending weeks of      │
│  intense fighting in the region. The agreement was...        │
├─────────────────────────────────────────────────────────────┤
│  🔗 [访问原文]  │ 📂 [分类标签]  │ 🌍 [地图位置]            │
└─────────────────────────────────────────────────────────────┘
```

**关键点**：
- ✅ 标题完整显示
- ✅ 摘要简洁明了
- ✅ 点击原文链接访问原始页面（包含图片）
- ✅ 专注文本内容，不被图片干扰

---

## 17. 图片处理策略

### 17.1 为什么移除图片？

| 原因 | 说明 |
|------|------|
| **前端干扰** | 图片大小不一，破坏界面一致性 |
| **加载缓慢** | 图片拖慢页面加载速度 |
| **存储开销** | 图片占用大量存储空间 |
| **不必要** | 用户点击原文可查看高清图片 |
| **专注内容** | Bloomberg Terminal 风格强调信息密度 |

### 17.2 如何查看图片？

用户可以通过 `original_url` 访问原文页面查看高清图片：

```
┌─────────────────────────────────────────────────────────────┐
│  🔗 [访问原文 BBC 完整报道]                              │
│      ↓                                                   │
│  用户跳转到 BBC 原始页面                                 │
│      ↓                                                   │
│  查看完整报道和高清图片                                   │
└─────────────────────────────────────────────────────────────┘
```

### 17.3 技术实现

```typescript
// 前端新闻卡片组件 (不显示图片)
interface NewsCardProps {
  news: {
    title: string;
    summary: string;
    original_url: string;  // 点击跳转原文
    source_name: string;
    published_at: string;
    priority: 'P0' | 'P1' | 'P2' | 'P3';
  };
}

function NewsCard({ news }: NewsCardProps) {
  return (
    <div className="news-card">
      {/* 标题 */}
      <h3>{news.title}</h3>
      
      {/* 元数据 */}
      <div className="meta">
        <span>{news.source_name}</span>
        <span>{formatTime(news.published_at)}</span>
        <span>{news.priority}</span>
      </div>
      
      {/* 摘要 */}
      <p>{news.summary}</p>
      
      {/* 操作按钮 - 访问原文 */}
      <a href={news.original_url} target="_blank">
        🔗 访问原文
      </a>
    </div>
  );
}
```

---

**文档版本**: v1.1  
**最后更新**: 2026-02-08  
**更新内容**: 移除 image_url 字段，轻量化设计
