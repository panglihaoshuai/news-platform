/**
 * Domain Classifier
 * Automatically classifies news articles into 6 domains using keyword matching
 * 
 * Domains: politics, finance, technology, sports, society, general
 * 
 * @version 1.0.0
 * @date 2026-02-09
 */

import type { Domain } from '@/types/unified-news';

// ============================================================================
// Domain Keywords (English)
// ============================================================================

const ENGLISH_KEYWORDS: Record<Domain, string[]> = {
  politics: [
    'election', 'vote', 'voting', 'government', 'minister', 'president',
    'parliament', 'congress', 'senate', 'assembly', 'bill', 'law',
    'sanction', 'sanctions', 'treaty', 'diplomatic', 'diplomacy',
    'war', 'conflict', 'military', 'army', 'troops', 'invasion',
    'summit', 'g20', 'g7', 'nato', 'united nations', 'security council',
    'rebellion', 'revolution', 'protest', 'protests', 'uprising',
    'coup', 'regime', 'opposition', 'candidate', 'campaign',
    'impeachment', 'investigation', 'scandal', 'corruption',
    'border', 'immigration', 'refugee', 'asylum', 'migration',
    'climate change', 'environment', 'energy policy', 'oil and gas',
    'human rights', 'freedom', 'democracy', 'authoritarian',
    'terrorism', 'extremism', 'isis', 'al-qaeda',
  ],
  finance: [
    'stock', 'stocks', 'market', 'markets', 'trading', 'trader',
    'economy', 'economic', 'gdp', 'growth', 'recession', 'inflation',
    'trade', 'trading', 'tariff', 'tariffs', 'import', 'export',
    'investment', 'investor', 'investors', 'bank', 'banking',
    'federal reserve', 'fed', 'ecb', 'interest rate', 'rates',
    'currency', 'dollar', 'euro', 'yen', 'forex', 'exchange rate',
    'oil price', 'gold', 'commodities', 'cryptocurrency', 'bitcoin',
    'merger', 'acquisition', 'ipo', 'initial public offering',
    'company', 'companies', 'corporation', 'business', 'ceo',
    'revenue', 'profit', 'loss', 'earnings', 'quarterly',
    'startup', 'venture capital', 'private equity', 'ipo',
    'tax', 'taxes', 'taxation', 'fiscal', 'budget deficit',
    'unemployment', 'jobs', 'employment', 'labor market',
    'consumer spending', 'retail sales', 'manufacturing',
  ],
  technology: [
    'ai', 'artificial intelligence', 'machine learning', 'deep learning',
    'tech', 'technology', 'technologies', 'technological',
    'software', 'app', 'apps', 'application', 'applications',
    'chip', 'chips', 'semiconductor', 'semiconductors', 'processor',
    'cyber', 'cybersecurity', 'hacking', 'hacker', 'data breach',
    'digital', 'digitization', 'digital transformation',
    'internet', 'online', 'e-commerce', 'ecommerce',
    'google', 'apple', 'microsoft', 'amazon', 'meta', 'facebook',
    'tesla', 'spacex', 'nvidia', 'intel', 'amd', 'openai',
    'robot', 'robotics', 'automation', 'automated',
    'smartphone', 'phone', 'mobile', 'tablet', 'device', 'devices',
    'cloud', 'cloud computing', 'aws', 'azure', 'data center',
    'data', 'data privacy', 'algorithm', 'algorithms',
    '5g', '6g', 'telecom', 'telecommunications', 'broadband',
    'vr', 'virtual reality', 'ar', 'augmented reality', 'metaverse',
  ],
  sports: [
    'football', 'soccer', 'basketball', 'baseball', 'tennis',
    'olympics', 'olympic', 'world cup', 'championship', 'finals',
    'cup', 'league', 'tournament', 'match', 'game', 'games',
    'player', 'players', 'coach', 'team', 'teams', 'club',
    'score', 'scores', 'win', 'won', 'loss', 'lost', 'draw',
    'f1', 'formula one', 'race', 'racing', 'nascar',
    'golf', 'boxing', 'mma', 'ufc', 'wrestling',
    'swimming', 'athletics', 'track and field', 'marathon',
    'cricket', 'rugby', 'hockey', 'volleyball',
    'injury', 'injured', 'suspension', 'banned', 'disqualified',
    'world record', 'record', 'medal', 'gold', 'silver', 'bronze',
    'transfer', 'transfer window', 'signing', 'contract',
    'super bowl', 'nfl', 'nba', 'mlb', 'premier league',
  ],
  society: [
    'health', 'healthcare', 'medical', 'medicine', 'hospital',
    'covid', 'pandemic', 'virus', 'infection', 'vaccine', 'vaccination',
    'education', 'school', 'university', 'college', 'student', 'students',
    'culture', 'cultural', 'art', 'music', 'film', 'movie', 'cinema',
    'entertainment', 'celebrity', 'celebrities', 'star', 'stars',
    'weather', 'storm', 'flood', 'earthquake', 'hurricane', 'tornado',
    'disaster', 'crisis', 'accident', 'fire', 'explosion',
    'crime', 'criminal', 'murder', 'assault', 'theft', 'robbery',
    'police', 'law enforcement', 'detective', 'investigation',
    'court', 'trial', 'judge', 'jury', 'verdict', 'sentence',
    'social media', 'twitter', 'instagram', 'tiktok', 'youtube',
    'lifestyle', 'fashion', 'food', 'travel', 'tourism',
    'housing', 'real estate', 'property', 'rent', 'mortgage',
    'religion', 'faith', 'church', 'mosque', 'temple', 'spiritual',
    'family', 'marriage', 'divorce', 'children', 'parenting',
  ],
  general: [],
};

