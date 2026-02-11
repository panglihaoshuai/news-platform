import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLocalizedAdminPath,
  extractLocaleFromPathname,
  parseNewsLimit,
  validateManualClassificationInput,
} from '../src/lib/admin-core';
import {
  buildManualClassificationIndex,
  buildRegionCoverage,
  getSourceHealthStatus,
  isLowConfidence,
  parseQueueFilter,
} from '../src/lib/admin-ops-core';

test('extractLocaleFromPathname resolves locale prefixes', () => {
  assert.equal(extractLocaleFromPathname('/zh/admin'), 'zh');
  assert.equal(extractLocaleFromPathname('/en/admin/keywords'), 'en');
  assert.equal(extractLocaleFromPathname('/admin-login'), 'en');
});

test('buildLocalizedAdminPath builds locale-aware admin routes', () => {
  assert.equal(buildLocalizedAdminPath('zh'), '/zh/admin');
  assert.equal(buildLocalizedAdminPath('en', '/keywords'), '/en/admin/keywords');
  assert.equal(buildLocalizedAdminPath('zh', 'test'), '/zh/admin/test');
});

test('parseNewsLimit sanitizes limit query parameter', () => {
  assert.equal(parseNewsLimit(null), 50);
  assert.equal(parseNewsLimit('10'), 10);
  assert.equal(parseNewsLimit('0'), 50);
  assert.equal(parseNewsLimit('999'), 100);
});

test('validateManualClassificationInput validates required fields', () => {
  const invalid = validateManualClassificationInput({
    newsItemId: '',
    categories: [],
    priority: 'P1',
  });

  assert.equal(invalid.valid, false);
  assert.equal(invalid.error, 'newsItemId is required');
});

test('validateManualClassificationInput normalizes valid payload', () => {
  const result = validateManualClassificationInput({
    newsItemId: 'abc',
    categories: [' 政治 ', '', '科技'],
    priority: 'p2',
    notes: '  reviewed ',
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.normalized, {
    categories: ['政治', '科技'],
    priority: 'P2',
    notes: 'reviewed',
  });
});

test('getSourceHealthStatus computes expected source states', () => {
  assert.equal(getSourceHealthStatus({ enabled: false }), 'disabled');
  assert.equal(getSourceHealthStatus({ enabled: true, successRate: 40, lastFetchedAt: new Date().toISOString() }), 'failing');
  assert.equal(getSourceHealthStatus({ enabled: true, successRate: 90, lastFetchedAt: null }), 'stale');
  assert.equal(getSourceHealthStatus({ enabled: true, successRate: 90, lastFetchedAt: new Date().toISOString() }), 'healthy');
});

test('buildRegionCoverage aggregates source and region counts', () => {
  const coverage = buildRegionCoverage([
    { region_code: 'NA', source_id: 's1' },
    { region_code: 'NA', source_id: 's1' },
    { region_code: 'EU', source_id: 's2' },
    { region_code: null, source_id: 's3' },
  ]);

  assert.deepEqual(coverage.byRegion, { NA: 2, EU: 1, UNKNOWN: 1 });
  assert.deepEqual(coverage.bySource, { s1: 2, s2: 1, s3: 1 });
});

test('buildManualClassificationIndex keeps latest record per news item', () => {
  const index = buildManualClassificationIndex([
    { news_item_id: 'n1', created_at: '2026-02-11T10:00:00.000Z' },
    { news_item_id: 'n1', created_at: '2026-02-11T11:00:00.000Z' },
    { news_item_id: 'n2', created_at: '2026-02-11T09:00:00.000Z' },
  ]);

  assert.equal(index.n1.created_at, '2026-02-11T11:00:00.000Z');
  assert.equal(index.n2.created_at, '2026-02-11T09:00:00.000Z');
});

test('queue filter and low-confidence helpers sanitize input', () => {
  assert.equal(parseQueueFilter('reviewed'), 'reviewed');
  assert.equal(parseQueueFilter('weird'), 'all');
  assert.equal(isLowConfidence(0.7), true);
  assert.equal(isLowConfidence(0.9), false);
});
