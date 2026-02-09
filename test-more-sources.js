/**
 * Comprehensive RSS source test
 */

const Parser = require('rss-parser');
const parser = new Parser({ timeout: 10000 });

const sources = [
  // Tier 1 - Major international (likely blocked)
  { name: 'AP News', url: 'https://apnews.com/hub/world-news/rss' },
  { name: 'AP News World', url: 'https://feeds.ap.org/feed/rss/2/worldnews' },
  { name: 'US News', url: 'https://www.reutersagency.com/feed/?best-regions=north-america' },

  // Tier 2 - Alternative international
  { name: 'Anadolu Agency', url: 'https://www.aa.com.tr/en/rss/-1' },
  { name: 'Xinhua English', url: 'https://www.xinhuanet.com/english/rss/headline/rss.xml' },
  { name: 'CNA Asia', url: 'https://www.channelnewsasia.com/rssfeeds/2896524' },
  { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/RSSHeadlineNews' },

  // Tier 3 - Tech news (usually less restricted)
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss' },

  // Tier 4 - Alternative news aggregators
  { name: 'Feedsportal', url: 'http://www.feedsportal.com/rss/30950.xml' },
  { name: 'NewsLookup', url: 'http://www.newslookup.com/rss/world.rss' },

  // Tier 5 - Regional sources
  { name: 'AllAfrica', url: 'https://allafrica.com/pages/articles/rss-feed/' },
  { name: 'Yahoo News', url: 'https://news.yahoo.com/rss/world' },
  { name: 'HuffPost', url: 'https://www.huffpost.com/section/world-news/rss.xml' },

  // Chinese sources (different blocking patterns)
  { name: '环球时报', url: 'http://www.huanqiu.com/rss/qqbd.xml' },
  { name: '观察者网', url: 'https://www.guancha.cn/Signal/rss.xml' },
  { name: '多维新闻', url: 'https://www.dwnews.com/feed' },
  { name: '新加坡联合早报', url: 'https://www.zaobao.com.sg/rss/realtime/china' },
];

async function testSources() {
  console.log('Testing RSS sources...\n');
  let results = [];

  for (const s of sources) {
    try {
      const data = await parser.parseURL(s.url);
      results.push({ name: s.name, status: '✅', count: data.items.length });
      console.log(`✅ ${s.name}: ${data.items.length} items`);
    } catch (err) {
      results.push({ name: s.name, status: '❌', error: err.message.substring(0, 50) });
      console.log(`❌ ${s.name}: ${err.message.substring(0, 60)}`);
    }
  }

  console.log(`\n--- Summary ---`);
  const working = results.filter(r => r.status === '✅').length;
  console.log(`Working: ${working} / ${results.length}`);

  if (working > 0) {
    console.log('\nWorking sources:');
    results.filter(r => r.status === '✅').forEach(r => {
      console.log(`  - ${r.name} (${r.count} items)`);
    });
  }
}

testSources();
