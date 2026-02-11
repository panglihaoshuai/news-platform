'use client';

import { useCallback, useEffect, useState } from 'react';

type SourceRow = {
  id: string;
  name: string;
  type: string;
  language: string;
  region_code: string;
  enabled: boolean;
  priority: number;
  last_fetched_at: string | null;
  fetch_count: number | null;
  success_rate: number | null;
  health_status: 'healthy' | 'stale' | 'failing' | 'disabled';
  recent_count: number;
};

const statusColor: Record<string, string> = {
  healthy: 'text-green-400',
  stale: 'text-yellow-400',
  failing: 'text-red-400',
  disabled: 'text-zinc-500',
};

export function SourceOperationsPanel() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [coverage, setCoverage] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sources', { cache: 'no-store' });
      const data = await response.json();
      setSources(data.sources || []);
      setCoverage(data.coverage?.byRegion || {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateSource = async (id: string, patch: { enabled?: boolean; priority?: number }) => {
    setBusyId(id);
    try {
      await fetch('/api/admin/sources', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const triggerAction = async (sourceId: string, action: 'refetch' | 'retry') => {
    setBusyId(sourceId);
    try {
      await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, action }),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <div className="text-zinc-500">加载数据源运营信息中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(coverage).map(([region, count]) => (
          <div key={region} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
            <div className="text-xs text-zinc-500">{region}</div>
            <div className="text-xl text-white font-bold">{count}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-zinc-400">
            <tr>
              <th className="text-left px-3 py-2">源</th>
              <th className="text-left px-3 py-2">状态</th>
              <th className="text-left px-3 py-2">最近抓取</th>
              <th className="text-left px-3 py-2">覆盖</th>
              <th className="text-left px-3 py-2">优先级</th>
              <th className="text-left px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.id} className="border-t border-zinc-800 bg-black">
                <td className="px-3 py-2">
                  <div className="text-white">{source.name}</div>
                  <div className="text-xs text-zinc-500">{source.type} / {source.language} / {source.region_code}</div>
                </td>
                <td className={`px-3 py-2 ${statusColor[source.health_status] || 'text-zinc-400'}`}>
                  {source.health_status}
                </td>
                <td className="px-3 py-2 text-zinc-400">
                  {source.last_fetched_at ? new Date(source.last_fetched_at).toLocaleString() : 'N/A'}
                </td>
                <td className="px-3 py-2 text-zinc-300">{source.recent_count}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    value={source.priority}
                    onChange={(e) => updateSource(source.id, { priority: Number.parseInt(e.target.value, 10) || source.priority })}
                    className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-white"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => updateSource(source.id, { enabled: !source.enabled })}
                      disabled={busyId === source.id}
                      className="px-2 py-1 rounded bg-zinc-800 text-zinc-200"
                    >
                      {source.enabled ? '禁用' : '启用'}
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerAction(source.id, 'refetch')}
                      disabled={busyId === source.id}
                      className="px-2 py-1 rounded bg-red-700 text-white"
                    >
                      重抓
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerAction(source.id, 'retry')}
                      disabled={busyId === source.id}
                      className="px-2 py-1 rounded bg-zinc-700 text-white"
                    >
                      重试
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
