# GDELT 三层混合架构设计文档 v2.0

**版本**: v2.0  
**日期**: 2026-02-09  
**状态**: 生产环境运行中  
**架构**: Layer 1 (RSS) + Layer 2 (NewsData) + Layer 3 (GDELT)

---

## 1. 执行摘要

本文档描述 Global Intel Map 项目的新闻数据三层混合架构。该方案结合：

- **Layer 1**: Direct RSS（实时，免费，无需API Key）
- **Layer 2**: NewsData.io API（权威媒体，~12小时延迟）
- **Layer 3**: GDELT API（**主力**，50,000+源，~15分钟延迟，完全免费）

**核心优势**:
- ✅ 14个权威GDELT源已配置，可扩展至47个
- ✅ ~1,850条/天（扩展后）
- ✅ ~15分钟延迟（远优于NewsData的12小时）
- ✅ 完全零成本
- ✅ 无需担心IP封锁

---

## 2. 当前架构

### 2.1 三层数据流

```
┌─────────────────────────────────────────────────────────────┐
│              GitHub Actions (每小时自动运行)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 1: Direct RSS (Real-Time)                       │ │
│  │  • TechCrunch, Wired, The Verge 等（~12源）            │ │
│  │  • 实时获取，免费，无需API Key                          │ │
│  │  • 预计: ~50条/小时                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 2: NewsData.io API (~12h delay)                 │ │
│  │  • BBC, Reuters 等被封锁源（~8源）                      │ │
│  │  • 需要API Key，免费版200次/天                          │ │
│  │  • 预计: ~30条/小时                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Layer 3: GDELT API (~15min delay) ⭐ 主力              │ │
│  │  • BBC, Reuters, CNN, NYT 等14个权威源                  │ │
│  │  • 完全免费，50,000+源覆盖                              │ │
│  │  • 预计: ~75条/小时（当前）→ ~150条/小时（扩展后）       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    统一数据处理管道                            │
│  ┌─────────┐  ┌─────────────┐  ┌─────────┐  ┌──────────┐   │
│  │ 数据清洗 │→│ 格式标准化  │→│ 去重    │→│ 语言过滤 │   │
│  └─────────┘  └─────────────┘  └─────────┘  └──────────┘   │
│         （只保留中文、英文，过滤其他语言）                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase 数据库                            │
│              （统一存储，统一查询，3天保留期）                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 当前GDELT源配置

### 3.1 已配置的14个源

| # | 源ID | 媒体名称 | 域名 | 等级 | 语言 | 地区 |
|---|------|---------|------|------|------|------|
| 1 | gdelt-bbc | BBC World | bbc.com | Tier 1 | EN | 全球 |
| 2 | gdelt-reuters | Reuters | reuters.com | Tier 1 | EN | 全球 |
| 3 | gdelt-afp | AFP | afp.com | Tier 1 | EN | 全球 |
| 4 | gdelt-apnews | AP News | apnews.com | Tier 1 | EN | 全球 |
| 5 | gdelt-cnn | CNN | cnn.com | Tier 1 | EN | 全球 |
| 6 | gdelt-nytimes | New York Times | nytimes.com | Tier 1 | EN | 全球 |
| 7 | gdelt-guardian | The Guardian | theguardian.com | Tier 1 | EN | 全球 |
| 8 | gdelt-washingtonpost | Washington Post | washingtonpost.com | Tier 1 | EN | 美国 |
| 9 | gdelt-bloomberg | Bloomberg | bloomberg.com | Tier 1 | EN | 全球 |
| 10 | gdelt-aljazeera | Al Jazeera | aljazeera.com | Tier 1 | EN | 中东 |
| 11 | gdelt-france24 | France 24 | france24.com | Tier 2 | EN | 欧洲/非洲 |
| 12 | gdelt-dw | Deutsche Welle | dw.com | Tier 2 | EN | 欧洲 |
| 13 | gdelt-africanews | African News | africanews.com | Tier 2 | EN | 非洲 |
| 14 | gdelt-news24 | News24 | news24.com | Tier 2 | EN | 非洲 |

**当前数据产出**: ~37条/小时（经过语言过滤后）

---

## 4. 可扩展的GDELT源

### 4.1 Tier 1 - 全球顶级媒体（+10个）

| # | 媒体名称 | 域名 | 等级 | 语言 | 地区 | 预计贡献 |
|---|---------|------|------|------|------|---------|
| 15 | Wall Street Journal | wsj.com | Tier 1 | EN | 美国/全球 | ~30条/天 |
| 16 | Financial Times | ft.com | Tier 1 | EN | 英国/全球 | ~25条/天 |
| 17 | The Economist | economist.com | Tier 1 | EN | 英国/全球 | ~20条/天 |
| 18 | Time Magazine | time.com | Tier 1 | EN | 美国/全球 | ~25条/天 |
| 19 | USA Today | usatoday.com | Tier 1 | EN | 美国 | ~30条/天 |
| 20 | CBS News | cbsnews.com | Tier 1 | EN | 美国 | ~20条/天 |
| 21 | NBC News | nbcnews.com | Tier 1 | EN | 美国 | ~20条/天 |
| 22 | ABC News | abcnews.go.com | Tier 1 | EN | 美国 | ~20条/天 |
| 23 | Fox News | foxnews.com | Tier 1 | EN | 美国 | ~25条/天 |
| 24 | ESPN | espn.com | Tier 1 | EN | 美国/全球 | ~15条/天 |

**小计**: +10源，预计 +230条/天

### 4.2 Tier 2 - 区域权威媒体（+15个）

**欧洲**
| # | 媒体名称 | 域名 | 等级 | 语言 | 预计贡献 |
|---|---------|------|------|------|---------|
| 25 | Euronews | euronews.com | Tier 2 | EN | ~15条/天 |
| 26 | Der Spiegel | spiegel.de | Tier 2 | DE/EN | ~10条/天 |
| 27 | Le Monde | lemonde.fr | Tier 2 | FR/EN | ~10条/天 |
| 28 | El País | elpais.com | Tier 2 | ES/EN | ~10条/天 |
| 29 | Corriere della Sera | corriere.it | Tier 2 | IT/EN | ~8条/天 |

**亚洲**
| # | 媒体名称 | 域名 | 等级 | 语言 | 预计贡献 |
|---|---------|------|------|------|---------|
| 30 | Nikkei | nikkei.com | Tier 2 | EN | ~15条/天 |
| 31 | South China Morning Post | scmp.com | Tier 2 | EN | ~15条/天 |
| 32 | Straits Times | straitstimes.com | Tier 2 | EN | ~12条/天 |
| 33 | The Hindu | thehindu.com | Tier 2 | EN | ~10条/天 |

**中东/拉美**
| # | 媒体名称 | 域名 | 等级 | 语言 | 预计贡献 |
|---|---------|------|------|------|---------|
| 34 | Haaretz | haaretz.com | Tier 2 | EN | ~10条/天 |
| 35 | Jerusalem Post | jpost.com | Tier 2 | EN | ~8条/天 |
| 36 | Daily Mail | dailymail.co.uk | Tier 2 | EN | ~20条/天 |
| 37 | Globo | globo.com | Tier 2 | PT/EN | ~12条/天 |
| 38 | Clarín | clarin.com | Tier 2 | ES/EN | ~8条/天 |
| 39 | Asahi Shimbun | asahi.com | Tier 2 | JP/EN | ~10条/天 |

**小计**: +15源，预计 +173条/天

### 4.3 Tier 3 - 科技 & 商业专业媒体（+8个）

| # | 媒体名称 | 域名 | 等级 | 领域 | 预计贡献 |
|---|---------|------|------|------|---------|
| 40 | TechCrunch | techcrunch.com | Tier 3 | 科技 | ~20条/天 |
| 41 | Wired | wired.com | Tier 3 | 科技 | ~15条/天 |
| 42 | The Verge | theverge.com | Tier 3 | 科技 | ~15条/天 |
| 43 | Axios | axios.com | Tier 3 | 政治/商业 | ~18条/天 |
| 44 | Politico | politico.com | Tier 3 | 政治 | ~15条/天 |
| 45 | Business Insider | businessinsider.com | Tier 3 | 商业 | ~20条/天 |
| 46 | Forbes | forbes.com | Tier 3 | 商业 | ~20条/天 |
| 47 | CNET | cnet.com | Tier 3 | 科技 | ~15条/天 |

**小计**: +8源，预计 +158条/天

---

## 5. 扩展后预期数据量

| 阶段 | GDELT源数 | 每日GDELT数据 | 备注 |
|------|----------|--------------|------|
| **当前** | 14个 | ~888条 | 已稳定运行 |
| **+ Tier 1** | 24个 | ~1,388条 | **推荐立即添加** |
| **+ Tier 2** | 39个 | ~1,613条 | 全球视角增强 |
| **+ Tier 3** | 47个 | ~1,853条 | 专业领域深度 |

**全部添加后**: **47个权威源，~1,850条/天**

---

## 6. 架构决策讨论：是否取消 RSS Hub？

### 6.1 RSS Hub 现状

**当前RSS源**: TechCrunch, Wired, The Verge, Africa News, France 24, 等 ~12个

**RSS数据产出**: ~50条/小时

### 6.2 RSS vs GDELT 对比

| 维度 | RSS Hub | GDELT Layer 3 |
|------|---------|---------------|
| **数据量** | ~50条/小时 | ~75条/小时（当前）→ ~150条/小时（扩展后）|
| **时效性** | 实时 | ~15分钟延迟 |
| **权威性** | Tier 2-3（科技媒体为主） | Tier 1（BBC/Reuters等） |
| **稳定性** | 依赖RSSHub.app服务 | GDELT官方API，更稳定 |
| **覆盖范围** | 科技/商业为主 | 全球/政治/金融/体育全覆盖 |
| **运维成本** | $0 | $0 |
| **语言** | 英文为主 | 多语言（我们过滤为中英文） |

### 6.3 建议方案

**方案A**: 保留RSS作为补充（推荐）
- RSS源提供**实时**科技快讯（GDELT有15分钟延迟）
- 可作为GDELT的**补充**，不冲突
- 建议减少RSS源数量，只保留最优质的3-5个

**方案B**: 完全取消RSS，专注GDELT
- 简化架构，单一数据源
- 依赖GDELT的15分钟延迟对大多数场景可接受
- 需要确认GDELT对科技新闻的覆盖是否足够

### 6.4 我的建议

**采用方案A的改良版**:

1. **GDELT作为主力**（Layer 3）: 扩展到24-39个源
2. **RSS精简为辅助**（Layer 1）: 只保留3-5个最优质的科技源
   - TechCrunch（科技创业）
   - Wired（深度科技）
   - The Verge（消费科技）
   - （可选）Axios（政治快讯）
3. **取消Layer 2**（NewsData.io）: 延迟12小时，价值不大

**理由**:
- GDELT覆盖已经很好，但科技新闻的**实时性**RSS更有优势
- 精简后的RSS只作为GDELT的补充，不增加架构复杂度
- 完全取消RSS可能会错过一些GDELT未覆盖的科技快讯

---

## 7. 实施路线图

### Phase 1: 立即执行（本周）
- [ ] 添加Tier 1的10个GDELT源
- [ ] 精简RSS源至3-5个
- [ ] 取消NewsData.io Layer 2
- [ ] 测试数据量是否达到 ~1,400条/天

### Phase 2: 扩展（2周后）
- [ ] 添加Tier 2的15个区域源
- [ ] 监测数据质量和语言分布
- [ ] 优化去重逻辑

### Phase 3: 专业领域（1个月后）
- [ ] 添加Tier 3的8个专业源
- [ ] 完整覆盖：全球新闻 + 科技 + 商业
- [ ] 目标：~1,850条/天

---

## 8. 结论

**当前GDELT 14个源已证明可行**，建议：

1. **立即扩展GDELT至24个源**（+10个Tier 1）
2. **精简RSS至3-5个核心科技源**
3. **取消NewsData.io**（12小时延迟价值不大）

**预期成果**: 简化架构为 **GDELT主力 + RSS补充**，数据量提升至 **~1,400条/天**，完全满足全球新闻可视化需求。

---

**请审阅此方案，确认是否按Phase 1立即执行？**
