# Implementation Issues - Hybrid Classification System

**Date**: 2026-02-07

## Known Issues

### Environment Variables
- Need to add `DEEPSEEK_API_KEY` to `.env.local`
- Need to verify API key works before deployment

### Database Schema
- Need to run migration `database/migrations/002_add_admin_tables.sql`
- Need to create `keyword_synonyms` table for synonym storage
- Need to add `classification_source` and `classification_reasoning` columns

### API Integration
- DeepSeek API returns JSON, need to handle parse errors
- Need timeout handling for API calls
- Need fallback mechanism if API fails

## Resolutions

### TBD
