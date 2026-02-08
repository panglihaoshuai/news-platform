# Admin 系统与重要性评分重构设计方案

**日期**: 2026-02-07  
**状态**: 待实施  
**优先级**: 高

---

## 1. 项目概述

### 1.1 目标
重构 Global Intel Map 的重要性评分算法，并构建用户友好的 Admin 管理面板，实现：
- 更频繁的新闻采集（1小时/次）
- 更智能的重要性评分（关键词权重提升）
- 可视化的新闻分类管理界面
- 可配置的关键词库

### 1.2 核心改进
| 模块 | 当前状态 | 改进后 |
|------|----------|--------|
| 采集频率 | 6小时/次 | **1小时/次** |
| 时效性评分 | 线性衰减 | **8小时保鲜期** |
| 关键词权重 | 25分 | **35分** |
| 分类管理 | 无 | **可视化Admin面板** |
| 关键词配置 | 硬编码 | **数据库存储+Web编辑** |

---

## 2. 技术架构

### 2.1 数据库Schema扩展

```sql
-- 关键词库表
CREATE TABLE keyword_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('P0', 'P1', 'P2', 'P3')),
  categories TEXT[] DEFAULT '{}',
  weight INTEGER DEFAULT 0,
  match_count INTEGER DEFAULT 0,  -- 匹配次数统计
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 人工分类记录表
CREATE TABLE manual_classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_item_id UUID REFERENCES news_items(id) ON DELETE CASCADE,
  categories TEXT[] NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 系统配置表（已存在，扩展用途）
-- 用于存储Admin密码等配置
INSERT INTO system_config (key, value, description) VALUES 
  ('admin_password_hash', '[HASH_OF_SSY20050515@]', 'Admin panel password hash'),
  ('admin_session_secret', '[RANDOM_32_CHAR_SECRET]', 'Session signing secret');
```

**安全凭证配置**（`.env.local`）：
```bash
# Admin Panel Authentication
ADMIN_PASSWORD=SSY20050515@
ADMIN_SESSION_SECRET=your-random-secret-key-min-32-characters-long
```

### 2.2 重要性评分算法 v2.0

```typescript
interface ImportanceFactors {
  mediaWeight: number;      // 0-30
  freshnessScore: number;   // 0-25 → 0-20 (调整)
  keywordScore: number;     // 0-25 → 0-35 (提升)
  contentBonus: number;     // 0-20 → 0-15 (降低)
}

function calculateImportanceScore(
  newsItem: NewsItem,
  source: RSSSource,
  keywords: KeywordLibrary[]
): number {
  // 1. 媒体权重 (30分)
  const mediaWeight = getMediaTierScore(source.name); // 30/24/18/12
  
  // 2. 时效性评分 (20分) - 1小时采集频率
  const hoursSincePublished = (Date.now() - new Date(newsItem.published_at).getTime()) / (1000 * 60 * 60);
  const freshnessScore = Math.max(0, 20 - hoursSincePublished * 2.5); // 8小时后归零
  
  // 3. 关键词评分 (35分) - 核心改进
  let keywordScore = 0;
  const matchedKeywords = [];
  
  for (const kw of keywords) {
    if (newsItem.title.toLowerCase().includes(kw.keyword.toLowerCase())) {
      keywordScore += getTierWeight(kw.tier); // P0=35, P1=25, P2=15, P3=8
      matchedKeywords.push(kw);
    }
  }
  keywordScore = Math.min(35, keywordScore);
  
  // 4. 内容丰富度 (15分)
  let contentBonus = 0;
  if (newsItem.enclosure) contentBonus += 5;  // 有附件
  if (newsItem.categories?.length > 0) contentBonus += 3;  // 有分类
  if (newsItem.summary?.length > 100) contentBonus += 4;  // 有实质内容
  if (newsItem.creator) contentBonus += 3;  // 有作者
  contentBonus = Math.min(15, contentBonus);
  
  // 总分计算
  const total = mediaWeight + freshnessScore + keywordScore + contentBonus;
  return Math.min(100, Math.round(total));
}
```

---

## 3. Admin 面板设计

### 3.1 路由结构

```
/app
├── /[locale]
│   └── /admin          # Admin 主入口（密码保护）
│       ├── /page.tsx   # 分类工作台（默认页）
│       ├── /keywords   # 关键词库管理
│       ├── /test       # 实时测试
│       └── /settings   # 系统设置
├── /admin-login        # 登录页面（独立路由）
└── /api/admin          # Admin API 端点
    ├── /auth           # 登录/验证
    ├── /keywords       # CRUD 关键词
    ├── /classify       # 保存分类
    └── /test           # 测试评分
```

### 3.2 分类工作台 (Classification Workbench)

**核心功能**：人工阅读新闻标题并分类

