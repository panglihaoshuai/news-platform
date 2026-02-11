'use client';

import { useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { buildLocalizedAdminPath, extractLocaleFromPathname } from '@/lib/admin-core';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const locale = extractLocaleFromPathname(pathname || '/admin-login');
        router.push(buildLocalizedAdminPath(locale));
        router.refresh();
      } else {
        setError('密码错误');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-white tracking-tight">GLOBAL INTEL MAP</h1>
          <p className="text-sm text-zinc-500 mt-2">管理后台登录</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入管理员密码"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <a href="/" className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
