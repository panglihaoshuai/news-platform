'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { InteractiveMap } from '@/components/InteractiveMap';
import { NewsFeed } from '@/components/NewsFeed';
import { Filters } from '@/components/Filters';
import { TerminalLayout } from '@/components/layout/TerminalLayout';
import { TickerBar } from '@/components/layout/TickerBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { MarketDataPanel } from '@/components/layout/MarketDataPanel';
import { NewsItem, NewsFilters, RSSSource, Theme } from '@/types/news';
import { useTheme, ThemeProvider } from '@/hooks/useTheme';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useMapDisplayMode } from '@/hooks/useMapDisplayMode';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// Main Page Content Component
// ============================================================================

function PageContent({ locale }: { locale: string }) {
  const { theme } = useTheme();
  const { displayMode, cycleDisplayMode } = useDisplayMode();
  const { mapDisplayMode, setMapDisplayMode } = useMapDisplayMode();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<NewsFilters>({
    timeRange: '24h',
    region: 'global',
    categories: [],
    density: 'medium',
    contentLanguage: locale === 'zh' ? 'zh' : 'en',
  });
  const [isOnline, setIsOnline] = useState(true);
  const [hasLoadedNews, setHasLoadedNews] = useState(false);
  const [latency, setLatency] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [marketExpanded, setMarketExpanded] = useState(true);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onToggleAutoPilot: () => { /* TODO: Implement auto-pilot toggle */ },
    onToggleFullscreen: () => { /* TODO: Implement fullscreen toggle */ },
    onRefetch: () => { /* TODO: Implement manual refresh */ },
  });

  // Fetch Sources First
  useEffect(() => {
    async function fetchSources() {
      const start = Date.now();
      const { data, error } = await supabase.from('rss_sources').select('*');
      setLatency(Date.now() - start);
      if (error) {
        setIsOnline(false);
        return;
      }
      if (data) {
        setSources(data as RSSSource[]);
        setIsOnline(true);
      }
    }
    fetchSources();
  }, []);

  // Fetch News and Merge with Source Info
  useEffect(() => {
    async function fetchNews() {
      const start = Date.now();
      let query = supabase
        .from('news_items')
        .select('*')
        .order('published_at', { ascending: false });

      if (filters.region !== 'global') {
        query = query.eq('region_code', filters.region);
      }

      const limit = filters.density === 'low' ? 20 : filters.density === 'medium' ? 50 : 100;
      query = query.limit(limit * 2);

      const { data, error } = await query;
      setLatency(Date.now() - start);

      if (data) {
        const enrichedNews: NewsItem[] = data
          .map(item => {
            const source = sources.find(s => s.id === item.source_id);
            return {
              ...item,
              source_name: source?.name || item.source_id || 'Unknown Source',
              source_language: source?.language || 'en'
            };
          })
          .filter(item => {
            if (filters.contentLanguage !== 'all' && item.source_language !== filters.contentLanguage) {
              return false;
            }
            
            if (filters.categories && filters.categories.length > 0) {
              const itemCategories = item.categories || [];
              const hasMatchingCategory = filters.categories.some(cat => 
                itemCategories.includes(cat)
              );
              if (!hasMatchingCategory) return false;
            }
            
            return true;
          });

        setNews(enrichedNews.slice(0, limit));
        setLastUpdated(new Date().toISOString());
      }
      if (error) {
        console.error('Error loading news:', error);
        setIsOnline(false);
      }

      setHasLoadedNews(true);
    }

    fetchNews();

    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, [filters, sources]);

  const handleNewsSelect = useCallback((newsId: string) => {
    setSelectedId(newsId);
  }, []);

  const handleToggleTheme = useCallback(() => {
    const themes: Theme[] = ['dark', 'amber', 'light'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    // TODO: Implement theme switching
  }, [theme]);

  return (
    <TerminalLayout
      theme={theme}
      showTicker={true}
      showStatus={true}
      showMarket={marketExpanded}
    >
      {{
        ticker: (
          <TickerBar
            news={news}
            theme={theme}
            onNewsSelect={handleNewsSelect}
            autoPlay={true}
          />
        ),
        map: (
          <InteractiveMap
            news={news}
            selectedId={selectedId}
            onSelect={setSelectedId}
            theme={theme}
            displayMode={mapDisplayMode}
          />
        ),
        news: (
          <NewsFeed
            news={news}
            selectedId={selectedId}
            onSelect={setSelectedId}
            theme={theme}
            hasLoaded={hasLoadedNews}
          />
        ),
        market: (
          <MarketDataPanel
            theme={theme}
            expanded={marketExpanded}
            onToggleExpand={() => setMarketExpanded(!marketExpanded)}
            autoRefresh={true}
          />
        ),
        status: (
          <StatusBar
            theme={theme}
            newsCount={news.length}
            lastUpdated={lastUpdated}
            latency={latency}
            isOnline={isOnline}
            autoPilotEnabled={false}
            onToggleTheme={handleToggleTheme}
          />
        ),
      }}
    </TerminalLayout>
  );
}

// ============================================================================
// Main Export
// ============================================================================

export default function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);

  return (
    <ThemeProvider defaultTheme="dark">
      <PageContent locale={locale} />
    </ThemeProvider>
  );
}