**界面布局**：
```
┌─────────────────────────────────────────────────────────────┐
│  分类工作台                              [退出]             │
├──────────────────────┬──────────────────────────────────────┤
│  📰 待分类新闻        │  🔍 当前新闻详情                      │
│  (最近24小时)         │                                      │
│                      │  ┌──────────────────────────────┐   │
│  ○ 突发：特朗普...    │  │ 标题：突发：特朗普遇刺        │   │
│  ○ 美联储宣布加息...   │  │ 来源：Reuters                 │   │
│  ○ OpenAI发布...      │  │ 发布时间：2小时前              │   │
│  ○ 台海局势紧张...     │  │ 自动评分：92分                │   │
│  ...                 │  │                              │   │
│                      │  │ 摘要：美国前总统特朗普在...     │   │
│                      │  └──────────────────────────────┘   │
│                      │                                      │
│                      │  📋 分类选择：                        │
│                      │  ┌────────────────────────────┐     │
│                      │  │ [政治] [军事] [经济] [科技] │     │
│                      │  │ [社会] [体育] [娱乐] [其他] │     │
│                      │  └────────────────────────────┘     │
│                      │                                      │
│                      │  🎯 优先级：                          │
│                      │  ┌────────────────────────────┐     │
│                      │  │ ○ 🔴 P0-重大                │     │
│                      │  │ ○ 🟠 P1-重要                │     │
│                      │  │ ○ 🟡 P2-普通                │     │
│                      │  │ ○ 🟢 P3-低优                │     │
│                      │  └────────────────────────────┘     │
│                      │                                      │
│                      │  📝 备注：                            │
│                      │  ┌────────────────────────────┐     │
│                      │  │ 可选：为什么这样分类...       │     │
│                      │  └────────────────────────────┘     │
│                      │                                      │
│                      │  [  💾 保存分类  ]  [  ⏭️ 跳过  ]   │
│                      │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

**交互流程**：
1. 左侧列表显示最近24小时内采集的新闻（按重要性倒序）
2. 点击新闻 → 右侧显示详情+自动评分
3. 选择分类标签（可多选）
4. 选择优先级（单选 P0-P3）
5. 可选填写备注
6. 点击保存 → 更新 `manual_classifications` 表
7. 系统自动学习：提取标题关键词，建议添加到关键词库

### 3.3 关键词库管理 (Keyword Library)

**核心功能**：可视化编辑关键词，无需操作JSON

**界面设计**：
```
┌─────────────────────────────────────────────────────────────┐
│  关键词库管理                   [+ 添加关键词]  [导入/导出]   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🔴 P0级 - 重大突发事件                    (8个关键词)       │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [战争] [冲突] [空袭] [核] [政变] [刺杀] [恐袭] ... │    │
│  │                                                     │    │
│  │ 点击编辑 • 拖拽排序 • 右键删除                       │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  🟠 P1级 - 重大政治经济                    (12个关键词)      │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [美联储] [加息] [通胀] [大选] [峰会] [协议] ...    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  🟡 P2级 - 行业重大                        (15个关键词)      │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [财报] [收购] [合并] [发布] [突破] ...             │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  🟢 P3级 - 一般热点                         (9个关键词)      │
│  ┌────────────────────────────────────────────────────┐    │
│  │ [涨价] [更新] [合作] [投资] ...                    │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**添加关键词弹窗**：
```
┌────────────────────────────┐
│ 添加新关键词                │
├────────────────────────────┤
│                            │
│  关键词：                  │
│  ┌────────────────────┐   │
│  │  刺杀              │   │
│  └────────────────────┘   │
│                            │
│  级别：                    │
│  ○ P0-重大  ● P1-重要     │
│  ○ P2-普通  ○ P3-低优     │
│                            │
│  关联分类（多选）：         │
│  ☑ 政治 ☑ 军事 ☐ 经济     │
│  ☐ 科技 ☐ 社会 ☐ 其他     │
│                            │
│  预计权重：25分             │
│                            │
│  [  保存  ]  [  取消  ]     │
│                            │
└────────────────────────────┘
```

### 3.4 实时测试 (Real-time Test)

**核心功能**：输入标题，实时查看评分和分类

```
┌─────────────────────────────────────────────────────────────┐
│  实时测试                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📝 输入测试标题：                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  美联储宣布加息25个基点，应对通胀压力                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [  ▶️  运行测试  ]                                         │
│                                                              │
│  📊 评分分析：                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                      │  │
│  │  媒体权重：Reuters (Tier 1)     +30分  ████████████ │  │
│  │  时效性：  2小时前              +18分  ███████▌     │  │
│  │  关键词：  [加息 +25分] [美联储 +25分]  +35分  ████████████│  │
│  │  内容分：  有分类+有内容        +10分  ████▌       │  │
│  │  ─────────────────────────────────────               │  │
│  │  总分：93分（封顶100分）      [🟠 P1级]              │  │
│  │                                                      │  │
│  │  🏷️ 自动分类：经济 / P1                              │  │
│  │                                                      │  │
│  │  🔍 匹配到的关键词：                                 │  │
│  │  • "加息" - P1级 - 经济领域 - 权重25分              │  │
│  │  • "美联储" - P1级 - 经济领域 - 权重25分            │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [ 将结果应用到关键词库 ] [ 导出测试报告 ]                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 安全设计

### 4.1 密码保护机制

**方案**：环境变量 + Session Cookie（无需外部OAuth）

```typescript
// .env.local
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password-here
ADMIN_SESSION_SECRET=random-secret-key-min-32-chars
```

**登录流程**：
1. 访问 `/admin` → 检查 session cookie
2. 无 session → 重定向到 `/admin-login`
3. 输入密码 → POST 到 `/api/admin/auth`
4. 验证成功 → 设置 httpOnly cookie，有效期24小时
5. 访问受保护路由时验证 cookie

**中间件实现**：
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = request.cookies.get('admin_session');
    
    if (!session || !verifySession(session.value)) {
      return NextResponse.redirect(new URL('/admin-login', request.url));
    }
  }
}
```

### 4.2 API 安全

- 所有 `/api/admin/*` 端点都需要 session 验证
- 使用 POST/PUT/DELETE 进行数据修改
- 输入验证和 SQL 注入防护（使用 Supabase 参数化查询）

---

## 5. 智能混合分类系统（关键词 + DeepSeek LLM）

### 5.1 方案概述

由于关键词匹配存在"变体命中难"的问题（如"刺杀"vs"遇刺"、"加息"vs"rate hike"），引入 DeepSeek LLM 作为智能判断层：

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         智能分类引擎                                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     第一层：关键词匹配                              │   │
│  │                                                                  │   │
│  │  • 精确匹配（同义词 + 模糊匹配）                                   │   │
│  │  • 置信度 > 0.9 → 直接返回（高质量，高性能）                    │   │
│  │  • 置信度 < 0.9 → 交给 LLM 判断（确保准确性）                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                │                                       │
│                                ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     第二层：LLM 推理                              │   │
│  │                                                                  │   │
│  │  DeepSeek V3.2 API                                              │   │
│  │  • 语义理解（解决变体问题）                                       │   │
│  │  • 上下文推理（多语言支持）                                       │   │
│  │  • 确定性输出（JSON格式）                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                │                                       │
│                                ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     第三层：分数合成                               │   │
│  │                                                                  │   │
│  │  关键词命中 → 关键词分数 + LLM 验证                              │   │
│  │  关键词未命中 → 纯 LLM 判断                                      │   │
│  │  LLM 失败 → 回退到基础分（极少情况）                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 策略调整（用户确认）

