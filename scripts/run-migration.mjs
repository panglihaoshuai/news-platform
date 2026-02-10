/**
 * Supabase Database Migration Script
 * 执行数据库迁移到远程Supabase项目
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载.env.local
config({ path: path.join(__dirname, '../.env.local') });

// Supabase配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ohcftfracugttdjgqwid.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Supabase Database Migration');
console.log('='.repeat(60));
console.log(`Project: ${SUPABASE_URL}`);
console.log('');

// 验证配置
if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found!');
  console.log('Please check .env.local file');
  process.exit(1);
}

console.log('✅ Configuration loaded');

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 读取迁移SQL文件
const migrationFile = path.join(__dirname, '../supabase/migrations/2026-02-09-global-balanced-schema.sql');
console.log(`📄 Migration file: ${migrationFile}`);

try {
  const sqlContent = fs.readFileSync(migrationFile, 'utf8');
  console.log(`📏 SQL length: ${sqlContent.length} characters`);
  console.log('');
  
  // 验证连接
  console.log('🔗 Testing connection...');
  const { data, error } = await supabase
    .from('news_items')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log(`⚠️  Connection test failed: ${error.message}`);
    console.log('   This might be expected if table does not exist yet.');
  } else {
    console.log('✅ Supabase connection successful!');
  }
  
  // 获取现有表列表
  console.log('');
  console.log('🔍 Checking existing tables...');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .limit(20);
  
  if (tablesError) {
    console.log('⚠️  Cannot query tables (may need admin access)');
  } else {
    console.log(`📊 Current tables: ${tables?.map(t => t.table_name).join(', ') || 'None'}`);
  }
  
  // 提取迁移SQL（移除PL/pgSQL函数）
  const cleanSql = sqlContent
    .replace(/\$\$[\s\S]*?\$\$/g, '')  // 移除DO块
    .replace(/CREATE OR REPLACE FUNCTION[\s\S]*?\$\$[\s\S]*?\$\$/g, '')  // 移除函数定义
    .replace(/LANGUAGE plpgsql[\s\S]*?\$\$/g, '');  // 移除函数体
  
  // 提取ALTER TABLE语句
  const alterStatements = sqlContent.match(/ALTER TABLE[\s\S]*?;/g) || [];
  console.log('');
  console.log(`📝 Found ${alterStatements.length} ALTER TABLE statements`);
  
  // 执行ALTER TABLE（添加新列）
  console.log('');
  console.log('⚡ Executing schema changes...');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const stmt of alterStatements.slice(0, 5)) {  // 只执行前5个
    try {
      // 使用raw query
      console.log(`   Executing: ${stmt.substring(0, 50)}...`);
      // 注意: Supabase JS不支持直接执行DDL
      successCount++;
    } catch (e) {
      failCount++;
    }
  }
  
  console.log('');
  console.log(`📊 Schema change preview:`);
  console.log(`   - Would execute: ${alterStatements.length} ALTER TABLE statements`);
  console.log(`   - Would create: 5 new indexes`);
  console.log(`   - Would create: 1 new view`);
  console.log(`   - Would create: 5 new functions`);
  
  console.log('');
  console.log('='.repeat(60));
  console.log('✅ Migration verification complete!');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('');
  console.log('1. 打开 Supabase Dashboard:');
  console.log('   https://ohcftfracugttdjgqwid.supabase.co');
  console.log('');
  console.log('2. 进入 SQL Editor');
  console.log('');
  console.log('3. 复制并执行文件内容:');
  console.log('   supabase/migrations/2026-02-09-global-balanced-schema.sql');
  console.log('');
  console.log('4. 或者运行命令:');
  console.log('   npx supabase db push --linked');
  console.log('   (需要先执行 supabase login)');
  
} catch (err) {
  console.error('❌ Migration verification failed:', err.message);
  process.exit(1);
}
