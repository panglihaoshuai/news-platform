#!/usr/bin/env node
/**
 * 数据库验证脚本 - 验证迁移结果和数据内容
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('');
console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║          数据库验证 - Database Verification                    ║');
console.log('╚════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log(`📦 Project: ${SUPABASE_URL}`);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
  try {
    // 1. 验证新列是否存在
    console.log('🔍 1. 验证新列...');
    console.log('');
    
    const columnsToCheck = [
      'domain', 'domain_confidence', 'domain_keywords',
      'geo_perspective', 'media_affiliation', 'political_ideology', 'target_audience',
      'event_country', 'event_country_code', 'event_city'
    ];
    
    for (const col of columnsToCheck) {
      const { data, error } = await supabase
        .from('news_items')
        .select(col)
        .limit(1);
        
      if (error && error.message.includes('does not exist')) {
        console.log(`   ❌ ${col}: 不存在`);
      } else {
        console.log(`   ✅ ${col}: 存在`);
      }
    }
    
    console.log('');
    
    // 2. 检查数据量
    console.log('📊 2. 检查数据量...');
    console.log('');
    
    const { count: totalCount, error: countError } = await supabase
      .from('news_items')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log(`   ❌ 查询失败: ${countError.message}`);
    } else {
      console.log(`   📈 总记录数: ${totalCount?.toLocaleString() || 0} 条`);
    }
    
    console.log('');
    
    // 3. 检查最近的数据
    console.log('🕐 3. 检查最近的数据...');
    console.log('');
    
    const { data: recentData, error: recentError } = await supabase
      .from('news_items')
      .select('title, source_name, published_at, domain')
      .order('published_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.log(`   ❌ 查询失败: ${recentError.message}`);
    } else if (recentData && recentData.length > 0) {
      console.log('   最近5条新闻:');
      console.log('   ' + '-'.repeat(70));
      recentData.forEach((item, i) => {
        const title = item.title?.substring(0, 40) || '无标题';
        const source = item.source_name?.padEnd(15) || 'Unknown';
        const domain = (item.domain || 'N/A').padEnd(10);
        console.log(`   ${i + 1}. [${source}] ${title}... (${domain})`);
      });
      console.log('   ' + '-'.repeat(70));
    } else {
      console.log('   📭 无数据');
    }
    
    console.log('');
    
    // 4. 检查各区域分布
    console.log('🌍 4. 检查数据来源分布...');
    console.log('');
    
    const { data: regionData, error: regionError } = await supabase
      .from('news_items')
      .select('source_name, source_tier')
      .limit(100);
    
    if (regionError) {
      console.log(`   ❌ 查询失败: ${regionError.message}`);
    } else if (regionData && regionData.length > 0) {
      const sources = [...new Set(regionData.map(d => d.source_name))];
      console.log(`   📰 不同来源数: ${sources.length}`);
      console.log('');
      console.log('   来源列表:');
      sources.forEach(s => console.log(`     - ${s}`));
    }
    
    console.log('');
    
    // 5. 验证视图
    console.log('👁️ 5. 验证视图...');
    console.log('');
    
    const { data: viewData, error: viewError } = await supabase
      .from('v_news_with_classifications')
      .select('id, title, domain, geo_perspective')
      .limit(3);
    
    if (viewError) {
      console.log(`   ❌ 视图查询失败: ${viewError.message}`);
    } else {
      console.log(`   ✅ 视图 v_news_with_classifications 存在`);
      console.log(`   📄 视图数据示例:`);
      viewData?.forEach((item, i) => {
        console.log(`     ${i + 1}. ${item.domain} - ${item.geo_perspective}`);
      });
    }
    
    console.log('');
    console.log('='.repeat(70));
    console.log('✅ 验证完成!');
    console.log('');
    
  } catch (err) {
    console.error('❌ 验证失败:', err.message);
    process.exit(1);
  }
}

verify();
