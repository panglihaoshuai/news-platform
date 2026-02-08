/**
 * Keyword Matcher with Synonym Support
 * 
 * Provides intelligent keyword matching for news classification
 * with support for Chinese/English synonyms and fuzzy matching.
 */

import { createClient } from '@supabase/supabase-js';

// Import string-similarity with any type to avoid module issues
const stringSimilarity = require('string-similarity') as {
  compareTwoStrings: (a: string, b: string) => number;
  findBestMatch: (main: string, targets: string[]) => {
    bestMatch: { rating: number; target: string };
    ratings: Array<{ target: string; rating: number }>;
  };
};

// Fuzzy match threshold
const FUZZY_THRESHOLD = 0.7;

// Interface definitions
export interface KeywordEntry {
  id: string;
  keyword: string;
  synonym_group: string | null;
  tier: 'P0' | 'P1' | 'P2' | 'P3';
  categories: string[];
  weight: number;
  is_active: boolean;
}

export interface SynonymGroup {
  group_id: string;
  canonical_keyword: string;
  synonyms: string[];
}

export interface MatchResult {
  keyword: KeywordEntry;
  matchType: 'exact' | 'synonym' | 'fuzzy';
  similarity?: number;
}

export interface MatchSummary {
  totalScore: number;
  matchedKeywords: MatchResult[];
  categories: string[];
  matchedByExact: number;
  matchedBySynonym: number;
  matchedByFuzzy: number;
}

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Load all active keywords from the database
 */
