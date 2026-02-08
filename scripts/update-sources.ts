import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const rssSources = [
    // --- Authoritative English Sources (via Google News Proxy for Stability) ---
    { name: 'BBC World', feed_url: 'https://news.google.com/rss/search?q=source:BBC+World+when:24h&hl=en-US&gl=US&ceid=US:en', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'en' },
    { name: 'NYT World', feed_url: 'https://news.google.com/rss/search?q=source:NYTimes+World+when:24h&hl=en-US&gl=US&ceid=US:en', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'en' },
    { name: 'Reuters Global', feed_url: 'https://news.google.com/rss/search?q=source:Reuters+when:24h&hl=en-US&gl=US&ceid=US:en', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'en' },
    { name: 'Al Jazeera', feed_url: 'https://news.google.com/rss/search?q=source:Al+Jazeera+World+when:24h&hl=en-US&gl=US&ceid=US:en', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'en' },
    { name: 'The Guardian', feed_url: 'https://news.google.com/rss/search?q=source:The+Guardian+World+when:24h&hl=en-GB&gl=GB&ceid=GB:en', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'en' },

    // --- Authoritative Chinese Sources ---
    { name: '联合早报', feed_url: 'https://news.google.com/rss/search?q=source:%E8%81%94%E5%90%88%E6%97%A9%E6%8a%A5+when:24h&hl=zh-CN&gl=CN&ceid=CN:zh-CN', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'zh' },
    { name: 'WSJ 中文', feed_url: 'https://news.google.com/rss/search?q=source:WSJ+when:24h&hl=zh-CN&gl=CN&ceid=CN:zh-CN', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'zh' },
    { name: 'FT 中文', feed_url: 'https://news.google.com/rss/search?q=source:%E9%87%91%E8%9E%8D%E6%97%B6%E6%8a%A5+when:24h&hl=zh-CN&gl=CN&ceid=CN:zh-CN', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'zh' },
    { name: 'NYT 中文', feed_url: 'https://news.google.com/rss/search?q=source:nytimes+when:24h&hl=zh-CN&gl=CN&ceid=CN:zh-CN', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'zh' },
    { name: 'BBC 中文', feed_url: 'https://news.google.com/rss/search?q=source:bbc+when:24h&hl=zh-CN&gl=CN&ceid=CN:zh-CN', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'zh' },
    { name: 'RFI 中文', feed_url: 'https://news.google.com/rss/search?q=source:rfi+when:24h&hl=zh-CN&gl=CN&ceid=CN:zh-CN', region_code: 'GLOBAL', country_code: 'GLOBAL', language: 'zh' }
];

async function updateSources() {
    console.log('Syncing authoritative RSS sources...');

    // First, disable all existing sources to start fresh (or we could just upsert)
    // Actually upsert is better if we want to keep history, but we want to ensure only these are enabled
    await supabase.from('rss_sources').update({ enabled: false }).neq('id', '00000000-0000-0000-0000-000000000000');

    for (const source of rssSources) {
        const { error } = await supabase
            .from('rss_sources')
            .upsert({ ...source, enabled: true }, { onConflict: 'feed_url' });

        if (error) console.error(`Error updating ${source.name}:`, error.message);
        else console.log(`✓ Updated: ${source.name} [${source.language}]`);
    }
}

updateSources();
