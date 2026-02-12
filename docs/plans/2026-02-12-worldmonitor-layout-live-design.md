# WorldMonitor-Style Layout + YouTube Live Panel (Design)

Date: 2026-02-12

## Goal

Deliver a more comfortable "situation room" dashboard layout (inspired by koala73/worldmonitor) while keeping our current stack and data model:

- Layout: top bar + left layer panel + large central map + right info rail + bottom card deck.
- Live video: a single in-app player with tab switching (YouTube-only, official channels only).
- Priority: when the Federal Reserve is live, auto-focus to Fed; otherwise show a playable global news stream (Reuters preferred).

## Non-goals (V1)

- No new external data sources or new map layers (only UI toggles for existing map visualization modes).
- No multi-player (no in-app multi-stream) to avoid audio chaos and CPU/memory blowups.
- No Reuters/BBC proprietary embeds (license risk). YouTube-only.

## Current Baseline (What We Have)

- Layout shell:
  - src/components/layout/TerminalLayout.tsx
  - src/components/layout/TickerBar.tsx
  - src/components/layout/StatusBar.tsx
  - src/components/layout/MarketDataPanel.tsx
- Map:
  - src/components/InteractiveMap.tsx (MapLibre + clustered news points)
- Main page composition:
  - src/app/[locale]/page.tsx

## Proposed Layout (V1)

Use a CSS Grid-based layout with explicit regions.

- Top bar (existing ticker/status elements, or a new compact header bar)
- Left: "Layers" panel (toggles for map visualization modes and map UI controls)
- Center: map viewport (InteractiveMap)
- Right: info rail (news list + market, reuse existing components)
- Bottom: card deck (Live panel first; optionally 1-2 existing panels later)

Implementation approach:

- Add a new layout variant in src/components/layout/TerminalLayout.tsx that can render this grid.
- Keep existing resize behavior optional; V1 can be fixed grid with sensible breakpoints.

## Map UI (V1)

We will not add new data layers; we will add a left-side UI that controls existing behavior:

- Map display mode: all / priority / heatmap (wire to src/hooks/useMapDisplayMode.ts).
- Marker density controls (clusterRadius / clusterMaxZoom knobs are out of scope for V1; only mode toggles).
- Legend (static): explain priority colors and cluster meaning.

Key constraint: avoid introducing new "always on" overlays that reduce map readability.

## Live Video Panel (YouTube-only)

### UX

- Single player, tabs for channels.
- Default mute ON.
- Switching tabs:
  - loads the new channel videoId (no page reload)
  - auto-mutes on switch
  - user explicitly unmutes
- Error handling:
  - if a channel video cannot play (embed disabled/region blocked), automatically try the next candidate and show a clear status message.

### Priority Rules

Channel groups:

- Fed group: one or more official Fed YouTube handles.
- Global news group: Reuters, BBC News, CNN (no strict order; select the first playable).

Selection:

1) If ANY Fed handle is live: select Fed (auto-focus and show a "LIVE: FED" indicator in chrome).
2) Else: select the first playable channel among Reuters/BBC/CNN.

### Technical Architecture

Components:

- src/components/live/LiveStreamsPanel.tsx
  - tabs
  - player container
  - status / error message
  - open-in-youtube link

API:

- src/app/api/youtube/live/route.ts
  - input: handle (e.g. "@Reuters")
  - output: { live: boolean, videoId: string | null }
  - implementation: resolve /@handle/live and extract videoId from the final URL or page metadata

Player:

- Use YouTube IFrame API (recommended for switching without reload).
- Use youtube-nocookie domain for embeds.

Config (V1 hardcoded, later admin-editable):

- A list of channels:
  - id, label, handle, fallbackVideoId, group (fed/global)

## Security / Compliance

- Official YouTube channels only.
- No scraping proprietary streams.
- Use no-cookie embeds.
- No autoplay with sound.

## Milestones + Acceptance Criteria

### M1: Live panel MVP (no layout change)

- Add LiveStreamsPanel and mount it in an existing area (temporary placement).
- Add /api/youtube/live endpoint.
- Criteria:
  - Tabs switch without a full-page reload.
  - Default mute on load and on tab switch.
  - Fed live detection causes auto-focus within polling interval.
  - If a channel cannot embed, auto-fallback works and UI indicates why.

### M2: Layout grid (worldmonitor-style)

- Add new layout variant in TerminalLayout and wire in page.tsx.
- Criteria:
  - No clipping at right/bottom edges.
  - Map remains primary viewport.
  - Right rail scrolls independently.
  - Bottom deck remains visible and does not overlap map interactions.

### M3: Left layers panel (map mode + legend)

- Wire map display mode via useMapDisplayMode.
- Add simple legend.
- Criteria:
  - Mode switches update map rendering reliably.
  - Legend is readable but non-intrusive.

## Testing Plan

- Unit tests:
  - Pure selection logic for priority rules (Fed live overrides; fallback order).
  - URL parsing/extraction in the /api/youtube/live route.
- Regression:
  - npm run build
  - npx tsc --noEmit

## Open Questions

- Final list of Fed official handles to include in the Fed group (we can seed with "@federalreserve" and refine later).
