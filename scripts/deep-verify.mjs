#!/usr/bin/env node
/**
 * 深度验证脚本 - 检查数据详情和源分布
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function deepVerify() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              深度数据库验证 - Deep Verification                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // 1. 按源统计
  console.log('📊 1. 按新闻来源统计...');
  console.log('');
  
  const { data: bySource, error: sourceError } = await supabase
    .from('news_items')
    .select('source_name, source_type, source_tier')
    .order('source_name');
  
  if (sourceError) {
    console.log(`   ❌ ${sourceError.message}`);
  } else {
    const sourceCounts = {};
    bySource?.forEach(item => {
      const key = `${item.source_name} (${item.source_type})`;
      sourceCounts[key] = (sourceCounts[key] || 0) + 1;
    });
    
    console.log('   来源                      | 类型    | Tier | 数量');
    console.log('   ' + '-'.repeat(65));
    for (const [source, count] of Object.entries(sourceCounts)) {
      const type = source.includes('newsdata') ? 'newsdata' : 
                   source.includes('rss') ? 'rss' : 'gdelt';
      console.log(`   ${source.padEnd(25)} | ${type.padEnd(7)} | ${item.source_tier?.padEnd(4) || 'N/A'} | ${count}`);
    }
  }
  
  console.log('');
  
  // 2. 按时间分布
  console.log('🕐 2. 按时间分布...');
  console.log('');
  
  const { data: timeData, error: timeError } = await supabase
    .from('news_items')
    .select('published_at')
    .order('published_at', { ascending: false });
  
  if (timeError) {
    console.log(`   ❌ ${timeError.message}`);
  } else if (timeData && timeData.length > 0) {
    const latest = timeData[0]?.published_at;
    const oldest = timeData[timeData.length - 1]?.published_at;
    console.log(`   📅 最新: ${latest}`);
    console.log(`   📅 最早: ${oldest}`);
    console.log(`   📊 总数: ${timeData.length} 条`);
  }
  
  console.log('');
  
  // 3. 字段填充率
  console.log('📈 3. 新字段填充率...');
  console.log('');
  
  const newFields = ['domain', 'domain_confidence', 'geo_perspective', 'media_affiliation', 
                     'event_country', 'event_city', 'event_confidence'];
  
  for (const field of newFields) {
    const { count, error } = await supabase
      .from('news_items')
      .select(field, { count: 'exact', head: true })
      .not(field, 'is', null);
    
    const total = 551;
    const filled = count || 0;
    const pct = ((filled / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(filled / 50)) + '░'.repeat(50 - Math.round(filled / 50));
    console.log(`   ${field.padEnd(20)} | ${bar} | ${filled.toString().padStart(4)}/${total} (${pct}%)`);
  }
  
  console.log('');
  console.log('💡 说明: 新字段需要运行 fetch-hybrid 脚本才会填充数据');
  console.log('');
  
  // 4. 检查GDELT配置
  console.log('🔧 4. GDELT配置状态...');
  console.log('');
  console.log('   配置了24个GDELT源，但数据可能来自:');
  console.log('   - NewsData.io API (旧数据)');
  console.log('   - RSS feeds');
  console.log('   - GDELT API (需要运行 fetch-hybrid)');
  console.log('');
  
  console.log('='.repeat(70));
  console.log('✅ 深度验证完成!');
  console.log('');
  console.log('📋 后续操作:');
  console.log('   1. 运行 fetch-hybrid 脚本填充新字段:');
  console.log('      npx tsx src/scripts/fetch-hybrid.ts');
  console.log('   2. 或等待 GitHub Actions 自动执行');
  console.log('   3. 验证新字段填充后，数据可按 domain/geo_perspective 筛选');
  console.log('');
}

deepVerify().catch(console.error);
