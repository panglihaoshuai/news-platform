#!/usr/bin/env node
/**
 * Test GDELT API connection
 * Run: npx tsx scripts/test-gdelt.ts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGdelt() {
  console.log('🧪 Testing GDELT API...\n');
  
  // Test 1: Direct API call
  console.log('1️⃣ Testing GDELT API connection...');
  const url = 'https://api.gdeltproject.org/api/v2/doc/doc?query=domain:bbc.com&mode=artlist&format=json&maxrecords=5&timespan=24h';
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(`✅ API Response: ${data.articles?.length || 0} articles\n`);
  } catch (e: any) {
    console.log(`❌ API Error: ${e.message}\n`);
  }
  
  // Test 2: Database insert
  console.log('2️⃣ Testing database insert...');
  const testNews = {
    external_id: `test-${Date.now()}`,
    source_id: 'gdelt-bbc',
    source_name: 'BBC Test',
    source_type: 'gdelt',
    title: 'GDELT Test Article',
    original_url: 'https://example.com/test',
    published_at: new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    categories: ['Test'],
    priority: 'P3',
    classification_confidence: 0.7,
    classification_source: 'keyword',
    used_llm: false
  };
  
  const { data, error } = await supabase
    .from('news_items')
    .upsert(testNews, { onConflict: 'external_id' });
  
  if (error) {
    console.log(`❌ Insert Error: ${error.message}\n`);
  } else {
    console.log(`✅ Insert Success\n`);
  }
  
  // Test 3: Check all source_type values
  console.log('3️⃣ Checking source_type distribution...');
  const { data: sources } = await supabase
    .from('news_items')
    .select('source_type, count')
    .order('created_at', { ascending: false })
    .limit(100);
  
  console.log(`📊 Recent entries: ${sources?.length || 0}`);
  
  console.log('\n🎉 Test complete!');
}

testGdelt().catch(console.error);
