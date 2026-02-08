# Implementation TODO - Unified Bloomberg Terminal Design

**Status**: Planning Complete | **Total Tasks**: 30 | **Priority**: High

---

## 📊 Progress Overview

```
Phase 1: 基础架构    [░░░░░░░░░░] 0% (5 tasks)
Phase 2: Web组件     [░░░░░░░░░░] 0% (7 tasks)  
Phase 3: Remotion    [░░░░░░░░░░] 0% (6 tasks)
Phase 4: 交互系统    [░░░░░░░░░░] 0% (4 tasks)
Phase 5: Tailwind    [░░░░░░░░░░] 0% (3 tasks)
Phase 6: 测试优化    [░░░░░░░░░░] 0% (5 tasks)
─────────────────────────────────────────
Overall:            [░░░░░░░░░░] 0% (30/30)
```

---

## 🎯 Phase 1: 基础架构 (共享设计系统)

### 1.1 创建设计Token文件
**文件**: `src/styles/designTokens.ts`
**任务**: 
- 定义色彩系统 (bg, text, accent, priority, border, shadow)
- 定义三种主题变体 (terminal/amber/light)
- 导出 TypeScript 类型
**依赖**: 无
**预计时间**: 30分钟
**状态**: ⏳ 待开始

### 1.2 创建字体系统
**文件**: `src/styles/typography.ts`
**任务**:
- 定义字体家族 (mono/sans/chinese)
- 定义字号系统 (ticker/label/data/body/title/heading/display)
- 定义字重和行高
**依赖**: 无
**预计时间**: 20分钟
**状态**: ⏳ 待开始

### 1.3 创建间距系统
**文件**: `src/styles/spacing.ts`
**任务**:
- 定义布局间距 (tickerHeight/statusHeight/panelWidth)
- 定义组件间距 (xs/sm/md/lg/xl/xxl)
- 定义圆角和z-index
**依赖**: 无
**预计时间**: 15分钟
**状态**: ⏳ 待开始

### 1.4 创建动画系统
**文件**: `src/styles/animations.ts`
**任务**:
- 定义动画时长 (fast/normal/slow/pulse/breathe/ticker)
- 定义缓动函数 (smooth/bounce/linear)
- 定义CSS Keyframes (Web用)
- 定义Remotion Spring配置
**依赖**: 无
**预计时间**: 30分钟
**状态**: ⏳ 待开始

### 1.5 统一导出
**文件**: `src/styles/index.ts`
**任务**:
- 统一导出所有设计系统模块
- 创建便捷的导入路径
**依赖**: 1.1-1.4
**预计时间**: 10分钟
**状态**: ⏳ 待开始

---

## 🎨 Phase 2: Web前端组件

### 2.1 终端布局组件
**文件**: `src/components/layout/TerminalLayout.tsx`
**任务**:
- 创建三栏布局 (Ticker/Main/Status)
- 支持三种显示模式切换
- 使用设计Token
**依赖**: Phase 1完成
**预计时间**: 45分钟
**状态**: ⏳ 待开始

### 2.2 滚动新闻条
**文件**: `src/components/layout/TickerBar.tsx`
**任务**:
- 水平滚动显示P0/P1事件
- 优先级颜色编码
- 点击跳转功能
- 平滑滚动动画
**依赖**: 2.1
**预计时间**: 40分钟
**状态**: ⏳ 待开始

### 2.3 状态栏
**文件**: `src/components/layout/StatusBar.tsx`
**任务**:
- 显示在线状态
- 显示最后更新时间(UTC)和本地时间
- 显示事件计数和网络延迟
- 主题切换按钮组
**依赖**: 2.1
**预计时间**: 35分钟
**状态**: ⏳ 待开始

### 2.4 市场数据面板
**文件**: `src/components/layout/MarketDataPanel.tsx`
**任务**:
- 可折叠侧边栏
- 显示实时市场数据(股指/商品/汇率)
- 涨跌颜色编码
- 与新闻的相关性高亮
**依赖**: 2.1
**预计时间**: 50分钟
**状态**: ⏳ 待开始

