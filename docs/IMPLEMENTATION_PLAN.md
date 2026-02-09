# GDELT三层架构简化实施方案

**方案版本**: v1.0  
**制定日期**: 2026-02-09  
**审批状态**: 待审批  
**实施周期**: 1周  

---

## 1. 方案概述

### 1.1 目标
将现有复杂的三层混合架构简化为**"GDELT主力 + RSS精简补充"**架构，提升数据量、稳定性和可维护性。

### 1.2 核心变更

| 变更项 | 当前状态 | 目标状态 | 影响 |
|--------|----------|----------|------|
| **GDELT源** | 14个 | 24个（+10个Tier 1） | 数据量+56% |
| **RSS源** | ~12个 | 3个核心 | 简化维护 |
| **NewsData.io** | 8个源 | 取消 | 去除12小时延迟 |
| **架构复杂度** | 3层 | 2层 | 更易维护 |

### 1.3 预期成果

- **数据量**: 888条/天 → **1,400条/天**（+57%）
- **时效性**: 平均延迟从12小时降至**15分钟**
- **稳定性**: 单一GDELT API依赖，减少故障点
- **覆盖范围**: 全球权威媒体 + 科技实时快讯

---

## 2. 详细实施计划

### Phase 1: 架构调整（Day 1-2）

#### 2.1.1 修改配置文件

**文件**: `src/config/news-sources.ts`

**操作**: 删除或禁用所有NewsData.io源配置

**原因**: 
- NewsData.io免费版有12小时延迟
- GDELT已覆盖相同权威媒体（BBC、Reuters等）
- GDELT完全免费，无API限制

#### 2.1.2 精简RSS源

**文件**: `src/config/news-sources.ts`

**保留源**（3个）:
```typescript
// 保留的科技媒体RSS源
export const RSS_SOURCES = [
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    feed_url: 'https://techcrunch.com/feed/',
    type: 'rss',
    enabled: true,
  },
  {
    id: 'wired',
    name: 'Wired',
    feed_url: 'https://www.wired.com/feed/rss',
    type: 'rss', 
    enabled: true,
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    feed_url: 'https://www.theverge.com/rss/index.xml',
    type: 'rss',
    enabled: true,
  },
];
```

**删除源**: 其他~9个RSS源（France 24、Africa News等，已在GDELT覆盖）

#### 2.1.3 更新架构文档

**文件**: `docs/designs/HYBRID_NEWS_SOURCES_DESIGN.md`

**更新内容**:
- 删除NewsData.io相关章节
- 更新架构图为2层
- 更新数据流说明

---

### Phase 2: GDELT扩展（Day 3-4）

#### 2.2.1 添加Tier 1权威媒体

**文件**: `src/config/gdelt-sources.ts`

**新增源**（10个）:

```typescript
// Tier 1扩展 - 全球顶级权威媒体
{
  id: 'gdelt-wsj',
  name: 'Wall Street Journal',
  type: 'gdelt',
  enabled: true,
  priority: 15,
  tier: 'tier1',
  language: 'en',
  region: 'GLOBAL',
  config: { domain: 'wsj.com' },
},
{
  id: 'gdelt-ft',
  name: 'Financial Times',
  type: 'gdelt',
  enabled: true,
  priority: 16,
  tier: 'tier1',
  language: 'en',
  region: 'GLOBAL',
  config: { domain: 'ft.com' },
},
{
  id: 'gdelt-economist',
  name: 'The Economist',
  type: 'gdelt',
  enabled: true,
  priority: 17,
  tier: 'tier1',
  language: 'en',
  region: 'GLOBAL',
  config: { domain: 'economist.com' },
},
{
  id: 'gdelt-time',
  name: 'Time Magazine',
  type: 'gdelt',
  enabled: true,
  priority: 18,
  tier: 'tier1',
  language: 'en',
  region: 'GLOBAL',
  config: { domain: 'time.com' },
},
{
  id: 'gdelt-usatoday',
  name: 'USA Today',
  type: 'gdelt',
  enabled: true,
  priority: 19,
  tier: 'tier1',
  language: 'en',
  region: 'US',
  config: { domain: 'usatoday.com' },
},
{
  id: 'gdelt-cbs',
  name: 'CBS News',
  type: 'gdelt',
  enabled: true,
  priority: 20,
  tier: 'tier1',
  language: 'en',
  region: 'US',
  config: { domain: 'cbsnews.com' },
},
{
  id: 'gdelt-nbc',
  name: 'NBC News',
  type: 'gdelt',
  enabled: true,
  priority: 21,
  tier: 'tier1',
  language: 'en',
  region: 'US',
  config: { domain: 'nbcnews.com' },
},
{
  id: 'gdelt-abc',
  name: 'ABC News',
  type: 'gdelt',
  enabled: true,
  priority: 22,
  tier: 'tier1',
  language: 'en',
  region: 'US',
  config: { domain: 'abcnews.go.com' },
},
{
  id: 'gdelt-fox',
  name: 'Fox News',
  type: 'gdelt',
  enabled: true,
  priority: 23,
  tier: 'tier1',
  language: 'en',
  region: 'US',
  config: { domain: 'foxnews.com' },
},
{
  id: 'gdelt-espn',
  name: 'ESPN',
  type: 'gdelt',
  enabled: true,
  priority: 24,
  tier: 'tier1',
  language: 'en',
  region: 'GLOBAL',
  config: { domain: 'espn.com' },
},
```

