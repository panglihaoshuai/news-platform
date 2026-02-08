'use client';

import React, { useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import { quickScore, ScoringResult } from '@/lib/importance-scorer';
import type { KeywordLibrary } from '@/lib/importance-scorer';

const TIER_LABELS = {
  P0: { label: '重大', color: 'text-red-500', bg: 'bg-red-600' },
  P1: { label: '重要', color: 'text-orange-500', bg: 'bg-orange-500' },
  P2: { label: '普通', color: 'text-yellow-500', bg: 'bg-yellow-500' },
  P3: { label: '低优', color: 'text-green-500', bg: 'bg-green-500' },
};

// Default keywords for testing (until API is ready)
const DEFAULT_KEYWORDS: KeywordLibrary[] = [
  { id: '1', keyword: '战争', tier: 'P0', categories: ['政治', '军事'], weight: 35 },
  { id: '2', keyword: '冲突', tier: 'P0', categories: ['政治', '军事'], weight: 35 },
  { id: '3', keyword: '刺杀', tier: 'P0', categories: ['政治', '军事'], weight: 35 },
  { id: '4', keyword: '美联储', tier: 'P1', categories: ['经济'], weight: 25 },
  { id: '5', keyword: '加息', tier: 'P1', categories: ['经济'], weight: 25 },
  { id: '6', keyword: '大选', tier: 'P1', categories: ['政治'], weight: 25 },
  { id: '7', keyword: '财报', tier: 'P2', categories: ['经济'], weight: 15 },
  { id: '8', keyword: '发布', tier: 'P2', categories: ['科技'], weight: 15 },
];

export const RealTimeTester: React.FC = () => {
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('Reuters');
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    if (!title.trim()) return;

    setIsTesting(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const testResult = quickScore(
      title,
      source,
      new Date().toISOString(),
      DEFAULT_KEYWORDS
    );
    
    setResult(testResult);
    setIsTesting(false);
  };

  const getProgressBar = (score: number, max: number, color: string) => {
    const percentage = (score / max) * 100;
    const filledChars = Math.round(percentage / 10);
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-zinc-500 w-12 text-right">{score.toFixed(0)}分</span>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">实时测试</h1>
        <p className="text-zinc-400 text-sm">输入新闻标题，实时查看评分和分类结果</p>
      </div>

      {/* Input Section */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 mb-6">
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <label htmlFor="test-title" className="block text-sm font-medium text-zinc-300 mb-2">
              新闻标题
            </label>
            <textarea
              id="test-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：美联储宣布加息25个基点"
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 resize-none"
            />
          </div>

          {/* Source Input */}
          <div>
            <label htmlFor="test-source" className="block text-sm font-medium text-zinc-300 mb-2">
              来源
            </label>
            <select
              id="test-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
            >
              <option value="Reuters">Reuters (路透社)</option>
              <option value="BBC">BBC</option>
              <option value="NYT">New York Times</option>
              <option value="WSJ">Wall Street Journal</option>
              <option value="FT">Financial Times</option>
              <option value="Guardian">The Guardian</option>
              <option value="联合早报">联合早报</option>
              <option value="其他">其他</option>
            </select>
          </div>

          {/* Test Button */}
          <button
            onClick={handleTest}
            disabled={!title.trim() || isTesting}
            type="button"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors"
          >
            {isTesting ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Play size={18} />
            )}
            <span>{isTesting ? '测试中...' : '运行测试'}</span>
          </button>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
          {/* Score Header */}
          <div className="px-6 py-4 bg-zinc-800 border-b border-zinc-700">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-zinc-400">总分</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">{result.totalScore}</span>
                  <span className="text-zinc-500">/ 100分</span>
                </div>
              </div>
              {result.suggestedPriority && (
                <div className="text-right">
                  <span className="text-sm text-zinc-400">建议级别</span>
                  <div className={`text-2xl font-bold ${TIER_LABELS[result.suggestedPriority].color}`}>
                    {result.suggestedPriority} - {TIER_LABELS[result.suggestedPriority].label}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="p-6 space-y-4">
            {/* Media Weight */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-400">媒体权重</span>
                <span className="text-sm text-white">{result.factors.mediaWeight} / 30分</span>
              </div>
              {getProgressBar(result.factors.mediaWeight, 30, 'bg-blue-500')}
            </div>

            {/* Freshness */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-400">时效性</span>
                <span className="text-sm text-white">{result.factors.freshnessScore.toFixed(1)} / 20分</span>
              </div>
              {getProgressBar(result.factors.freshnessScore, 20, 'bg-green-500')}
            </div>

            {/* Keywords */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-400">关键词</span>
                <span className="text-sm text-white">{result.factors.keywordScore} / 35分</span>
              </div>
              {getProgressBar(result.factors.keywordScore, 35, 'bg-red-500')}
            </div>

            {/* Content Bonus */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-400">内容丰富度</span>
                <span className="text-sm text-white">{result.factors.contentBonus} / 15分</span>
              </div>
              {getProgressBar(result.factors.contentBonus, 15, 'bg-yellow-500')}
            </div>
          </div>

          {/* Matched Keywords */}
          {result.matchedKeywords.length > 0 && (
            <div className="px-6 py-4 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">匹配到的关键词</h3>
              <div className="flex flex-wrap gap-2">
                {result.matchedKeywords.map((match, idx) => (
                  <div
                    key={idx}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${TIER_LABELS[match.tier].bg} text-white`}
                  >
                    {match.keyword} (+{match.weight}分)
                  </div>
                ))}
              </div>
              {result.suggestedCategories.length > 0 && (
                <div className="mt-3">
                  <span className="text-sm text-zinc-500">建议分类: </span>
                  {result.suggestedCategories.map((cat, idx) => (
                    <span key={idx} className="text-sm text-zinc-300">
                      {cat}{idx < result.suggestedCategories.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* No Match Warning */}
          {result.matchedKeywords.length === 0 && (
            <div className="px-6 py-4 border-t border-zinc-800 bg-yellow-500/10">
              <p className="text-sm text-yellow-500">
                ⚠️ 未匹配到任何关键词。考虑添加新关键词到词库。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
