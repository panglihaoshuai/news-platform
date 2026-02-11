'use client';

import { useCallback, useEffect, useState } from 'react';

type QueueItem = {
  id: string;
  title: string;
  summary: string;
  source_name: string;
  published_at: string;
  categories?: string[];
  priority?: string;
  classification_confidence?: number;
  review_status: 'reviewed' | 'unreviewed';
  explainability: {
    classification_source: string;
    classification_confidence: number;
    used_llm: boolean;
    domain_keywords: string[];
  };
  manual_classification?: {
    categories: string[];
    priority: string;
    notes?: string;
  } | null;
};

const filters = ['all', 'unreviewed', 'reviewed', 'low-confidence'] as const;
const categories = ['政治', '军事', '经济', '科技', '社会', '体育', '娱乐', '其他'];

export function QualityConsole() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]>('all');
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priority, setPriority] = useState('P2');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/quality?filter=${filter}&limit=80`, { cache: 'no-store' });
      const data = await response.json();
      const nextItems = data.items || [];
      setItems(nextItems);
      setSelected((prev) => (prev ? nextItems.find((item: QueueItem) => item.id === prev.id) || nextItems[0] || null : nextItems[0] || null));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setSelectedCategories(selected.manual_classification?.categories || selected.categories || []);
    setPriority(selected.manual_classification?.priority || selected.priority || 'P2');
    setNotes(selected.manual_classification?.notes || '');
  }, [selected]);

  const save = async () => {
    if (!selected) return;
    await fetch('/api/admin/quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newsItemId: selected.id,
        categories: selectedCategories,
        priority,
        notes,
      }),
    });
    await load();
  };

  if (loading) {
    return <div className="text-zinc-500">加载质量队列中...</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div className="xl:col-span-1 rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="p-3 border-b border-zinc-800 flex gap-2 flex-wrap">
          {filters.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setFilter(name)}
              className={`px-2 py-1 rounded text-xs ${filter === name ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="max-h-[520px] overflow-auto">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className={`w-full text-left p-3 border-b border-zinc-800 ${selected?.id === item.id ? 'bg-zinc-800' : 'bg-zinc-900'}`}
            >
              <div className="text-xs text-zinc-500">{item.source_name}</div>
              <div className="text-sm text-white line-clamp-2">{item.title}</div>
              <div className="text-xs text-zinc-500 mt-1">置信度 {Math.round((item.classification_confidence || 0) * 100)}%</div>
            </button>
          ))}
        </div>
      </div>

      <div className="xl:col-span-2 rounded-xl border border-zinc-800 bg-black p-4">
        {selected ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg text-white font-semibold">{selected.title}</h3>
              <p className="text-sm text-zinc-400 mt-2">{selected.summary}</p>
            </div>

            <div className="text-xs text-zinc-500">
              来源: {selected.explainability.classification_source} / 置信度: {Math.round(selected.explainability.classification_confidence * 100)}% / LLM: {selected.explainability.used_llm ? 'yes' : 'no'}
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setSelectedCategories((prev) => (active ? prev.filter((value) => value !== cat) : [...prev, cat]))
                    }
                    className={`px-3 py-1 rounded text-sm ${active ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-300'}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              {['P0', 'P1', 'P2', 'P3'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1 rounded text-sm ${priority === p ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="纠错备注"
              className="w-full px-3 py-2 rounded bg-zinc-900 border border-zinc-700 text-white"
            />

            <button type="button" onClick={save} className="px-4 py-2 rounded bg-red-600 text-white">
              保存纠错并回写
            </button>
          </div>
        ) : (
          <div className="text-zinc-500">暂无队列项</div>
        )}
      </div>
    </div>
  );
}