// ============================================================================
// Domain Keywords (Chinese)
// ============================================================================

const CHINESE_KEYWORDS: Record<Domain, string[]> = {
  politics: [
    '选举', '投票', '政府', '部长', '总统', '议会', '国会',
    '制裁', '条约', '外交', '外交关系', '大使',
    '战争', '冲突', '军事', '军队', '入侵', '占领',
    '峰会', 'G20', 'G7', '北约', '联合国', '安理会',
    '革命', '抗议', '起义', '叛乱', '政变',
    '反对派', '候选人', '竞选', '弹劾', '调查', '丑闻', '腐败',
    '边境', '移民', '难民', '庇护', '移民政策',
    '气候变化', '能源政策', '石油天然气',
    '人权', '自由', '民主', '独裁', '威权',
    '恐怖主义', '极端主义',
  ],
  finance: [
    '股票', '股市', '市场', '交易', '贸易',
    '经济', 'GDP', '增长', '衰退', '通胀', '通货膨胀',
    '关税', '进口', '出口', '贸易战',
    '投资', '投资者', '银行', '银行业',
    '美联储', '欧洲央行', '利率',
    '货币', '美元', '欧元', '日元', '汇率',
    '油价', '黄金', '大宗商品', '加密货币', '比特币',
    '并购', '收购', 'IPO', '首次公开募股',
    '公司', '企业', '商业', 'CEO', '董事长',
    '收入', '利润', '亏损', '盈利', '财报', '季度业绩',
    '创业公司', '风险投资', '私募股权',
    '税收', '税务', '财政', '预算赤字',
    '就业', '失业', '劳动力市场',
    '消费者支出', '零售销售', '制造业',
  ],
  technology: [
    '人工智能', 'AI', '机器学习', '深度学习',
    '科技', '技术', '技术创新',
    '软件', '应用', 'APP', '应用程序',
    '芯片', '半导体', '处理器',
    '网络安全', '黑客', '数据泄露',
    '数字化', '数字转型', '数字经济',
    '互联网', '在线', '电子商务',
    '谷歌', '苹果', '微软', '亚马逊', 'Meta', 'Facebook',
    '特斯拉', 'SpaceX', '英伟达', '英特尔', 'AMD', 'OpenAI',
    '机器人', '机器人技术', '自动化',
    '智能手机', '手机', '移动设备', '平板电脑',
    '云计算', '云服务', 'AWS', 'Azure', '数据中心',
    '数据', '数据隐私', '算法',
    '5G', '6G', '电信', '通讯', '宽带',
    '虚拟现实', 'VR', '增强现实', 'AR', '元宇宙',
  ],
  sports: [
    '足球', '篮球', '棒球', '网球',
    '奥运会', '世界杯', '锦标赛', '决赛',
    '联赛', '杯赛', '锦标赛', '比赛', '赛事',
    '球员', '运动员', '教练', '球队', '俱乐部',
    '比分', '得分', '获胜', '胜利', '失利', '平局',
    'F1', '方程式赛车', '赛车', '比赛',
    '高尔夫', '拳击', 'MMA', 'UFC', '摔跤',
    '游泳', '田径', '马拉松',
    '板球', '橄榄球', '曲棍球', '排球',
    '受伤', '伤病', '禁赛', '取消资格',
    '世界纪录', '纪录', '奖牌', '金牌', '银牌', '铜牌',
    '转会', '签约', '合同',
    '超级碗', 'NFL', 'NBA', 'MLB', '英超',
  ],
  society: [
    '健康', '医疗', '医疗保健', '医院', '医学',
    '疫情', '新冠病毒', '病毒', '疫苗', '接种',
    '教育', '学校', '大学', '学院', '学生',
    '文化', '艺术', '音乐', '电影', '影院',
    '娱乐', '名人', '明星',
    '天气', '风暴', '洪水', '地震', '飓风', '龙卷风',
    '灾难', '危机', '事故', '火灾', '爆炸',
    '犯罪', '罪犯', '谋杀', '袭击', '盗窃', '抢劫',
    '警察', '执法', '侦探', '调查',
    '法院', '审判', '法官', '陪审团', '裁决', '判决',
    '社交媒体', '推特', 'Instagram', 'TikTok', 'YouTube',
    '生活方式', '时尚', '美食', '旅游', '旅游业',
    '住房', '房地产', '房产', '租金', '抵押贷款',
    '宗教', '信仰', '教堂', '清真寺', '寺庙',
    '家庭', '婚姻', '离婚', '孩子', '育儿',
  ],
  general: [],
};

