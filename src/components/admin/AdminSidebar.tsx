'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Tag, TestTube, Settings, LogOut } from 'lucide-react';
import { buildLocalizedAdminPath, extractLocaleFromPathname } from '@/lib/admin-core';

const menuItems = [
  { subPath: '', label: '分类工作台', icon: LayoutDashboard },
  { subPath: '/keywords', label: '关键词库', icon: Tag },
  { subPath: '/test', label: '实时测试', icon: TestTube },
  { subPath: '/settings', label: '系统设置', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const locale = extractLocaleFromPathname(pathname || '/en/admin');

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-black tracking-tighter text-white">ADMIN</h1>
        <p className="text-xs text-zinc-500 mt-1">Global Intel Map</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const href = buildLocalizedAdminPath(locale, item.subPath);
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);
            
            return (
              <li key={item.subPath || 'root'}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={() => {
            fetch('/api/admin/auth', { method: 'DELETE' })
              .then(() => { window.location.href = '/admin-login'; });
          }}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          <span className="font-medium">退出登录</span>
        </button>
      </div>
    </aside>
  );
}