| 策略 | 调整前 | 调整后 |
|------|--------|--------|
| LLM 调用时机 | 仅作为兜底（置信度 < 0.8） | 关键词未命中时首选（置信度 < 0.9） |
| 预期 LLM 比例 | ~30% | ~50%（关键词未命中就交由 LLM） |
| 月度成本控制 | < $0.05 | < $1.00（几美元可接受） |
| 优化方向 | 成本优先 | **性能优先**（更好效果） |

**核心理念**：既然成本不高（几美元/月），就应该让 LLM 发挥更大作用，确保每条新闻都得到准确分类。
┌─────────────────────────────────────────────────────────────────────────┐
│                         智能分类引擎                                      │
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────────────────────────────┐    │
│  │   关键词匹配层    │    │            LLM 推理层                   │    │
│  │                 │    │                                          │    │
│  │  • 精确匹配      │    │  ┌──────────────────────────────────┐  │    │
│  │  • 同义词匹配    │    │  │       DeepSeek V3.2 API         │  │    │
│  │  • 模糊匹配      │    │  │                                  │  │    │
│  │                 │    │  │  • 语义理解                       │  │    │
│  │  置信度 > 0.8   │    │  • 上下文推理                      │  │    │
│  │  → 直接返回     │    │  • 多语言支持（中/英）              │  │    │
│  └─────────────────┘    │  │                                  │  │    │
│         │               │  │  置信度 > 0.7                     │  │    │
│         │               │  │  → 返回结果                       │  │    │
│         ▼               │  └──────────────────────────────────┘  │    │
│  ┌─────────────────┐    │                     │                    │    │
│  │   决策层        │◄───┼─────────────────────┘                    │    │
│  │                 │    │                                           │    │
│  │  关键词命中→返回│    │                                           │    │
│  │  未命中→LLM推理│    │                                           │    │
│  │  LLM失败→回退  │    │                                           │    │
│  └─────────────────┘    └───────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 DeepSeek API 集成

#### 5.2.1 定价（2025年2月）

| 项目 | DeepSeek V3.2 | GPT-3.5-turbo | 节省 |
|------|----------------|----------------|------|
| **输入（缓存命中）** | $0.028/1M tokens | $0.50/1M tokens | **94%** |
| **输入（缓存未命中）** | $0.28/1M tokens | $0.50/1M tokens | 44% |
| **输出** | $0.42/1M tokens | $1.50/1M tokens | **72%** |
| **上下文窗口** | 128K tokens | 16K tokens | 8倍 |
| **免费额度** | 500万 tokens/月 | 无 | - |

#### 5.2.2 服务封装

```typescript
// src/services/deepseek-service.ts

import OpenAI from 'openai';

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

interface ClassificationResult {
  categories: string[];
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  confidence: number;
  reasoning: string;
}

export async function classifyWithDeepSeek(
  title: string,
  context?: string
): Promise<ClassificationResult> {
  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `你是一个专业的全球新闻分类专家。请分析新闻标题，返回JSON格式：

{
  "categories": ["政治", "经济"],
  "priority": "P0",
  "confidence": 0.85,
  "reasoning": "一句话说明分类理由"
}

分类标准：
- P0（重大）：战争、刺杀、恐袭、金融危机、核泄漏、大流行、重大科技突破
- P1（重要）：大选、美联储加息、政策变化、重大峰会、公司丑闻
- P2（普通）：财报、收购、产品发布、行业新闻
- P3（低优）：常规更新、合作、投资进展

领域分类：政治、军事、经济、科技、环境、社会、体育、娱乐`
      },
      {
        role: 'user',
        content: `请分类这条新闻：${title}${context ? `\n\n相关上下文：${context}` : ''}`
      }
    ],
    temperature: 0.3,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content) as ClassificationResult;
}
```

### 5.3 关键词匹配器（带同义词）

#### 5.3.1 同义词扩展设计

```typescript
interface KeywordEntry {
  keyword: string;
  synonyms: string[];      // 同义词列表
  tier: 'P0' | 'P1' | 'P2' | 'P3';
  categories: string[];
  baseScore: number;
}

const defaultKeywords: KeywordEntry[] = [
  {
    keyword: '战争',
    synonyms: ['war', 'conflict', 'military action', 'invasion', 'hostilities', '开战', '交战'],
    tier: 'P0',
    categories: ['政治', '军事'],
    baseScore: 35,
  },
  {
    keyword: '刺杀',
    synonyms: ['assassination', '遇刺', '暗杀', 'murder attempt', 'shooting', '枪击'],
    tier: 'P0',
    categories: ['政治', '军事', '社会'],
    baseScore: 35,
  },
  {
    keyword: '加息',
    synonyms: ['rate hike', 'raises rates', 'interest rate increase', '升息', '涨息', '利率上调'],
    tier: 'P1',
    categories: ['经济'],
    baseScore: 25,
  },
  // ... 更多关键词
];

export function matchKeywords(title: string, keywords: KeywordEntry[] = defaultKeywords) {
  const lowerTitle = title.toLowerCase();
  const matches: MatchResult[] = [];

  for (const entry of keywords) {
    // 精确匹配
    for (const form of [entry.keyword, ...entry.synonyms]) {
      if (lowerTitle.includes(form.toLowerCase())) {
        matches.push({ ...entry, matchedKeyword: form, matchedType: 'exact' });
        break;
      }
    }

    // 部分匹配（60%词匹配）
    if (!matches.find(m => m.keyword === entry.keyword)) {
      const words = entry.keyword.split(' ');
      if (words.length > 1) {
        const matchCount = words.filter(w => lowerTitle.includes(w.toLowerCase())).length;
        if (matchCount / words.length >= 0.6) {
          matches.push({ 
            ...entry, 
            matchedKeyword: entry.keyword, 
            matchedType: 'fuzzy',
            baseScore: Math.round(entry.baseScore * 0.6) 
          });
        }
      }
    }
  }

  return matches;
}
```

### 5.4 智能分类主入口

