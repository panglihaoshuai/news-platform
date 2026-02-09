# 0元部署指南

> 完全基于免费云服务部署全球新闻可视化平台

## 📋 部署前准备

### 1. 注册账号

- [ ] GitHub 账号（已有则跳过）
- [ ] Vercel 账号（使用GitHub登录）
- [ ] Supabase 账号（使用GitHub登录）

### 2. 安装工具

```bash
# 安装 Vercel CLI
npm i -g vercel

# 安装 Supabase CLI（可选，用于本地开发）
npm i -g supabase
```

## 🚀 Deployment Steps

### 步骤1: 创建GitHub仓库

1. 访问 https://github.com/new
2. 创建名为 `global-news-viz` 的公开仓库
3. 将代码推送到仓库：

```bash
# 初始化仓库（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 关联远程仓库
git remote add origin https://github.com/your-username/global-news-viz.git
git branch -M main
git push -u origin main
```

### 步骤2: 配置Supabase

1. 访问 https://app.supabase.com
2. 点击 "New Project"
3. 填写项目名称：`global-news-viz`
4. 选择最近的数据库区域（推荐：Singapore或Tokyo）
5. 等待数据库创建完成（约2分钟）

#### 2.1 执行数据库Schema

1. 在项目Dashboard中，点击左侧 "SQL Editor"
2. 新建查询，复制 `database/schema.sql` 的全部内容
3. 点击 "Run" 执行
4. 确认所有表和索引创建成功

#### 2.2 获取连接信息

1. 点击左侧 "Project Settings"
2. 选择 "Database" 标签
3. 复制以下信息：
   - **URL**: `postgres://postgres.[ref]@aws-0-[region].pooler.supabase.com:6543/postgres`
   - **Service Role Key**: 在 "API" 标签页找到 `service_role` key

### 步骤3: 配置Vercel

1. 访问 https://vercel.com/new
2. 选择 "Import Git Repository"
3. 选择你的 `global-news-viz` 仓库
4. 点击 "Import"

#### 3.1 配置环境变量

在部署配置页面，添加以下环境变量：

```
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# NewsData.io (Optional - for blocked sources)
# Get free API key at: https://newsdata.io/
NEWS_DATA_API_KEY=your-newsdata-api-key

# DeepSeek (Optional - for LLM classification)
# Get free API key at: https://platform.deepseek.com/
DEEPSEEK_API_KEY=your-deepseek-api-key

# GDELT API (NO API KEY REQUIRED!)
# Already configured in code, no action needed
```

> **注意**: 
> - GDELT API (三层架构 Layer 3) 完全免费，无需配置API密钥！
> - **定时采集使用 GitHub Actions**，不需要配置 Vercel Cron

#### 3.2 完成部署

1. 点击 "Deploy"
2. 等待部署完成（约2-3分钟）
3. 记录分配的域名（如 `global-news-viz.vercel.app`）

### 步骤4: 配置GitHub Actions

1. 访问你的GitHub仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 添加以下Secrets：

```
# Vercel (Required for CI/CD)
VERCEL_TOKEN=[your-vercel-token]
VERCEL_ORG_ID=[from-vercel-project-settings]
VERCEL_PROJECT_ID=[from-vercel-project-settings]

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# API Keys (Optional)
NEWS_DATA_API_KEY=[your-newsdata-api-key]
DEEPSEEK_API_KEY=[your-deepseek-api-key]
```

> **注意**: GitHub Secrets区分大小写，务必完全一致！

### 步骤5: 验证部署

#### 5.1 测试三层混合架构

```bash
# 本地测试
npm run fetch:hybrid

# 预期输出：
# 🚀 === HYBRID NEWS FETCH STARTED ===
# 📊 Sources:
#    Direct RSS: 12
#    NewsData.io: 8
#    GDELT: 14  ← 新增！
# Total: 34 sources
# 📡 === Phase 1: Direct RSS (Real-Time) ===
# 📡 === Phase 2: NewsData.io API ===
# 📡 === Phase 3: GDELT API (~15min delay) ===
# 📊 === FETCH SUMMARY ===
# Total fetched: 100-500
# Total inserted: 50-200
```

#### 5.2 GDELT API 独立测试

```bash
# 测试GDELT Layer 3
npm run fetch:gdelt

# 预期输出：
# 🚀 === GDELT FETCH STARTED ===
# 📡 GDELT API: Combined query for tier 1 sources
# ✅ Retrieved 50 articles from GDELT
# 📦 Transformed 48 articles to unified format
# 📊 === FETCH SUMMARY ===
# Total fetched: 50
# Total inserted: 48
```

#### 5.3 测试API接口

```bash
# 测试新闻查询API
curl "https://your-domain.vercel.app/api/news?timeRange=24h&density=medium"
```

应该返回JSON格式的最新新闻数据。

#### 5.4 测试前端页面

1. 访问 `https://your-domain.vercel.app`
2. 应该看到控制面板和空的播放器区域
3. 点击 "应用筛选" 或 "加载新闻"
4. 等待数据加载，应该看到新闻可视化

## 🔧 免费层限制监控

### GitHub Actions 监控

已配置两个工作流：
- **CI/CD** (`ci.yml`): 每次PR和push自动运行
- **Scheduled Fetch** (`schedule.yml`): **每1小时自动采集** ⭐

**定时采集频率**: 
```
每1小时运行一次 = 每天24次 = 每月约720次
预计耗时: 每次1.5分钟
月度使用: ~1080分钟 (54%额度, 充足备用)
```

**监控面板**: https://github.com/[username]/[repo]/settings/actions

### 三层架构数据源统计

