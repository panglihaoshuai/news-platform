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

## 🚀 部署步骤

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
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_KEY=[your-service-role-key]
RSSHUB_BASE_URL=https://rsshub.app
```

> **注意**: `SUPABASE_SERVICE_KEY` 是Service Role Key，不是Anon Key！

#### 3.2 完成部署

1. 点击 "Deploy"
2. 等待部署完成（约2-3分钟）
3. 记录分配的域名（如 `global-news-viz.vercel.app`）

### 步骤4: 配置GitHub Actions

1. 访问你的GitHub仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 添加以下Secrets：

```
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_KEY=[your-service-role-key]
RSSHUB_BASE_URL=https://rsshub.app
```

> **注意**: GitHub Secrets区分大小写，务必完全一致！

### 步骤5: 验证部署

#### 5.1 测试数据采集

1. 在GitHub仓库页面，点击 "Actions" 标签
2. 找到 "Fetch RSS News" 工作流
3. 点击 "Run workflow" 手动触发一次
4. 等待执行完成（约5-10分钟）
5. 检查是否成功（绿色✓）

#### 5.2 测试API接口

```bash
# 测试新闻查询API
curl "https://your-domain.vercel.app/api/news?timeRange=24h&density=medium"
```

应该返回JSON格式的最新新闻数据。

#### 5.3 测试前端页面

1. 访问 `https://your-domain.vercel.app`
2. 应该看到控制面板和空的播放器区域
3. 点击 "应用筛选" 或 "加载新闻"
4. 等待数据加载，应该看到新闻可视化

## 🔧 免费层限制监控

### GitHub Actions 监控

在 `.github/workflows/fetch-news.yml` 中已配置：
- 每6小时执行一次（120次/月）
- 单次超时15分钟
- 失败时自动创建Issue

**监控面板**: https://github.com/[username]/[repo]/settings/actions

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
2. 检查 `SUPABASE_SERVICE_KEY` 是否正确
3. 检查RSSHub服务状态：`curl https://rsshub.app`
4. 如果是限流错误，增加延迟或更换RSSHub实例

**解决方案**:
```bash
# 测试RSSHub连接
curl "https://rsshub.app/bbc/world"

# 如果失败，尝试备用实例
# 编辑 .github/workflows/fetch-news.yml
# 修改 RSSHUB_BASE_URL 为备用地址
```

### 问题2: 数据库连接失败

**症状**: API返回500错误，提示数据库连接失败

**排查步骤**:
1. 检查 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY` 是否正确
2. 检查Supabase项目是否处于Active状态
3. 检查是否超过连接数限制（免费层60个并发）

**解决方案**:
```bash
# 测试数据库连接
npx supabase status

# 或者使用psql直接连接
psql "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
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

| 服务 | 免费额度 | 预计使用 | 使用率 |
|------|---------|---------|--------|
| GitHub Actions | 2000分钟/月 | ~300分钟/月 | 15% |
| Supabase | 500MB | ~120MB/月 | 24% |
| Vercel | 100GB/月 | ~15GB/月 | 15% |

### 升级触发条件

如果出现以下情况，考虑升级到付费方案：

1. **GitHub Actions超过1500分钟/月**
   - 解决方案：减少执行频率（从6小时改为12小时）
   - 付费方案：$5/月获得3000分钟

2. **Supabase存储超过400MB**
   - 解决方案：缩短数据保留期（从90天改为60天）
   - 付费方案：$25/月获得8GB存储

3. **Vercel带宽超过80GB/月**
   - 解决方案：启用更激进的缓存策略
   - 付费方案：$20/月获得1TB带宽

## 🎉 完成！

部署完成后，你的全球新闻可视化平台应该：

✅ 每6小时自动采集全球新闻  
✅ 支持多维度筛选（时间/地区/领域/密度）  
✅ 使用Remotion展示动态新闻可视化  
✅ 完全0元成本运营  

**访问你的应用**: `https://your-domain.vercel.app`

**监控面板**:
- GitHub Actions: `https://github.com/[username]/[repo]/actions`
- Supabase: `https://app.supabase.com/project/[ref]`
- Vercel: `https://vercel.com/dashboard`

---

如有问题，请查看项目Issues或提交新的Issue。