```typescript
// src/lib/smart-classifier.ts

interface FinalResult {
  categories: string[];
  priority: 'P0' | 'P1' | 'P2' | 'P3' | null;
  confidence: number;
  score: number;
  source: 'keyword' | 'llm' | 'fallback';
  reasoning: string;
}

export async function smartClassify(
  title: string,
  keywords: KeywordEntry[] = [],
  useLLM: boolean = true
): Promise<FinalResult> {
  // Step 1: 关键词匹配
  const matches = matchKeywords(title, keywords);
  const keywordResult = calculateKeywordScore(matches);

  if (keywordResult.maxConfidence >= 0.8) {
    return {
      categories: keywordResult.categories,
      priority: getPriorityFromScore(keywordResult.totalScore),
      confidence: keywordResult.maxConfidence,
      score: keywordResult.totalScore,
      source: 'keyword',
      reasoning: matches.map(m => `匹配"${m.matchedKeyword}"`).join('; '),
    };
  }

  // Step 2: LLM 兜底
  if (useLLM && keywordResult.maxConfidence < 0.8) {
    try {
      const llmResult = await classifyWithDeepSeek(title);
      return {
        categories: [...new Set([...keywordResult.categories, ...llmResult.categories])],
        priority: llmResult.priority,
        confidence: llmResult.confidence,
        score: priorityToScore(llmResult.priority),
        source: 'llm',
        reasoning: llmResult.reasoning,
      };
    } catch (e) {
      console.error('LLM failed:', e);
    }
  }

  // Step 3: 回退方案
  return {
    categories: ['其他'],
    priority: 'P3',
    confidence: 0.3,
    score: 20,
    source: 'fallback',
    reasoning: '关键词未匹配，LLM不可用',
  };
}
```

### 5.5 成本分析

#### 场景假设

| 参数 | 值 |
|------|-----|
| 新闻采集频率 | 每小时，720条/月 |
| LLM 调用比例 | ~50%（关键词未命中就交由 LLM） |
| 平均输入 tokens | 50 tokens |
| 平均输出 tokens | 100 tokens |
| 缓存命中率 | 50%（DeepSeek自动） |

#### 月度成本计算

```
每月调用次数 = 720 × 50% = 360次

每次调用成本（50%缓存命中）：
  输入 = 50 × ($0.28×0.5 + $0.028×0.5) / 1M = $0.0000077
  输出 = 100 × $0.42 / 1M = $0.000042
  每次 = $0.0000497

月度总成本 = 360 × $0.0000497 = **$0.018/月**
           ≈ **2美分/月**

【即使100%使用LLM】
  每月调用次数 = 720次
  月度成本 = 720 × $0.0000497 = $0.036/月
           ≈ **4美分/月**
```

#### 成本结论

| 预期使用场景 | 月度成本 |
|-------------|---------|
| **正常（50% LLM）** | **$0.02 - $0.05** |
| **保守（80% LLM）** | **$0.03 - $0.08** |
| **极端（100% LLM）** | **$0.04 - $0.10** |

**结论**：DeepSeek 成本极低，即使 100% 使用 LLM 也只需几美分/月，完全可接受。

#### 成本对比

| 方案 | 月度成本 | 相对DeepSeek |
|------|----------|-------------|
| **DeepSeek V3.2** | **$0.02 - $0.10** | 1x |
| GPT-3.5-turbo | $1.00 - $5.00 | 50x |
| GPT-4 | $50.00+ | 2500x |
| 纯关键词 | $0 | 免费 |

### 5.6 环境配置

```bash
# .env.local 添加
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### 5.7 数据库扩展

```sql
-- 添加分类来源字段
ALTER TABLE news_items 
ADD COLUMN IF NOT EXISTS classification_source TEXT,
ADD COLUMN IF NOT EXISTS classification_reasoning TEXT;

-- 创建关键词同义词扩展表
CREATE TABLE IF NOT EXISTS keyword_synonyms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID REFERENCES keyword_library(id) ON DELETE CASCADE,
  synonym TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_synonym_keyword ON keyword_synonyms(keyword_id);
CREATE INDEX idx_news_classification_source ON news_items(classification_source);
```

---

## 6. 默认关键词库

系统初始化时预置全面的多领域关键词库：

### 5.1 P0级 - 重大突发事件 (35分)

**地缘政治与军事** (中文/英文)
```sql
INSERT INTO keyword_library (keyword, tier, categories, weight) VALUES
-- 战争与冲突
('战争', 'P0', '{"政治", "军事"}', 35),
('war', 'P0', '{"political", "military"}', 35),
('冲突', 'P0', '{"政治", "军事"}', 35),
('conflict', 'P0', '{"political", "military"}', 35),
('宣战', 'P0', '{"政治", "军事"}', 35),
('declaration of war', 'P0', '{"political", "military"}', 35),

-- 暴力袭击
('刺杀', 'P0', '{"政治", "军事", "社会"}', 35),
('assassination', 'P0', '{"political", "military", "social"}', 35),
('谋杀', 'P0', '{"社会", "政治"}', 35),
('murder', 'P0', '{"social", "political"}', 35),
('恐袭', 'P0', '{"政治", "军事", "社会"}', 35),
('terrorist attack', 'P0', '{"political", "military", "social"}', 35),
('爆炸', 'P0', '{"社会", "军事"}', 35),
('explosion', 'P0', '{"social", "military"}', 35),
('空袭', 'P0', '{"军事", "政治"}', 35),
('air strike', 'P0', '{"military", "political"}', 35),

-- 政权变动
('政变', 'P0', '{"政治"}', 35),
('coup', 'P0', '{"political"}', 35),
('政权更迭', 'P0', '{"政治"}', 35),
('regime change', 'P0', '{"political"}', 35),
('革命', 'P0', '{"政治", "社会"}', 35),
('revolution', 'P0', '{"political", "social"}', 35),
('戒严', 'P0', '{"政治", "军事"}', 35),
('martial law', 'P0', '{"political", "military"}', 35),
('国家紧急状态', 'P0', '{"政治", "社会"}', 35),
('state of emergency', 'P0', '{"political", "social"}', 35),