### 2.5 地图组件升级
**文件**: `src/components/InteractiveMap.tsx`
**任务**:
- 添加脉冲标记动画(P0红色/P1橙色)
- 区域热力着色
- 主题适配
- 性能优化
**依赖**: Phase 1
**预计时间**: 60分钟
**状态**: ⏳ 待开始

### 2.6 新闻列表升级
**文件**: `src/components/NewsFeed.tsx`
**任务**:
- Bloomberg风格卡片设计
- 优先级图标显示
- 时间格式化
- 新条目淡入动画
- 紧凑模式适配
**依赖**: Phase 1
**预计时间**: 45分钟
**状态**: ⏳ 待开始

### 2.7 筛选器升级
**文件**: `src/components/Filters.tsx`
**任务**:
- 添加主题切换按钮
- 添加显示模式切换
- 优化分类筛选UI
- 应用设计Token
**依赖**: 2.1
**预计时间**: 30分钟
**状态**: ⏳ 待开始

---

## 🎬 Phase 3: Remotion组件更新

### 3.1 Remotion地图更新
**文件**: `src/remotion/components/WorldMap.tsx`
**任务**:
- 应用设计Token色彩
- 更新标记颜色为Bloomberg风格
- 添加主题适配能力
- 保持现有动画逻辑
**依赖**: Phase 1
**预计时间**: 30分钟
**状态**: ⏳ 待开始

### 3.2 Remotion新闻卡片更新
**文件**: `src/remotion/components/NewsCard.tsx`
**任务**:
- 应用设计Token
- Bloomberg风格布局
- 优先级颜色编码
- 保持入场动画
**依赖**: Phase 1
**预计时间**: 25分钟
**状态**: ⏳ 待开始

### 3.3 优先级指示器
**文件**: `src/remotion/components/PriorityIndicator.tsx`
**任务**:
- P0红色脉冲动画(使用interpolate)
- P1橙色呼吸动画
- P2/P3静态标记
- 可复用组件
**依赖**: Phase 1
**预计时间**: 40分钟
**状态**: ⏳ 待开始

### 3.4 滚动条组件
**文件**: `src/remotion/components/TickerBand.tsx`
**任务**:
- 水平滚动动画
- 优先级颜色区分
- 无缝循环
- Bloomberg风格
**依赖**: Phase 1
**预计时间**: 35分钟
**状态**: ⏳ 待开始

### 3.5 主合成更新
**文件**: `src/remotion/NewsVisualization.tsx`
**任务**:
- 整合新组件
- 添加TickerBar
- 添加StatusBar
- 统一视觉风格
**依赖**: 3.1-3.4
**预计时间**: 45分钟
**状态**: ⏳ 待开始

### 3.6 开场动画
**文件**: `src/remotion/compositions/TerminalIntro.tsx`
**任务**:
- Terminal启动效果
- 文字逐字显示
- Logo动画
- 进入主界面过渡
**依赖**: 3.5
**预计时间**: 50分钟
**状态**: ⏳ 待开始

---

## 🎮 Phase 4: 交互系统

### 4.1 主题切换Hook
**文件**: `src/hooks/useTheme.ts`
**任务**:
- 管理三种主题状态
- localStorage持久化
- CSS类切换逻辑
- 平滑过渡动画
**依赖**: Phase 1
**预计时间**: 25分钟
**状态**: ⏳ 待开始

### 4.2 显示模式Hook
**文件**: `src/hooks/useDisplayMode.ts`
**任务**:
- 三种布局模式切换
- 快捷键支持(Tab)
- 状态持久化
**依赖**: Phase 1
**预计时间**: 20分钟
**状态**: ⏳ 待开始

### 4.3 键盘快捷键Hook
**文件**: `src/hooks/useKeyboardShortcuts.ts`
**任务**:
- 监听键盘事件
- 实现所有快捷键
- 帮助面板触发
- 防止冲突
**依赖**: Phase 1
**预计时间**: 30分钟
**状态**: ⏳ 待开始

