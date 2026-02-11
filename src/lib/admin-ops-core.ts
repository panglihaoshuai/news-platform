export type SourceHealthStatus = 'healthy' | 'stale' | 'failing' | 'disabled';

export interface SourceHealthInput {
  enabled: boolean;
  lastFetchedAt?: string | null;
  successRate?: number | null;
  staleMinutes?: number;
}

export interface RegionCoverageItem {
  region_code: string | null;
  source_id: string;
}

export interface ManualClassificationLite {
  news_item_id: string;
  created_at?: string;
}

export interface QualityNewsLite {
  id: string;
  classification_confidence?: number | null;
}

export function getSourceHealthStatus(input: SourceHealthInput): SourceHealthStatus {
  if (!input.enabled) return 'disabled';

  const successRate = input.successRate ?? 100;
  if (successRate < 60) return 'failing';

  const staleMinutes = input.staleMinutes ?? 180;
  if (!input.lastFetchedAt) return 'stale';

  const lastFetchedAtMs = new Date(input.lastFetchedAt).getTime();
  if (Number.isNaN(lastFetchedAtMs)) return 'stale';

  const ageMs = Date.now() - lastFetchedAtMs;
  if (ageMs > staleMinutes * 60_000) return 'stale';

  return 'healthy';
}

export function buildRegionCoverage(items: RegionCoverageItem[]): {
  byRegion: Record<string, number>;
  bySource: Record<string, number>;
} {
  return items.reduce(
    (acc, item) => {
      const region = item.region_code || 'UNKNOWN';
      acc.byRegion[region] = (acc.byRegion[region] || 0) + 1;
      acc.bySource[item.source_id] = (acc.bySource[item.source_id] || 0) + 1;
      return acc;
    },
    { byRegion: {} as Record<string, number>, bySource: {} as Record<string, number> }
  );
}

export function buildManualClassificationIndex(
  records: ManualClassificationLite[]
): Record<string, ManualClassificationLite> {
  const sorted = [...records].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  });

  const map: Record<string, ManualClassificationLite> = {};
  for (const record of sorted) {
    if (!map[record.news_item_id]) {
      map[record.news_item_id] = record;
    }
  }
  return map;
}

export function isLowConfidence(confidence: number | null | undefined, threshold = 0.75): boolean {
  return (confidence ?? 0) < threshold;
}

export function parseQueueFilter(raw: string | null): 'all' | 'unreviewed' | 'reviewed' | 'low-confidence' {
  const allowed = new Set(['all', 'unreviewed', 'reviewed', 'low-confidence']);
  if (raw && allowed.has(raw)) {
    return raw as 'all' | 'unreviewed' | 'reviewed' | 'low-confidence';
  }
  return 'all';
}
