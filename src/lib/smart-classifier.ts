/**
 * Smart Classifier - Hybrid News Classification System
 * 
 * Combines keyword matching with DeepSeek LLM for intelligent news classification.
 * Hybrid approach: keyword matching first, then LLM for unmatched items.
 */

import {
  classifyWithDeepSeek,
  batchClassifyWithDeepSeek,
  ClassificationResult,
  DeepSeekClassificationInput,
  Category,
  PriorityTier
} from '@/services/deepseek-service';
import {
  matchKeywords,
  loadActiveKeywords,
  buildSynonymMap,
  KeywordEntry,
  MatchResult,
  MatchSummary
} from '@/lib/keyword-matcher';
import {
  calculateFreshnessScore,
  getMediaWeight,
  calculateContentBonus,
  determinePriority
} from '@/lib/importance-scorer';

// Configuration thresholds
const KEYWORD_CONFIDENCE_THRESHOLD = 0.9; // If keyword match >= 90%, use keyword result
const KEYWORD_SCORE_THRESHOLD = 25; // If keyword score >= 25, consider it a good match
const MAX_KEYWORD_MATCHES = 3; // Max keywords to consider for a single news item

// Classification source tracking
export type ClassificationSource = 'keyword' | 'llm' | 'hybrid' | 'fallback';

export interface SmartClassificationResult {
  categories: Category[];
  priority: PriorityTier;
  source: ClassificationSource;
  confidence: number;
  reasoning: string;
  
  // Detailed breakdown
  keywordMatch?: {
    score: number;
    matches: MatchResult[];
    categories: string[];
  };
  
  llmClassification?: ClassificationResult;
  
  // Scoring factors
  factors: {
    mediaWeight: number;
    freshnessScore: number;
    keywordScore: number;
    contentBonus: number;
    llmScore?: number;
  };
  
  // Metadata
  processingTime: number;
  usedLLM: boolean;
  costEstimate?: number;
}

export interface NewsItemInput {
  title: string;
  summary?: string;
  sourceName: string;
  publishedAt: string;
  enclosure?: any;
  creator?: string;
}

/**
 * Determine language from title
 */
function detectLanguage(title: string): 'zh' | 'en' | 'mixed' {
  const chineseRegex = /[\u4e00-\u9fa5]/;
  const englishRegex = /[a-zA-Z]/;
  
  const hasChinese = chineseRegex.test(title);
  const hasEnglish = englishRegex.test(title);
  
  if (hasChinese && hasEnglish) return 'mixed';
  if (hasChinese) return 'zh';
  return 'en';
}

/**
 * Classify a single news item using hybrid approach
 */
export async function classifyNews(
  input: NewsItemInput,
  keywords?: KeywordEntry[]
): Promise<SmartClassificationResult> {
  const startTime = Date.now();
  const { title, summary, sourceName, publishedAt, enclosure, creator } = input;
  
  // Load keywords if not provided
  const keywordList = keywords || await loadActiveKeywords();
  const synonymMap = buildSynonymMap(keywordList);
  
  // Step 1: Keyword matching
  const keywordResult = matchKeywords(title, keywordList, synonymMap);
  const keywordConfidence = calculateKeywordConfidence(keywordResult);
  
  // Step 2: Determine if we need LLM
  const needsLLM = shouldUseLLM(keywordResult, keywordConfidence);
  
  let llmResult: ClassificationResult | undefined;
  let usedLLM = false;
  let costEstimate = 0;
  
  if (needsLLM) {
    usedLLM = true;
    
    // Call DeepSeek for classification
    try {
      llmResult = await classifyWithDeepSeek({
        title,
        summary,
        sourceName,
        language: detectLanguage(title)
      });
      
      // Estimate cost
      const cost = estimateClassificationCost(title, summary);
      costEstimate = cost.estimatedCost;
    } catch (error) {
      console.error('LLM classification failed:', error);
      // Fallback to keyword results
    }
  }
  
  // Step 3: Synthesize final result
  const result = synthesizeResult(
    keywordResult,
    llmResult,
    usedLLM
  );
  
  // Step 4: Calculate scoring factors
  const factors = calculateScoringFactors(
    input,
    keywordResult,
    llmResult
  );
  
  // Step 5: Determine final priority
  const priority = determineFinalPriority(factors, result.priority);
  
  const processingTime = Date.now() - startTime;
  
  return {
    categories: result.categories,
    priority,
    source: result.source,
    confidence: result.confidence,
    reasoning: result.reasoning,
    keywordMatch: {
      score: keywordResult.totalScore,
      matches: keywordResult.matchedKeywords,
      categories: keywordResult.categories as string[]
    },
    llmClassification: llmResult,
    factors,
    processingTime,
    usedLLM,
    costEstimate
  };
}

