/**
 * DeepSeek LLM Service for News Classification
 * 
 * Uses DeepSeek Chat model to classify news articles into categories
 * and determine importance priority tiers.
 * 
 * API Endpoint: https://api.deepseek.com
 * Model: deepseek-chat
 * Temperature: 0.3 (stable classification)
 */

// DeepSeek API configuration
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-chat';
const DEEPSEEK_TEMPERATURE = 0.3;

// Classification categories
export const CATEGORIES = [
  '政治',
  '军事',
  '经济',
  '科技',
  '环境',
  '社会',
  '体育',
  '娱乐'
] as const;

export type Category = typeof CATEGORIES[number];

// Priority tiers
export const PRIORITY_TIERS = ['P0', 'P1', 'P2', 'P3'] as const;
export type PriorityTier = typeof PRIORITY_TIERS[number];

export interface ClassificationResult {
  categories: Category[];
  priority: PriorityTier;
  reasoning: string;
  confidence: number; // 0-1 scale
}

export interface DeepSeekClassificationInput {
  title: string;
  summary?: string;
  sourceName?: string;
  language?: 'zh' | 'en' | 'mixed';
}

// Environment variable type declaration
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DEEPSEEK_API_KEY?: string;
    }
  }
}

/**
 * Get API key from environment or parameter
 */
function getApiKey(apiKey?: string): string {
  return apiKey || process.env.DEEPSEEK_API_KEY || '';
}

/**
 * Create the classification prompt for DeepSeek
 */
export function createClassificationPrompt(input: DeepSeekClassificationInput): object {
  const { title, summary, sourceName, language } = input;
  
  const systemPrompt = `你是一个专业的新闻分类专家。你的任务是对新闻标题进行准确分类。

## 分类体系
1. **政治** - 政府政策、选举、外交关系、国际组织
2. **军事** - 战争、军事行动、国防、武器装备、恐怖主义
3. **经济** - 金融市场、经济政策、贸易、企业财报、通胀就业
4. **科技** - AI突破、互联网产品、新硬件、科学发现、航天
5. **环境** - 气候变化、自然灾害、环保政策、污染治理
6. **社会** - 犯罪案件、社会运动、人口变化、文化事件
7. **体育** - 奥运会、世界杯、职业联赛、重大赛事
8. **娱乐** - 影视综艺、明星八卦、音乐奖项、颁奖典礼

## 优先级判定标准
- **P0 (80+分)** - 重大突发事件：战争爆发、重大政变、严重自然灾害、经济危机、重大科技突破
- **P1 (60-79分)** - 重大政治经济：重要政策出台、经济数据发布、重大外交事件
- **P2 (40-59分)** - 行业重大：科技新品发布、企业重大并购、行业政策变化
- **P3 (20-39分)** - 一般热点：常规赛事、文化活动、一般性社会新闻

## 输出要求
请以JSON格式返回分类结果，包含：
- categories: 预测分类（可多个，按相关性排序）
- priority: 优先级等级
- reasoning: 分类理由（简要说明）
- confidence: 置信度（0-1）

示例输出：
{
  "categories": ["政治", "经济"],
  "priority": "P1",
  "reasoning": "美联储降息是重大货币政策变化",
  "confidence": 0.85
}`;

  // Build user prompt based on available information
  let userContent = `请对以下新闻进行分类：\n\n**标题**: ${title}`;
  
  if (summary) {
    userContent += `\n**摘要**: ${summary}`;
  }
  
  if (sourceName) {
    userContent += `\n**来源**: ${sourceName}`;
  }
  
  if (language) {
    userContent += `\n**语言**: ${language === 'zh' ? '中文' : language === 'en' ? '英文' : '中英混合'}`;
  }
  
  userContent += '\n\n请给出分类结果：';

  return {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ]
  };
}

/**
 * Parse the classification response from DeepSeek
 */
