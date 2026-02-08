# Implementation Learnings - Hybrid Classification System

**Date**: 2026-02-07  
**Status**: In Progress

## Phase 1: DeepSeek API Infrastructure

### DeepSeek Integration
- DeepSeek V3.2 API is OpenAI-compatible
- Base URL: `https://api.deepseek.com`
- Model: `deepseek-chat`
- Response format: JSON object mode

### Key Decisions
- Use `deepseek-chat` model (not `deepseek-reasoner`) for faster classification
- Temperature: 0.3 for consistent classification
- Max tokens: 500 for response
- JSON format required for structured output

## Phase 2: Keyword Matcher Upgrade

### Synonym Strategy
- Each keyword gets 5-10 synonyms
- Include Chinese and English variations
- Partial match threshold: 60% word match
- Confidence score for exact match: 0.95
- Confidence score for fuzzy match: 0.7

## Phase 3: Smart Classifier

### Hybrid Decision Logic
- Keyword confidence > 0.9: Return directly
- Keyword confidence < 0.9: Use LLM for judgment
- LLM failure: Fallback to base score (20 points, P3)

## Cost Optimizations
- DeepSeek caching automatically enabled
- 50% cache hit rate assumed
- Cost ~$0.02-0.05/month even at 50% LLM usage
