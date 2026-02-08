'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X, Edit2, Save, Search } from 'lucide-react';

interface Keyword {
  id: string;
  keyword: string;
  tier: 'P0' | 'P1' | 'P2' | 'P3';
  categories: string[];
  match_count: number;
}

const tierConfig = {
  P0: { label: 'P0-重大', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  P1: { label: 'P1-重要', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  P2: { label: 'P2-普通', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  P3: { label: 'P3-低优', color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
};

const categoryOptions = [
  '政治', '军事', '经济', '科技', '环境', '社会',
  'political', 'military', 'economic', 'technology', 'environment', 'social'
];

export function KeywordLibrary() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    keyword: '',
    tier: 'P1' as 'P0' | 'P1' | 'P2' | 'P3',
    categories: [] as string[],
  });

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/keywords');
      const data = await res.json();
      setKeywords(data);
    } catch (err) {
      console.error('Failed to fetch keywords:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  async function handleSave() {
    if (!formData.keyword.trim()) return;

    try {
      const res = await fetch('/api/admin/keywords', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...formData, id: editingId } : formData),
      });

      if (res.ok) {
        setShowAddModal(false);
        setEditingId(null);
        setFormData({ keyword: '', tier: 'P1', categories: [] });
        fetchKeywords();
      }
    } catch (err) {
      console.error('Failed to save keyword:', err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个关键词吗？')) return;

    try {
      const res = await fetch(`/api/admin/keywords?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchKeywords();
    } catch (err) {
      console.error('Failed to delete keyword:', err);
    }
  }

  function startEdit(keyword: Keyword) {
    setFormData({
      keyword: keyword.keyword,
      tier: keyword.tier,
      categories: keyword.categories,
    });
    setEditingId(keyword.id);
    setShowAddModal(true);
  }

  const filteredKeywords = keywords.filter(kw => {
    const matchesSearch = kw.keyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = selectedTier === 'all' || kw.tier === selectedTier;
    return matchesSearch && matchesTier;
  });

  const groupedByTier = filteredKeywords.reduce((acc, kw) => {
    if (!acc[kw.tier]) acc[kw.tier] = [];
    acc[kw.tier].push(kw);
    return acc;
  }, {} as Record<string, Keyword[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">关键词库</h2>
          <p className="text-zinc-500 mt-1">管理系统用于新闻分类和重要性评分的关键词</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setFormData({ keyword: '', tier: 'P1', categories: [] });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus size={18} />
          添加关键词
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            placeholder="搜索关键词..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
          />
        </div>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-red-600"
        >
          <option value="all">所有级别</option>
          <option value="P0">P0-重大</option>
          <option value="P1">P1-重要</option>
          <option value="P2">P2-普通</option>
          <option value="P3">P3-低优</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {Object.entries(tierConfig).map(([tier, config]) => (
          <div key={tier} className={`p-4 rounded-lg border ${config.border} ${config.bg}`}>
            <div className={`text-2xl font-bold ${config.color}`}>
              {groupedByTier[tier]?.length || 0}
            </div>
            <div className="text-sm text-zinc-400">{config.label}</div>
          </div>
        ))}
      </div>

      {/* Keywords by Tier */}
      <div className="space-y-6">
        {Object.entries(tierConfig).map(([tier, config]) => {
          const tierKeywords = groupedByTier[tier] || [];
          if (tierKeywords.length === 0) return null;

          return (
            <div key={tier} className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
              <div className={`px-6 py-4 border-b ${config.border} ${config.bg}`}>
                <h3 className={`font-bold ${config.color}`}>
                  {config.label} ({tierKeywords.length}个)
                </h3>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  {tierKeywords.map((kw) => (
                    <div
                      key={kw.id}
                      className="group flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                    >
                      <span className="text-white font-medium">{kw.keyword}</span>
                      {kw.match_count > 0 && (
                        <span className="text-xs text-zinc-500">({kw.match_count})</span>
                      )}
                      <div className="hidden group-hover:flex items-center gap-1 ml-2">
                        <button
                          type="button"
                          onClick={() => startEdit(kw)}
                          className="p-1 text-zinc-400 hover:text-white"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(kw.id)}
                          className="p-1 text-zinc-400 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-lg border border-zinc-800 w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingId ? '编辑关键词' : '添加新关键词'}
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="keyword-input" className="block text-sm font-medium text-zinc-400 mb-2">
                  关键词
                </label>
                <input
                  id="keyword-input"
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  placeholder="输入关键词..."
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <span className="block text-sm font-medium text-zinc-400 mb-2">
                  级别
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(tierConfig).map(([tier, config]) => (
                    <button
                      type="button"
                      key={tier}
                      onClick={() => setFormData({ ...formData, tier: tier as 'P0' | 'P1' | 'P2' | 'P3' })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        formData.tier === tier
                          ? `${config.bg} ${config.color} ${config.border}`
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-zinc-400 mb-2">
                  关联分类（多选）
                </span>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        const newCategories = formData.categories.includes(cat)
                          ? formData.categories.filter((c) => c !== cat)
                          : [...formData.categories, cat];
                        setFormData({ ...formData, categories: newCategories });
                      }}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        formData.categories.includes(cat)
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!formData.keyword.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
