'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { NewsFilters, Theme, MapDisplayMode } from '@/types/news';
import { getThemeTokens } from '@/styles/designTokens';
import { Sun, Moon, Eye, Globe, AlertTriangle, Flame } from 'lucide-react';

interface FiltersProps {
    filters: NewsFilters;
    onChange: (filters: NewsFilters) => void;
    theme?: Theme;
    onThemeChange?: (theme: Theme) => void;
    mapDisplayMode?: MapDisplayMode;
    onMapModeChange?: (mode: MapDisplayMode) => void;
}

export const Filters: React.FC<FiltersProps> = ({ 
    filters, 
    onChange,
    theme = 'dark',
    onThemeChange,
    mapDisplayMode = 'all',
    onMapModeChange
}) => {
    const t = useTranslations('HomePage.filters');
    const tokens = getThemeTokens(theme);

    const regions = ['global', 'NA', 'EU', 'AS', 'ME', 'AF', 'OC', 'SA'];
    
    const categories = [
        { key: 'politics', label: '政治', color: tokens.accent.info },
        { key: 'military', label: '军事', color: tokens.priority.p0 },
        { key: 'economy', label: '经济', color: tokens.accent.up },
        { key: 'technology', label: '科技', color: '#a855f7' },
        { key: 'environment', label: '环境', color: '#10b981' },
        { key: 'society', label: '社会', color: tokens.accent.warning },
        { key: 'sports', label: '体育', color: '#eab308' },
        { key: 'entertainment', label: '娱乐', color: '#ec4899' },
    ];

    const themes: { id: Theme; icon: React.ReactNode; label: string }[] = [
        { id: 'dark', icon: <Moon size={14} />, label: 'Dark' },
        { id: 'light', icon: <Sun size={14} />, label: 'Light' },
        { id: 'amber', icon: <Eye size={14} />, label: 'Amber' },
    ];

    const mapModes: { id: MapDisplayMode; icon: React.ReactNode; label: string }[] = [
        { id: 'all', icon: <Globe size={14} />, label: 'All' },
        { id: 'priority', icon: <AlertTriangle size={14} />, label: 'Priority' },
        { id: 'heatmap', icon: <Flame size={14} />, label: 'Heat' },
    ];

    const toggleCategory = (cat: string) => {
        const current = filters.categories || [];
        const newCategories = current.includes(cat)
            ? current.filter(c => c !== cat)
            : [...current, cat];
        onChange({ ...filters, categories: newCategories });
    };

    return (
        <div 
            className="p-4 border-b flex flex-wrap gap-4 items-center"
            style={{ 
                backgroundColor: tokens.bg.secondary,
                borderColor: tokens.border.default 
            }}
        >
            {/* Region Selector */}
            <div className="flex bg-zinc-900 rounded-md p-1">
                {regions.map((region) => (
                    <button
                        key={region}
                        type="button"
                        onClick={() => onChange({ ...filters, region })}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${filters.region === region
                            ? 'bg-zinc-700 text-white shadow-sm'
                            : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        {region}
                    </button>
                ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Language</span>
                <div className="flex bg-zinc-900 rounded-md p-1">
                    {(['en', 'zh', 'all'] as const).map((lang) => (
                        <button
                            key={lang}
                            type="button"
                            onClick={() => onChange({ ...filters, contentLanguage: lang })}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${filters.contentLanguage === lang
                                ? 'bg-zinc-700 text-white shadow-sm'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Selector */}
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">类型</span>
                <div className="flex flex-wrap gap-1 bg-zinc-900 rounded-md p-1">
                    {categories.map((cat) => {
                        const isActive = (filters.categories || []).includes(cat.key);
                        return (
                            <button
                                key={cat.key}
                                type="button"
                                onClick={() => toggleCategory(cat.key)}
                                className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition-all ${
                                    isActive
                                        ? `${cat.color} text-white shadow-sm`
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {cat.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Density Selector */}
            <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t('density')}</span>
                <div className="flex bg-zinc-900 rounded-md p-1">
                    {(['low', 'medium', 'high'] as const).map((d) => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => onChange({ ...filters, density: d })}
                            className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${filters.density === d
                                ? 'bg-red-600 text-white'
                                : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {d}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
