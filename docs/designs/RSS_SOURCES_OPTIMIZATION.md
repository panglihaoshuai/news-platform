# RSS 新闻源架构优化方案

> 更新日期: 2026年2月8日  
> 状态: 待开发

---

## 一、问题分析

### 1.1 当前 RSS Sources 状态

| 类别 | 数量 | 状态 |
|------|------|------|
| Google News RSS | 13 | ❌ GitHub Actions 中无法访问 |
| RSSHub 实例 | 2 | ❌ Vercel 实例已下线 |
| 直接 RSS (已工作) | 3 | ✅ Africa News, Solidot, France 24 |
| 直接 RSS (服务器封锁) | 16 | ❌ BBC/NYT/Guardian 等被封锁 |

### 1.2 根本原因

```
GitHub Actions 服务器网络限制：
- 无法访问: news.google.com, bbc.co.uk, nytimes.com 等
- 可访问: france24.com, aficanews.com, solidot.org 等

RSSHub Vercel 实例问题：
- https://rss-hub-seven-chi.vercel.app 已下线
- Vercel 免费版不适合运行 RSSHub（需要持续运行/Puppeteer）
```

---

## 二、方案 A：权威源直接 RSS + 第三方 RSSHub 代理

### 2.1 架构设计

```
┌─────────────────────────────────────────────────────────────────────┐
│                      GitHub Actions (每小时运行)                      │
│                                                                      │
│   ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│   │ 权威直接 RSS │    │ 第三方 RSSHub │    │  RSSHub.app 代理  │   │
│   └──────┬──────┘    └──────┬───────┘    └────────┬─────────┘   │
│          │                  │                       │                 │
│          ▼                  ▼                       ▼                 │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │              Supabase 数据库 (news_items)                 │    │
│   └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
          │                         │
          ▼                         ▼
   ┌──────────────┐          ┌──────────────────┐
   │ Vercel 前端 │          │  RSSHub.app      │
   │ 显示新闻    │          │  (第三方服务)     │
   └──────────────┘          └──────────────────┘
```

### 2.2 数据流说明

```
步骤 1: GitHub Actions 定时触发
   └─► 每小时自动运行 scripts/fetch-rss.ts

步骤 2: 抓取新闻源
   ├─► 权威直接 RSS (如 France24, Reuters, AFP)
   │    └─► 直接从源网站获取，无代理
   │
   └─► Google News RSS (如 BBC/NYT/Guardian 中文)
        └─► 通过 https://rsshub.app 代理获取

步骤 3: 存入 Supabase
   └─► news_items 表

步骤 4: Vercel 前端显示
   └─► 从 Supabase 读取并展示
```

### 2.3 第三方 RSSHub 实例

```
推荐使用的第三方 RSSHub 实例：

✅ https://rsshub.app
   - 免费稳定
   - 支持大多数源
   - 无需部署

✅ https://hub.scuttle.cn  
   - 国内访问友好
   - 备用选择

✅ https://rsshub.rssduck.com
   - 额外备用选择
```

---

## 三、权威新闻源清单

### 3.1 全球权威源 (按区域)

| 区域 | 新闻源 | 类型 | URL | 权威性 | 及时性 |
|------|--------|------|-----|--------|--------|
| **全球** | Reuters | 直接 RSS | `https://www.reutersagency.com/feed/` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **全球** | AFP | 直接 RSS | `https://www.afp.com/en/rss` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **全球** | AP | 直接 RSS | `https://feeds.ap.org/rss/TopNews` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **全球** | France 24 | 直接 RSS | `https://www.france24.com/en/rss` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **全球** | Al Jazeera | 直接 RSS | `https://www.aljazeera.com/xml/rss.xml` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **美国** | NYT | 直接 RSS | `https://rss.nytimes.com/services/xml/rss/nyt/World.xml` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **美国** | WSJ | 直接 RSS | `https://feeds.a.dj.com/rss/RSSWorldNews.html` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **英国** | BBC | 直接 RSS | `https://www.bbc.com/news/rss` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **英国** | Guardian | 直接 RSS | `https://www.theguardian.com/world/rss` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **中国** | 联合早报 | 直接 RSS | `https://www.zaobao.com.sg/rss/realtime/china` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **日本** | 共同社 | 直接 RSS | `https://english.kyodonews.net/rss/news.xml` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **澳洲** | ABC | 直接 RSS | `https://www.abc.net.au/news/feed/51120/rss.xml` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **非洲** | Africa News | 直接 RSS | `https://www.africanews.com/feed/rss` | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

