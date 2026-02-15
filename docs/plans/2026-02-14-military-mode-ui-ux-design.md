# Military Tracking Mode - UI/UX Design Document

## 1. Overview

Add military tracking mode to existing Bloomberg-style news platform with:
- Military news filtering and prioritization
- Real-time US military aircraft visualization on map
- Density heatmap for military activity hotspots

## 2. Visual Design (Bloomberg Style)

### Color Palette

| Element | Color | Hex |
|---------|-------|-----|
| Bombers | Red | #ff3b30 |
| Transport | Blue | #0a84ff |
| Fighters | Gold | #ffb000 |
| Helicopters | Green | #30d158 |
| Bases | Purple | #bf5af2 |
| Heatmap (low) | Blue | #0a84ff |
| Heatmap (high) | Red | #ff3b30 |
| Panel BG | Dark | #141415 |
| Panel Border | Gray | #2c2c2e |
| Text Primary | White | #f5f5f5 |
| Text Secondary | Gray | #a0a0a5 |

### Typography
- Font: Monospace (existing Bloomberg style)
- Sizes: 10px (labels), 12px (counts), 14px (titles)

### Components

#### 2.1 Military Toggle Panel (New)
Location: Top-right corner, next to existing Filters

```
┌─────────────────────────────────┐
│ 🛩️ Military Tracking    [ON]  │  ← Toggle switch
├─────────────────────────────────┤
│  🛫 Aircraft    ████████░░ 12 │  ← Count + bar
│  🏯 Bases       ██████░░░░ 8   │  ← Count + bar
│  📊 Activity    ████████░░ High │  ← Density indicator
└─────────────────────────────────┘
```

- Toggle: Switch between OFF/ON
- Aircraft toggle: Show/hide military aircraft on map
- Bases toggle: Show/hide overseas US bases
- Density indicator: Real-time activity level

#### 2.2 Aircraft Marker Icons
Each aircraft type has distinct color and icon:
- Bomber (B-52, B-2, B-1): Red circle with ✈️
- Transport (C-130, C-17): Blue circle with 🛫
- Fighter (F-22, F-35, F-18): Gold circle with fighter icon
- Helicopter (H-60, H-47): Green circle with Heli icon

#### 2.3 Density Heatmap
- Low activity: Blue overlay (#0a84ff, 30% opacity)
- Medium activity: Orange overlay (#ff9500, 40% opacity)
- High activity: Red overlay (#ff3b30, 50% opacity)
- Trigger: When aircraft count at base > 3x normal

#### 2.4 News Feed Changes
When military mode ON:
- Filter: Only show military category news
- Sort: Military news first, then by time
- Highlight: Military news has left border color matching aircraft type
- Badge: "🔴 Military" tag on each item

## 3. Functionality

### 3.1 Toggle Flow
1. User clicks "Military Tracking" toggle
2. System enables military mode:
   - Load aircraft data from OpenSky API
   - Show base markers on map
   - Filter news to military only
3. When OFF: Restore previous state

### 3.2 Aircraft Data Flow
```
OpenSky API → Filter US Military → Classify by Type → Display on Map
                                    ↓
                            Color by Category
                            (Bomber/Transport/Fighter/Heli)
```

### 3.3 Density Calculation
```
For each base region:
  currentCount = aircraft within 50km of base
  baseline = average(count last 7 days)
  ratio = currentCount / baseline
  
  If ratio > 3.0 → HIGH (red)
  If ratio > 2.0 → MEDIUM (orange)
  Else → LOW (blue)
```

### 3.4 News Filtering
- Source: Existing news_items table
- Filter: category = 'military' OR keywords contains military terms
- Sort: importance_score DESC, then published_at DESC

## 4. Component Structure

```
src/
├── components/
│   ├── military/
│   │   ├── MilitaryModeToggle.tsx    # Main toggle panel
│   │   ├── AircraftMarker.tsx        # Aircraft icons
│   │   ├── BaseMarker.tsx            # Base icons
│   │   ├── DensityHeatmap.tsx        # Heatmap layer
│   │   └── MilitaryNewsBadge.tsx     # News tag
│   └── Filters.tsx                   # Modify existing
├── hooks/
│   └── useMilitaryMode.ts             # State management
└── lib/
    └── military/
        ├── aircraftClassifier.ts      # Classify aircraft type
        └── densityCalculator.ts      # Calculate density
```

## 5. Acceptance Criteria

| Feature | Criteria |
|---------|----------|
| Toggle | Click toggles military mode on/off |
| Aircraft Display | Colored markers show on map when enabled |
| Base Display | 40+ bases shown as purple markers |
| Heatmap | Red zones appear when activity > 3x normal |
| News Filter | Only military news shown when mode ON |
| Performance | Map updates within 2 seconds |
| Tests | All unit tests pass |

## 6. Implementation Phases

### Phase 1: Toggle Panel
- Create MilitaryModeToggle component
- Add to top-right of map

### Phase 2: Map Visualization
- Update AircraftMarker with type-based colors
- Add base markers
- Add density heatmap layer

### Phase 3: News Integration
- Modify news filtering when mode ON
- Add military badges to news items

### Phase 4: Testing
- Unit tests for each component
- E2E browser tests

---

*Document created: 2026-02-14*
*Status: Ready for implementation*
