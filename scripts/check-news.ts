import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNews() {
    const { data, error } = await supabase
        .from('news_items')
        .select('title, country_code, region_code, geo_lat, geo_lng')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) console.error(error);
    else console.table(data);
}

checkNews();
