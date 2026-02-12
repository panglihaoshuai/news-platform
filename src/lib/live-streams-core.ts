export type LiveChannelGroup = 'fed' | 'global';

export interface LiveChannelConfig {
  id: string;
  label: string;
  handle: string;
  fallbackVideoId?: string;
  group: LiveChannelGroup;
}

export interface ParsedYouTubeLiveResult {
  videoId: string | null;
  isLiveNow: boolean;
}

export function parseYouTubeHandle(raw: string): string | null {
  const value = (raw || '').trim();
  if (!/^@[A-Za-z0-9._-]{2,}$/.test(value)) {
    return null;
  }
  return value;
}

export function extractYouTubeVideoIdFromUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    if (host === 'youtu.be') {
      const shortId = url.pathname.split('/').filter(Boolean)[0];
      return shortId || null;
    }

    if (host.endsWith('youtube.com') || host.endsWith('youtube-nocookie.com')) {
      const watchId = url.searchParams.get('v');
      if (watchId) return watchId;

      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' && parts[1]) return parts[1];
      if (parts[0] === 'live' && parts[1]) return parts[1];
    }

    return null;
  } catch {
    return null;
  }
}

export function parseYouTubeLiveFromHtml(html: string): ParsedYouTubeLiveResult {
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const canonicalVideoId = canonicalMatch ? extractYouTubeVideoIdFromUrl(canonicalMatch[1]) : null;

  const jsonVideoIdMatch = html.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{6,})"/);
  const jsonVideoId = jsonVideoIdMatch ? jsonVideoIdMatch[1] : null;

  const isLiveByFlag =
    /"isLiveNow"\s*:\s*true/.test(html) || /"isLiveContent"\s*:\s*true/.test(html);

  return {
    videoId: canonicalVideoId || jsonVideoId,
    isLiveNow: isLiveByFlag,
  };
}

export function parseYouTubeLatestVideoIdFromHtml(html: string): string | null {
  const watchMatches = html.match(/\/watch\?v=([a-zA-Z0-9_-]{6,})/g);
  if (!watchMatches || watchMatches.length === 0) {
    return null;
  }

  const firstMatch = watchMatches[0].match(/v=([a-zA-Z0-9_-]{6,})/);
  return firstMatch ? firstMatch[1] : null;
}

export function parseYouTubeChannelIdFromHtml(html: string): string | null {
  const channelIdMatch = html.match(/"(?:externalId|channelId)"\s*:\s*"(UC[a-zA-Z0-9_-]{8,})"/);
  return channelIdMatch ? channelIdMatch[1] : null;
}

export function parseLatestVideoIdFromFeedXml(xml: string): string | null {
  const match = xml.match(/<yt:videoId>([a-zA-Z0-9_-]{6,})<\/yt:videoId>/);
  return match ? match[1] : null;
}

export function selectDefaultChannelId({
  channels,
  fedIsLive,
}: {
  channels: LiveChannelConfig[];
  fedIsLive: boolean;
}): string | null {
  const fedChannel = channels.find((channel) => channel.group === 'fed');
  if (fedIsLive && fedChannel) {
    return fedChannel.id;
  }

  const preferredGlobal = channels.find((channel) => channel.id === 'reuters' && channel.group === 'global');
  if (preferredGlobal) {
    return preferredGlobal.id;
  }

  const fallbackGlobal = channels.find((channel) => channel.group === 'global');
  if (fallbackGlobal) {
    return fallbackGlobal.id;
  }

  return channels[0]?.id || null;
}

export function resolveChannelVideoId({
  liveVideoId,
  latestVideoId,
  fallbackVideoId,
}: {
  liveVideoId: string | null;
  latestVideoId: string | null;
  fallbackVideoId?: string;
}): string | null {
  return liveVideoId || latestVideoId || fallbackVideoId || null;
}
