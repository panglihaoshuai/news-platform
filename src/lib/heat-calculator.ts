/**
 * Heat Calculator - 热度计算核心模块
 * 基于多源报道共识度的智能热度算法
 */

import { NewsItem, GeoCluster, HeatCalculationInput, HeatCalculationResult, HeatLevel, SourceTier } from '@/types/news';

// Authority Tier Configuration
const AUTHORITY_TIERS: Record<string, { tier: SourceTier; weight: number }> = {
    // Tier 1: Global Top Tier (20 points)
    'Reuters': { tier: 'tier1', weight: 20 },
    'Reuters Global': { tier: 'tier1', weight: 20 },
    'BBC': { tier: 'tier1', weight: 20 },
    'BBC World': { tier: 'tier1', weight: 20 },
    'NYT': { tier: 'tier1', weight: 20 },
    'NYTimes': { tier: 'tier1', weight: 20 },
    'NYT World': { tier: 'tier1', weight: 20 },
    'New York Times': { tier: 'tier1', weight: 20 },
    'WSJ': { tier: 'tier1', weight: 20 },
    'Wall Street Journal': { tier: 'tier1', weight: 20 },
    'Financial Times': { tier: 'tier1', weight: 20 },
    'FT': { tier: 'tier1', weight: 20 },
    'AP': { tier: 'tier1', weight: 20 },
    'AFP': { tier: 'tier1', weight: 20 },

    // Tier 2: Authoritative Media (15 points)
    'Bloomberg': { tier: 'tier2', weight: 15 },
    'CNBC': { tier: 'tier2', weight: 15 },
    'Guardian': { tier: 'tier2', weight: 15 },
    'The Guardian': { tier: 'tier2', weight: 15 },
    'Al Jazeera': { tier: 'tier2', weight: 15 },
    '联合早报': { tier: 'tier2', weight: 15 },
    'The Economist': { tier: 'tier2', weight: 15 },
    'Washington Post': { tier: 'tier2', weight: 15 },
    'WaPo': { tier: 'tier2', weight: 15 },

    // Tier 3: Regional Authoritative (10 points)
    'RFI': { tier: 'tier3', weight: 10 },
    'RFI 中文': { tier: 'tier3', weight: 10 },
    'BBC 中文': { tier: 'tier3', weight: 10 },
    'WSJ 中文': { tier: 'tier3', weight: 10 },
    'FT 中文': { tier: 'tier3', weight: 10 },
    'NYT 中文': { tier: 'tier3', weight: 10 },
    'Nikkei': { tier: 'tier3', weight: 10 },
    'SCMP': { tier: 'tier3', weight: 10 },
    'CNA': { tier: 'tier3', weight: 10 },
    'South China Morning Post': { tier: 'tier3', weight: 10 },

    // Default: Regular Media (5 points)
    'default': { tier: 'tier4', weight: 5 }
};

/**
 * Get source tier and authority weight
 */
export function getSourceTier(sourceName: string): { tier: SourceTier; weight: number } {
    // Exact match
    if (AUTHORITY_TIERS[sourceName]) {
        return AUTHORITY_TIERS[sourceName];
    }

    // Partial match
    for (const [key, value] of Object.entries(AUTHORITY_TIERS)) {
        if (sourceName.toLowerCase().includes(key.toLowerCase())) {
            return value;
        }
    }

    return AUTHORITY_TIERS['default'];
}

/**
 * Get authority weight for a tier
 */
export function getAuthorityWeight(tier: SourceTier): number {
    const weights: Record<SourceTier, number> = {
        tier1: 20,
        tier2: 15,
        tier3: 10,
        tier4: 5
    };
    return weights[tier];
}

/**
 * Calculate freshness score (0-10)
 * Higher score for newer news
 */
