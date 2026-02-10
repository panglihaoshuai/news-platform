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
console.log('║           数据内容检查 - Content Analysis                    ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
console.log('');

try {
  // 检查domain分布
  const { data: domainData } = await supabase
    .from('news_items')
    .select('domain, geo_perspective, media_affiliation, event_country')
    .limit(20);
  
  console.log('📊 字段值分布 (前20条):');
  console.log('');
  console.log('domain'.padEnd(12) + ' | ' + 
             'geo_perspective'.padEnd(16) + ' | ' + 
             'media_affiliation'.padEnd(18) + ' | ' +
             'event_country'.padEnd(15));
  console.log('-'.repeat(70));
  
  domainData?.forEach(item => {
    const d = (item.domain || 'NULL').padEnd(12);
    const g = (item.geo_perspective || 'NULL').padEnd(16);
    const m = (item.media_affiliation || 'NULL').padEnd(18);
    const e = (item.event_country || 'NULL').padEnd(15);
    console.log(`${d} | ${g} | ${m} | ${e}`);
  });
  
  console.log('');
  
  // 统计domain
  const { data: allData } = await supabase.from('news_items').select('domain');
  const domainStats = {};
  allData?.forEach(item => {
    const d = item.domain || 'NULL';
    domainStats[d] = (domainStats[d] || 0) + 1;
  });
  
  console.log('📈 domain字段统计:');
  Object.entries(domainStats).sort((a, b) => b[1] - a[1]).forEach(([domain, count]) => {
    const pct = ((count / (allData?.length || 1)) * 100).toFixed(1);
    console.log(`   ${domain.padEnd(12)} | ${count.toString().padStart(4)} (${pct}%)`);
  });
  
  console.log('');
  console.log('💡 分析:');
  console.log('   - domain字段有值但可能来自旧的分类系统');
  console.log('   - geo_perspective/media_affiliation/event_country 为NULL');
  console.log('   - 这些新字段需要运行 fetch-hybrid 才会填充');
  console.log('');
  console.log('='.repeat(70));
  
} catch (err) {
  console.error('❌ 错误:', err.message);
}