// ============================================================================
// Domain Classifier Class
// ============================================================================

export class DomainClassifier {
  private englishKeywords: Map<string, Domain>;
  private chineseKeywords: Map<string, Domain>;
  
  constructor() {
    this.englishKeywords = new Map();
    this.chineseKeywords = new Map();
    
    // Build English keyword map
    for (const [domain, keywords] of Object.entries(ENGLISH_KEYWORDS)) {
      for (const keyword of keywords) {
        this.englishKeywords.set(keyword.toLowerCase(), domain as Domain);
      }
    }
    
    // Build Chinese keyword map
    for (const [domain, keywords] of Object.entries(CHINESE_KEYWORDS)) {
      for (const keyword of keywords) {
        this.chineseKeywords.set(keyword, domain as Domain);
      }
    }
  }
  
  /**
   * Classify a news title/content into a domain
   * @param title - News article title
   * @param content - Optional article content/summary
   * @returns Domain classification result
   */
  classify(title: string, content?: string): {
    domain: Domain;
    confidence: number;
    matchedKeywords: string[];
    scores: Record<Domain, number>;
  } {
    const text = `${title} ${content || ''}`.toLowerCase();
    const chineseText = `${title} ${content || ''}`;
    
    // Count keyword matches for each domain
    const scores: Record<Domain, number> = {
      politics: 0,
      finance: 0,
      technology: 0,
      sports: 0,
      society: 0,
      general: 0,
    };
    
    const matchedKeywords: string[] = [];
    
    // Check English keywords
    for (const [keyword, domain] of this.englishKeywords) {
      if (text.includes(keyword)) {
        scores[domain]++;
        matchedKeywords.push(keyword);
      }
    }
    
    // Check Chinese keywords
    for (const [keyword, domain] of this.chineseKeywords) {
      if (chineseText.includes(keyword)) {
        scores[domain]++;
        matchedKeywords.push(keyword);
      }
    }
    
    // Find domain with highest score
    let maxScore = 0;
    let bestDomain: Domain = 'general';
    
    for (const [domain, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestDomain = domain as Domain;
      }
    }
    
    // Calculate confidence
    const totalMatches = matchedKeywords.length;
    const confidence = totalMatches >= 2 
      ? Math.min(0.95, 0.5 + (totalMatches * 0.1))  // Higher confidence with more matches
      : totalMatches === 1 
        ? 0.4 
        : 0.2;  // Low confidence for no matches
    
    return {
      domain: bestDomain,
      confidence,
      matchedKeywords,
      scores,
    };
  }
  
  /**
   * Batch classify multiple articles
   */
  classifyBatch(
    articles: Array<{ title: string; content?: string }>
  ): Array<{ title: string; domain: Domain; confidence: number }> {
    return articles.map(article => {
      const result = this.classify(article.title, article.content);
      return {
        title: article.title,
        domain: result.domain,
        confidence: result.confidence,
      };
    });
  }
  
  /**
   * Get domain statistics from a batch of articles
   */
  getDomainStatistics(
    articles: Array<{ title: string; content?: string }>
  ): {
    distribution: Record<Domain, number>;
    total: number;
    topKeywords: Array<{ keyword: string; count: number }>;
  } {
    const distribution: Record<Domain, number> = {
      politics: 0,
      finance: 0,
      technology: 0,
      sports: 0,
      society: 0,
      general: 0,
    };
    
    const keywordCounts = new Map<string, number>();
    
    for (const article of articles) {
      const result = this.classify(article.title, article.content);
      distribution[result.domain]++;
      
      for (const keyword of result.matchedKeywords) {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      }
    }
    
    const topKeywords = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));
    
    return {
      distribution,
      total: articles.length,
      topKeywords,
    };
  }
}

// ============================================================================
// Export
// ============================================================================

export const domainClassifier = new DomainClassifier();

export default DomainClassifier;