/**
 * Calculate confidence level from keyword matching
 */
function calculateKeywordConfidence(matchResult: MatchSummary): number {
  if (matchResult.matchedKeywords.length === 0) return 0;
  
  // Higher confidence if:
  // - Many exact matches
  // - High keyword score
  // - Clear category consensus
  
  const exactRatio = matchResult.matchedByExact / matchResult.matchedKeywords.length;
  const scoreRatio = Math.min(matchResult.totalScore / 35, 1); // Cap at 35
  
  // Combine factors
  const confidence = (exactRatio * 0.5) + (scoreRatio * 0.5);
  
  return Math.min(confidence, 1);
}

/**
 * Determine if LLM should be used
 */
function shouldUseLLM(
  keywordResult: MatchSummary,
  keywordConfidence: number
): boolean {
  // Use LLM if:
  // 1. No keyword matches at all
  // 2. Low keyword confidence (< 90%)
  // 3. Keyword score is low (< 25) but not zero
  // 4. Categories are ambiguous (multiple categories with similar scores)
  
  if (keywordResult.matchedKeywords.length === 0) return true;
  
  if (keywordConfidence < KEYWORD_CONFIDENCE_THRESHOLD) return true;
  
  if (keywordResult.totalScore < KEYWORD_SCORE_THRESHOLD) return true;
  
  // Check for category ambiguity
  if (keywordResult.categories.length > 3) return true;
  
  return false;
}

/**
 * Synthesize final classification from keyword and LLM results
 */
function synthesizeResult(
  keywordResult: MatchSummary,
  llmResult?: ClassificationResult,
  usedLLM?: boolean
): {
  categories: Category[];
  priority: PriorityTier;
  source: ClassificationSource;
  confidence: number;
  reasoning: string;
} {
  // Case 1: Good keyword match, no LLM needed
  if (!usedLLM || !llmResult) {
    const categories: Category[] = keywordResult.categories.length > 0
      ? keywordResult.categories.filter((c): c is Category => 
          ['政治', '军事', '经济', '科技', '环境', '社会', '体育', '娱乐'].includes(c)
        )
      : ['社会'];
    
    return {
      categories,
      priority: keywordToPriority(keywordResult),
      source: 'keyword',
      confidence: calculateKeywordConfidence(keywordResult),
      reasoning: `Keyword matching: ${keywordResult.matchedByExact} exact, ${keywordResult.matchedBySynonym} synonym, ${keywordResult.matchedByFuzzy} fuzzy matches`
    };
  }
  
  // Case 2: LLM classification available
  // Use LLM categories but consider keyword consensus
  
  // If keywords strongly suggest one category and LLM agrees → high confidence
  // If keywords and LLM disagree → use LLM but note the conflict
  
  const validCategories = ['政治', '军事', '经济', '科技', '环境', '社会', '体育', '娱乐'] as const;
  const keywordCategories = new Set<Category>(
    keywordResult.categories
      .filter((c): c is Category => validCategories.includes(c as Category))
  );
  const llmCategories = new Set<Category>(llmResult.categories);
  
  // Check agreement
  const agreement: Category[] = [...keywordCategories].filter((c): c is Category => llmCategories.has(c));
  const hasAgreement = agreement.length > 0;
  
  if (hasAgreement) {
    // Good agreement between keyword and LLM
    return {
      categories: llmResult.categories,
      priority: llmResult.priority,
      source: 'hybrid',
      confidence: Math.max(0.7, llmResult.confidence),
      reasoning: `Hybrid: Keywords and LLM agree on ${agreement.join(', ')}. ${llmResult.reasoning}`
    };
  } else {
    // Disagreement - trust LLM more for classification
    return {
      categories: llmResult.categories,
      priority: llmResult.priority,
      source: 'llm',
      confidence: llmResult.confidence * 0.8, // Reduce confidence slightly
      reasoning: `LLM override: Keywords suggested ${[...keywordCategories].join(', ')} but LLM classified as ${llmResult.categories.join(', ')}. ${llmResult.reasoning}`
    };
  }
}

