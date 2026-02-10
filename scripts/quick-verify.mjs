#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

console.log('');
console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║              数据库验证报告 - Database Report                 ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
console.log('');

try {
  // 1. 总数
  const { count: total } = await supabase.from('news_items').select('*', { count: 'exact', head: true });
  console.log(`📊 总记录数: ${total?.toLocaleString() || 0} 条`);
  console.log('');
  
  // 2. 按源统计
  const { data: bySource } = await supabase
    .from('news_items')
    .select('source_name, source_type');
  
  const sourceCounts = {};
  bySource?.forEach(item => {
    const key = item.source_name || 'Unknown';
    sourceCounts[key] = (sourceCounts[key] || 0) + 1;
  });
  
  console.log('📰 来源统计:');
  Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
    console.log(`   ${name.padEnd(20)} | ${count.toString().padStart(4)} 条`);
  });
  console.log('');
  
  // 3. 新字段填充率
  const fields = ['domain', 'geo_perspective', 'media_affiliation', 'event_country'];
  console.log('📈 新字段填充率:');
  for (const field of fields) {
    const { count: filled } = await supabase.from('news_items').select(field, { count: 'exact', head: true }).not(field, 'is', null);
    const pct = total ? ((filled / total) * 100).toFixed(1) : '0.0';
    console.log(`   ${field.padEnd(20)} | ${filled?.toString().padStart(4)}/${total} (${pct}%)`);
  }
  console.log('');
  
  // 4. 最近数据
  const { data: recent } = await supabase
    .from('news_items')
    .select('title, source_name, published_at')
    .order('published_at', { ascending: false })
    .limit(3);
  
  console.log('🕐 最近数据:');
  recent?.forEach(item => {
    const title = item.title?.substring(0, 35) || 'N/A';
    console.log(`   [${item.source_name?.substring(0, 12)}] ${title}...`);
  });
  console.log('');
  
  console.log('='.repeat(65));
  console.log('✅ 验证完成!');
  console.log('');
  console.log('💡 新字段需要运行 fetch-hybrid 脚本填充');
  
} catch (err) {
  console.error('❌ 错误:', err.message);
}