-- 核武器
('核', 'P0', '{"军事", "政治"}', 35),
('nuclear', 'P0', '{"military", "political"}', 35),
('核武器', 'P0', '{"军事", "政治"}', 35),
('nuclear weapon', 'P0', '{"military", "political"}', 35),
('核试验', 'P0', '{"军事", "政治"}', 35),
('nuclear test', 'P0', '{"military", "political"}', 35),
('导弹', 'P0', '{"军事", "政治"}', 35),
('missile', 'P0', '{"military", "political"}', 35),
('洲际导弹', 'P0', '{"军事", "政治"}', 35),
('ICBM', 'P0', '{"military", "political"}', 35),

-- 大规模杀伤
('大屠杀', 'P0', '{"社会", "政治"}', 35),
('massacre', 'P0', '{"social", "political"}', 35),
('种族灭绝', 'P0', '{"政治", "社会"}', 35),
('genocide', 'P0', '{"political", "social"}', 35),
('人道主义危机', 'P0', '{"社会", "政治"}', 35),
('humanitarian crisis', 'P0', '{"social", "political"}', 35),

-- 重大安全事件
('人质', 'P0', '{"社会", "政治", "军事"}', 35),
('hostage', 'P0', '{"social", "political", "military"}', 35),
('劫持', 'P0', '{"社会", "军事"}', 35),
('hijacking', 'P0', '{"social", "military"}', 35),
('击落', 'P0', '{"军事", "政治"}', 35),
('shot down', 'P0', '{"military", "political"}', 35);
```

**经济与金融** (中文/英文)
```sql
INSERT INTO keyword_library (keyword, tier, categories, weight) VALUES
-- 金融危机
('金融危机', 'P0', '{"经济", "政治"}', 35),
('financial crisis', 'P0', '{"economic", "political"}', 35),
('股市崩盘', 'P0', '{"经济"}', 35),
('stock market crash', 'P0', '{"economic"}', 35),
('闪崩', 'P0', '{"经济"}', 35),
('flash crash', 'P0', '{"economic"}', 35),
('熔断', 'P0', '{"经济"}', 35),
('circuit breaker', 'P0', '{"economic"}', 35),
('银行倒闭', 'P0', '{"经济", "政治"}', 35),
('bank failure', 'P0', '{"economic", "political"}', 35),

-- 货币危机
('货币危机', 'P0', '{"经济", "政治"}', 35),
('currency crisis', 'P0', '{"economic", "political"}', 35),
('恶性通胀', 'P0', '{"经济", "社会"}', 35),
('hyperinflation', 'P0', '{"economic", "social"}', 35),
('债务违约', 'P0', '{"经济", "政治"}', 35),
('debt default', 'P0', '{"economic", "political"}', 35),
('主权违约', 'P0', '{"经济", "政治"}', 35),
('sovereign default', 'P0', '{"economic", "political"}', 35),

-- 大宗商品危机
('石油危机', 'P0', '{"经济", "政治"}', 35),
('oil crisis', 'P0', '{"economic", "political"}', 35),
('能源危机', 'P0', '{"经济", "政治", "环境"}', 35),
('energy crisis', 'P0', '{"economic", "political", "environment"}', 35),
('粮食危机', 'P0', '{"经济", "社会", "环境"}', 35),
('food crisis', 'P0', '{"economic", "social", "environment"}', 35);
```

**科技与网络安全** (中文/英文)
```sql
INSERT INTO keyword_library (keyword, tier, categories, weight) VALUES
-- 重大技术突破
('人工智能突破', 'P0', '{"科技"}', 35),
('AI breakthrough', 'P0', '{"technology"}', 35),
('通用人工智能', 'P0', '{"科技"}', 35),
('AGI', 'P0', '{"technology"}', 35),
('量子霸权', 'P0', '{"科技"}', 35),
('quantum supremacy', 'P0', '{"technology"}', 35),
('量子计算突破', 'P0', '{"科技"}', 35),
('quantum computing breakthrough', 'P0', '{"technology"}', 35),

-- 网络安全
('大规模网络攻击', 'P0', '{"科技", "政治", "军事"}', 35),
('major cyberattack', 'P0', '{"technology", "political", "military"}', 35),
('国家级黑客', 'P0', '{"科技", "政治", "军事"}', 35),
('state-sponsored hacking', 'P0', '{"technology", "political", "military"}', 35),
('关键基础设施瘫痪', 'P0', '{"科技", "社会"}', 35),
('critical infrastructure failure', 'P0', '{"technology", "social"}', 35),
('数据泄露', 'P0', '{"科技", "社会"}', 35),
('data breach', 'P0', '{"technology", "social"}', 35),
('勒索软件', 'P0', '{"科技"}', 35),
('ransomware', 'P0', '{"technology"}', 35);
```

**环境与灾难** (中文/英文)
```sql
INSERT INTO keyword_library (keyword, tier, categories, weight) VALUES
-- 自然灾害
('大地震', 'P0', '{"环境", "社会"}', 35),
('major earthquake', 'P0', '{"environment", "social"}', 35),
('海啸', 'P0', '{"环境", "社会"}', 35),
('tsunami', 'P0', '{"environment", "social"}', 35),
('超级台风', 'P0', '{"环境", "社会"}', 35),
('super typhoon', 'P0', '{"environment", "social"}', 35),
('飓风', 'P0', '{"环境", "社会"}', 35),
('hurricane', 'P0', '{"environment", "social"}', 35),
('龙卷风', 'P0', '{"环境", "社会"}', 35),
('tornado', 'P0', '{"environment", "social"}', 35),
('特大洪水', 'P0', '{"环境", "社会"}', 35),
('catastrophic flood', 'P0', '{"environment", "social"}', 35),

-- 环境灾难
('核泄漏', 'P0', '{"环境", "社会", "政治"}', 35),
('nuclear leak', 'P0', '{"environment", "social", "political"}', 35),
('核事故', 'P0', '{"环境", "政治"}', 35),
('nuclear accident', 'P0', '{"environment", "political"}', 35),
('生态灾难', 'P0', '{"环境", "社会"}', 35),
('ecological disaster', 'P0', '{"environment", "social"}', 35),
('大规模野火', 'P0', '{"环境", "社会"}', 35),
('wildfire', 'P0', '{"environment", "social"}', 35),
('极端天气', 'P0', '{"环境", "社会"}', 35),
('extreme weather', 'P0', '{"environment", "social"}', 35),

