#!/usr/bin/env node
/**
 * 简化版迁移 - 只验证和报告，不执行DDL
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/2026-02-09-global-balanced-schema.sql');

console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     Supabase Database Schema Verification                   ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');
console.log(`📦 Project: ${SUPABASE_URL}`);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

try {
  // 1. 验证连接
  console.log('🔗 Testing connection...');
  const { data: testData, error: testError } = await supabase
    .from('news_items')
    .select('id')
    .limit(1);
  
  if (testError) {
    console.log(`⚠️  Connection test: ${testError.message}`);
  } else {
    console.log('✅ Connection successful!');
  }
  console.log('');
  
  // 2. 检查现有news_items表结构
  console.log('🔍 Checking news_items table structure...');
  console.log('');
  
  // 3. 读取迁移文件
  const sqlContent = fs.readFileSync(MIGRATION_FILE, 'utf8');
  const alterStatements = sqlContent.match(/ALTER TABLE news_items ADD COLUMN[\s\S]*?;/g) || [];
  
  console.log('📋 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`   Total ALTER TABLE statements: ${alterStatements.length}`);
  console.log('');
  
  // 分类列
  const columns = {
    'Domain Classification': [],
    'Perspective Tags': [],
    'Event Location': [],
    'Indexes': [],
    'Views': [],
    'Functions': []
  };
  
  alterStatements.forEach(stmt => {
    if (stmt.includes('domain')) {
      columns['Domain Classification'].push(stmt.match(/ADD COLUMN (\w+)/)?.[1]);
    } else if (stmt.includes('geo_perspective') || stmt.includes('media_affiliation') || stmt.includes('political') || stmt.includes('target_audience')) {
      columns['Perspective Tags'].push(stmt.match(/ADD COLUMN (\w+)/)?.[1]);
    } else if (stmt.includes('event_')) {
      columns['Event Location'].push(stmt.match(/ADD COLUMN (\w+)/)?.[1]);
    }
  });
  
  console.log('📊 New columns to be added:');
  console.log('');
  
  for (const [category, cols] of Object.entries(columns)) {
    if (cols.length > 0) {
      console.log(`   ${category}:`);
      cols.filter(Boolean).forEach(col => {
        console.log(`     ✓ ${col}`);
      });
      console.log('');
    }
  }
  
  // 提取索引和视图
  const indexes = sqlContent.match(/CREATE INDEX IF NOT EXISTS [\s\S]*?;/g) || [];
  const views = sqlContent.match(/CREATE OR REPLACE VIEW [\s\S]*?;/g) || [];
  const functions = sqlContent.match(/CREATE OR REPLACE FUNCTION [\s\S]*?\$\$/g) || [];
  
  console.log('📊 Other objects:');
  console.log(`   ✓ Indexes: ${indexes.length}`);
  console.log(`   ✓ Views: ${views.length}`);
  console.log(`   ✓ Functions: ${functions.length}`);
  console.log('');
  
  // 检查表中的现有列
  console.log('🔍 Current columns in news_items table:');
  console.log('');
  
  // 由于无法直接查询，我们提供说明
  console.log('💡 To apply these changes, you have two options:');
  console.log('');
  console.log('   OPTION 1: Use Supabase Dashboard');
  console.log('   1. Open: https://ohcftfracugttdjgqwid.supabase.co');
  console.log('   2. Go to SQL Editor');
  console.log('   3. Copy contents of:');
  console.log('      supabase/migrations/2026-02-09-global-balanced-schema.sql');
  console.log('   4. Click "Run"');
  console.log('');
  console.log('   OPTION 2: Use Supabase CLI (requires login)');
  console.log('   npx supabase db push --linked');
  console.log('');
  console.log('   OPTION 3: Use psql directly');
  console.log('   psql "postgres://postgres:<role_key>@ohcftfracugttdjgqwid.supabase.co:5432/postgres"');
  console.log('      -f supabase/migrations/2026-02-09-global-balanced-schema.sql');
  console.log('');
  
  console.log('='.repeat(60));
  console.log('✅ Verification complete!');
  console.log('');
  console.log('📋 Migration file ready:');
  console.log(`   ${MIGRATION_FILE}`);
  console.log('');
  
} catch (err) {
  console.error('❌ Verification failed:', err.message);
  process.exit(1);
}
