# Implementation Learnings - Hybrid Classification System

## Overview
Smart classification system combining keyword matching + DeepSeek LLM for Global Intel Map news classification.

## Key Design Decisions

### 1. Classification Strategy
- Keyword matching first for fast, cheap classification
- DeepSeek LLM as fallback for unmatched items
- Confidence threshold: 90% - if keyword match ≥90%, use keyword result
- Cost optimization: LLM only when needed (~50% of news items)

### 2. Synonym Handling
- Keywords stored in `keyword_library.synonym_group` column
- Synonym matching uses 80% weight (vs 100% for exact match)
- Example: "刺杀" → matches "遇刺", "暗杀", "被枪击" with 80% score

### 3. Priority Scoring (P0-P3)
- P0 (≥80): 重大突发事件 - war, economic crisis, major disaster
- P1 (60-79): 重大政治经济 - policy changes, economic data
- P2 (40-59): 行业重大 - product launches, M&A
- P3 (20-39): 一般热点 - regular events

### 4. DeepSeek Configuration
- Model: `deepseek-chat` (not `deepseek-reasoner`)
- Temperature: 0.3 for stable classification
- JSON response format
- Auto-caching enabled (reduces costs)

## Code Patterns

### Smart Classification Flow
```typescript
async function classifyNews(input) {
  // Step 1: Keyword matching
  const keywordResult = matchKeywords(title, keywords);
  
  // Step 2: Check if LLM needed
  if (keywordConfidence < 0.9 || keywordScore < 25) {
    // Step 3: Call DeepSeek
    llmResult = await classifyWithDeepSeek(input);
  }
  
  // Step 4: Synthesize final result
  return synthesizeResult(keywordResult, llmResult);
}
```

### Keyword Match Priority
1. Exact match (100% weight)
2. Synonym match (80% weight)
3. Fuzzy match (50% weight × similarity score)

## Gotchas & Issues

### 1. TypeScript Type Narrowing
- Categories returned from database are `string[]`, not `Category[]`
- Solution: Filter and cast using valid category list

### 2. string-similarity Module
- No TypeScript types available
- Solution: Use `require()` with type assertion

### 3. DeepSeek Environment Variable
- Must use `process.env.DEEPSEEK_API_KEY` in Node.js context
- Check for undefined before use

## File Locations
- Services: `src/services/deepseek-service.ts`
- Lib: `src/lib/{keyword-matcher.ts, smart-classifier.ts, importance-scorer.ts}`
- Scripts: `scripts/fetch-rss.ts`
- Config: `.env.local`

## Database Tables
- `keyword_library` - Keywords with synonyms, tiers, categories
- `news_items` - Enhanced with classification tracking fields

## Next Steps
- Run tests to verify classification accuracy
- Monitor LLM usage and costs
- Add more keywords to library
- Optimize synonym groups
