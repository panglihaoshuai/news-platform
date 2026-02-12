'use client';

import { type NewsFilters, type Theme } from '@/types/news';
import { getThemeTokens } from '@/styles/designTokens';

interface MarketFilterPanelProps {
  filters: NewsFilters;
  onChange: (filters: NewsFilters) => void;
  countries?: string[];
  theme?: Theme;
}

const REGIONS = ['global', 'NA', 'EU', 'AS', 'ME', 'AF', 'OC', 'SA'];
const LANGUAGES: Array<NewsFilters['contentLanguage']> = ['all', 'en', 'zh'];
const DENSITY_LEVELS: Array<NewsFilters['density']> = ['low', 'medium', 'high'];
const CATEGORIES = [
  { key: 'politics', label: 'Politics' },
  { key: 'military', label: 'Military' },
  { key: 'economy', label: 'Economy' },
  { key: 'technology', label: 'Tech' },
  { key: 'environment', label: 'Climate' },
  { key: 'society', label: 'Society' },
  { key: 'sports', label: 'Sports' },
  { key: 'entertainment', label: 'Culture' },
];

function SectionTitle({ title, subtitle, theme }: { title: string; subtitle: string; theme: Theme }) {
  const tokens = getThemeTokens(theme);
  return (
    <div>
      <h4
        style={{
          margin: 0,
          color: tokens.text.secondary,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 700,
        }}
      >
        {title}
      </h4>
      <p style={{ margin: '3px 0 0 0', color: tokens.text.muted, fontSize: 11 }}>{subtitle}</p>
    </div>
  );
}

function ChipButton({
  active,
  label,
  onClick,
  theme,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  theme: Theme;
}) {
  const tokens = getThemeTokens(theme);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 36,
        border: `1px solid ${active ? tokens.accent.info : tokens.border.default}`,
        borderRadius: 8,
        backgroundColor: active ? tokens.bg.hover : tokens.bg.secondary,
        color: active ? tokens.text.primary : tokens.text.secondary,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.25,
        padding: '0 10px',
        cursor: 'pointer',
        transition: 'all 180ms ease',
      }}
    >
      {label}
    </button>
  );
}

export function MarketFilterPanel({
  filters,
  onChange,
  countries = ['US', 'CN', 'GB', 'JP', 'DE', 'FR', 'RU', 'IN'],
  theme = 'dark',
}: MarketFilterPanelProps) {
  const tokens = getThemeTokens(theme);

  const toggleCategory = (category: string) => {
    const nextCategories = filters.categories.includes(category)
      ? filters.categories.filter((item) => item !== category)
      : [...filters.categories, category];

    onChange({ ...filters, categories: nextCategories });
  };

  return (
    <section
      style={{
        backgroundColor: tokens.bg.secondary,
        border: `1px solid ${tokens.border.default}`,
        borderRadius: 10,
        padding: 12,
        display: 'grid',
        gap: 14,
      }}
    >
      <SectionTitle title="Region" subtitle="Select macro area" theme={theme} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
        {REGIONS.map((region) => (
          <ChipButton
            key={region}
            active={filters.region === region}
            label={region.toUpperCase()}
            theme={theme}
            onClick={() => onChange({ ...filters, region })}
          />
        ))}
      </div>

      <SectionTitle title="Language" subtitle="News language channel" theme={theme} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
        {LANGUAGES.map((language) => (
          <ChipButton
            key={language}
            active={filters.contentLanguage === language}
            label={language.toUpperCase()}
            theme={theme}
            onClick={() => onChange({ ...filters, contentLanguage: language })}
          />
        ))}
      </div>

      <SectionTitle title="Country" subtitle="Target country scope" theme={theme} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <ChipButton
          active={filters.country === 'all'}
          label="ALL"
          theme={theme}
          onClick={() => onChange({ ...filters, country: 'all' })}
        />
        {countries.slice(0, 14).map((country) => (
          <ChipButton
            key={country}
            active={filters.country === country}
            label={country}
            theme={theme}
            onClick={() => onChange({ ...filters, country })}
          />
        ))}
      </div>

      <SectionTitle title="Density" subtitle="How many items to show" theme={theme} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}>
        {DENSITY_LEVELS.map((density) => (
          <ChipButton
            key={density}
            active={filters.density === density}
            label={density.toUpperCase()}
            theme={theme}
            onClick={() => onChange({ ...filters, density })}
          />
        ))}
      </div>

      <SectionTitle title="Category" subtitle="Refine by topic" theme={theme} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {CATEGORIES.map((category) => (
          <ChipButton
            key={category.key}
            active={filters.categories.includes(category.key)}
            label={category.label}
            theme={theme}
            onClick={() => toggleCategory(category.key)}
          />
        ))}
      </div>
    </section>
  );
}

export default MarketFilterPanel;
