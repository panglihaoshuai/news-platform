import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function clearOldData() {
  console.log('🗑️  删除旧数据...');
  
  // 先查询旧数据
  const { data: oldData, error: queryError } = await supabase
    .from('news_items')
    .select('id, source_name, published_at, domain')
    .lt('published_at', '2026-02-09T00:00:00Z');  // 2月9日之前的数据
  
  if (queryError) {
    console.log('❌ 查询失败:', queryError.message);
    return;
  }
  
  console.log(`📊 将删除 ${oldData?.length || 0} 条旧数据`);
  
  // 删除
  const { error: deleteError } = await supabase
    .from('news_items')
    .delete()
    .lt('published_at', '2026-02-09T00:00:00Z');
  
  if (deleteError) {
    console.log('❌ 删除失败:', deleteError.message);
  } else {
    console.log('✅ 旧数据已删除');
  }
  
  // 验证
  const { count } = await supabase.from('news_items').select('*', { count: 'exact', head: true });
  console.log(`📊 剩余记录数: ${count || 0}`);
}

clearOldData().catch(console.error);