| Layer | Source Type | Count | Delay | Cost |
|-------|-------------|-------|-------|------|
| Layer 1 | Direct RSS | ~12 | Real-time | Free |
| Layer 2 | NewsData.io | ~8 | ~12 hours | Free tier |
| Layer 3 | GDELT | ~14 | ~15 min | **Free!** |
| **Total** | | **~34** | Best coverage | **$0** |

### Supabase 存储监控

执行以下SQL查询查看使用情况：

```sql
-- 查看各表存储占用
SELECT * FROM check_storage_usage();

-- 查看总体统计
SELECT * FROM get_news_stats();

-- 查看90天以上的旧数据（将被清理）
SELECT COUNT(*) as old_articles 
FROM articles 
WHERE published_at < EXTRACT(EPOCH FROM (NOW() - INTERVAL '90 days'))::INTEGER;
```

**监控建议**:
- 设置每周检查存储使用
- 如果超过400MB（80%），考虑增加清理频率
- 或者手动导出旧数据到GitHub Release

### Vercel 用量监控

1. 访问 https://vercel.com/dashboard
2. 点击你的项目
3. 查看 "Analytics" 标签
4. 监控：
   - Function invocations
   - Bandwidth usage
   - Build time

## 🚨 故障排查

### 问题1: RSS采集失败

**症状**: GitHub Actions显示红色✗

**排查步骤**:
1. 查看Actions日志，找到错误信息
2. 检查 `SUPABASE_SERVICE_ROLE_KEY` 是否正确
3. 检查RSSHub服务状态：`curl https://rsshub.app`
4. 如果是限流错误，GitHub Actions会自动重试

**解决方案**:
```bash
# 测试RSSHub连接
curl "https://rsshub.app/bbc/world"
```

### 问题2: 数据库连接失败

**症状**: API返回500错误，提示数据库连接失败

**排查步骤**:
1. 检查 `SUPABASE_SERVICE_ROLE_KEY` 是否正确
2. 检查Supabase项目是否处于Active状态
3. 检查是否超过连接数限制（免费层60个并发）

**解决方案**:
```bash
# 测试数据库连接 (使用Supabase CLI)
npx supabase status
```

### 问题3: 存储超限

**症状**: Supabase报错 "storage quota exceeded"

**解决方案**:
1. 手动清理旧数据：
```sql
-- 删除90天前的数据
SELECT cleanup_old_data();
```

2. 或者导出到GitHub Release：
```bash
# 导出数据
pg_dump "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" \
  --table=articles \
  --data-only \
  > backup.sql

# 上传到GitHub Release
git tag backup-$(date +%Y%m%d)
git push origin backup-$(date +%Y%m%d)
```

### 问题4: 页面加载慢

**症状**: 首次加载超过5秒

**优化方案**:
1. 启用Vercel Edge Cache（已配置）
2. 减少首次加载的新闻数量
3. 使用CDN加速静态资源

在 `app/api/news/route.ts` 中调整：
```typescript
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
// 从100改为50，减少数据传输
```

## 🔄 持续维护

### 每周检查清单

- [ ] 检查GitHub Actions执行状态
- [ ] 检查Supabase存储使用情况（< 400MB）
- [ ] 检查Vercel带宽使用情况（< 80GB）
- [ ] 检查RSS源健康状态

### 每月优化

- [ ] 分析慢查询日志
- [ ] 优化数据库索引
- [ ] 清理失败的RSS源
- [ ] 更新依赖包

### 数据备份策略

虽然免费层会自动备份，但建议：

```bash
# 每月手动导出重要数据
pg_dump $SUPABASE_URL --table=articles > backup-$(date +%Y%m).sql

# 上传到GitHub Release
git tag data-backup-$(date +%Y%m)
git push origin data-backup-$(date +%Y%m)
```

## 📊 成本预估

### 免费层使用情况

| 服务 | 免费额度 | 预计使用 | 使用率 | 说明 |
|------|---------|---------|--------|------|
| GitHub Actions | 2000分钟/月 | ~500分钟/月 | 25% | CI/CD + Scheduled Fetch |
| Supabase | 500MB | ~120MB/月 | 24% | 新闻数据存储 |
| Vercel | 100GB/月 | ~15GB/月 | 15% | 前端托管 |
| **GDELT** | **Unlimited** | **~50条/小时** | **0%** | **完全免费!** |

### 升级触发条件

如果出现以下情况，考虑升级到付费方案：

1. **GitHub Actions超过1500分钟/月**
   - 解决方案：减少执行频率（从每小时改为每2小时）
   - 付费方案：$5/月获得3000分钟

2. **Supabase存储超过400MB**
   - 解决方案：缩短数据保留期（从3天改为2天）
   - 付费方案：$25/月获得8GB存储

3. **Vercel带宽超过80GB/月**
   - 解决方案：启用更激进的缓存策略
   - 付费方案：$20/月获得1TB带宽

## 🎉 完成！

部署完成后，你的全球新闻可视化平台应该：

✅ **三层混合架构** (新增GDELT Layer 3)
- Layer 1: Direct RSS (~12源, 实时)
- Layer 2: NewsData.io (~8源, ~12小时延迟)
- Layer 3: GDELT (~14源, ~15分钟延迟) ⭐ **完全免费!**
- 总计: ~34个权威媒体源

✅ 每小时自动采集全球新闻  
✅ 支持多维度筛选（时间/地区/领域/密度）  
✅ 使用Remotion展示动态新闻可视化  
✅ **完全0元成本运营** (GDELT无需API Key!)

**访问你的应用**: `https://your-domain.vercel.app`

**监控面板**:
- GitHub Actions: `https://github.com/[username]/[repo]/actions`
- Supabase: `https://app.supabase.com/project/[ref]`
- Vercel: `https://vercel.com/dashboard`

---

如有问题，请查看项目Issues或提交新的Issue。
