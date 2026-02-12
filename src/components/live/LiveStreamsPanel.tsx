'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getThemeTokens, Theme } from '@/styles/designTokens';
import {
  LiveChannelConfig,
  resolveChannelVideoId,
  selectDefaultChannelId,
} from '@/lib/live-streams-core';

interface LiveStreamsPanelProps {
  theme?: Theme;
  pollIntervalMs?: number;
}

interface ChannelLiveStatus {
  live: boolean;
  liveVideoId: string | null;
  latestVideoId: string | null;
}

interface YouTubePlayer {
  loadVideoById: (videoId: string) => void;
  mute: () => void;
  unMute: () => void;
  playVideo: () => void;
  destroy: () => void;
}

interface YouTubePlayerEvent {
  data: number;
}

interface YouTubeNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars: Record<string, number | string>;
      events: {
        onReady: () => void;
        onError: (event: YouTubePlayerEvent) => void;
        onStateChange: (event: YouTubePlayerEvent) => void;
      };
    }
  ) => YouTubePlayer;
}

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeNamespace> | null = null;

const LIVE_CHANNELS: LiveChannelConfig[] = [
  {
    id: 'reuters',
    label: 'Reuters',
    handle: '@Reuters',
    fallbackVideoId: '3UKNY-z_KzA',
    group: 'global',
  },
  {
    id: 'bbc',
    label: 'BBC',
    handle: '@BBCNews',
    fallbackVideoId: 'TZf3lTlH4M8',
    group: 'global',
  },
  {
    id: 'cnn',
    label: 'CNN',
    handle: '@CNN',
    fallbackVideoId: '2i2PeXJnkM8',
    group: 'global',
  },
  {
    id: 'fed',
    label: 'Fed',
    handle: '@federalreserve',
    fallbackVideoId: 'KckGHaBLSn4',
    group: 'fed',
  },
];

function loadYouTubeApi(): Promise<YouTubeNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube API is only available in browser'));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YouTubeNamespace>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-youtube-iframe-api="1"]');

    window.onYouTubeIframeAPIReady = () => {
      if (window.YT?.Player) {
        resolve(window.YT);
        return;
      }
      reject(new Error('YouTube API initialized without Player'));
    };

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.youtubeIframeApi = '1';
      script.onerror = () => reject(new Error('Failed to load YouTube API script'));
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

