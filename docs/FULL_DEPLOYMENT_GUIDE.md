# Global Intel Map - 完整部署方案

> **最后更新**: 2026-02-09  
> **架构版本**: v2.0 (三层混合架构 + GDELT)

---

## 📋 目录

1. [方案概述](#1-方案概述)
2. [架构设计](#2-架构设计)
3. [部署步骤](#3-部署步骤)
4. [验证测试](#4-验证测试)
5. [监控维护](#5-监控维护)
6. [故障排查](#6-故障排查)

---

## 1. 方案概述

### 1.1 解决的问题

| 问题 | 原方案 | 新方案 |
|------|--------|--------|
| **NewsData延迟** | ~12小时 | GDELT ~15分钟 |
| **IP封锁** | 需要API Key | GDELT完全免费 |
| **权威来源覆盖** | ~8个 | ~34个 (+325%) |
| **月度成本** | $0 | **$0** |

### 1.2 三层混合架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    Global Intel Map                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Layer 1: Direct RSS (优先级最高 - 实时)                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  | TechCrunch, Wired, The Verge, MIT Tech Review...        |   │
│  | ~12个源 | 实时 | 免费 | 无需API Key                    |   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 2: NewsData.io API (备选 - 被封锁源)                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  | BBC, Reuters, AFP (免费版限制访问)                      |   │
│  | ~8个源 | ~12小时延迟 | 免费200次/天 | 需要API Key      |   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Layer 3: GDELT API (新增 - 免费且低延迟) ⭐                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  | BBC, Reuters, AFP, AP News, CNN, NYT, Guardian...     |   │
│  | ~14个权威源 | ~15分钟延迟 | **完全免费** | 无需API Key  |   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  | 🏆 总计: ~34个权威媒体源 | 最佳覆盖率 | 0成本          |   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 架构设计

### 2.1 数据流

```
                    ┌──────────────────────────────────────┐
                    │   GitHub Actions (每小时)            │
                    │   schedule.yml                       │
                    └──────────────────┬───────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    src/scripts/fetch-hybrid.ts                   │
│                                                                 │
│  Phase 1: Direct RSS (real-time)                                │
│  └── scripts/fetch-rss.ts → 12个RSS源                            │
│                                                                 │
│  Phase 2: NewsData.io API (~12h delay)                           │
│  └── src/scripts/fetch-newsdata.ts → 8个源                       │
│                                                                 │
│  Phase 3: GDELT API (~15min delay) ⭐                            │
│  └── scripts/fetch-gdelt.ts → 14个权威媒体                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │   Supabase Database                  │
                    │   news_items table                   │
                    └──────────────────┬───────────────────┘
                                       │
                    ┌──────────────────┴───────────────────┐
                    ▼                                      ▼
        ┌────────────────────┐             ┌────────────────────┐
        │   Vercel Frontend  │             │   API Endpoints     │
        │   Next.js 16        │             │   /api/news         │
        └────────────────────┘             └────────────────────┘
```

### 2.2 文件结构

```
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # CI: Lint, Type Check, Build
│   │   └── schedule.yml         # ⭐ Scheduled Fetch (每小时)
│   └── dependencies/
│
├── src/
│   ├── config/
│   │   ├── gdelt-sources.ts   # ⭐ GDELT配置 (14个权威媒体)
│   │   └── news-sources.ts     # RSS + NewsData配置
│   │
│   ├── lib/
│   │   ├── gdelt-transformer.ts # ⭐ GDELT数据转换
│   │   ├── data-transformer.ts   # 统一数据转换
│   │   ├── data-cleaner.ts      # 数据清洗
│   │   └── importance-scorer.ts # 评分算法
│   │
│   ├── scripts/
│   │   ├── fetch-hybrid.ts     # ⭐ 三层架构主入口
│   │   ├── fetch-newsdata.ts    # Layer 2
│   │   └── fetch-rss.ts         # Layer 1
│   │
│   └── types/
│       └── unified-news.ts      # 统一类型定义
│
├── scripts/
│   └── fetch-gdelt.ts           # ⭐ GDELT独立脚本
│
├── vercel.json                 # Vercel配置
├── package.json                # npm脚本
└── docs/
    └── DEPLOYMENT.md           # 部署文档
```

---

## 3. 部署步骤

### 3.1 前置要求

```bash
# 检查环境
node --version  # 需要 >= 18
npm --version
git --version
```

### 3.2 步骤1: 准备GitHub仓库

```bash
# 创建仓库 (如果没有)
# 访问: https://github.com/new

# 推送代码
git init
git add .
git commit -m "feat: Add GDELT three-layer hybrid architecture"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### 3.3 步骤2: 配置Supabase

1. 访问 https://app.supabase.com
2. 创建新项目 `global-news-viz`
3. 等待数据库创建完成

#### 3.3.1 执行数据库Schema

在 Supabase Dashboard > SQL Editor 执行:

```sql
-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建news_items表
CREATE TABLE IF NOT EXISTS news_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_language TEXT,
  title TEXT NOT NULL,
  summary TEXT,
  original_url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  geo_lat DOUBLE PRECISION,
  geo_lng DOUBLE PRECISION,
  region_code TEXT,
  country_code TEXT,
  importance_score INTEGER DEFAULT 0,
  categories TEXT[],
  priority TEXT DEFAULT 'P3',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  source_type TEXT DEFAULT 'rss',
  source_tier TEXT,
  fetched_at TIMESTAMPTZ,
  importance_factors JSONB,
  external_id TEXT UNIQUE
);

-- 创建索引
CREATE INDEX idx_news_items_published ON news_items(published_at DESC);
CREATE INDEX idx_news_items_source ON news_items(source_id);
CREATE INDEX idx_news_items_region ON news_items(region_code);
CREATE INDEX idx_news_items_priority ON news_items(priority);

-- 创建rss_sources表
CREATE TABLE IF NOT EXISTS rss_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'rss',
  tier TEXT,
  language TEXT,
  region_code TEXT,
  feed_url TEXT,
  config JSONB,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  last_fetched_at TIMESTAMPTZ,
  fetch_count INTEGER DEFAULT 0,
  success_rate DOUBLE PRECISION DEFAULT 1
);

-- 创建fetch_metrics表
CREATE TABLE IF NOT EXISTS fetch_metrics (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  total_fetched INTEGER DEFAULT 0,
  total_inserted INTEGER DEFAULT 0,
  total_duplicates INTEGER DEFAULT 0,
  failed_sources TEXT[],
  api_usage JSONB,
  processing_time INTEGER DEFAULT 0,
  status TEXT,
  error_message TEXT
);
```

### 3.4 步骤3: 配置Vercel

1. 访问 https://vercel.com/new
2. 导入GitHub仓库
3. 配置环境变量:

| 变量 | 值 | 必需 |
|------|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | `xxx` | ✅ |
| `NEWS_DATA_API_KEY` | `xxx` | ⚠️ 可选 |
| `DEEPSEEK_API_KEY` | `xxx` | ⚠️ 可选 |

4. 点击 **Deploy**

### 3.5 步骤4: 配置GitHub Secrets

访问 GitHub > Settings > Secrets and variables > Actions:

| Secret | 值 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key |
| `NEWS_DATA_API_KEY` | NewsData API Key (可选) |
| `DEEPSEEK_API_KEY` | DeepSeek API Key (可选) |

### 3.6 步骤5: 验证部署

```bash
# 1. 检查GitHub Actions
# 访问: https://github.com/USERNAME/REPO/actions
# 应该看到:
# - ci.yml: 通过 (lint, type check, build)
# - schedule.yml: 每1小时运行一次

# 2. 手动触发采集
gh workflow run schedule.yml -f

# 3. 检查数据库
# 在Supabase Table Editor中查看news_items表
# 应该看到新采集的新闻数据

# 4. 访问前端
# 访问: https://YOUR-APP.vercel.app
# 应该看到新闻可视化界面
```

---

## 4. 验证测试

### 4.1 本地测试

```bash
# 安装依赖
npm ci

# 测试TypeScript
npx tsc --noEmit

# 测试GDELT Layer 3
npm run fetch:gdelt
# 预期输出:
# 🚀 === GDELT FETCH STARTED ===
# ✅ Retrieved 50 articles from GDELT
# 📊 === FETCH SUMMARY ===

# 测试完整三层架构
npm run fetch:hybrid
# 预期输出:
# 🚀 === HYBRID NEWS FETCH STARTED ===
# 📊 Sources:
#    Direct RSS: 12
#    NewsData.io: 8
#    GDELT: 14
# Total: 34 sources
# 📊 === FETCH SUMMARY ===
```

### 4.2 预期结果

| 指标 | 目标值 | 验证方法 |
|------|--------|---------|
| TypeScript编译 | 无错误 | `npx tsc --noEmit` |
| GDELT API响应 | >10条 | `npm run fetch:gdelt` |
| 数据库插入 | >50条/次 | Supabase Table Editor |
| 前端加载 | 正常渲染 | 浏览器访问 |

---

## 5. 监控维护

### 5.1 成本监控

| 服务 | 免费额度 | 预计使用 | 使用率 |
|------|---------|---------|--------|
| GitHub Actions | 2000分钟/月 | ~600分钟/月 | 30% |
| Supabase | 500MB | ~120MB/月 | 24% |
| Vercel | 100GB/月 | ~15GB/月 | 15% |
| **GDELT** | **无限** | **~50条/小时** | **0%** |

### 5.2 定时任务

```yaml
# .github/workflows/schedule.yml
on:
  schedule:
    - cron: '0 * * * *'  # 每小时运行
  workflow_dispatch:  # 手动触发
```

**频率**: 每1小时 = 每天24次 = 每月约720次

### 5.3 性能指标

| 指标 | 目标值 | 告警阈值 |
|------|--------|---------|
| 采集耗时 | <60秒 | >120秒 |
| 插入数量 | >100条/次 | <50条/次 |
| 错误率 | <10% | >20% |

---

## 6. 故障排查

### 6.1 GitHub Actions失败

```bash
# 1. 查看日志
# 访问: https://github.com/USERNAME/REPO/actions

# 2. 常见错误:
# - "Missing environment variable": 检查Secrets配置
# - "Database connection failed": 检查Supabase URL和Key
# - "Timeout": 网络问题，重试即可
```

### 6.2 数据库无数据

```sql
-- 检查表是否存在
SELECT COUNT(*) FROM news_items;

-- 检查最近数据
SELECT * FROM news_items ORDER BY created_at DESC LIMIT 10;

-- 检查采集记录
SELECT * FROM fetch_metrics ORDER BY timestamp DESC LIMIT 5;
```

### 6.3 前端无法加载

```bash
# 1. 检查浏览器控制台错误
# 2. 检查API响应
curl https://YOUR-APP.vercel.app/api/news

# 3. 检查Supabase连接
# 在浏览器Network面板查看API请求
```

---

## 📞 技术支持

- **Issues**: https://github.com/USERNAME/REPO/issues
- **文档**: `docs/DEPLOYMENT.md`
- **架构说明**: `docs/designs/HYBRID_NEWS_SOURCES_DESIGN.md`

---

**Happy Deploying! 🚀**