-- 公共卫生
('全球大流行', 'P0', '{"社会", "政治"}', 35),
('pandemic', 'P0', '{"social", "political"}', 35),
('疫情爆发', 'P0', '{"社会", "政治"}', 35),
('outbreak', 'P0', '{"social", "political"}', 35),
('新型病毒', 'P0', '{"社会", "科技"}', 35),
('novel virus', 'P0', '{"social", "technology"}', 35),
('生物安全', 'P0', '{"社会", "政治", "科技"}', 35),
('biosecurity', 'P0', '{"social", "political", "technology"}', 35);
```

### 5.2 P1级 - 重大政治经济 (25分)

**政治与外交** (中文/英文)
```sql
INSERT INTO keyword_library (keyword, tier, categories, weight) VALUES
-- 重大政治事件
('大选', 'P1', '{"政治"}', 25),
('election', 'P1', '{"political"}', 25),
('总统选举', 'P1', '{"政治"}', 25),
('presidential election', 'P1', '{"political"}', 25),
('议会选举', 'P1', '{"政治"}', 25),
('parliamentary election', 'P1', '{"political"}', 25),
('公投', 'P1', '{"政治"}', 25),
('referendum', 'P1', '{"political"}', 25),
('弹劾', 'P1', '{"政治"}', 25),
('impeachment', 'P1', '{"political"}', 25),
('不信任投票', 'P1', '{"政治"}', 25),
('vote of no confidence', 'P1', '{"political"}', 25),

-- 外交与峰会
('峰会', 'P1', '{"政治", "外交"}', 25),
('summit', 'P1', '{"political", "diplomatic"}', 25),
('G7', 'P1', '{"政治", "经济"}', 25),
('G20', 'P1', '{"政治", "经济"}', 25),
('联合国大会', 'P1', '{"政治"}', 25),
('UN General Assembly', 'P1', '{"political"}', 25),
('北约', 'P1', '{"政治", "军事"}', 25),
('NATO', 'P1', '{"political", "military"}', 25),
('制裁', 'P1', '{"政治", "经济"}', 25),
('sanctions', 'P1', '{"political", "economic"}', 25),
('撤军', 'P1', '{"政治", "军事"}', 25),
('troop withdrawal', 'P1', '{"political", "military"}', 25),
('停火', 'P1', '{"政治", "军事"}', 25),
('ceasefire', 'P1', '{"political", "military"}', 25),
('和平协议', 'P1', '{"政治"}', 25),
('peace agreement', 'P1', '{"political"}', 25);
```

**经济与金融** (中文/英文)
```sql
INSERT INTO keyword_library (keyword, tier, categories, weight) VALUES
-- 央行政策
('美联储', 'P1', '{"经济"}', 25),
('Federal Reserve', 'P1', '{"economic"}', 25),
('加息', 'P1', '{"经济"}', 25),
('rate hike', 'P1', '{"economic"}', 25),
('降息', 'P1', '{"经济"}', 25),
('rate cut', 'P1', '{"economic"}', 25),
('量化宽松', 'P1', '{"经济"}', 25),
('QE', 'P1', '{"economic"}', 25),
('缩表', 'P1', '{"经济"}', 25),
('balance sheet reduction', 'P1', '{"economic"}', 25),
('通胀', 'P1', '{"经济", "社会"}', 25),
('inflation', 'P1', '{"economic", "social"}', 25),
('通缩', 'P1', '{"经济"}', 25),
('deflation', 'P1', '{"economic"}', 25),
('滞胀', 'P1', '{"经济"}', 25),
('stagflation', 'P1', '{"economic"}', 25),

-- 市场动态
('央行', 'P1', '{"经济"}', 25),
('central bank', 'P1', '{"economic"}', 25),
('利率决议', 'P1', '{"经济"}', 25),
('interest rate decision', 'P1', '{"economic"}', 25),
('非农就业', 'P1', '{"经济"}', 25),
('non-farm payroll', 'P1', '{"economic"}', 25),
('GDP', 'P1', '{"经济"}', 25),
('CPI', 'P1', '{"经济"}', 25),
('PPI', 'P1', '{"经济"}', 25),
('PMI', 'P1', '{"经济"}', 25);
```

**科技与产业** (中文/英文)
```sql
INSERT INTO keyword_library (keyword, tier, categories, weight) VALUES
-- AI与科技巨头
('OpenAI', 'P1', '{"科技"}', 25),
('GPT', 'P1', '{"科技"}', 25),
('ChatGPT', 'P1', '{"科技"}', 25),
('大语言模型', 'P1', '{"科技"}', 25),
('LLM', 'P1', '{"technology"}', 25),
('生成式AI', 'P1', '{"科技"}', 25),
('generative AI', 'P1', '{"technology"}', 25),
('谷歌', 'P1', '{"科技"}', 25),
('Google', 'P1', '{"technology"}', 25),
('微软', 'P1', '{"科技"}', 25),
('Microsoft', 'P1', '{"technology"}', 25),
('苹果', 'P1', '{"科技"}', 25),
('Apple', 'P1', '{"technology"}', 25),
('英伟达', 'P1', '{"科技", "经济"}', 25),
('NVIDIA', 'P1', '{"technology", "economic"}', 25),
('特斯拉', 'P1', '{"科技", "经济"}', 25),
('Tesla', 'P1', '{"technology", "economic"}', 25),
('亚马逊', 'P1', '{"科技", "经济"}', 25),
('Amazon', 'P1', '{"technology", "economic"}', 25),
('Meta', 'P1', '{"科技"}', 25),
('Facebook', 'P1', '{"科技"}', 25),

