import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log(`Testing connection to ${supabaseUrl}...`);

    try {
        const { data, error } = await supabase.from('rss_sources').select('count');

        if (error) {
            console.error('Error connecting to rss_sources table:', error.message);
            console.log('Did you run the schema.sql in Supabase SQL Editor?');
        } else {
            console.log('Successfully connected to rss_sources table!');

            const { data: sources, error: sourcesError } = await supabase.from('rss_sources').select('*');
            if (sourcesError) {
                console.error('Error fetching sources:', sourcesError.message);
            } else {
                console.log(`Found ${sources.length} RSS sources in the database.`);
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