### 4.4 主页面整合
**文件**: `src/app/[locale]/page.tsx`
**任务**:
- 整合所有新组件
- 连接所有hooks
- 确保数据流正确
- 性能优化
**依赖**: Phase 2-4
**预计时间**: 40分钟
**状态**: ⏳ 待开始

---

## 🎨 Phase 5: Tailwind配置

### 5.1 Tailwind配置更新
**文件**: `tailwind.config.ts`
**任务**:
- 添加设计Token到theme.extend
- 配置自定义颜色
- 配置字体系统
- 配置动画
**依赖**: Phase 1
**预计时间**: 30分钟
**状态**: ⏳ 待开始

### 5.2 全局样式
**文件**: `src/styles/globals.css`
**任务**:
- CSS变量定义
- 全局重置样式
- 滚动条样式
- 字体导入
**依赖**: 5.1
**预计时间**: 20分钟
**状态**: ⏳ 待开始

### 5.3 主题切换CSS
**任务**:
- 主题切换过渡动画
- 深色/浅色/琥珀色类
- 响应式适配
**依赖**: 5.2
**预计时间**: 25分钟
**状态**: ⏳ 待开始

---

## ✅ Phase 6: 测试与优化

### 6.1 主题切换测试
**任务**:
- 测试Terminal主题
- 测试Amber主题
- 测试Light主题
- 测试切换动画
**依赖**: All phases
**预计时间**: 20分钟
**状态**: ⏳ 待开始

### 6.2 显示模式测试
**任务**:
- 测试标准模式
- 测试紧凑模式
- 测试沉浸模式
- 测试快捷键切换
**依赖**: All phases
**预计时间**: 15分钟
**状态**: ⏳ 待开始

### 6.3 键盘快捷键测试
**任务**:
- 测试Tab切换
- 测试Space暂停
- 测试F全屏
- 测试T主题切换
- 测试M市场数据
**依赖**: All phases
**预计时间**: 15分钟
**状态**: ⏳ 待开始

### 6.4 Remotion视频测试
**任务**:
- 测试视频生成
- 检查视觉一致性
- 检查动画流畅度
- 导出样本视频
**依赖**: Phase 3
**预计时间**: 30分钟
**状态**: ⏳ 待开始

### 6.5 性能优化
**任务**:
- 首屏加载优化
- 动画性能检查
- 内存泄漏检查
- 最终代码清理
**依赖**: All phases
**预计时间**: 40分钟
**状态**: ⏳ 待开始

---

## 📈 依赖关系图

```
Phase 1 (基础架构)
    │
    ├──→ Phase 2 (Web组件)
    │       │
    │       ├──→ Phase 4.4 (主页面整合)
    │       │
    │       └──→ Phase 5 (Tailwind)
    │
    ├──→ Phase 3 (Remotion)
    │       │
    │       └──→ Phase 6.4 (Remotion测试)
    │
    └──→ Phase 4 (交互系统)
            │
            └──→ Phase 4.4 (主页面整合)

Phase 6 (测试) 依赖所有前面的Phase
```

---

## 🎯 实施建议

### 执行顺序
1. **首先完成Phase 1** - 这是所有组件的基础
2. **并行开发Phase 2和Phase 3** - Web和Remotion可以同时进行
3. **然后Phase 4和5** - 交互和样式
4. **最后Phase 6** - 全面测试

### 并行任务
- Phase 2.1-2.4 (布局组件) 可以并行
- Phase 2.5-2.7 (内容组件) 可以并行
- Phase 3.1-3.4 (Remotion组件) 可以并行

### 关键路径
Phase 1 → Phase 2.1 → Phase 4.4 → Phase 6

---

## 📝 备注

- 所有时间估计基于单人开发
- 如果使用多个agents并行，可缩短50%时间
- Remotion和Web开发可以同时进行
- 测试阶段不可跳过

**Last Updated**: 2026-02-08
**Next Review**: After Phase 1 completion
