'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { InteractiveMap } from '@/components/InteractiveMap';
import { NewsFeed } from '@/components/NewsFeed';
import { Filters } from '@/components/Filters';
import { TerminalLayout } from '@/components/layout/TerminalLayout';
import { TickerBar } from '@/components/layout/TickerBar';
import { StatusBar } from '@/components/layout/StatusBar';
import { MarketDataPanel } from '@/components/layout/MarketDataPanel';
import { LiveStreamsPanel } from '@/components/live/LiveStreamsPanel';
import { MapLayersPanel } from '@/components/map/MapLayersPanel';
import { NewsItem, NewsFilters, RSSSource, Theme } from '@/types/news';
import { useTheme, ThemeProvider } from '@/hooks/useTheme';
import { useDisplayMode } from '@/hooks/useDisplayMode';
import { useMapDisplayMode } from '@/hooks/useMapDisplayMode';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { createClient } from '@supabase/supabase-js';
import { getCountriesByRegion, getCountryByCode, COUNTRIES } from '@/config/region-mapping';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function normalizeLanguage(value?: string | null, title?: string): 'en' | 'zh' {
  const lower = (value || '').toLowerCase();
  if (lower.startsWith('zh') || lower === 'cn' || lower === 'chinese') return 'zh';
  if (lower.startsWith('en') || lower === 'english') return 'en';
  if (title && /[\u4e00-\u9fff]/.test(title)) return 'zh';
  return 'en';
}

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
    country: 'all',
    categories: [],
    density: 'high',
    contentLanguage: 'all',
  });
  const [isOnline, setIsOnline] = useState(true);
  const [hasLoadedNews, setHasLoadedNews] = useState(false);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [latency, setLatency] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [marketExpanded, setMarketExpanded] = useState(true);
  const latestTopNewsIdRef = useRef<string | null>(null);

  const countryOptions = filters.region === 'global'
    ? availableCountries
    : getCountriesByRegion(filters.region).map((country) => country.code);

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

      if (filters.country !== 'all') {
        // Convert ISO country code to full country name for database query
        const countryInfo = getCountryByCode(filters.country);
        if (countryInfo) {
          query = query.eq('country_code', countryInfo.name);
        }
      }

      const limit = filters.density === 'low' ? 20 : filters.density === 'medium' ? 50 : 100;
      query = query.limit(limit * 2);

      const { data, error } = await query;
      setLatency(Date.now() - start);

      if (data) {
        // Convert full country names to ISO codes for filter buttons
        const countryNames = Array.from(
          new Set(
            data
              .map((item) => item.country_code)
              .filter((code): code is string => Boolean(code))
          )
        );
        // Map country names to ISO codes
        const countryCodeMap: Record<string, string> = {};
        COUNTRIES.forEach(c => {
          countryCodeMap[c.name.toLowerCase()] = c.code;
          countryCodeMap[c.code.toLowerCase()] = c.code;
        });
        const isoCodes = countryNames
          .map(name => countryCodeMap[name.toLowerCase()])
          .filter(Boolean);
        setAvailableCountries(isoCodes);

        const enrichedNews: NewsItem[] = data
          .map(item => {
            const source = sources.find(s => s.id === item.source_id);
            return {
              ...item,
              source_name: source?.name || item.source_id || 'Unknown Source',
              source_language: normalizeLanguage(source?.language || item.source_language, item.title),
            };
          })
          .filter(item => {
            if (filters.contentLanguage !== 'all' && item.source_language !== filters.contentLanguage) {
              return false;
            }
            
            // Category filtering based on title keywords since database stores "General"
            if (filters.categories && filters.categories.length > 0) {
              const title = item.title?.toLowerCase() || '';
              const categoryKeywords: Record<string, string[]> = {
                politics: ['politic', 'election', 'government', 'president', 'minister', 'parliament', 'vote', 'party', 'trump', 'biden', 'congress', 'policy', 'sanction', 'diplomat', 'war', 'peace', 'treaty', 'summit', 'justice', 'capitol', 'riot', 'department', 'minister', 'conservative', 'labour', 'democrat', 'republican', 'leader', 'cabinet', 'administration', 'regime', 'opposition', 'reform', 'constitution', 'referendum', 'coalition', 'mao', 'jinping', 'brexit', 'boris', 'modi', 'putin', 'zelensky', 'macron', 'scholz', 'sunak', 'trudeau', 'morrison', 'albanese'],
                military: ['military', 'army', 'weapon', 'defense', 'attack', 'bomb', 'missile', 'navy', 'air force', 'soldier', 'combat', 'invasion', 'gaza', 'israel', 'iran', 'ukraine', 'defence', 'armed', 'forces', 'troop', 'battle', 'conflict', 'drone', 'aircraft', 'tank', 'artillery', 'radar', 'intelligence', 'security', 'pentagon', 'nato', 'militant', 'terrorist', 'jihadist'],
                economy: ['economy', 'economic', 'market', 'stock', 'trade', 'tariff', 'gdp', 'inflation', 'recession', 'bank', 'financial', 'investment', 'business', 'company', 'growth', 'revenue', 'profit', 'commerce', 'industry', 'manufacturing', 'supply', 'demand', 'price', 'cost', 'budget', 'fiscal', 'monetary', 'currency', 'exchange', 'rate', 'debt', 'loan', 'mortgage', 'tax', 'subsidy', 'export', 'import', 'billion', 'million', 'deal', 'merger', 'acquisition', 'earnings', 'shares', 'stocks', 'bonds', 'fund', 'investor', 'shareholder', 'ceo', 'executive', 'startup', 'fintech'],
                technology: ['technology', 'tech', 'ai', 'artificial intelligence', 'digital', 'internet', 'cyber', 'software', 'app', 'google', 'apple', 'microsoft', 'amazon', 'meta', 'chip', 'semiconductor', 'data', 'computer', 'smartphone', 'device', 'innovation', 'robot', 'automation', 'blockchain', 'crypto', 'bitcoin', 'ethereum', 'nft', 'cloud', 'computing', 'algorithm', 'code', 'programming', 'hacker', 'cybersecurity', 'privacy', 'online', 'platform', 'website', 'social media', 'instagram', 'youtube', 'tiktok', 'twitter', 'x', 'electric vehicle', 'ev', 'tesla', 'spacex', 'satellite', '5g', '6g', 'quantum'],
                environment: ['environment', 'climate', 'pollution', 'carbon', 'green', 'renewable', 'energy', 'oil', 'gas', 'fossil', 'warming', 'weather', 'disaster', 'earthquake', 'flood', 'nature', 'ecology', 'sustainable', 'conservation', 'biodiversity', 'emission', 'net zero', 'carbon neutral', 'solar', 'wind', 'hydro', 'nuclear', 'power', 'electricity', 'drought', 'wildfire', 'tsunami', 'hurricane', 'typhoon', 'storm', 'rainfall', 'temperature', 'heatwave', 'drought', 'desertification', 'deforestation', 'plastic', 'waste', 'recycling'],
                society: ['society', 'social', 'protest', 'strike', 'rights', 'justice', 'crime', 'police', 'court', 'law', 'education', 'health', 'medical', 'covid', 'pandemic', 'community', 'culture', 'religion', 'gender', 'equality', 'discrimination', 'racism', 'poverty', 'inequality', 'welfare', 'housing', 'homeless', 'migration', 'refugee', 'immigration', 'border', 'citizenship', 'democracy', 'freedom', 'censorship', 'press', 'media', 'journalism', 'misinformation', 'disinformation', 'public', 'survey', 'poll', 'opinion', 'lifestyle', 'family', 'marriage', 'divorce', 'birth', 'death', 'suicide', 'mental health', 'addiction', 'drug', 'alcohol', 'crime', 'criminal', 'prison', 'sentence', 'trial', 'lawsuit', 'legal', 'illegal', 'constitution', 'court', 'judge', 'justice', 'police', 'officer', 'arrest', 'shooting', 'violence', 'abuse', 'harassment', 'assault', 'murder', 'theft', 'fraud', 'corruption', 'scandal'],
                sports: ['sports', 'sport', 'football', 'soccer', 'basketball', 'baseball', 'tennis', 'olympic', 'game', 'match', 'team', 'player', 'champion', 'league', 'tournament', 'athlete', 'coach', 'manager', 'score', 'goal', 'point', 'win', 'victory', 'defeat', 'draw', 'tie', 'race', 'run', 'medal', 'gold', 'silver', 'bronze', 'record', 'world cup', 'premier league', 'nfl', 'nba', 'mlb', 'nhl', 'fifa', 'uefa', 'champions league', 'super bowl', 'grand slam', 'wimbledon', 'us open', 'french open', 'australian open', 'formula 1', 'f1', 'cricket', 'rugby', 'golf', 'boxing', 'mma', 'ufc', 'wrestling', 'gymnastics', 'swimming', 'athletics', 'marathon', 'cycling', 'skiing', 'skating', 'snowboard', 'surfing'],
                entertainment: ['entertainment', 'celebrity', 'movie', 'film', 'cinema', 'music', 'album', 'concert', 'show', 'tv', 'television', 'hollywood', 'actor', 'actress', 'star', 'festival', 'drama', 'series', 'netflix', 'streaming', 'director', 'producer', 'song', 'singer', 'musician', 'band', 'artist', 'album', 'single', 'chart', 'hit', 'release', 'premiere', 'box office', 'award', 'oscar', 'emmy', 'grammy', 'golden globe', 'cannes', 'sundance', 'comic con', 'fashion', 'model', 'designer', 'royal', 'wedding', 'divorce', 'scandal', 'gossip', 'rumor', 'relationship', 'dating', 'affair', 'lifestyle', 'travel', 'food', 'restaurant', 'chef', 'cooking', 'recipe', 'book', 'novel', 'author', 'publishing', 'bestseller', 'museum', 'art', 'exhibition', 'theater', 'broadway', 'opera', 'ballet', 'dance', 'comedy', 'stand-up']
              };
              
              const hasMatchingCategory = filters.categories.some(cat => {
                const keywords = categoryKeywords[cat] || [];
                return keywords.some(keyword => title.includes(keyword));
              });
              if (!hasMatchingCategory) return false;
            }
            
            return true;
          });

        setNews(enrichedNews.slice(0, limit));
        const latest = enrichedNews[0];
        if (latest && latest.id !== latestTopNewsIdRef.current) {
          setSelectedId(latest.id);
          latestTopNewsIdRef.current = latest.id;
        }
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

  const handleMapSelect = useCallback((newsId: string) => {
    setSelectedId(newsId);
    const selected = news.find((item) => item.id === newsId);
    if (!selected) return;
    const countryCode = selected?.country_code || null;
    if (!countryCode) return;

    setFilters((prev) => {
      const nextRegion = selected.region_code || prev.region;
      if (prev.country === countryCode && prev.region === nextRegion) {
        return prev;
      }
      return {
        ...prev,
        region: nextRegion,
        country: countryCode,
      };
    });
  }, [news]);

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
            onSelect={handleMapSelect}
            theme={theme}
            displayMode={mapDisplayMode}
            focusRegion={filters.region}
            focusCountry={filters.country}
          />
        ),
        left: (
          <MapLayersPanel
            mapDisplayMode={mapDisplayMode}
            onMapModeChange={setMapDisplayMode}
            theme={theme}
          />
        ),
        news: (
          <>
            <Filters
              filters={filters}
              onChange={setFilters}
              theme={theme}
              mapDisplayMode={mapDisplayMode}
              onMapModeChange={setMapDisplayMode}
              countries={countryOptions}
            />
            <NewsFeed
              news={news}
              selectedId={selectedId}
              onSelect={setSelectedId}
              theme={theme}
              hasLoaded={hasLoadedNews}
            />
          </>
        ),
        market: (
          <MarketDataPanel
            theme={theme}
            expanded={marketExpanded}
            onToggleExpand={() => setMarketExpanded(!marketExpanded)}
            autoRefresh={true}
          />
        ),
        bottom: (
          <LiveStreamsPanel theme={theme} />
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
