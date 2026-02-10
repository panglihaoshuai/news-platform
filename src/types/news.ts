export interface NewsItem {
    id: string;
    source_id: string;
    source_name: string;
    source_language: 'en' | 'zh';
    title: string;                    // ✅ 标题完整保留
    summary: string;                   // ✅ 摘要完整保留
    original_url: string;             // ✅ 原文链接，可点击跳转
    published_at: string;
    geo_lat: number | null;
    geo_lng: number | null;
    region_code: string | null;
    country_code: string | null;
    importance_score: number;
    // ❌ image_url 已移除 - 轻量化设计，不存储图片
    created_at: string;
    
    // Categories from RSS source
    categories?: string[];
    
    // Heat metrics [新增] 热度相关字段 - 可选以保持向后兼容
    heat_score?: number;                             // 热度评分 0-100
    source_tier?: 'tier1' | 'tier2' | 'tier3' | 'tier4'; // 媒体等级
    cluster_id?: string;                             // 所属聚类ID
    related_news_ids?: string[];                     // 相关新闻ID列表
    reported_by_count?: number;                      // 报道源数量
}

export interface NewsFilters {
    timeRange: string; // '24h', '7d', '30d', '1y'
    region: string;    // 'global', 'NA', 'EU', 'AS', etc.
    country: string;   // 'all', 'US', 'CN', etc.
    categories: string[];
    density: 'low' | 'medium' | 'high';
    contentLanguage: 'en' | 'zh' | 'all';
}

export interface RSSSource {
    id: string;
    name: string;
    feed_url: string;
    region_code: string;
    country_code: string;
    language: 'en' | 'zh';
    enabled: boolean;
}

// ============================================================================
// Heat & Cluster Types [新增] 热度与聚类类型
// ============================================================================

export type HeatLevel = 'low' | 'medium' | 'high' | 'critical';

export type MapDisplayMode = 'all' | 'priority' | 'heatmap';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export type SourceTier = 'tier1' | 'tier2' | 'tier3' | 'tier4';

/**
 * Geographic Cluster - 地理聚类
 * 将同区域、同时间段的新闻聚合成热点
 */
export interface GeoCluster {
    id: string;                    // 聚类唯一ID
    center_lat: number;            // 中心纬度
    center_lng: number;            // 中心经度
    news_count: number;            // 新闻数量
    sources: string[];             // 涉及的媒体源
    max_priority: Priority;        // 最高优先级
    heat_score: number;            // 聚合热度评分
    news_ids: string[];            // 包含的新闻ID
    created_at: string;            // 聚类创建时间
    updated_at: string;            // 聚类更新时间
}

/**
 * Heat Calculation Input - 热度计算输入
 */
export interface HeatCalculationInput {
    newsItems: NewsItem[];
    timeWindow?: number;           // 时间窗口（小时），默认6
    geoRadius?: number;            // 地理半径（公里），默认50
    minSources?: number;           // 最小源数量，默认2
}

/**
 * Heat Calculation Result - 热度计算结果
 */
export interface HeatCalculationResult {
    clusters: GeoCluster[];
    itemHeatScores: Map<string, number>;
    timestamp: string;
}

/**
 * Authority Tier Configuration - 媒体权威性等级配置
 */
export interface AuthorityTierConfig {
    tier: SourceTier;
    weight: number;                // 权重分数
    sources: string[];             // 该等级的媒体列表
}

/**
 * Map Filter State - 地图过滤器状态 [扩展]
 */
export interface MapFilters {
    timeRange: string;             // '24h', '7d', '30d', '1y'
    region: string;                // 'global', 'NA', 'EU', 'AS', etc.
    categories: string[];
    density: 'low' | 'medium' | 'high';
    contentLanguage: 'en' | 'zh' | 'all';
    displayMode: MapDisplayMode;   // [新增] 地图显示模式
    priorityFilter: Priority[];    // [新增] 优先级过滤
    heatThreshold?: number;       // [新增] 热度阈值
    sentimentFilter?: SentimentFilter; // [新增] 情感过滤
    crisisOnly?: boolean;         // [新增] 只显示危机新闻
}

/**
 * Sentiment Filter - 情感过滤选项
 */
export type SentimentFilter = 'all' | 'positive' | 'neutral' | 'negative';

/**
 * Sentiment Range - 情感范围过滤
 */
export interface SentimentRange {
    min?: number;  // 最小 tone 值
    max?: number;   // 最大 tone 值
}

// ============================================================================
// Display & Theme Types [新增] 显示与主题类型
// ============================================================================

export type Theme = 'dark' | 'amber' | 'light';

export type DisplayMode = 'standard' | 'compact' | 'immersive';

/**
 * Theme Configuration - 主题配置
 */
export interface ThemeConfig {
    id: Theme;
    name: string;
    description: string;
    colors: {
        bg: {
            primary: string;
            secondary: string;
            tertiary: string;
            hover: string;
            map: string;
        };
        text: {
            primary: string;
            secondary: string;
            muted: string;
            disabled: string;
        };
        accent: {
            up: string;
            down: string;
            info: string;
            warning: string;
            neutral: string;
        };
        priority: {
            p0: string;
            p1: string;
            p2: string;
            p3: string;
        };
        heat: {
            low: string;
            medium: string;
            high: string;
            critical: string;
        };
    };
}

/**
 * Keyboard Shortcut Definition - 键盘快捷键定义
 */
export interface KeyboardShortcut {
    key: string;
    description: string;
    action: string;
    modifier?: 'ctrl' | 'alt' | 'shift' | 'meta';
}

/**
 * Application State - 应用状态
 */
export interface AppState {
    theme: Theme;
    displayMode: DisplayMode;
    mapDisplayMode: MapDisplayMode;
    selectedNewsId: string | null;
    autoPilotEnabled: boolean;
    lastUpdated: string;
}

