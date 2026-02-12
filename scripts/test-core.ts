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

import {
  extractYouTubeVideoIdFromUrl,
  parseLatestVideoIdFromFeedXml,
  parseYouTubeChannelIdFromHtml,
  parseYouTubeLatestVideoIdFromHtml,
  parseYouTubeHandle,
  parseYouTubeLiveFromHtml,
  resolveChannelVideoId,
  selectDefaultChannelId,
  type LiveChannelConfig,
} from '../src/lib/live-streams-core';

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

test('parseYouTubeHandle validates @handle input', () => {
  assert.equal(parseYouTubeHandle('@Reuters'), '@Reuters');
  assert.equal(parseYouTubeHandle('Reuters'), null);
  assert.equal(parseYouTubeHandle('@'), null);
  assert.equal(parseYouTubeHandle('@reuters!!'), null);
});

test('extractYouTubeVideoIdFromUrl parses common YouTube URLs', () => {
  assert.equal(extractYouTubeVideoIdFromUrl('https://www.youtube.com/watch?v=abc123'), 'abc123');
  assert.equal(extractYouTubeVideoIdFromUrl('https://youtu.be/xyz789'), 'xyz789');
  assert.equal(extractYouTubeVideoIdFromUrl('not-a-url'), null);
});

test('parseYouTubeLiveFromHtml extracts live video id and status', () => {
  const liveHtml = `
    <html><head>
      <link rel="canonical" href="https://www.youtube.com/watch?v=LIVE123" />
    </head><body>
      <script>
        var ytInitialPlayerResponse = {"videoDetails":{"videoId":"LIVE123","isLiveContent":true},"microformat":{"playerMicroformatRenderer":{"liveBroadcastDetails":{"isLiveNow":true}}}};
      </script>
    </body></html>
  `;

  const result = parseYouTubeLiveFromHtml(liveHtml);
  assert.equal(result.videoId, 'LIVE123');
  assert.equal(result.isLiveNow, true);
});

test('parseYouTubeLatestVideoIdFromHtml extracts first watch id', () => {
  const html = `
    <a href="/watch?v=LATEST1">v1</a>
    <a href="/watch?v=LATEST2">v2</a>
  `;

  assert.equal(parseYouTubeLatestVideoIdFromHtml(html), 'LATEST1');
});

test('parseYouTubeChannelIdFromHtml extracts channel id', () => {
  const html = '<script>var data={"externalId":"UCabcDEF123_456XYZ"};</script>';
  assert.equal(parseYouTubeChannelIdFromHtml(html), 'UCabcDEF123_456XYZ');
});

test('parseLatestVideoIdFromFeedXml extracts latest feed video id', () => {
  const xml = '<feed><entry><yt:videoId>VIDE0123</yt:videoId></entry></feed>';
  assert.equal(parseLatestVideoIdFromFeedXml(xml), 'VIDE0123');
});

test('resolveChannelVideoId prefers live then latest then fallback', () => {
  assert.equal(resolveChannelVideoId({ liveVideoId: 'LIVE1', latestVideoId: 'LATEST1', fallbackVideoId: 'F1' }), 'LIVE1');
  assert.equal(resolveChannelVideoId({ liveVideoId: null, latestVideoId: 'LATEST1', fallbackVideoId: 'F1' }), 'LATEST1');
  assert.equal(resolveChannelVideoId({ liveVideoId: null, latestVideoId: null, fallbackVideoId: 'F1' }), 'F1');
});

test('selectDefaultChannelId honors Fed live override', () => {
  const channels: LiveChannelConfig[] = [
    { id: 'reuters', label: 'Reuters', handle: '@Reuters', fallbackVideoId: 'r1', group: 'global' },
    { id: 'bbc', label: 'BBC', handle: '@BBCNews', fallbackVideoId: 'b1', group: 'global' },
    { id: 'cnn', label: 'CNN', handle: '@CNN', fallbackVideoId: 'c1', group: 'global' },
    { id: 'fed', label: 'Fed', handle: '@federalreserve', fallbackVideoId: 'f1', group: 'fed' },
  ];

  assert.equal(selectDefaultChannelId({ channels, fedIsLive: true }), 'fed');
  assert.equal(selectDefaultChannelId({ channels, fedIsLive: false }), 'reuters');
});
