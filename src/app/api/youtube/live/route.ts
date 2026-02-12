import { NextResponse } from 'next/server';
import {
  extractYouTubeVideoIdFromUrl,
  parseLatestVideoIdFromFeedXml,
  parseYouTubeChannelIdFromHtml,
  parseYouTubeLatestVideoIdFromHtml,
  parseYouTubeHandle,
  parseYouTubeLiveFromHtml,
} from '@/lib/live-streams-core';

export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawHandle = searchParams.get('handle') || '';
  const handle = parseYouTubeHandle(rawHandle);

  if (!handle) {
    return NextResponse.json(
      { error: 'Invalid handle. Expected format: @ChannelHandle' },
      { status: 400 }
    );
  }

  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    const [liveResponse, videosResponse, rootResponse] = await Promise.all([
      fetch(`https://www.youtube.com/${handle}/live`, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
        headers,
      }),
      fetch(`https://www.youtube.com/${handle}/videos`, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
        headers,
      }),
      fetch(`https://www.youtube.com/${handle}`, {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
        headers,
      }),
    ]);

    const finalUrl = liveResponse.url;
    const liveHtml = await liveResponse.text();
    const videosHtml = await videosResponse.text();
    const rootHtml = await rootResponse.text();

    const parsed = parseYouTubeLiveFromHtml(liveHtml);
    const redirectedVideoId = extractYouTubeVideoIdFromUrl(finalUrl);
    const liveVideoId = parsed.videoId || redirectedVideoId;

    const redirectedToWatch = finalUrl.includes('/watch') && finalUrl.includes('v=');
    const live = Boolean(parsed.isLiveNow || (redirectedToWatch && liveVideoId));
    const channelId = parseYouTubeChannelIdFromHtml(rootHtml) || parseYouTubeChannelIdFromHtml(videosHtml);

    let latestVideoId: string | null = null;
    if (channelId) {
      try {
        const feedResponse = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
          headers,
        });
        const feedXml = await feedResponse.text();
        latestVideoId = parseLatestVideoIdFromFeedXml(feedXml);
      } catch {
        latestVideoId = null;
      }
    }

    if (!latestVideoId) {
      latestVideoId = parseYouTubeLatestVideoIdFromHtml(videosHtml);
    }

    return NextResponse.json(
      {
        handle,
        live,
        videoId: live ? liveVideoId : null,
        liveVideoId: live ? liveVideoId : null,
        latestVideoId,
        channelId,
        checkedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        handle,
        live: false,
        videoId: null,
        error: 'Unable to check live status',
      },
      { status: 502 }
    );
  }
}