-- 半导体
('芯片', 'P1', '{"科技", "经济"}', 25),
('chip', 'P1', '{"technology", "economic"}', 25),
('半导体', 'P1', '{"科技", "经济"}', 25),
('semiconductor', 'P1', '{"technology", "economic"}', 25),
('台积电', 'P1', '{"科技", "经济"}', 25),
('TSMC', 'P1', '{"technology", "economic"}', 25),
('光刻机', 'P1', '{"科技"}', 25),
('lithography', 'P1', '{"technology"}', 25),
('芯片禁令', 'P1', '{"科技", "政治"}', 25),
('chip ban', 'P1', '{"technology", "political"}', 25);
```

### 5.3 P2级 - 行业重大 (15分)

**企业动态** (中文/英文)
```sql
INSERT INTO keyword_library (keyword, tier, categories, weight) VALUES
('财报', 'P2', '{"经济"}', 15),
('earnings', 'P2', '{"economic"}', 15),
('季度财报', 'P2', '{"经济"}', 15),
('quarterly earnings', 'P2', '{"economic"}', 15),
('年报', 'P2', '{"经济"}', 15),
('annual report', 'P2', '{"economic"}', 15),
('收购', 'P2', '{"经济"}', 15),
('acquisition', 'P2', '{"economic"}', 15),
('合并', 'P2', '{"经济"}', 15),
('merger', 'P2', '{"economic"}', 15),
('并购', 'P2', '{"经济"}', 15),
('M&A', 'P2', '{"economic"}', 15),
('上市', 'P2', '{"经济"}', 15),
('IPO', 'P2', '{"economic"}', 15),
('退市', 'P2', '{"经济"}', 15),
('delisting', 'P2', '{"economic"}', 15),
('破产', 'P2', '{"经济"}', 15),
('bankruptcy', 'P2', '{"economic"}', 15),
('重组', 'P2', '{"经济"}', 15),
('restructuring', 'P2', '{"economic"}', 15),
('裁员', 'P2', '{"经济", "社会"}', 15),
('layoffs', 'P2', '{"economic", "social"}', 15),
('大规模裁员', 'P2', '{"经济", "社会"}', 15),
('mass layoffs', 'P2', '{"economic", "social"}', 15);
```

**产业与产品** (中文/英文)
```sql
INSERT INTO keyword_library (keyword, tier, categories, weight) VALUES
('发布', 'P2', '{"科技"}', 15),
('launch', 'P2', '{"technology"}', 15),
('新品发布', 'P2', '{"科技"}', 15),
('new product', 'P2', '{"technology"}', 15),
('iPhone', 'P2', '{"科技"}', 15),
('突破', 'P2', '{"科技"}', 15),
('breakthrough', 'P2', '{"technology"}', 15),
('创新', 'P2', '{"科技"}', 15),
('innovation', 'P2', '{"technology"}', 15),
('临床试验', 'P2', '{"科技", "社会"}', 15),
('clinical trial', 'P2', '{"technology", "social"}', 15),
('新药', 'P2', '{"科技", "社会"}', 15),
('new drug', 'P2', '{"technology", "social"}', 15);
```

### 5.4 P3级 - 一般热点 (8分)

**日常热点** (中文/英文)
```sql
INSERT INTO keyword_library (keyword, tier, categories, weight) VALUES
('涨价', 'P3', '{"经济", "社会"}', 8),
('price increase', 'P3', '{"economic", "social"}', 8),
('降价', 'P3', '{"经济"}', 8),
('price cut', 'P3', '{"economic"}', 8),
('更新', 'P3', '{"科技"}', 8),
('update', 'P3', '{"technology"}', 8),
('升级', 'P3', '{"科技"}', 8),
('upgrade', 'P3', '{"technology"}', 8),
('合作', 'P3', '{"经济"}', 8),
('partnership', 'P3', '{"economic"}', 8),
('投资', 'P3', '{"经济"}', 8),
('investment', 'P3', '{"economic"}', 8),
('融资', 'P3', '{"经济"}', 8),
('funding', 'P3', '{"economic"}', 8),
('扩张', 'P3', '{"经济"}', 8),
('expansion', 'P3', '{"economic"}', 8);
```

---

## 6. 智能学习机制

### 5.1 学习触发条件

当用户保存人工分类时，系统自动分析：

```typescript
function learnFromClassification(
  newsItem: NewsItem,
  classification: ManualClassification
) {
  // 1. 提取标题关键词
  const keywords = extractKeywords(newsItem.title);
  
  // 2. 对比自动分类结果
  const autoResult = autoClassify(newsItem);
  
  // 3. 如果人工与自动差异大，提示学习
  if (autoResult.priority !== classification.priority) {
    suggestNewKeywords(keywords, classification);
  }
  
  // 4. 更新关键词匹配统计
  updateKeywordStats(keywords);
}
```

### 5.2 学习建议弹窗

```
┌──────────────────────────────────────────┐
│ 💡 发现新的分类模式                        │
├──────────────────────────────────────────┤
│                                          │
│  您刚刚将以下新闻分类为：政治 / P0         │
│  "突发：特朗普遇刺未遂"                    │
│                                          │
│  系统建议学习以下关键词：                  │
│  ┌──────────────────────────────────┐   │
│  │ • "刺杀" → P0级 → 政治/军事      │   │
│  │ • "特朗普" → 政治人物标签         │   │
│  │ • "遇刺" → P0级 → 政治/军事      │   │
│  └──────────────────────────────────┘   │
│                                          │
│  [ 全部添加 ] [ 选择性添加 ] [ 忽略 ]      │
│                                          │
│  ☑️ 不再询问此类建议                       │
│                                          │
└──────────────────────────────────────────┘
```

---

## 6. 实施计划

### Phase 1: 基础设施（1天）
- [ ] 更新 GitHub Actions 频率为1小时
- [ ] 创建数据库表：`keyword_library`, `manual_classifications`
- [ ] 更新 `news_items` 表：添加 `categories`, `priority` 字段

### Phase 2: 后端 API（1天）
- [ ] 创建 `/api/admin/auth` 登录验证
- [ ] 创建 `/api/admin/keywords` CRUD API
- [ ] 创建 `/api/admin/classify` 分类保存 API
- [ ] 创建 `/api/admin/test` 测试评分 API
- [ ] 更新 `fetch-rss.ts`：集成新评分算法

### Phase 3: Admin UI（1-2天）
- [ ] 创建 `/admin-login` 登录页面
- [ ] 创建 `/admin` 布局（侧边栏导航）
- [ ] 实现分类工作台组件
- [ ] 实现关键词库管理组件
- [ ] 实现实时测试组件
- [ ] 实现系统设置页面

### Phase 4: 集成测试（0.5天）
- [ ] 测试登录/权限系统
- [ ] 测试新闻采集+新评分
- [ ] 测试分类保存
- [ ] 测试关键词CRUD

---

## 7. 文件变更清单

### 新增文件
```
database/
├── migrations/
│   └── 002_add_admin_tables.sql

