# Global Intel Map - 全球新闻可视化情报平台

![Project UI Mockup](https://images.unsplash.com/photo-1526778546141-54facf1348b1?auto=format&fit=crop&q=80) 

## 1. 项目简介
**Global Intel Map** 是一个实时监测并可视化全球权威新闻的深度情报平台。它打破了传统文本新闻流的分散感，将全球热点事件直接映射到 3D 地图中，通过经纬度坐标、多语言感知和时间轴维度，为用户提供“上帝视角”的全球资讯洞察。

## 2. 技术栈 (Tech Stack)
本项目采用现代全栈 Web 开发方案，强调数据的实时性与视觉的冲击力：
*   **核心框架**: [Next.js 16 (React 19)](https://nextjs.org/) - 利用其领先的并发渲染与异步 Server Actions。
*   **数据库 & 实时后端**: [Supabase](https://supabase.com/) - 托管 PostgreSQL 数据库，处理新闻数据的持久化与同步调优。
*   **地图引擎**: [MapLibre GL JS](https://maplibre.org/) - 配合 [MapTiler](https://www.maptiler.com/) 提供的暗黑数据可视化主题，支持平滑的聚合点渲染。
*   **数据流水线**: 
    *   `rss-parser`: 高度兼容的 RSS 解析引擎。
    *   `string-similarity`: 基于 Dice 系数的语义相似度计算，用于新闻查重。
*   **UI/UX**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) + [Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) 微动画。
*   **视频渲染**: [Remotion](https://www.remotion.dev/) - 旨在将每日热点自动合成为叙事短视频（开发中）。
*   **国际化**: `next-intl` - 支持中英双语及其各自语境下的数据过滤。

## 3. 系统架构与流程 (Architecture & Pipeline)
### 总体结构
*   `/src/app/[locale]/`: 应用容器，管理多语言状态与全局布局。
*   `/src/components/`:
    *   `InteractiveMap`: 负责 WebGL 地图逻辑、聚合点位显示、自动驾驶 FlyTo 动画。
    *   `NewsFeed`: 响应式侧边栏，支持来源标注、时间格式化及内容详情展开。
    *   `Filters`: 多维过滤器，控制语言（EN/ZH/ALL）、区域、信息密度。
*   `/scripts/`: 后台作业中心。

### 数据流转流程
1.  **源同步 (`update-sources.ts`)**: 维护一份高权威度的 RSS 地址库（如 BBC, NYT, Financial Times, WSJ, 联合早报等）。
2.  **抓取解析 (`fetch-rss.ts`)**: 
    *   使用伪装浏览器头（User-Agent）执行大规模异步请求。
    *   **语义去重**: 动态对比 48 小时内的已有标题，相似度阈值设为 0.5。
    *   **智能地理编码**: 通过匹配标题中的中英文地名/关键词，将新闻自动归类到全球 100+ 关键城市与国家坐标。
3.  **呈现过滤**: 前端实时从数据库提取已聚合的数据，并根据用户选择的“内容语言”进行二次过滤。

## 4. 功能实现状态 (Feature Checklist)

### ✅ 已落地功能 (Implemented)
*   **中英双语全覆盖**: 支持 UI 切换及对应的权威新闻源识别（WSJ 中文, BBC 中文, FT 中文等）。
*   **全球来源标注**: 每条新闻均明确显示红色来源标签（如：*NYT World*, *联合早报*）。
*   **自动驾驶 (Auto-Pilot)**: 系统会自动聚焦最近热点，地图自动平滑漫游。
*   **地理坐标精准映射**: 解决了中文媒体在报道全球（如乌克兰、中东）事件时的定位偏差问题。
*   **信息密度控制**: 支持 Low/Medium/High 三档信息流密度调节。
*   **视觉优化**: 剔除南极洲视图，优化暗黑模式的透明玻璃感 UI。

### ❌ 待完善/尚未实现 (Backlog)
*   **Remotion 视频流水线**: 目前 Remotion 代码已存在，但尚未实现将每日 Top 3 热点自动渲染成视频并下载的功能。
*   **实时分析摘要**: 计划引入 LLM 对同一事件的多方报道进行汇总与观点对比。
*   **更细粒度的分类**: 部分 RSS 源尚未完全映射到分类体系（如科技、军事、金融）。

## 5. 开发规范
本项目遵循严格的开发流程，详情请参阅 [RULES.md](./docs/RULES.md)。
主要原则：
1. 头脑风暴先行，方案审批后动工。
2. 每一个功能单元必须经过脚本验证与手动测试。
3. 文档与注释必须保持中英文严谨对应（默认以中文主框架为准）。

---
**Last Updated**: 2026-02-07
