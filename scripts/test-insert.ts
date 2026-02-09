#!/usr/bin/env node
/**
 * Direct test of news fetch
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('🧪 Testing direct insert to news_items...\n');
  
  // Insert test data
  const testData = {
    external_id: `manual-test-${Date.now()}`,
    source_id: 'test-source',
    source_name: 'Test Source',
    source_type: 'test',
    title: 'Test News Item',
    original_url: 'https://example.com/test',
    published_at: new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    categories: ['Test'],
    priority: 'P3',
    classification_confidence: 0.7,
    classification_source: 'keyword',
    used_llm: false
  };
  
  console.log('Inserting test data...');
  const { data, error } = await supabase
    .from('news_items')
    .insert(testData)
    .select();
  
  if (error) {
    console.log('❌ Insert failed:', error.message);
    console.log('Error details:', error);
  } else {
    console.log('✅ Insert success!');
    console.log('Data:', data);
  }
  
  // Check total count
  const { count } = await supabase
    .from('news_items')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📊 Total news items in database: ${count}`);
}

testInsert().catch(console.error);