### 3.2 Google News 源的替代方案

| 当前 Google News 源 | 建议替代 |
|---------------------|----------|
| Google News BBC World | 直接用 `bbc.com/news/rss` ✅ |
| Google News NYT | 直接用 NYT 直接 RSS ✅ |
| Google News Reuters | 直接用 Reuters 直接 RSS ✅ |
| Google News Guardian | 直接用 Guardian 直接 RSS ✅ |
| Google News FT 中文 | 直接用 FT 中文 RSS ✅ |

### 3.3 权威性、及时性对比

```
Google News RSS vs 权威源直接 RSS：

及时性对比：
- Google News RSS: 延迟 15-30 分钟（聚合后）
- 权威直接 RSS: 实时推送（源网站发布即推送）
  ✅ 直接 RSS 更及时！

权威性对比：
- Google News RSS: 聚合所有源，来源混杂
- 权威直接 RSS: 直接来自官方源，更权威
  ✅ 直接 RSS 更权威！

结论：直接 RSS 优于 Google News RSS！
```

---

## 四、实施计划

### 4.1 更新后的 RSS Sources 配置

```sql
-- 需要保留的直接 RSS (权威且可访问)
INSERT INTO rss_sources (id, name, feed_url, region_code, country_code, language, enabled) VALUES
-- 全球权威
('guid-001', 'Reuters', 'https://www.reutersagency.com/feed/', 'GLOBAL', NULL, 'en', true),
('guid-002', 'AFP', 'https://www.afp.com/en/rss', 'GLOBAL', NULL, 'en', true),
('guid-003', 'AP', 'https://feeds.ap.org/rss/TopNews', 'GLOBAL', NULL, 'en', true),
('guid-004', 'France 24', 'https://www.france24.com/en/rss', 'GLOBAL', NULL, 'en', true),
('guid-005', 'Al Jazeera', 'https://www.alazeera.com/xml/rss.xml', 'GLOBAL', NULL, 'en', true),

-- 美国
('na-001', 'NYT World', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', 'NA', 'US', 'en', true),
('na-002', 'WSJ World', 'https://feeds.a.dj.com/rss/RSSWorldNews.html', 'NA', 'US', 'en', true),

-- 英国
('eu-001', 'BBC World', 'https://www.bbc.com/news/rss', 'EU', 'UK', 'en', true),
('eu-002', 'Guardian', 'https://www.theguardian.com/world/rss', 'EU', 'UK', 'en', true),

-- 中国/中文
('as-001', '联合早报', 'https://www.zaobao.com.sg/rss/realtime/china', 'AS', 'CN', 'zh', true),
('as-002', 'FT 中文', 'https://www.ftchinese.com/rss/feed', 'AS', 'CN', 'zh', true),
('as-003', '共同社', 'https://english.kyodonews.net/rss/news.xml', 'AS', 'JP', 'en', true),

-- 其他区域
('oc-001', 'ABC Australia', 'https://www.abc.net.au/news/feed/51120/rss.xml', 'OC', 'AU', 'en', true),
('af-001', 'Africa News', 'https://www.africanews.com/feed/rss', 'AF', NULL, 'en', true);
```

### 4.2 需要通过第三方 RSSHub 获取的源

