# Sentiment Analysis Features - Implementation Status

**Date**: 2026-02-10
**Status**: A (Partial), B (Modified), D (Removed) | C Reserved

---

## Important Update: GDELT Doesn't Provide Tone Data

**Discovery**: GDELT v2 API `artlist` mode does NOT return `tone` or `sentiment` data.

**Available Fields**:
```json
{
  "url": "...",
  "title": "...",
  "seendate": "...",
  "domain": "...",
  "language": "...",
  "sourcecountry": "...",
  "socialimage": "..."
}
```

**Unavailable Fields**:
- ❌ `tone` (sentiment score)
- ❌ `socialshares` (engagement metrics)
- ❌ `article_content` (full text)

---

## Completed Features

### A. 情感过滤 (Sentiment Filtering) - PARTIALLY IMPLEMENTED

**Status**: ⚠️ Type Support Only - No Actual Tone Data

**Features**:
- `SentimentFilter` type defined in types
- Added to `MapFilters` interface
- **Limitation**: Cannot filter by tone (no data source)

**Usage** (when data available):
```typescript
const filters: MapFilters = {
  sentimentFilter: 'negative',
};
```

**Note**: Requires external sentiment API (e.g., AWS Comprehend, Google NLP) for real implementation.

---

### B. 危机标记 (Crisis Tagging) - KEYWORD-BASED ✅

**Status**: ✅ Implemented with Keywords

**Logic** (Updated):
- Threshold: Keywords in title detection
- Crisis keywords: `war`, `crisis`, `attack`, `terror`, `murder`, `death`, `killed`, `wounded`, `conflict`, `disaster`, `emergency`, `breaking`

```typescript
const crisisKeywords = ['war', 'crisis', 'attack', 'terror', 'murder', 'death', 'killed', 'wounded', 'conflict', 'disaster', 'emergency', 'breaking'];
const isCrisis = crisisKeywords.some(keyword => titleLower.includes(keyword));
```

**Automatic Effects**:
- Crisis news automatically gets `P0` priority
- Boosted in importance scoring

**Database**:
- Column: `is_crisis` (boolean)
- View: `v_crisis_news`

---

### D. 重要性加权 (Importance Weighting) - REVERTED

**Status**: ❌ Tone Bonus Removed

**Original Plan** (not implemented):
```
importance_score = mediaWeight + freshnessScore + keywordScore + toneBonus + contentBonus
```

**Current Implementation**:
```
importance_score = mediaWeight + freshnessScore + keywordScore + contentBonus
```

**Reason**: No tone data available from GDELT

---

## Reserved Features

### C. 趋势仪表盘 (Trends Dashboard) - 待讨论

**Status**: ⚠️ Reserved - 待开发 (Discuss before implementation)

**Proposed Features**:
1. **地区情感趋势**: Regional sentiment over time
2. **话题情感对比**: Compare sentiment across topics
3. **来源视角差异**: Show how different sources cover the same event
4. **历史对比**: Compare current sentiment to historical baseline

**Requirements for Implementation**:
1. **Sentiment API**: Need external service (AWS Comprehend, Google NLP, OpenAI)
2. **Historical Storage**: Store sentiment per article
3. **Aggregation Logic**: Calculate rolling averages by region/topic

**Estimated Cost** (if using cloud NLP):
- AWS Comprehend: ~$1 per 10,000 articles
- Google NLP: ~$1 per 1,000 articles

**Discussion Points**:
1. Which NLP service to use?
2. Budget for sentiment analysis?
3. Which regions/topics to highlight?

---

## Current Data Sources

| Feature | Data Source | Status |
|---------|-------------|--------|
| Crisis Detection | Keywords in title | ✅ Working |
| Sentiment/Tone | N/A (GDELT doesn't provide) | ❌ Not Available |
| Social Shares | N/A (GDELT doesn't provide) | ❌ Not Available |

---

## Alternatives for Future Implementation

### Option 1: Add Sentiment API
```typescript
// Pseudocode
import { Comprehend } from '@aws-sdk/client-comprehend';

async function analyzeSentiment(text: string) {
  const client = new Comprehend({ region: 'us-east-1' });
  const result = await client.detectSentiment({
    Text: text,
    LanguageCode: 'en'
  });
  return result.SentimentScore;
}
```

### Option 2: Use Local Sentiment Library
```bash
npm install sentiment  # Node.js sentiment analysis
```

### Option 3: Accept Limitation
Keep current architecture without sentiment/tone features.

---

## Updated Importance Scoring

**Current Formula**:
```
importance_score = mediaWeight (10-20) + freshnessScore (1-10) + keywordScore (0-5) + contentBonus (0-5)
```

**Priority Boost for Crisis**:
- Crisis articles → P0 regardless of source tier

---

## Database Schema

### Current Columns
```sql
is_crisis BOOLEAN DEFAULT FALSE  -- Crisis detection
```

### Removed Columns
```sql
tone DECIMAL(3,1)              -- NOT available from GDELT
crisis_confidence DECIMAL(3,2)  -- NOT available
```

---

## Frontend Integration

### Crisis Filter UI Mockup
```
┌────────────────────────────────────────┐
│ Filters                    [X]           │
├────────────────────────────────────────┤
│ Time: [24h ▼]                          │
│ Region: [Global ▼]                     │
│ Category: [All ▼]                      │
│ Language: [All ▼]                      │
│ Priority: [All ▼]                      │
│ ─────────────────────────────────      │
│ ☑ Crisis Only (keyword detection)      │
│ ─────────────────────────────────      │
│ [ Apply ]  [ Reset ]                   │
└────────────────────────────────────────┘
```

---

## Test Cases

| Scenario | Expected Result |
|----------|----------------|
| Title: "War in Ukraine continues" | is_crisis = true, priority = P0 |
| Title: "Stock market rises today" | is_crisis = false, priority = normal |
| Title: "Breaking: Earthquake hits Japan" | is_crisis = true, priority = P0 |
| Title: "Local weather forecast" | is_crisis = false |

---

## Next Steps

1. **✅ Crisis Detection**: Working with keywords
2. **❌ Sentiment Filtering**: Needs external API (discuss)
3. **❌ Trends Dashboard**: Needs sentiment data (discuss)
4. **Decision Needed**: Budget for sentiment API?

---

**Document Version**: 2.0 - Updated after GDELT API investigation
**Last Updated**: 2026-02-10