export async function loadActiveKeywords(): Promise<KeywordEntry[]> {
  const { data, error } = await supabase
    .from('keyword_library')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    console.error('Failed to load keywords:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Build synonym map from keyword entries
 * Groups keywords by synonym_group
 */
export function buildSynonymMap(keywords: KeywordEntry[]): Map<string, SynonymGroup> {
  const synonymMap = new Map<string, SynonymGroup>();
  
  // Group by synonym_group
  const groups = new Map<string, KeywordEntry[]>();
  
  for (const keyword of keywords) {
    if (keyword.synonym_group) {
      if (!groups.has(keyword.synonym_group)) {
        groups.set(keyword.synonym_group, []);
      }
      groups.get(keyword.synonym_group)!.push(keyword);
    }
  }
  
  // Build synonym groups
  for (const [groupId, entries] of groups) {
    // Use the first keyword as canonical
    const canonical = entries[0];
    const synonyms = entries.map(e => e.keyword.toLowerCase());
    
    synonymMap.set(groupId, {
      group_id: groupId,
      canonical_keyword: canonical.keyword,
      synonyms
    });
  }
  
  return synonymMap;
}

/**
 * Normalize keyword for comparison
 */
function normalizeKeyword(keyword: string): string {
  return keyword.toLowerCase().trim();
}

/**
 * Check if a keyword matches (exact, synonym, or fuzzy)
 */
function checkKeywordMatch(
  title: string,
  keyword: KeywordEntry,
  synonymMap: Map<string, SynonymGroup>
): MatchResult | null {
  const normalizedTitle = title.toLowerCase();
  const normalizedKeyword = normalizeKeyword(keyword.keyword);
  
  // 1. Exact match (highest priority)
  if (normalizedTitle.includes(normalizedKeyword)) {
    return {
      keyword,
      matchType: 'exact'
    };
  }
  
  // 2. Synonym match
  if (keyword.synonym_group) {
    const group = synonymMap.get(keyword.synonym_group);
    if (group) {
      for (const synonym of group.synonyms) {
        if (normalizedTitle.includes(synonym)) {
          return {
            keyword,
            matchType: 'synonym'
          };
        }
      }
    }
  }
  
  // 3. Fuzzy match (threshold check)
  const similarity = stringSimilarity.compareTwoStrings(
    normalizedTitle,
    normalizedKeyword
  );
  
  if (similarity >= FUZZY_THRESHOLD) {
    return {
      keyword,
      matchType: 'fuzzy',
      similarity
    };
  }
  
  return null;
}

/**
 * Main keyword matching function
 */
export function matchKeywords(
  title: string,
  keywords: KeywordEntry[],
  synonymMap?: Map<string, SynonymGroup>
): MatchSummary {
  const synMap = synonymMap || buildSynonymMap(keywords);
  
  const matches: MatchResult[] = [];
  const categories = new Set<string>();
  let exactCount = 0;
  let synonymCount = 0;
  let fuzzyCount = 0;
  
  for (const keyword of keywords) {
    const match = checkKeywordMatch(title, keyword, synMap);
    
    if (match) {
      matches.push(match);
      
      // Track match type counts
      switch (match.matchType) {
        case 'exact':
          exactCount++;
          break;
        case 'synonym':
          synonymCount++;
          break;
        case 'fuzzy':
          fuzzyCount++;
          break;
      }
      
      // Collect categories
      for (const cat of keyword.categories) {
        categories.add(cat);
      }
    }
  }
  
  // Calculate total score
  // Exact match: full weight
  // Synonym match: 80% of weight
  // Fuzzy match: 50% of weight
  let totalScore = 0;
  
  for (const match of matches) {
    let weight = match.keyword.weight;
    
    switch (match.matchType) {
      case 'synonym':
        weight *= 0.8;
        break;
      case 'fuzzy':
        weight *= 0.5;
        if (match.similarity) {
          weight *= match.similarity;
        }
        break;
    }
    
    totalScore += weight;
  }
  
  return {
    totalScore: Math.round(totalScore),
    matchedKeywords: matches,
    categories: Array.from(categories),
    matchedByExact: exactCount,
    matchedBySynonym: synonymCount,
    matchedByFuzzy: fuzzyCount
  };
}

/**
 * Enhanced keyword loading with synonym pre-processing
 */
export async function loadKeywordsWithSynonyms(): Promise<{
  keywords: KeywordEntry[];
  synonymMap: Map<string, SynonymGroup>;
}> {
  const keywords = await loadActiveKeywords();
  const synonymMap = buildSynonymMap(keywords);
  
  return { keywords, synonymMap };
}

/**
 * Quick match function for simple use cases
 */
export function quickMatch(
  title: string,
  keywords: Array<{ keyword: string; weight: number; categories: string[] }>
): MatchSummary {
  // Convert simple keywords to KeywordEntry format
  const entries: KeywordEntry[] = keywords.map((k, i) => ({
    id: `temp-${i}`,
    keyword: k.keyword,
    synonym_group: null,
    tier: 'P3' as const,
    categories: k.categories,
    weight: k.weight,
    is_active: true
  }));
  
  return matchKeywords(title, entries);
}

/**
 * Match with tier-based scoring
 * Applies tier multipliers to the base score
 */
export function matchWithTierScoring(
  title: string,
  keywords: KeywordEntry[],
  synonymMap?: Map<string, SynonymGroup>
): MatchSummary {
  const baseMatch = matchKeywords(title, keywords, synonymMap);
  
  // Tier multipliers for priority adjustment
  const tierMultipliers: Record<string, number> = {
    'P0': 1.0,
    'P1': 0.8,
    'P2': 0.6,
    'P3': 0.4
  };
  
  // Recalculate score with tier consideration
  let tieredScore = 0;
  
  for (const match of baseMatch.matchedKeywords) {
    const multiplier = tierMultipliers[match.keyword.tier] || 0.4;
    tieredScore += match.keyword.weight * multiplier;
  }
  
  return {
    ...baseMatch,
    totalScore: Math.round(tieredScore)
  };
}

/**
 * Debug function to see matching details
 */
export function debugMatch(
  title: string,
  keywords: KeywordEntry[],
  synonymMap?: Map<string, SynonymGroup>
): object {
  const synMap = synonymMap || buildSynonymMap(keywords);
  const matchResult = matchKeywords(title, keywords, synMap);
  
  return {
    title,
    keywordCount: keywords.length,
    matchCount: matchResult.matchedKeywords.length,
    exactMatches: matchResult.matchedByExact,
    synonymMatches: matchResult.matchedBySynonym,
    fuzzyMatches: matchResult.matchedByFuzzy,
    totalScore: matchResult.totalScore,
    categories: matchResult.categories,
    matches: matchResult.matchedKeywords.map(m => ({
      keyword: m.keyword.keyword,
      tier: m.keyword.tier,
      matchType: m.matchType,
      similarity: m.similarity
    }))
  };
}

// Tier weight mapping (from importance-scorer.ts)
const TIER_WEIGHTS: Record<string, number> = {
  'P0': 35,
  'P1': 25,
  'P2': 15,
  'P3': 8
};

/**
 * Calculate keyword score compatible with importance scorer
 */
export function calculateKeywordScore(
  title: string,
  keywords: KeywordEntry[]
): { score: number; matched: KeywordEntry[]; categories: string[] } {
  const synonymMap = buildSynonymMap(keywords);
  const result = matchKeywords(title, keywords, synonymMap);
  
  return {
    score: Math.min(35, result.totalScore),
    matched: result.matchedKeywords.map(m => m.keyword),
    categories: result.categories
  };
}
