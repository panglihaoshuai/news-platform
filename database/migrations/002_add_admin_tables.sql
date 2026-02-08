-- Migration: Admin System - Keywords and Classifications
-- Date: 2026-02-07
-- Description: Add tables for keyword library, manual classifications, and admin authentication

-- Enable UUID extension (if not already enabled)
create extension if not exists "uuid-ossp";

-- ============================================
-- Table: keyword_library
-- Description: Stores the keyword database for news classification
-- ============================================
create table if not exists keyword_library (
  id uuid primary key default uuid_generate_v4(),
  keyword text not null unique,
  tier text not null check (tier in ('P0', 'P1', 'P2', 'P3')),
  categories text[] default '{}',
  weight integer default 0,
  match_count integer default 0,  -- Statistics: how many times this keyword matched
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for keyword_library
create index idx_keyword_tier on keyword_library(tier);
create index idx_keyword_active on keyword_library(is_active);
create index idx_keyword_categories on keyword_library using gin(categories);

-- ============================================
-- Table: manual_classifications
-- Description: Stores manual classifications by admin users
-- ============================================
create table if not exists manual_classifications (
  id uuid primary key default uuid_generate_v4(),
  news_item_id uuid references news_items(id) on delete cascade,
  categories text[] not null,
  priority text not null check (priority in ('P0', 'P1', 'P2', 'P3')),
  notes text,
  classified_by text,  -- Could be used for multi-admin tracking in future
  created_at timestamptz default now()
);

-- Indexes for manual_classifications
create index idx_classification_news on manual_classifications(news_item_id);
create index idx_classification_priority on manual_classifications(priority);
create index idx_classification_created on manual_classifications(created_at desc);

-- ============================================
-- Table: admin_sessions
-- Description: Stores admin session tokens for authentication
-- ============================================
create table if not exists admin_sessions (
  id uuid primary key default uuid_generate_v4(),
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  last_used_at timestamptz default now()
);

-- Index for session cleanup
create index idx_session_expires on admin_sessions(expires_at);

-- ============================================
-- Function: Update timestamp trigger
-- ============================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for keyword_library
drop trigger if exists update_keyword_library_updated_at on keyword_library;
create trigger update_keyword_library_updated_at
  before update on keyword_library
  for each row
  execute function update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable RLS on new tables
alter table keyword_library enable row level security;
alter table manual_classifications enable row level security;
alter table admin_sessions enable row level security;

-- Public read access for keywords (needed by fetch-rss script)
create policy "Public read access for keywords" 
  on keyword_library for select 
  using (is_active = true);

-- Public read access for classifications
create policy "Public read access for classifications" 
  on manual_classifications for select 
  using (true);

-- Service role has full access (implicit via service_role key)
-- Note: Service role bypasses RLS by default

-- ============================================
-- Seed: Default Keyword Library
-- ============================================

-- P0 Level - Critical Events (35 points)
insert into keyword_library (keyword, tier, categories, weight) values
-- Geopolitical & Military (Chinese)
('战争', 'P0', '{"政治", "军事"}', 35),
('冲突', 'P0', '{"政治", "军事"}', 35),
('宣战', 'P0', '{"政治", "军事"}', 35),
('刺杀', 'P0', '{"政治", "军事", "社会"}', 35),
('谋杀', 'P0', '{"社会", "政治"}', 35),
('恐袭', 'P0', '{"政治", "军事", "社会"}', 35),
('爆炸', 'P0', '{"社会", "军事"}', 35),
('空袭', 'P0', '{"军事", "政治"}', 35),
('政变', 'P0', '{"政治"}', 35),
('政权更迭', 'P0', '{"政治"}', 35),
('革命', 'P0', '{"政治", "社会"}', 35),
('戒严', 'P0', '{"政治", "军事"}', 35),
('国家紧急状态', 'P0', '{"政治", "社会"}', 35),
('核', 'P0', '{"军事", "政治"}', 35),
('核武器', 'P0', '{"军事", "政治"}', 35),
('核试验', 'P0', '{"军事", "政治"}', 35),
('导弹', 'P0', '{"军事", "政治"}', 35),
('洲际导弹', 'P0', '{"军事", "政治"}', 35),
('大屠杀', 'P0', '{"社会", "政治"}', 35),
('种族灭绝', 'P0', '{"政治", "社会"}', 35),
('人道主义危机', 'P0', '{"社会", "政治"}', 35),
('人质', 'P0', '{"社会", "政治", "军事"}', 35),
('劫持', 'P0', '{"社会", "军事"}', 35),
('击落', 'P0', '{"军事", "政治"}', 35),
-- Geopolitical & Military (English)
('war', 'P0', '{"political", "military"}', 35),
('conflict', 'P0', '{"political", "military"}', 35),
('declaration of war', 'P0', '{"political", "military"}', 35),
('assassination', 'P0', '{"political", "military", "social"}', 35),
('murder', 'P0', '{"social", "political"}', 35),
('terrorist attack', 'P0', '{"political", "military", "social"}', 35),
('explosion', 'P0', '{"social", "military"}', 35),
('air strike', 'P0', '{"military", "political"}', 35),
('coup', 'P0', '{"political"}', 35),
('regime change', 'P0', '{"political"}', 35),
('revolution', 'P0', '{"political", "social"}', 35),
('martial law', 'P0', '{"political", "military"}', 35),
('state of emergency', 'P0', '{"political", "social"}', 35),
('nuclear', 'P0', '{"military", "political"}', 35),
('nuclear weapon', 'P0', '{"military", "political"}', 35),
('nuclear test', 'P0', '{"military", "political"}', 35),
('missile', 'P0', '{"military", "political"}', 35),
('ICBM', 'P0', '{"military", "political"}', 35),
('massacre', 'P0', '{"social", "political"}', 35),
('genocide', 'P0', '{"political", "social"}', 35),
('humanitarian crisis', 'P0', '{"social", "political"}', 35),
('hostage', 'P0', '{"social", "political", "military"}', 35),
('hijacking', 'P0', '{"social", "military"}', 35),
('shot down', 'P0', '{"military", "political"}', 35),
-- Economic Crisis (Chinese)
('金融危机', 'P0', '{"经济", "政治"}', 35),
('股市崩盘', 'P0', '{"经济"}', 35),
('闪崩', 'P0', '{"经济"}', 35),
('熔断', 'P0', '{"经济"}', 35),
('银行倒闭', 'P0', '{"经济", "政治"}', 35),
('货币危机', 'P0', '{"经济", "政治"}', 35),
('恶性通胀', 'P0', '{"经济", "社会"}', 35),
('债务违约', 'P0', '{"经济", "政治"}', 35),
('主权违约', 'P0', '{"经济", "政治"}', 35),
('石油危机', 'P0', '{"经济", "政治"}', 35),
('能源危机', 'P0', '{"经济", "政治", "环境"}', 35),
('粮食危机', 'P0', '{"经济", "社会", "环境"}', 35),
-- Economic Crisis (English)
('financial crisis', 'P0', '{"economic", "political"}', 35),
('stock market crash', 'P0', '{"economic"}', 35),
('flash crash', 'P0', '{"economic"}', 35),
('circuit breaker', 'P0', '{"economic"}', 35),
('bank failure', 'P0', '{"economic", "political"}', 35),
('currency crisis', 'P0', '{"economic", "political"}', 35),
('hyperinflation', 'P0', '{"economic", "social"}', 35),
('debt default', 'P0', '{"economic", "political"}', 35),
('sovereign default', 'P0', '{"economic", "political"}', 35),
('oil crisis', 'P0', '{"economic", "political"}', 35),
('energy crisis', 'P0', '{"economic", "political", "environment"}', 35),
('food crisis', 'P0', '{"economic", "social", "environment"}', 35),
-- Technology & Cybersecurity (Chinese)
('人工智能突破', 'P0', '{"科技"}', 35),
('通用人工智能', 'P0', '{"科技"}', 35),
('量子霸权', 'P0', '{"科技"}', 35),
('量子计算突破', 'P0', '{"科技"}', 35),
('大规模网络攻击', 'P0', '{"科技", "政治", "军事"}', 35),
('国家级黑客', 'P0', '{"科技", "政治", "军事"}', 35),
('关键基础设施瘫痪', 'P0', '{"科技", "社会"}', 35),
('数据泄露', 'P0', '{"科技", "社会"}', 35),
('勒索软件', 'P0', '{"科技"}', 35),
-- Technology & Cybersecurity (English)
('AI breakthrough', 'P0', '{"technology"}', 35),
('AGI', 'P0', '{"technology"}', 35),
('quantum supremacy', 'P0', '{"technology"}', 35),
('quantum computing breakthrough', 'P0', '{"technology"}', 35),
('major cyberattack', 'P0', '{"technology", "political", "military"}', 35),
('state-sponsored hacking', 'P0', '{"technology", "political", "military"}', 35),
('critical infrastructure failure', 'P0', '{"technology", "social"}', 35),
('data breach', 'P0', '{"technology", "social"}', 35),
('ransomware', 'P0', '{"technology"}', 35),
-- Environment & Disaster (Chinese)
('大地震', 'P0', '{"环境", "社会"}', 35),
('海啸', 'P0', '{"环境", "社会"}', 35),
('超级台风', 'P0', '{"环境", "社会"}', 35),
('飓风', 'P0', '{"环境", "社会"}', 35),
('龙卷风', 'P0', '{"环境", "社会"}', 35),
('特大洪水', 'P0', '{"环境", "社会"}', 35),
('核泄漏', 'P0', '{"环境", "社会", "政治"}', 35),
('核事故', 'P0', '{"环境", "政治"}', 35),
('生态灾难', 'P0', '{"环境", "社会"}', 35),
('大规模野火', 'P0', '{"环境", "社会"}', 35),
('极端天气', 'P0', '{"环境", "社会"}', 35),
('全球大流行', 'P0', '{"社会", "政治"}', 35),
('疫情爆发', 'P0', '{"社会", "政治"}', 35),
('新型病毒', 'P0', '{"社会", "科技"}', 35),
('生物安全', 'P0', '{"社会", "政治", "科技"}', 35),
-- Environment & Disaster (English)
('major earthquake', 'P0', '{"environment", "social"}', 35),
('tsunami', 'P0', '{"environment", "social"}', 35),
('super typhoon', 'P0', '{"environment", "social"}', 35),
('hurricane', 'P0', '{"environment", "social"}', 35),
('tornado', 'P0', '{"environment", "social"}', 35),
('catastrophic flood', 'P0', '{"environment", "social"}', 35),
('nuclear leak', 'P0', '{"environment", "social", "political"}', 35),
('nuclear accident', 'P0', '{"environment", "political"}', 35),
('ecological disaster', 'P0', '{"environment", "social"}', 35),
('wildfire', 'P0', '{"environment", "social"}', 35),
('extreme weather', 'P0', '{"environment", "social"}', 35),
('pandemic', 'P0', '{"social", "political"}', 35),
('outbreak', 'P0', '{"social", "political"}', 35),
('novel virus', 'P0', '{"social", "technology"}', 35),
('biosecurity', 'P0', '{"social", "political", "technology"}', 35)
on conflict (keyword) do nothing;

-- P1 Level - Major Political/Economic (25 points)
insert into keyword_library (keyword, tier, categories, weight) values
-- Political & Diplomatic (Chinese)
('大选', 'P1', '{"政治"}', 25),
('总统选举', 'P1', '{"政治"}', 25),
('议会选举', 'P1', '{"政治"}', 25),
('公投', 'P1', '{"政治"}', 25),
('弹劾', 'P1', '{"政治"}', 25),
('不信任投票', 'P1', '{"政治"}', 25),
('峰会', 'P1', '{"政治", "外交"}', 25),
('G7', 'P1', '{"政治", "经济"}', 25),
('G20', 'P1', '{"政治", "经济"}', 25),
('联合国大会', 'P1', '{"政治"}', 25),
('北约', 'P1', '{"政治", "军事"}', 25),
('制裁', 'P1', '{"政治", "经济"}', 25),
('撤军', 'P1', '{"政治", "军事"}', 25),
('停火', 'P1', '{"政治", "军事"}', 25),
('和平协议', 'P1', '{"政治"}', 25),
-- Political & Diplomatic (English)
('election', 'P1', '{"political"}', 25),
('presidential election', 'P1', '{"political"}', 25),
('parliamentary election', 'P1', '{"political"}', 25),
('referendum', 'P1', '{"political"}', 25),
('impeachment', 'P1', '{"political"}', 25),
('vote of no confidence', 'P1', '{"political"}', 25),
('summit', 'P1', '{"political", "diplomatic"}', 25),
('NATO', 'P1', '{"political", "military"}', 25),
('sanctions', 'P1', '{"political", "economic"}', 25),
('troop withdrawal', 'P1', '{"political", "military"}', 25),
('ceasefire', 'P1', '{"political", "military"}', 25),
('peace agreement', 'P1', '{"political"}', 25),
-- Economic (Chinese)
('美联储', 'P1', '{"经济"}', 25),
('加息', 'P1', '{"经济"}', 25),
('降息', 'P1', '{"经济"}', 25),
('量化宽松', 'P1', '{"经济"}', 25),
('缩表', 'P1', '{"经济"}', 25),
('通胀', 'P1', '{"经济", "社会"}', 25),
('通缩', 'P1', '{"经济"}', 25),
('滞胀', 'P1', '{"经济"}', 25),
('央行', 'P1', '{"经济"}', 25),
('利率决议', 'P1', '{"经济"}', 25),
('非农就业', 'P1', '{"经济"}', 25),
('GDP', 'P1', '{"经济"}', 25),
('CPI', 'P1', '{"经济"}', 25),
('PPI', 'P1', '{"经济"}', 25),
('PMI', 'P1', '{"经济"}', 25),
-- Economic (English)
('Federal Reserve', 'P1', '{"economic"}', 25),
('rate hike', 'P1', '{"economic"}', 25),
('rate cut', 'P1', '{"economic"}', 25),
('QE', 'P1', '{"economic"}', 25),
('balance sheet reduction', 'P1', '{"economic"}', 25),
('inflation', 'P1', '{"economic", "social"}', 25),
('deflation', 'P1', '{"economic"}', 25),
('stagflation', 'P1', '{"economic"}', 25),
('central bank', 'P1', '{"economic"}', 25),
('interest rate decision', 'P1', '{"economic"}', 25),
('non-farm payroll', 'P1', '{"economic"}', 25),
-- Technology (Chinese)
('OpenAI', 'P1', '{"科技"}', 25),
('GPT', 'P1', '{"科技"}', 25),
('ChatGPT', 'P1', '{"科技"}', 25),
('大语言模型', 'P1', '{"科技"}', 25),
('生成式AI', 'P1', '{"科技"}', 25),
('谷歌', 'P1', '{"科技"}', 25),
('微软', 'P1', '{"科技"}', 25),
('苹果', 'P1', '{"科技"}', 25),
('英伟达', 'P1', '{"科技", "经济"}', 25),
('特斯拉', 'P1', '{"科技", "经济"}', 25),
('亚马逊', 'P1', '{"科技", "经济"}', 25),
('Meta', 'P1', '{"科技"}', 25),
('Facebook', 'P1', '{"科技"}', 25),
('芯片', 'P1', '{"科技", "经济"}', 25),
('半导体', 'P1', '{"科技", "经济"}', 25),
('台积电', 'P1', '{"科技", "经济"}', 25),
('光刻机', 'P1', '{"科技"}', 25),
('芯片禁令', 'P1', '{"科技", "政治"}', 25),
-- Technology (English)
('LLM', 'P1', '{"technology"}', 25),
('generative AI', 'P1', '{"technology"}', 25),
('Google', 'P1', '{"technology"}', 25),
('Microsoft', 'P1', '{"technology"}', 25),
('Apple', 'P1', '{"technology"}', 25),
('NVIDIA', 'P1', '{"technology", "economic"}', 25),
('Tesla', 'P1', '{"technology", "economic"}', 25),
('Amazon', 'P1', '{"technology", "economic"}', 25),
('chip', 'P1', '{"technology", "economic"}', 25),
('semiconductor', 'P1', '{"technology", "economic"}', 25),
('TSMC', 'P1', '{"technology", "economic"}', 25),
('lithography', 'P1', '{"technology"}', 25),
('chip ban', 'P1', '{"technology", "political"}', 25)
on conflict (keyword) do nothing;

-- P2 Level - Industry Major (15 points)
insert into keyword_library (keyword, tier, categories, weight) values
-- Corporate (Chinese)
('财报', 'P2', '{"经济"}', 15),
('季度财报', 'P2', '{"经济"}', 15),
('年报', 'P2', '{"经济"}', 15),
('收购', 'P2', '{"经济"}', 15),
('合并', 'P2', '{"经济"}', 15),
('并购', 'P2', '{"经济"}', 15),
('上市', 'P2', '{"经济"}', 15),
('退市', 'P2', '{"经济"}', 15),
('破产', 'P2', '{"经济"}', 15),
('重组', 'P2', '{"经济"}', 15),
('裁员', 'P2', '{"经济", "社会"}', 15),
('大规模裁员', 'P2', '{"经济", "社会"}', 15),
-- Corporate (English)
('earnings', 'P2', '{"economic"}', 15),
('quarterly earnings', 'P2', '{"economic"}', 15),
('annual report', 'P2', '{"economic"}', 15),
('acquisition', 'P2', '{"economic"}', 15),
('merger', 'P2', '{"economic"}', 15),
('M&A', 'P2', '{"economic"}', 15),
('IPO', 'P2', '{"economic"}', 15),
('delisting', 'P2', '{"economic"}', 15),
('bankruptcy', 'P2', '{"economic"}', 15),
('restructuring', 'P2', '{"economic"}', 15),
('layoffs', 'P2', '{"economic", "social"}', 15),
('mass layoffs', 'P2', '{"economic", "social"}', 15),
-- Product & Industry (Chinese)
('发布', 'P2', '{"科技"}', 15),
('新品发布', 'P2', '{"科技"}', 15),
('突破', 'P2', '{"科技"}', 15),
('创新', 'P2', '{"科技"}', 15),
('临床试验', 'P2', '{"科技", "社会"}', 15),
('新药', 'P2', '{"科技", "社会"}', 15),
-- Product & Industry (English)
('launch', 'P2', '{"technology"}', 15),
('new product', 'P2', '{"technology"}', 15),
('breakthrough', 'P2', '{"technology"}', 15),
('innovation', 'P2', '{"technology"}', 15),
('clinical trial', 'P2', '{"technology", "social"}', 15),
('new drug', 'P2', '{"technology", "social"}', 15)
on conflict (keyword) do nothing;

-- P3 Level - General Hot Topics (8 points)
insert into keyword_library (keyword, tier, categories, weight) values
-- General (Chinese)
('涨价', 'P3', '{"经济", "社会"}', 8),
('降价', 'P3', '{"经济"}', 8),
('更新', 'P3', '{"科技"}', 8),
('升级', 'P3', '{"科技"}', 8),
('合作', 'P3', '{"经济"}', 8),
('投资', 'P3', '{"经济"}', 8),
('融资', 'P3', '{"经济"}', 8),
('扩张', 'P3', '{"经济"}', 8),
-- General (English)
('price increase', 'P3', '{"economic", "social"}', 8),
('price cut', 'P3', '{"economic"}', 8),
('update', 'P3', '{"technology"}', 8),
('upgrade', 'P3', '{"technology"}', 8),
('partnership', 'P3', '{"economic"}', 8),
('investment', 'P3', '{"economic"}', 8),
('funding', 'P3', '{"economic"}', 8),
('expansion', 'P3', '{"economic"}', 8)
on conflict (keyword) do nothing;

-- ============================================
-- Update news_items table: Add categories and priority columns
-- ============================================
alter table news_items 
add column if not exists categories text[] default '{}',
add column if not exists priority text check (priority in ('P0', 'P1', 'P2', 'P3')),
add column if not exists importance_score_calculated integer default 0;

create index idx_news_categories on news_items using gin(categories);
create index idx_news_priority on news_items(priority);
create index idx_news_calculated_score on news_items(importance_score_calculated desc);

-- ============================================
-- Cleanup function for expired sessions
-- ============================================
create or replace function cleanup_expired_sessions()
returns void as $$
begin
  delete from admin_sessions where expires_at < now();
end;
$$ language plpgsql;

-- ============================================
-- View: Keyword statistics
-- ============================================
create or replace view keyword_stats as
select 
  tier,
  count(*) as keyword_count,
  array_agg(distinct unnest_categories) as all_categories
from keyword_library,
lateral unnest(categories) as unnest_categories
where is_active = true
group by tier
order by tier;

-- ============================================
-- Success message
-- ============================================
select 'Migration 002 completed successfully: Admin system tables and default keywords created' as status;
