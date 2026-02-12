'use client';

import { MapDisplayMode, Theme } from '@/types/news';
import { getThemeTokens } from '@/styles/designTokens';
import { MAP_DISPLAY_MODES, MAP_MODE_CONFIG } from '@/hooks/useMapDisplayMode';

interface MapLayersPanelProps {
  mapDisplayMode: MapDisplayMode;
  onMapModeChange: (mode: MapDisplayMode) => void;
  theme?: Theme;
}

export function MapLayersPanel({ mapDisplayMode, onMapModeChange, theme = 'dark' }: MapLayersPanelProps) {
  const tokens = getThemeTokens(theme);

  return (
    <aside
      style={{
        backgroundColor: tokens.bg.secondary,
        border: `1px solid ${tokens.border.default}`,
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 0,
        overflow: 'auto',
      }}
    >
      <div>
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: tokens.text.primary, letterSpacing: 0.4 }}>LAYERS</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: 11, color: tokens.text.muted }}>Map visualization modes</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {MAP_DISPLAY_MODES.map((mode) => {
          const active = mode === mapDisplayMode;
          const config = MAP_MODE_CONFIG[mode];

          return (
            <button
              key={mode}
              type="button"
              onClick={() => onMapModeChange(mode)}
              style={{
                border: `1px solid ${active ? tokens.accent.info : tokens.border.default}`,
                borderRadius: 6,
                backgroundColor: active ? tokens.bg.hover : tokens.bg.tertiary,
                color: active ? tokens.text.primary : tokens.text.secondary,
                textAlign: 'left',
                padding: '8px 10px',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700 }}>{config.name}</div>
              <div style={{ fontSize: 10, color: tokens.text.muted }}>{config.description}</div>
            </button>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${tokens.border.default}`, paddingTop: 10 }}>
        <h4 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: tokens.text.primary, letterSpacing: 0.4 }}>LEGEND</h4>
        <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
          {[
            { label: 'P0 Critical', color: tokens.priority.p0 },
            { label: 'P1 High', color: tokens.priority.p1 },
            { label: 'P2 Medium', color: tokens.priority.p2 },
            { label: 'P3 Low', color: tokens.priority.p3 },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: item.color,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 11, color: tokens.text.secondary }}>{item.label}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: tokens.heat.high,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 11, color: tokens.text.secondary }}>Heat cluster</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default MapLayersPanel;