export function parseClassificationResponse(response: string): ClassificationResult {
  try {
    // Try to parse the response as JSON
    const parsed = JSON.parse(response);
    
    // Validate required fields
    if (!parsed.categories || !parsed.priority || !parsed.reasoning) {
      throw new Error('Missing required fields in response');
    }
    
    // Ensure categories is an array
    const categories = Array.isArray(parsed.categories) 
      ? parsed.categories 
      : [parsed.categories];
    
    // Filter to valid categories only
    const validCategories = categories.filter((cat: string) => 
      CATEGORIES.includes(cat as Category)
    ) as Category[];
    
    // Validate priority
    const priority = PRIORITY_TIERS.includes(parsed.priority as PriorityTier)
      ? parsed.priority as PriorityTier
      : 'P3';
    
    return {
      categories: validCategories.length > 0 ? validCategories : ['社会'],
      priority,
      reasoning: parsed.reasoning || 'Based on title analysis',
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
    };
  } catch (parseError) {
    // If JSON parsing fails, try to extract info from text
    console.error('Failed to parse DeepSeek response:', parseError);
    console.error('Raw response:', response);
    
    return {
      categories: ['社会'],
      priority: 'P3',
      reasoning: 'Classification failed, default to P3',
      confidence: 0
    };
  }
}

/**
 * Call DeepSeek API for classification
 */
export async function classifyWithDeepSeek(
  input: DeepSeekClassificationInput,
  apiKey?: string
): Promise<ClassificationResult> {
  const key = getApiKey(apiKey);
  
  if (!key) {
    throw new Error('DEEPSEEK_API_KEY environment variable is not set');
  }
  
  const messages = createClassificationPrompt(input);
  
  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: (messages as { messages: Array<{ role: string; content: string }> }).messages,
        temperature: DEEPSEEK_TEMPERATURE,
        max_tokens: 1000,
        response_format: {
          type: 'json_object'
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid DeepSeek response format');
    }
    
    const content = data.choices[0].message.content;
    return parseClassificationResponse(content);
  } catch (error) {
    console.error('DeepSeek classification error:', error);
    throw error;
  }
}

/**
 * Batch classification for multiple news items
 */
export async function batchClassifyWithDeepSeek(
  inputs: DeepSeekClassificationInput[],
  apiKey?: string
): Promise<ClassificationResult[]> {
  // Process in parallel with concurrency limit
  const results: ClassificationResult[] = [];
  const concurrencyLimit = 5; // Avoid rate limiting
  
  for (let i = 0; i < inputs.length; i += concurrencyLimit) {
    const batch = inputs.slice(i, i + concurrencyLimit);
    const batchResults = await Promise.all(
      batch.map(input => classifyWithDeepSeek(input, apiKey).catch(err => {
        console.error(`Classification failed for: ${input.title}`, err);
        return {
          categories: ['社会'] as Category[],
          priority: 'P3' as PriorityTier,
          reasoning: 'Classification failed',
          confidence: 0
        };
      }))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Estimate cost for classification
 */
export function estimateClassificationCost(
  title: string,
  summary?: string
): { inputTokens: number; outputTokens: number; estimatedCost: number } {
  // Rough token estimates (Chinese: ~1.5 tokens/char, English: ~0.75 tokens/word)
  const titleTokens = Math.ceil(title.length * 0.75);
  const summaryTokens = summary ? Math.ceil(summary.length * 0.75) : 0;
  const systemPromptTokens = 800; // ~800 tokens for system prompt
  
  const inputTokens = systemPromptTokens + titleTokens + summaryTokens + 100; // +100 for formatting
  const outputTokens = 150; // ~150 tokens for JSON response
  
  // DeepSeek pricing: $0.28/1M input, $0.42/1M output
  const inputCost = (inputTokens / 1_000_000) * 0.28;
  const outputCost = (outputTokens / 1_000_000) * 0.42;
  
  return {
    inputTokens,
    outputTokens,
    estimatedCost: inputCost + outputCost
  };
}
