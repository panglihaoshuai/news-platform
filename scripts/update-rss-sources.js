/**
 * RSS Sources Update Script
 * Replaces blocked Google News RSS with authoritative direct RSS
 * Run with: node scripts/update-rss-sources.js
 */

const { createClient } = require('@supabase/supabase-js');

// Use environment variables or defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohcftfracugttdjgqwid.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9oY2Z0ZnJhY3VndHRkamdxd2lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDI3OTQ2MSwiZXhwIjoyMDg1ODU1NDYxfQ.zG4QNYOXL3_byg5It_x2kcoeyd5Kkog1MwIJ9Kc4C3M';

const supabase = createClient(supabaseUrl, supabaseKey);

// Authoritative direct RSS sources (replacing Google News RSS)
const authoritativeSources = [
  // Global / English Sources
  {
    name: 'Reuters Global',
    feed_url: 'https://www.reutersagency.com/feed/',
    language: 'en',
    country_code: null,
    enabled: true
  },
  {
    name: 'BBC World',
    feed_url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    language: 'en',
    country_code: 'GB',
    enabled: true
  },
  {
    name: 'NYT World',
    feed_url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    language: 'en',
    country_code: 'US',
    enabled: true
  },
  {
    name: 'Al Jazeera',
    feed_url: 'https://www.aljazeera.com/xml/rss/all.xml',
    language: 'en',
    country_code: 'QA',
    enabled: true
  },
  {
    name: 'France 24',
    feed_url: 'https://www.france24.com/en/rss',
    language: 'en',
    country_code: 'FR',
    enabled: true
  },
  {
    name: 'Africa News',
    feed_url: 'https://www.africanews.com/feed/rss',
    language: 'en',
    country_code: 'XX',
    enabled: true
  },
  {
    name: 'The Guardian',
    feed_url: 'https://www.theguardian.com/world/rss',
    language: 'en',
    country_code: 'GB',
    enabled: true
  },
  {
    name: 'CNA',
    feed_url: 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml',
    language: 'en',
    country_code: 'SG',
    enabled: true
  },
  {
    name: 'ABC Australia',
    feed_url: 'https://www.abc.net.au/news/feed/51120/rss.xml',
    language: 'en',
    country_code: 'AU',
    enabled: true
  },
  {
    name: 'DW News',
    feed_url: 'https://rss.dw.com/xml/rss-en-all',
    language: 'en',
    country_code: 'DE',
    enabled: true
  },
  {
    name: 'Kyodo News',
    feed_url: 'https://english.kyodonews.net/rss/news.xml',
    language: 'en',
    country_code: 'JP',
    enabled: true
  },

  // Chinese Sources
  {
    name: '联合早报',
    feed_url: 'https://www.zaobao.com.sg/rss/realtime/china',
    language: 'zh',
    country_code: 'SG',
    enabled: true
  },
  {
    name: 'BBC 中文',
    feed_url: 'https://www.bbc.com/zhongwen/simp/index.xml',
    language: 'zh',
    country_code: 'GB',
    enabled: true
  },
  {
    name: 'FT 中文',
    feed_url: 'http://www.ftchinese.com/rss/feed',
    language: 'zh',
    country_code: 'GB',
    enabled: true
  },
  {
    name: 'RFI 中文',
    feed_url: 'https://www.rfi.fr/cn/rss',
    language: 'zh',
    country_code: 'FR',
    enabled: true
  },
  {
    name: 'WSJ 中文',
    feed_url: 'https://cn.wsj.com/rss/CN_China.xml',
    language: 'zh',
    country_code: 'US',
    enabled: true
  },
  {
    name: 'NYT 中文',
    feed_url: 'https://cn.nytimes.com/rss/',
    language: 'zh',
    country_code: 'US',
    enabled: true
  },
  {
    name: 'Solidot',
    feed_url: 'https://www.solidot.org/index.rss',
    language: 'zh',
    country_code: 'CN',
    enabled: true
  },

  // RSSHub.app proxied sources (for sites that require scraping)
  {
    name: '路透中文',
    feed_url: 'https://cn.reuters.com/rssFeed/chinaNews/',
    language: 'zh',
    country_code: 'CN',
    enabled: true
  },
  {
    name: 'Xinhua World',
    feed_url: 'https://www.xinhuanet.com/world/rss',
    language: 'zh',
    country_code: 'CN',
    enabled: true
  }
];

async function updateRSSSources() {
  console.log('=== RSS Sources Update Script ===\n');

  try {
    // Step 1: Disable all current Google News RSS sources
    console.log('1. Disabling Google News RSS sources...');
    const { data: googleNewsSources, error: googleError } = await supabase
      .from('rss_sources')
      .select('id, name, feed_url')
      .ilike('feed_url', '%news.google.com%');

    if (googleError) {
      console.error('   ❌ Error fetching Google News sources:', googleError.message);
    } else if (googleNewsSources && googleNewsSources.length > 0) {
      const ids = googleNewsSources.map(s => s.id);
      const { error: disableError } = await supabase
        .from('rss_sources')
        .update({ enabled: false })
        .in('id', ids);

      if (disableError) {
        console.error('   ❌ Error disabling Google News sources:', disableError.message);
      } else {
        console.log(`   ✅ Disabled ${googleNewsSources.length} Google News RSS sources`);
      }
    } else {
      console.log('   ℹ️  No Google News RSS sources found');
    }

    // Step 2: Enable existing authoritative sources
    console.log('\n2. Enabling existing direct RSS sources...');
    const authoritativeUrls = authoritativeSources
      .filter(s => !s.use_proxy)
      .map(s => s.feed_url);

    const { data: existingSources, error: existingError } = await supabase
      .from('rss_sources')
      .select('id, name, feed_url')
      .in('feed_url', authoritativeUrls);

    if (existingError) {
      console.error('   ❌ Error fetching existing sources:', existingError.message);
    } else if (existingSources && existingSources.length > 0) {
      const ids = existingSources.map(s => s.id);
      const { error: enableError } = await supabase
        .from('rss_sources')
        .update({ enabled: true })
        .in('id', ids);

      if (enableError) {
        console.error('   ❌ Error enabling sources:', enableError.message);
      } else {
        console.log(`   ✅ Enabled ${existingSources.length} existing authoritative sources`);
      }
    }

    // Step 3: Insert new authoritative sources (insert with auto-generated UUID)
    console.log('\n3. Inserting new authoritative sources...');
    for (const source of authoritativeSources) {
      const { error: insertError } = await supabase
        .from('rss_sources')
        .insert({
          name: source.name,
          feed_url: source.feed_url,
          language: source.language,
          country_code: source.country_code,
          enabled: source.enabled
        });

      if (insertError) {
        console.error(`   ❌ Error inserting ${source.name}:`, insertError.message);
      } else {
        console.log(`   ✅ ${source.name}`);
      }
    }

    // Step 4: Summary
    console.log('\n=== Update Complete ===');

    // Show final state
    const { data: finalSources } = await supabase
      .from('rss_sources')
      .select('id, name, feed_url, enabled, use_proxy')
      .eq('enabled', true);

    console.log(`\nTotal enabled sources: ${finalSources?.length || 0}`);
    console.log('\nEnabled sources breakdown:');
    const direct = finalSources?.filter(s => !s.use_proxy) || [];
    const proxied = finalSources?.filter(s => s.use_proxy) || [];
    console.log(`  - Direct RSS: ${direct.length}`);
    console.log(`  - RSSHub.app proxy: ${proxied.length}`);

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

updateRSSSources();
