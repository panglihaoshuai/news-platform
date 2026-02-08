-- Seed System Config
insert into system_config (key, value, description) values
('NEWS_RETENTION_DAYS', '90', 'Days to keep news items before deletion'),
('MAX_DAILY_ITEMS_PER_SOURCE', '20', 'Max items to fetch per source per run to avoid spam'),
('FETCH_INTERVAL_HOURS', '6', 'Expected interval between fetches');

-- Seed RSS Sources (Global Balanced)
insert into rss_sources (name, feed_url, region_code, country_code, language) values
-- North America
('Reuters US', 'https://www.reutersagency.com/feed/?best-regions=north-america&post_type=best', 'NA', 'US', 'en'),
('NYT World', 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', 'NA', 'US', 'en'),

-- Europe
('BBC World', 'http://feeds.bbci.co.uk/news/world/rss.xml', 'EU', 'GB', 'en'),
('France 24', 'https://www.france24.com/en/rss', 'EU', 'FR', 'en'),

-- Asia
('CNA (Channel News Asia)', 'https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml', 'AS', 'SG', 'en'),
('Kyodo News', 'https://english.kyodonews.net/rss/news.xml', 'AS', 'JP', 'en'),
-- Note: Xinhua/CCTV often don't have stable direct RSS, using potential RSSHub routes or reliable alternatives if available
-- For now using standard available ones.

-- Middle East
('Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'ME', 'QA', 'en'),

-- Africa
('Africa News', 'https://www.africanews.com/feed/rss', 'AF', 'CG', 'en'),

-- Oceania
('ABC News (Australia)', 'https://www.abc.net.au/news/feed/51120/rss.xml', 'OC', 'AU', 'en');