export function calculateFreshnessScore(publishedAt: string): number {
    const published = new Date(publishedAt).getTime();
    const now = Date.now();
    const hoursSincePublished = (now - published) / (1000 * 60 * 60);

    // Decay: 1 point per hour, max 10 hours
    const score = Math.max(0, 10 - hoursSincePublished);
    return Math.round(score);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calculate heat score for a single news item
 * Formula: sourceCount*15 + authorityWeight*20 + freshnessScore*10 + geoClusterBonus*5
 */
export function calculateHeatScore(item: NewsItem, clusterNews?: NewsItem[]): number {
    // Source count factor (15 points per source, max 75 points for 5 sources)
    const reportedByCount = item.reported_by_count || 1;
    const sourceCountScore = Math.min(reportedByCount * 15, 75);

    // Authority weight factor (20 points max)
    const sourceTier = item.source_tier || getSourceTier(item.source_name).tier;
    const authorityWeight = getAuthorityWeight(sourceTier);

    // Freshness factor (10 points max)
    const freshnessScore = calculateFreshnessScore(item.published_at);

    // Geo cluster bonus (5 points if part of a cluster with 3+ events)
    let geoClusterBonus = 0;
    if (clusterNews && clusterNews.length >= 3) {
        geoClusterBonus = 5;
    }

    // Calculate total (max 100)
    const total = Math.min(100,
        sourceCountScore + authorityWeight + freshnessScore + geoClusterBonus
    );

    return Math.round(total);
}

/**
 * Cluster news by geographic proximity and time window
 */
export function clusterNewsByLocation(
    input: HeatCalculationInput
): HeatCalculationResult {
    const {
        newsItems,
        timeWindow = 6, // 6 hours
        geoRadius = 50, // 50 km
        minSources = 2
    } = input;

    const clusters: GeoCluster[] = [];
    const itemHeatScores = new Map<string, number>();
    const processedItems = new Set<string>();

    // Sort by published time (newest first)
    const sortedItems = [...newsItems].sort(
        (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    for (const item of sortedItems) {
        if (processedItems.has(item.id)) continue;
        if (!item.geo_lat || !item.geo_lng) continue;

        // Find nearby items within time window
        const clusterItems: NewsItem[] = [item];
        const clusterSources = new Set<string>([item.source_name]);
        let maxPriority = getPriorityFromScore(item.importance_score);

        for (const other of sortedItems) {
            if (other.id === item.id) continue;
            if (processedItems.has(other.id)) continue;
            if (!other.geo_lat || !other.geo_lng) continue;

            // Check time window
            const timeDiff = Math.abs(
                new Date(item.published_at).getTime() - new Date(other.published_at).getTime()
            ) / (1000 * 60 * 60); // hours

            if (timeDiff > timeWindow) continue;

            // Check distance
            const distance = calculateDistance(
                item.geo_lat, item.geo_lng,
                other.geo_lat, other.geo_lng
            );

            if (distance <= geoRadius) {
                clusterItems.push(other);
                clusterSources.add(other.source_name);

                const otherPriority = getPriorityFromScore(other.importance_score);
                if (comparePriority(otherPriority, maxPriority) > 0) {
                    maxPriority = otherPriority;
                }
            }
        }

        // Only create cluster if meets minimum sources
        if (clusterSources.size >= minSources) {
            const cluster: GeoCluster = {
                id: `cluster-${item.id}`,
                center_lat: item.geo_lat,
                center_lng: item.geo_lng,
                news_count: clusterItems.length,
                sources: Array.from(clusterSources),
                max_priority: maxPriority,
                heat_score: calculateClusterHeatScore(clusterItems),
                news_ids: clusterItems.map(n => n.id),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            clusters.push(cluster);

            // Mark items as processed
            clusterItems.forEach(n => processedItems.add(n.id));

            // Calculate individual heat scores
            clusterItems.forEach(n => {
                const score = calculateHeatScore(n, clusterItems);
                itemHeatScores.set(n.id, score);
            });
        } else {
            // Calculate heat for non-clustered item
            const score = calculateHeatScore(item);
            itemHeatScores.set(item.id, score);
            processedItems.add(item.id);
        }
    }

    return {
        clusters,
        itemHeatScores,
        timestamp: new Date().toISOString()
    };
}

/**
 * Calculate cluster heat score
 */
function calculateClusterHeatScore(items: NewsItem[]): number {
    const baseScore = Math.min(items.length * 10, 50); // 10 points per item, max 50
    const maxImportance = Math.max(...items.map(i => i.importance_score || 0));
    const sourceBonus = new Set(items.map(i => i.source_name)).size * 5;

    return Math.min(100, baseScore + maxImportance * 0.3 + sourceBonus);
}

/**
 * Get priority from importance score
 */
function getPriorityFromScore(score?: number): 'P0' | 'P1' | 'P2' | 'P3' {
    if (!score) return 'P3';
    if (score >= 80) return 'P0';
    if (score >= 60) return 'P1';
    if (score >= 40) return 'P2';
    return 'P3';
}

/**
 * Compare priority levels
 */
function comparePriority(a: 'P0' | 'P1' | 'P2' | 'P3', b: 'P0' | 'P1' | 'P2' | 'P3'): number {
    const levels = { P0: 4, P1: 3, P2: 2, P3: 1 };
    return levels[a] - levels[b];
}

/**
 * Get heat level from score
 */
export function getHeatLevel(score: number): HeatLevel {
    if (score >= 76) return 'critical';
    if (score >= 51) return 'high';
    if (score >= 26) return 'medium';
    return 'low';
}

export default {
    calculateHeatScore,
    clusterNewsByLocation,
    getSourceTier,
    getAuthorityWeight,
    getHeatLevel
};
