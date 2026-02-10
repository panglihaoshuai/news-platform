#!/usr/bin/env node
/**
 * Supabase Database Migration Tool
 * 支持直接执行SQL到远程Supabase项目
 * 
 * 使用方法: node scripts/supabase-migrate.mjs
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 加载.env.local
config({ path: path.join(__dirname, '../.env.local') });

const { Pool } = pg;

console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     Supabase Database Migration Tool                       ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// 配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MIGRATION_FILE = path.join(__dirname, '../supabase/migrations/2026-02-09-global-balanced-schema.sql');

console.log(`📦 Project: ${SUPABASE_URL}`);
console.log(`📄 Migration: ${MIGRATION_FILE}`);
console.log('');

// 解析连接字符串
const match = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!match) {
  console.error('❌ Invalid Supabase URL format');
  process.exit(1);
}
const PROJECT_REF = match[1];

// PostgreSQL连接字符串
const PG_URL = `postgres://postgres:${SUPABASE_KEY}@${PROJECT_REF}.supabase.co:5432/postgres`;

console.log('🔗 Connecting to PostgreSQL...');

const pool = new Pool({
  connectionString: PG_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function migrate() {
  try {
    // 测试连接
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL!');
    console.log('');
    
    // 读取迁移SQL
    console.log('📖 Reading migration file...');
    const sqlContent = fs.readFileSync(MIGRATION_FILE, 'utf8');
    console.log(`   Length: ${sqlContent.length} characters`);
    console.log('');
    
    // 执行迁移
    console.log('🚀 Executing migration...');
    console.log('');
    
    const result = await client.query(sqlContent);
    console.log('✅ Migration executed successfully!');
    console.log('');
    
    // 验证新列
    console.log('🔍 Verifying new columns...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'news_items' 
      AND column_name LIKE 'domain_%'
      OR column_name LIKE 'event_%'
      OR column_name LIKE 'geo_perspect%'
      OR column_name LIKE 'media_affil%'
      OR column_name LIKE 'political_%'
      OR column_name LIKE 'target_%'
      ORDER BY column_name
    `);
    
    console.log('');
    console.log('📊 New columns added to news_items:');
    console.log('-'.repeat(50));
    if (columnsResult.rows.length > 0) {
      columnsResult.rows.forEach(row => {
        console.log(`   ✓ ${row.column_name.padEnd(25)} ${row.data_type}`);
      });
    } else {
      console.log('   No new columns found (may already exist)');
    }
    
    // 验证索引
    console.log('');
    console.log('📊 New indexes:');
    console.log('-'.repeat(50));
    const indexResult = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'news_items' 
      AND indexname LIKE '%domain%' 
      OR indexname LIKE '%geo_%'
      OR indexname LIKE '%event_%'
      OR indexname LIKE '%perspect%'
      ORDER BY indexname
    `);
    
    if (indexResult.rows.length > 0) {
      indexResult.rows.forEach(row => {
        const shortName = row.indexname.split('_').slice(0, 3).join('_');
        console.log(`   ✓ ${shortName}`);
      });
    } else {
      console.log('   No new indexes found');
    }
    
    // 验证视图
    console.log('');
    console.log('📊 New views:');
    console.log('-'.repeat(50));
    const viewResult = await client.query(`
      SELECT viewname 
      FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname = 'v_news_with_classifications'
    `);
    
    if (viewResult.rows.length > 0) {
      console.log(`   ✓ ${viewResult.rows[0].viewname}`);
    } else {
      console.log('   View not found');
    }
    
    // 验证函数
    console.log('');
    console.log('📊 New functions:');
    console.log('-'.repeat(50));
    const funcResult = await client.query(`
      SELECT proname 
      FROM pg_proc 
      WHERE proname LIKE 'get_%'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY proname
    `);
    
    if (funcResult.rows.length > 0) {
      funcResult.rows.forEach(row => {
        console.log(`   ✓ ${row.proname}`);
      });
    } else {
      console.log('   No new functions found');
    }
    
    client.release();
    await pool.end();
    
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ MIGRATION COMPLETE!                                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Columns checked: ${columnsResult.rows.length}`);
    console.log(`   - Indexes checked: ${indexResult.rows.length}`);
    console.log(`   - Views checked: ${viewResult.rows.length}`);
    console.log(`   - Functions checked: ${funcResult.rows.length}`);
    console.log('');
    
  } catch (err) {
    console.error('');
    console.error('❌ Migration failed!');
    console.error('');
    console.error('Error details:');
    console.error(err.message);
    console.error('');
    
    if (err.message.includes('column "domain" of relation "news_items" already exists')) {
      console.log('💡 The column already exists. This is expected if migration was run before.');
      console.log('');
      console.log('✅ Verification complete!');
    } else if (err.message.includes('permission denied')) {
      console.log('');
      console.log('💡 Permission denied. Please use Supabase Dashboard SQL Editor:');
      console.log('   1. Open: https://ohcdjgqwidftfracugtt.supabase.co');
      console.log('   2. Go to SQL Editor');
      console.log('   3. Copy and run the migration file');
    } else {
      console.log('');
      console.log('💡 Try running manually in Supabase SQL Editor');
    }
    
    await pool.end();
    process.exit(1);
  }
}

migrate();
