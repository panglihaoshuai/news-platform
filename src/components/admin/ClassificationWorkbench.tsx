'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { NewsItem } from '@/types/news';
import { ScoringResult } from '@/lib/importance-scorer';

interface NewsWithScore extends NewsItem {
  scoringResult?: ScoringResult;
  categories?: string[];
  priority?: string;
}

const CATEGORIES = ['政治', '军事', '经济', '科技', '社会', '体育', '娱乐', '其他'];

const TIER_OPTIONS = [
  { value: 'P0', label: 'P0-重大', color: 'bg-red-600' },
  { value: 'P1', label: 'P1-重要', color: 'bg-orange-500' },
  { value: 'P2', label: 'P2-普通', color: 'bg-yellow-500' },
  { value: 'P3', label: 'P3-低优', color: 'bg-green-500' },
];

export const ClassificationWorkbench: React.FC = () => {
  const [news, setNews] = useState<NewsWithScore[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsWithScore | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadNews = useCallback(async () => {
    try {
      const response = await fetch('/api/news?limit=50');
      if (response.ok) {
        const data = await response.json();
        setNews(data);
        if (data.length > 0 && !selectedNews) {
          setSelectedNews(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedNews]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  useEffect(() => {
    if (selectedNews) {
      setSelectedCategories(selectedNews.categories || []);
      setSelectedPriority(selectedNews.priority || '');
    }
  }, [selectedNews]);

  const handleSave = async () => {
    if (!selectedNews) return;

    try {
      const response = await fetch('/api/admin/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsItemId: selectedNews.id,
          categories: selectedCategories,
          priority: selectedPriority,
          notes
        })
      });

      if (response.ok) {
        // Move to next news item
        const currentIndex = news.findIndex(n => n.id === selectedNews.id);
        const nextIndex = (currentIndex + 1) % news.length;
        setSelectedNews(news[nextIndex]);
        setNotes('');
      }
    } catch (error) {
      console.error('Failed to save classification:', error);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : [...prev, cat]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Left: News List */}
      <div className="w-1/3 bg-zinc-900 border-r border-zinc-800 overflow-y-auto">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">待分类新闻</h2>
          <p className="text-xs text-zinc-500 mt-1">最近24小时内采集的新闻</p>
        </div>
        <div className="divide-y divide-zinc-800">
          {news.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedNews(item)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedNews(item)}
              role="button"
              tabIndex={0}
              className={`p-4 cursor-pointer hover:bg-zinc-800 transition-colors ${
                selectedNews?.id === item.id ? 'bg-zinc-800 border-l-4 border-l-red-600' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-red-500 font-medium">{item.source_name}</span>
                <span className="text-xs text-zinc-500">
                  {new Date(item.published_at).toLocaleTimeString()}
                </span>
              </div>
              <h3 className="text-sm text-white line-clamp-2">{item.title}</h3>
              {item.importance_score > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-zinc-400">评分:</span>
                  <span className="text-xs font-bold text-red-500">{item.importance_score}分</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right: Classification Panel */}
      <div className="flex-1 bg-black p-6 overflow-y-auto">
        {selectedNews ? (
          <div className="max-w-2xl mx-auto">
            {/* News Detail */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2 py-1 bg-red-600 text-white text-xs rounded">{selectedNews.source_name}</span>
                <span className="text-sm text-zinc-400">{selectedNews.country_code || 'Global'}</span>
                <span className="text-sm text-zinc-500">
                  {new Date(selectedNews.published_at).toLocaleString()}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mb-4">{selectedNews.title}</h1>
              {selectedNews.summary && (
                <p className="text-sm text-zinc-400 leading-relaxed">{selectedNews.summary}</p>
              )}
            </div>

            {/* Classification Form */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h2 className="text-lg font-bold text-white mb-6">分类选择</h2>

              {/* Categories */}
              <div className="mb-6">
                <span className="block text-sm font-medium text-zinc-300 mb-3">领域分类（多选）</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      type="button"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategories.includes(cat)
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="mb-6">
                <span className="block text-sm font-medium text-zinc-300 mb-3">优先级</span>
                <div className="grid grid-cols-2 gap-3">
                  {TIER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedPriority(option.value)}
                      type="button"
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedPriority === option.value
                          ? `${option.color} text-white`
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-zinc-300 mb-2">
                  备注（可选）
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="为什么这样分类..."
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  type="button"
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  保存分类
                </button>
                <button
                  onClick={() => {
                    const currentIndex = news.findIndex(n => n.id === selectedNews.id);
                    const nextIndex = (currentIndex + 1) % news.length;
                    setSelectedNews(news[nextIndex]);
                  }}
                  type="button"
                  className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  跳过
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500">
            选择一条新闻开始分类
          </div>
        )}
      </div>
    </div>
  );
};