#### 2.2.2 调整GDELT查询配置

**文件**: `src/scripts/fetch-hybrid.ts`

**修改**:
- 源数量限制: `slice(0, 10)` → 移除限制（查询所有24个源）
- 去重窗口: 48小时 → 6小时（平衡新鲜度和数据量）

---

### Phase 3: 代码清理（Day 5）

#### 2.3.1 删除NewsData.io相关代码

**删除文件**:
- `src/scripts/fetch-newsdata.ts`
- （可选）NewsData transformer相关代码

**修改文件**: `src/scripts/fetch-hybrid.ts`
- 删除NewsData API调用逻辑
- 删除Phase 2（NewsData层）
- 保留Phase 1（RSS精简）和Phase 3（GDELT扩展）

#### 2.3.2 更新类型定义

**文件**: `src/types/unified-news.ts`

**操作**: 移除或标记NewsData相关类型（如不再需要）

---

### Phase 4: 测试验证（Day 6-7）

#### 2.4.1 本地测试

```bash
# 1. 编译检查
npm run build

# 2. 类型检查
npx tsc --noEmit

# 3. 本地运行测试
npm run fetch:hybrid
```

#### 2.4.2 GitHub Actions测试

**操作**:
1. 推送代码到main分支
2. 手动触发`schedule.yml` workflow
3. 监控运行日志，确认：
   - GDELT查询24个源
   - RSS只查询3个源
   - 无NewsData相关日志

#### 2.4.3 数据验证

**SQL验证**:
```sql
-- 验证源分布
SELECT 
    source_type,
    COUNT(*) as count,
    COUNT(DISTINCT source_name) as unique_sources
FROM news_items 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY source_type;

-- 预期结果:
-- source_type | count | unique_sources
-- gdelt       | ~100  | ~24
-- rss         | ~10   | 3
```

---

## 3. 风险与对策

| 风险 | 可能性 | 影响 | 对策 |
|------|--------|------|------|
| **GDELT API限制** | 低 | 高 | 已实施逐个源查询，避免复杂OR查询 |
| **数据量过大** | 中 | 中 | 监控Supabase存储，必要时缩短保留期 |
| **RSS源失效** | 中 | 低 | 3个RSS源相互备份，失效可快速移除 |
| **多语言过滤过度** | 中 | 中 | 监控语言分布，必要时放宽过滤 |
| **GitHub Actions额度** | 低 | 高 | 当前每小时1次，月耗~720分钟<2000限制 |

---

## 4. 回滚计划

如果实施失败，可快速回滚：

1. **Git回滚**: `git revert HEAD` 回到实施前状态
2. **数据库**: 无需操作，新数据自动覆盖
3. **NewsData.io**: 保留API Key，可随时重新启用

---

## 5. 成功标准

### 5.1 技术指标

- [ ] GitHub Actions workflow成功运行
- [ ] 每小时数据量: ~60条（GDELT）+ ~10条（RSS）
- [ ] 无NewsData.io相关错误日志
- [ ] Supabase数据正常写入

### 5.2 业务指标

- [ ] 每日总数据量: ~1,400条
- [ ] GDELT源覆盖: 24个
- [ ] RSS源覆盖: 3个
- [ ] 平均延迟: <20分钟

---

## 6. 审批记录

| 角色 | 姓名 | 审批意见 | 日期 |
|------|------|----------|------|
| 方案提出 | AI Assistant | 建议实施 | 2026-02-09 |
| 业务审批 | ____________ | ____________ | ________ |
| 技术审批 | ____________ | ____________ | ________ |

**审批意见**:
- [ ] 同意实施
- [ ] 需要修改（请说明）
- [ ] 不同意（请说明原因）

---

## 7. 附录

### 7.1 新增GDELT源详细信息

| 域名 | 媒体类型 | 预计条数/天 | 特点 |
|------|----------|------------|------|
| wsj.com | 金融 | ~30 | 全球金融权威 |
| ft.com | 金融 | ~25 | 英国商业视角 |
| economist.com | 分析 | ~20 | 深度评论 |
| time.com | 综合 | ~25 | 全球影响力 |
| usatoday.com | 综合 | ~30 | 美国大众 |
| cbsnews.com | 电视 | ~20 | 主流电视网 |
| nbcnews.com | 电视 | ~20 | 主流电视网 |
| abcnews.go.com | 电视 | ~20 | 主流电视网 |
| foxnews.com | 电视 | ~25 | 保守派视角 |
| espn.com | 体育 | ~15 | 全球体育 |

**合计**: +230条/天

### 7.2 相关文档

- 架构设计: `docs/designs/GDELT_ARCHITECTURE_v2.md`
- 扩展源列表: `docs/GDELT_SOURCE_EXTENSIONS.md`
- 部署指南: `docs/FULL_DEPLOYMENT_GUIDE.md`

---

**方案制定**: AI Assistant  
**最后更新**: 2026-02-09  
**版本**: v1.0