async function fetchChannelLiveStatus(handle: string): Promise<ChannelLiveStatus> {
  try {
    const response = await fetch(`/api/youtube/live?handle=${encodeURIComponent(handle)}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return { live: false, liveVideoId: null, latestVideoId: null };
    }

    const data = (await response.json()) as {
      live?: boolean;
      liveVideoId?: string | null;
      latestVideoId?: string | null;
      videoId?: string | null;
    };

    const liveVideoId = data.liveVideoId || data.videoId || null;
    return {
      live: data.live === true,
      liveVideoId,
      latestVideoId: data.latestVideoId || null,
    };
  } catch {
    return { live: false, liveVideoId: null, latestVideoId: null };
  }
}

export function LiveStreamsPanel({ theme = 'dark', pollIntervalMs = 45_000 }: LiveStreamsPanelProps) {
  const tokens = getThemeTokens(theme);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);

  const [liveStatusById, setLiveStatusById] = useState<Record<string, ChannelLiveStatus>>({});
  const [activeChannelId, setActiveChannelId] = useState<string>(
    selectDefaultChannelId({ channels: LIVE_CHANNELS, fedIsLive: false }) || 'reuters'
  );
  const [statusMessage, setStatusMessage] = useState('Checking live feeds...');
  const [isMuted, setIsMuted] = useState(true);
  const [isFedPriority, setIsFedPriority] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());

  const channelMap = useMemo(
    () => Object.fromEntries(LIVE_CHANNELS.map((channel) => [channel.id, channel])) as Record<string, LiveChannelConfig>,
    []
  );

  const activeChannel = channelMap[activeChannelId];
  const activeChannelLabel = activeChannel?.label || 'channel';
  const activeStatus = liveStatusById[activeChannelId] || { live: false, liveVideoId: null, latestVideoId: null };
  const activeVideoId = activeChannel
    ? resolveChannelVideoId({
        liveVideoId: activeStatus.liveVideoId,
        latestVideoId: activeStatus.latestVideoId,
        fallbackVideoId: activeChannel.fallbackVideoId,
      })
    : null;

  const switchToNextChannel = useCallback((currentId: string) => {
    const currentIndex = LIVE_CHANNELS.findIndex((channel) => channel.id === currentId);
    if (currentIndex < 0) return;

    const candidates = [
      ...LIVE_CHANNELS.slice(currentIndex + 1),
      ...LIVE_CHANNELS.slice(0, currentIndex),
    ];

    const next = candidates.find((channel) => !unavailableIds.has(channel.id));
    if (next) {
      setActiveChannelId(next.id);
      setStatusMessage(`${channelMap[currentId]?.label || 'Channel'} unavailable. Switched to ${next.label}.`);
    }
  }, [channelMap, unavailableIds]);

  const refreshLiveStatus = useCallback(async () => {
    const entries = await Promise.all(
      LIVE_CHANNELS.map(async (channel) => [channel.id, await fetchChannelLiveStatus(channel.handle)] as const)
    );

    const nextStatus = Object.fromEntries(entries) as Record<string, ChannelLiveStatus>;
    setLiveStatusById(nextStatus);

    const fedChannel = LIVE_CHANNELS.find((channel) => channel.group === 'fed');
    const fedLive = fedChannel ? nextStatus[fedChannel.id]?.live === true : false;

    setIsFedPriority(fedLive);

    if (fedLive && fedChannel && activeChannelId !== fedChannel.id) {
      setActiveChannelId(fedChannel.id);
      setStatusMessage('LIVE: Fed stream detected and prioritized.');
      return;
    }

    if (!fedLive && activeChannelId === fedChannel?.id) {
      const playableGlobal = LIVE_CHANNELS.find((channel) => {
        if (channel.group !== 'global') return false;
        if (unavailableIds.has(channel.id)) return false;
        const status = nextStatus[channel.id];
        return Boolean(status?.liveVideoId || status?.latestVideoId || channel.fallbackVideoId);
      });

      const fallbackId = playableGlobal?.id || selectDefaultChannelId({ channels: LIVE_CHANNELS, fedIsLive: false });
      if (fallbackId) {
        setActiveChannelId(fallbackId);
      }
    }
  }, [activeChannelId, unavailableIds]);

  useEffect(() => {
    const run = async () => {
      await refreshLiveStatus();
      setStatusMessage('Live feeds ready.');
    };

    run();
    const timer = window.setInterval(refreshLiveStatus, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [pollIntervalMs, refreshLiveStatus]);

  useEffect(() => {
    let disposed = false;

    const setup = async () => {
      if (!playerContainerRef.current) return;

      if (!activeVideoId) {
        setIsVideoPlaying(false);
        setStatusMessage(`No playable video found for ${activeChannelLabel}.`);
        return;
      }

      const youtube = await loadYouTubeApi();
      if (disposed) return;

      if (!playerRef.current) {
        playerRef.current = new youtube.Player(playerContainerRef.current, {
          videoId: activeVideoId,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              playerRef.current?.mute();
              playerRef.current?.playVideo();
              setIsMuted(true);
              setStatusMessage(`Loading ${activeChannelLabel} feed...`);
            },
            onError: () => {
              setIsVideoPlaying(false);
              setUnavailableIds((previous) => {
                const next = new Set(previous);
                next.add(activeChannelId);
                return next;
              });
              switchToNextChannel(activeChannelId);
            },
            onStateChange: (event) => {
              const playing = event.data === 1;
              setIsVideoPlaying(playing);
              if (playing) {
                setStatusMessage(`Now playing: ${activeChannelLabel}.`);
              }
            },
          },
        });
        return;
      }

      playerRef.current.loadVideoById(activeVideoId);
      playerRef.current.mute();
      playerRef.current.playVideo();
      setIsMuted(true);
    };

    setup();

    return () => {
      disposed = true;
    };
  }, [activeChannelId, activeChannelLabel, activeVideoId, switchToNextChannel]);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, []);

  const handleToggleMute = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      playerRef.current.unMute();
      playerRef.current.playVideo();
      setIsMuted(false);
      return;
    }

    playerRef.current.mute();
    setIsMuted(true);
  };

  const handleChannelClick = (channelId: string) => {
    setStatusMessage(`Switched to ${channelMap[channelId]?.label || 'channel'}.`);
    setActiveChannelId(channelId);
  };

  return (
    <section
      style={{
        backgroundColor: tokens.bg.secondary,
        border: `1px solid ${tokens.border.default}`,
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          borderBottom: `1px solid ${tokens.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: tokens.text.primary, fontWeight: 700, fontSize: 11, letterSpacing: 0.7 }}>LIVE MONITOR</span>
          {isFedPriority && (
            <span
              style={{
                color: '#fff',
                backgroundColor: tokens.priority.p0,
                fontSize: 9,
                fontWeight: 700,
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              LIVE: FED
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={handleToggleMute}
            style={{
              border: `1px solid ${tokens.border.default}`,
              borderRadius: 4,
              backgroundColor: tokens.bg.tertiary,
              color: tokens.text.primary,
              fontSize: 10,
              minHeight: 32,
              padding: '0 10px',
              cursor: 'pointer',
            }}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </button>

          <a
            href={`https://www.youtube.com/${activeChannel?.handle || '@Reuters'}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              border: `1px solid ${tokens.border.default}`,
              borderRadius: 4,
              backgroundColor: tokens.bg.tertiary,
              color: tokens.text.secondary,
              fontSize: 10,
              minHeight: 32,
              padding: '0 10px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Open YouTube
          </a>
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '6px 8px',
          borderBottom: `1px solid ${tokens.border.default}`,
          backgroundColor: tokens.bg.primary,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        {LIVE_CHANNELS.map((channel) => {
          const isActive = channel.id === activeChannelId;
          const isLive = liveStatusById[channel.id]?.live === true;
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => handleChannelClick(channel.id)}
              style={{
                border: `1px solid ${isActive ? tokens.accent.info : tokens.border.default}`,
                borderRadius: 4,
                backgroundColor: isActive ? tokens.bg.hover : tokens.bg.secondary,
                color: isActive ? tokens.text.primary : tokens.text.secondary,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.2,
                minHeight: 32,
                padding: '0 9px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                flexShrink: 0,
              }}
            >
              <span>{channel.label}</span>
              {isLive && (
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: tokens.priority.p0,
                    display: 'inline-block',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#050505',
          padding: 8,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            minHeight: 140,
            aspectRatio: '16 / 9',
            maxHeight: '100%',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#000',
          }}
        >
          <div ref={playerContainerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      <footer
        style={{
          borderTop: `1px solid ${tokens.border.default}`,
          padding: '6px 10px',
          fontSize: 10,
          color: tokens.text.muted,
          backgroundColor: tokens.bg.primary,
          lineHeight: 1.4,
        }}
      >
        {statusMessage} {isVideoPlaying ? ' (PLAYING)' : ' (IDLE)'}
      </footer>
    </section>
  );
}

export default LiveStreamsPanel;