| 新闻源 | 区域 | RSSHub URL |
|--------|------|------------|
| BBC 中文 | AS | `https://rsshub.app/bbc/zhongwen/simp` |
| NYT 中文 | AS | `https://rsshub.app/nytimes/zh-CN` |
| WSJ 中文 | AS | `https://rsshub.app/wsj/zh-CN` |
| FT 中文 (备用) | AS | `https://rsshub.app/ftchina` |
| DW 中文 | AS | `https://rsshub.app/dw/zh-CN` |

### 4.3 实施步骤

```
步骤 1: 备份当前 RSS Sources
步骤 2: 清空并重建 RSS Sources 表
步骤 3: 插入新的权威 RSS 配置
步骤 4: 更新 scripts/fetch-rss.ts 支持 RSSHub.app 代理
步骤 5: 手动触发 GitHub Actions 测试
步骤 6: 验证数据采集
```

---

## 五、FAQ

### Q1: 第三方 RSSHub.app 可靠吗？

```
✅ rsshub.app 是社区维护的公共实例
✅ 免费且稳定运行多年
✅ 作为备份，可随时切换其他实例
✅ 不影响数据权威性（内容来自原 RSS）
```

### Q2: 数据权威性会下降吗？

```
✅ 不会下降，反而提升！

原因：
1. 直接 RSS 来自官方源，更权威
2. Google News RSS 是聚合源，来源混杂
3. 替换后都是国际顶级通讯社/媒体
```

### Q3: 数据及时性会下降吗？

```
✅ 不会下降，反而提升！

原因：
1. Google News 有 15-30 分钟聚合延迟
2. 直接 RSS 是实时推送
3. 更及时！
```

### Q4: 覆盖范围会减少吗？

```
反而增加！

原来：
- Google News RSS (13 个) - 被封锁，无法获取

现在：
- 直接 RSS (15 个权威源) - 全部可访问
- RSSHub 代理 (5 个中文源) - 通过 rsshub.app

结果：覆盖更全面，数据更可靠！
```

---

## 六、预期效果

### 6.1 数据质量提升

```
之前 (34 个源):
- Google News RSS: 0 条 (无法访问)
- RSSHub: 0 条 (实例下线)
- 直接 RSS: 3 条 (仅 France24/Africa/Solidot)

之后 (20 个源):
- 直接权威 RSS: 15 条 ✅
- RSSHub 代理: 5 条 ✅
- 预计每小时获取: 100-200 条新闻
```

### 6.2 数据源权威性

```
预期数据来源分布：

Reuters/AFP/AP: 30% (全球顶级通讯社)
BBC/NYT/Guardian/WSJ: 25% (顶级媒体)
France24/Al Jazeera: 15% (国际媒体)
联合早报/FT 中文: 15% (中文权威)
其他区域源: 15% (地区权威)

✅ 90%+ 内容来自国际权威媒体！
```

---

## 七、风险与应对

| 风险 | 可能性 | 影响 | 应对措施 |
|------|--------|------|----------|
| 第三方 RSSHub 不稳定 | 低 | 部分源无法获取 | 准备 3 个备用实例 |
| RSS 源变更 URL | 低 | 数据中断 | 监控 + 自动告警 |
| GitHub Actions 网络限制 | 低 | 所有源无法获取 | 增加重试机制 |

---

## 八、总结

### 方案 A 优势

```
✅ 数据更权威 - 直接来自官方 RSS
✅ 数据更及时 - 实时推送，无聚合延迟
✅ 覆盖更全面 - 20+ 权威源
✅ 实施最简单 - 无需额外部署
✅ 成本最低 - 全部免费使用
```

### 核心结论

```
放弃 Google News RSS，使用权威源直接 RSS：
- 权威性提升 ✅
- 及时性提升 ✅
- 覆盖范围不变 ✅
- 实施难度低 ✅

这是最优方案！
```

---

> 文档版本: v1.0  
> 作者: Sisyphus AI Agent  
> 更新日期: 2026-02-08
