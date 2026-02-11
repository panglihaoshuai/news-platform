'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { NewsItem, Theme } from '@/types/news';
import { ExternalLink, ChevronDown } from 'lucide-react';
import { getThemeTokens } from '@/styles/designTokens';
import { PaywallPromptModal } from '@/components/PaywallPromptModal';
import { usePaywallLinkInterceptor } from '@/hooks/usePaywallPrompt';

interface NewsFeedProps {
    news: NewsItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    theme?: Theme;
    hasLoaded?: boolean;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ news, selectedId, onSelect, theme = 'dark', hasLoaded = false }) => {
    const t = useTranslations('NewsFeed');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const tokens = getThemeTokens(theme);
    const {
        showModal,
        pendingUrl,
        interceptLinkClick,
        handleContinue,
        handleClose,
    } = usePaywallLinkInterceptor();

    return (
        <div 
            className="flex flex-col h-full overflow-y-auto border-l"
            style={{ 
                backgroundColor: tokens.bg.secondary,
                borderColor: tokens.border.default 
            }}
        >
            {news.map((item) => (
                <button
                    type="button"
                    key={item.id}
                    className={`p-4 border-b w-full text-left transition-colors cursor-pointer ${selectedId === item.id ? ' border-l-2 ' : ''
                        }`}
                    onClick={() => onSelect(item.id)}
                >
                    <div className="flex justify-between items-center text-[10px]  uppercase tracking-widest mb-2 font-mono">
                        <div className="flex gap-2">
                            <span className="text-[var(--accent)] font-bold">{item.source_name}</span>
                            <span>•</span>
                            <span>{item.country_code || 'Global'}</span>
                        </div>
                        <span>
                            {new Date(item.published_at).toLocaleString(undefined, {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>

                    <h3 className="text-sm font-semibold  leading-snug mb-2">
                        {item.title}
                    </h3>

                    {expandedId === item.id ? (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="text-xs  leading-relaxed mb-4">
                                {item.summary}
                            </p>
                            <div className="flex gap-4">
                                <a
                                    href={item.original_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        const intercepted = interceptLinkClick(item.original_url);
                                        if (!intercepted) {
                                            window.open(item.original_url, '_blank', 'noopener,noreferrer');
                                        }
                                    }}
                                    className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent)]  uppercase"
                                >
                                    <ExternalLink size={12} />
                                    {t('readOriginal')}
                                </a>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}
                                    className="text-[11px] text-[var(--muted)] hover: uppercase font-bold"
                                >
                                    {t('expand').includes('Details') ? 'Close' : '收起'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setExpandedId(item.id); onSelect(item.id); }}
                            className="flex items-center gap-1 text-[11px] text-[var(--muted)] hover: uppercase font-bold"
                        >
                            <ChevronDown size={12} />
                            {t('expand')}
                        </button>
                    )}
                </button>
            ))}

            {news.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-[var(--muted)] text-sm">
                    {hasLoaded ? 'No news available' : t('loading')}
                </div>
            )}

            <PaywallPromptModal
                isOpen={showModal}
                onClose={handleClose}
                onContinue={handleContinue}
                targetUrl={pendingUrl || ''}
                theme={theme}
            />
        </div>
    );
};
