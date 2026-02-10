# GDELT 新闻源扩展方案

## 📊 当前配置概览

| 等级 | 数量 | 来源 |
|------|------|------|
| **Tier 1** (顶级权威) | 10个 | BBC, Reuters, AFP, AP, CNN, NYT, Guardian, Washington Post, Bloomberg, Al Jazeera |
| **Tier 2** (重要权威) | 4个 | France 24, Deutsche Welle, African News, News24 |
| **总计** | **14个** | |

---

## 🆕 可扩展的权威新闻源

### Tier 1 - 全球顶级媒体 (可添加10个)

| 域名 | 媒体名称 | 语言 | 地区 | 权威性 |
|------|---------|------|------|--------|
| wsj.com | Wall Street Journal | English | 美国/全球 | ⭐⭐⭐⭐⭐ 金融权威 |
| ft.com | Financial Times | English | 英国/全球 | ⭐⭐⭐⭐⭐ 商业权威 |
| economist.com | The Economist | English | 英国/全球 | ⭐⭐⭐⭐⭐ 深度分析 |
| time.com | Time Magazine | English | 美国/全球 | ⭐⭐⭐⭐⭐ 影响力大 |
| usatoday.com | USA Today | English | 美国 | ⭐⭐⭐⭐ 发行量大 |
| cbsnews.com | CBS News | English | 美国 | ⭐⭐⭐⭐ 主流电视网 |
| nbcnews.com | NBC News | English | 美国 | ⭐⭐⭐⭐ 主流电视网 |
| abcnews.go.com | ABC News | English | 美国 | ⭐⭐⭐⭐ 主流电视网 |
| foxnews.com | Fox News | English | 美国 | ⭐⭐⭐⭐ 保守派主流 |
| espn.com | ESPN | English | 美国/全球 | ⭐⭐⭐⭐ 体育权威 |

**预期贡献**: 每个源 ~30-50条/天（英文）= **300-500条/天**

---

### Tier 2 - 区域权威媒体 (可添加15个)

#### 欧洲

| 域名 | 媒体名称 | 语言 | 地区 | 权威性 |
|------|---------|------|------|--------|
| euronews.com | Euronews | English | 欧洲 | ⭐⭐⭐⭐ 泛欧视角 |
| spiegel.de | Der Spiegel | German | 德国 | ⭐⭐⭐⭐ 深度报道 |
| lemonde.fr | Le Monde | French | 法国 | ⭐⭐⭐⭐ 法国权威 |
| elpais.com | El País | Spanish | 西班牙 | ⭐⭐⭐⭐ 西语权威 |
| corriere.it | Corriere della Sera | Italian | 意大利 | ⭐⭐⭐⭐ 意大利权威 |

#### 亚洲

| 域名 | 媒体名称 | 语言 | 地区 | 权威性 |
|------|---------|------|------|--------|
| nikkei.com | Nikkei | English | 日本 | ⭐⭐⭐⭐ 日本经济 |
| asahi.com | Asahi Shimbun | Japanese | 日本 | ⭐⭐⭐⭐ 日本主流 |
| scmp.com | South China Morning Post | English | 香港 | ⭐⭐⭐⭐ 中国视角 |
| straitstimes.com | Straits Times | English | 新加坡 | ⭐⭐⭐⭐ 东南亚视角 |
| thehindu.com | The Hindu | English | 印度 | ⭐⭐⭐⭐ 印度权威 |

#### 中东 & 其他

| 域名 | 媒体名称 | 语言 | 地区 | 权威性 |
|------|---------|------|------|--------|
| haaretz.com | Haaretz | English | 以色列 | ⭐⭐⭐⭐ 以色列视角 |
| jpost.com | Jerusalem Post | English | 以色列 | ⭐⭐⭐⭐ 以色列视角 |
| dailymail.co.uk | Daily Mail | English | 英国 | ⭐⭐⭐ 流量大 |
| globo.com | Globo | Portuguese | 巴西 | ⭐⭐⭐⭐ 拉美最大 |
| clarin.com | Clarín | Spanish | 阿根廷 | ⭐⭐⭐⭐ 阿根廷权威 |

**预期贡献**: 每个源 ~20-40条/天（多语言）→ 英文 ~10-15条 = **150-225条/天**

---

### Tier 3 - 科技 & 商业专业媒体 (可添加8个)

| 域名 | 媒体名称 | 语言 | 领域 | 权威性 |
|------|---------|------|------|--------|
| techcrunch.com | TechCrunch | English | 科技 | ⭐⭐⭐⭐ 科技创业 |
| wired.com | Wired | English | 科技/文化 | ⭐⭐⭐⭐ 深度科技 |
| theverge.com | The Verge | English | 科技/消费 | ⭐⭐⭐⭐ 消费科技 |
| axios.com | Axios | English | 政治/商业 | ⭐⭐⭐⭐ 简洁新闻 |
| politico.com | Politico | English | 政治 | ⭐⭐⭐⭐ 政治专业 |
| businessinsider.com | Business Insider | English | 商业/科技 | ⭐⭐⭐⭐ 商业快讯 |
| forbes.com | Forbes | English | 商业/财经 | ⭐⭐⭐⭐ 商业权威 |
| cnet.com | CNET | English | 科技产品 | ⭐⭐⭐⭐ 产品评测 |

**预期贡献**: 每个源 ~20-30条/天（英文）= **160-240条/天**

---

## 📈 扩展后预期数据量

| 配置 | 源数量 | 预期每日数据（英文） |
|------|--------|---------------------|
| **当前** | 14个 | ~888条 |
| **+ Tier 1** | 24个 | ~1,388条 (+500) |
| **+ Tier 2** | 39个 | ~1,613条 (+225) |
| **+ Tier 3** | 47个 | ~1,853条 (+240) |
| **总计** | **47个** | **~1,850条/天** |

---

## ⚠️ 注意事项

1. **语言过滤**: 非英文源（德/法/西/日等）会被过滤掉 ~60-70%
2. **去重**: GDELT 按域名查询会返回多语言版本
3. **API限制**: GDELT 免费，建议添加所有源测试稳定性

---

## 🚀 实施建议

**阶段1**（立即）：添加 Tier 1 的10个源
**阶段2**（测试后）：添加 Tier 2 的15个源  
**阶段3**（稳定后）：添加 Tier 3 的8个源

**全部添加后预期**: **47个权威源，~1,850条/天**