/**
 * Convert keyword score to priority tier
 */
function keywordToPriority(matchResult: MatchSummary): PriorityTier {
  // Use the matched keywords to determine priority
  const hasP0 = matchResult.matchedKeywords.some(m => m.keyword.tier === 'P0');
  const hasP1 = matchResult.matchedKeywords.some(m => m.keyword.tier === 'P1');
  const hasP2 = matchResult.matchedKeywords.some(m => m.keyword.tier === 'P2');
  
  if (hasP0) return 'P0';
  if (hasP1) return 'P1';
  if (hasP2) return 'P2';
  
  // Default to P3 based on score
  return determinePriority(matchResult.totalScore) || 'P3';
}

/**
 * Calculate scoring factors for importance
 */
function calculateScoringFactors(
  input: NewsItemInput,
  keywordResult: MatchSummary,
  llmResult?: ClassificationResult
): SmartClassificationResult['factors'] {
  const mediaWeight = getMediaWeight(input.sourceName);
  const freshnessScore = calculateFreshnessScore(input.publishedAt);
  const contentBonus = calculateContentBonus({
    ...input,
    enclosure: input.enclosure,
    creator: input.creator
  });
  
  // Use keyword score (capped at 35)
  const keywordScore = Math.min(keywordResult.totalScore, 35);
  
  // LLM can provide additional scoring hints
  const llmScore = llmResult ? convertLLMScore(llmResult) : undefined;
  
  return {
    mediaWeight,
    freshnessScore,
    keywordScore,
    contentBonus,
    llmScore
  };
}

/**
 * Convert LLM confidence/priority to a numeric score
 */
function convertLLMScore(llmResult: ClassificationResult): number {
  // Map priority to score
  const priorityScores: Record<PriorityTier, number> = {
    'P0': 35,
    'P1': 25,
    'P2': 15,
    'P3': 8
  };
  
  const baseScore = priorityScores[llmResult.priority] || 8;
  
  // Adjust by confidence
  return baseScore * llmResult.confidence;
}

/**
 * Determine final priority from all factors
 */
function determineFinalPriority(
  factors: SmartClassificationResult['factors'],
  initialPriority: PriorityTier
): PriorityTier {
  // Calculate total from all factors
  let total = factors.mediaWeight + factors.freshnessScore + factors.keywordScore + factors.contentBonus;
  
  // Add LLM score if available
  if (factors.llmScore) {
    total += factors.llmScore;
  }
  
  // Determine priority from total
  if (total >= 80) return 'P0';
  if (total >= 60) return 'P1';
  if (total >= 40) return 'P2';
  if (total >= 20) return 'P3';
  
  return 'P3'; // Default
}

/**
 * Estimate classification cost
 */
function estimateClassificationCost(
  title: string,
  summary?: string
): { inputTokens: number; outputTokens: number; estimatedCost: number } {
  // Rough token estimates
  const titleTokens = Math.ceil(title.length * 0.75);
  const summaryTokens = summary ? Math.ceil(summary.length * 0.75) : 0;
  const systemPromptTokens = 800;
  
  const inputTokens = systemPromptTokens + titleTokens + summaryTokens + 100;
  const outputTokens = 150;
  
  // DeepSeek pricing
  const inputCost = (inputTokens / 1_000_000) * 0.28;
  const outputCost = (outputTokens / 1_000_000) * 0.42;
  
  return {
    inputTokens,
    outputTokens,
    estimatedCost: inputCost + outputCost
  };
}

/**
 * Batch classify multiple news items
 */
export async function batchClassifyNews(
  inputs: NewsItemInput[],
  keywords?: KeywordEntry[]
): Promise<SmartClassificationResult[]> {
  // Load keywords once
  const keywordList = keywords || await loadActiveKeywords();
  
  // Process in batches to avoid rate limiting
  const results: SmartClassificationResult[] = [];
  const batchSize = 5;
  
  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(input => classifyNews(input, keywordList))
    );
    
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Quick classification for simple use cases
 */
export async function quickClassify(
  title: string,
  sourceName: string = 'default'
): Promise<SmartClassificationResult> {
  return classifyNews({
    title,
    sourceName,
    publishedAt: new Date().toISOString()
  });
}
