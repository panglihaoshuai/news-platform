import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const parser = new Parser({ timeout: 20000 });

async function quickFetch() {
    console.log('Targeted Chinese News Fetch...');
    const { data: sources } = await supabase.from('rss_sources').select('*').eq('language', 'zh');
    if (!sources) return;

    for (const source of sources) {
        try {
            console.log(`Trying ${source.name}...`);
            const feed = await parser.parseURL(source.feed_url);
            const items = feed.items.map(item => ({
                source_id: source.id,
                title: item.title || '无标题',
                summary: (item.contentSnippet || '').substring(0, 500),
                original_url: item.link || '',
                published_at: item.isoDate ? new Date(item.isoDate).toISOString() : new Date().toISOString(),
                importance_score: 50,
                region_code: source.region_code,
                country_code: source.country_code
            }));

            if (items.length > 0) {
                const { error } = await supabase.from('news_items').upsert(items.slice(0, 20), { onConflict: 'source_id,original_url', ignoreDuplicates: true });
                if (error) console.error('Insert error:', error.message);
                else console.log(`✓ Added ${items.length} items from ${source.name}`);
            }
        } catch (e: any) {
            console.log(`✕ Failed ${source.name}: ${e.message}`);
        }
    }
}

quickFetch();