src/
├── app/
│   ├── admin-login/
│   │   └── page.tsx
│   └── [locale]/
│       └── admin/
│           ├── layout.tsx
│           ├── page.tsx              # 分类工作台
│           ├── keywords/
│           │   └── page.tsx
│           ├── test/
│           │   └── page.tsx
│           └── settings/
│               └── page.tsx
│
├── components/
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── ClassificationWorkbench.tsx
│       ├── KeywordLibrary.tsx
│       ├── RealTimeTester.tsx
│       ├── NewsList.tsx
│       ├── NewsDetail.tsx
│       ├── CategorySelector.tsx
│       ├── PrioritySelector.tsx
│       └── AddKeywordModal.tsx
│
├── lib/
│   ├── importance-scorer.ts          # 新评分算法
│   ├── keyword-matcher.ts            # 关键词匹配
│   └── admin-auth.ts                 # 认证工具
│
└── types/
    └── admin.ts                      # Admin相关类型

scripts/
└── fetch-rss.ts                      # 更新评分逻辑

.github/
└── workflows/
    └── fetch-news.yml                # 更新频率
```

### 修改文件
```
src/
├── types/
│   └── news.ts                       # 添加 categories, priority
│
├── components/
│   └── Filters.tsx                   # 添加分类筛选
│
└── app/
    └── [locale]/
        └── page.tsx                  # 添加分类显示
```

---

## 8. 验收标准

### 功能验收
- [ ] GitHub Actions 每小时执行一次
- [ ] 新闻采集正常，新评分算法运行无误
- [ ] Admin 面板可正常登录和访问
- [ ] 分类工作台可浏览新闻并保存分类
- [ ] 关键词库可增删改查（含同义词编辑）
- [ ] 实时测试功能正常工作
- [ ] DeepSeek LLM 集成正常（~50%新闻使用）
- [ ] 混合分类系统工作正常（关键词命中→直接返回；未命中→LLM判断）

### 性能验收
- [ ] Admin 页面加载 < 2秒
- [ ] 关键词匹配 < 10ms/条新闻
- [ ] DeepSeek LLM 调用 < 2秒/条（约50%新闻）
- [ ] 整体分类 < 100ms/条新闻
- [ ] 月度成本 < $1.00（DeepSeek，几美元可接受）

### 安全验收
- [ ] 未登录无法访问 Admin 页面
- [ ] Session 过期后自动跳转登录
- [ ] API 端点都有权限验证
- [ ] 密码和 API Key 不在前端暴露
- [ ] DeepSeek API 调用在服务端执行

### 成本验收
- [ ] 月度 LLM 成本 < $1.00（50%缓存命中率，50% LLM使用）
- [ ] DeepSeek 自动缓存生效
- [ ] 成本在可接受范围内（几美元/月完全可接受）

---

## 9. 实施检查清单

### 第一阶段：基础设施（预估0.5天）
- [ ] 1.1 添加 DeepSeek API Key 到环境变量
- [ ] 1.2 安装 DeepSeek 依赖（openai SDK）
- [ ] 1.3 创建 DeepSeek 服务封装（deepseek-service.ts）
- [ ] 1.4 测试 DeepSeek API 连通性

### 第二阶段：关键词升级（预估0.5天）
- [ ] 2.1 升级关键词匹配器（keyword-matcher.ts）
- [ ] 2.2 为所有 P0/P1 关键词添加同义词（5-10个/词）
- [ ] 2.3 实现模糊匹配算法（60%词匹配）
- [ ] 2.4 更新数据库 schema（添加同义词表）
- [ ] 2.5 Admin 面板添加同义词编辑功能

### 第三阶段：智能分类器（预估1天）
- [ ] 3.1 创建智能分类主入口（smart-classifier.ts）
- [ ] 3.2 实现混合决策逻辑（关键词命中→直接返回；未命中→LLM判断）
- [ ] 3.3 集成到新闻采集脚本（fetch-rss.ts）
- [ ] 3.4 添加分类来源和理由字段记录

### 第四阶段：测试与优化（预估0.5天）
- [ ] 4.1 测试关键词匹配准确率
- [ ] 4.2 测试 DeepSeek LLM 分类效果
- [ ] 4.3 验证混合系统工作流程
- [ ] 4.4 监控首月 LLM 成本（预期 < $1/月）
- [ ] 4.5 性能调优（如需要）

---

## 10. 成本监控

### 月度预算（用户确认）

| 项目 | 预算 |
|------|------|
| DeepSeek API | < **$1.00/月**（几美元可接受） |
| GitHub Actions | 约 360分钟/月（1小时频率） |
| Supabase | 免费层足够 |
| Vercel | 免费层足够 |

### 成本预警（已放宽）

由于用户确认成本可接受（几美元/月），预警阈值调整：

- ~~月度 DeepSeek 成本 > $0.10~~ → **删除此限制**
- ~~月度 DeepSeek 成本 > $0.25~~ → **删除此限制**
- **新规则**：月度成本 < $1.00 视为正常，无需干预

---

## 11. 风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| DeepSeek API 涨价 | 低 | 中 | 保留切换到开源模型能力 |
| LLM 分类不稳定 | 中 | 低 | 提高关键词匹配阈值作为兜底 |
| 缓存命中率低 | 中 | 低 | 优化 prompt 结构，增加重复模式 |
| API 调用超时 | 低 | 中 | 实现超时重试和回退机制 |

---

**文档版本**: v2.0  
**更新日期**: 2026-02-07  
**状态**: 待实施（混合分类系统 + DeepSeek LLM）  
**审批状态**: ⏳ 待用户审阅
