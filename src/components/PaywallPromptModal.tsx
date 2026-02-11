'use client';

import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Info } from 'lucide-react';
import { getThemeTokens } from '@/styles/designTokens';

interface PaywallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (permanent: boolean) => void;
  targetUrl: string;
  theme?: 'dark' | 'light' | 'amber';
}

export const PaywallPromptModal: React.FC<PaywallPromptModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  targetUrl,
  theme = 'dark',
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const tokens = getThemeTokens(theme);

  useEffect(() => {
    if (isOpen) {
      setDontShowAgain(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinue = () => {
    onContinue(dontShowAgain);
  };

  const handleLearnMore = () => {
    window.open(
      'https://gitflic.ru/project/magnolia1234/bypass-paywalls-chrome-clean',
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <button
      type="button"
      className="fixed inset-0 z-50 flex items-center justify-center w-full h-full"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 rounded-lg shadow-2xl border"
        style={{
          backgroundColor: tokens.bg.primary,
          borderColor: tokens.border.default,
          borderWidth: '1px',
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="p-2 rounded-full"
            style={{ backgroundColor: tokens.accent.info + '20' }}
          >
            <Info size={20} style={{ color: tokens.accent.info }} />
          </div>
          <div className="flex-1">
            <h3
              className="text-lg font-bold mb-1"
              style={{ color: tokens.text.primary }}
            >
              阅读提示
            </h3>
            <p
              className="text-sm"
              style={{ color: tokens.text.secondary }}
            >
              您即将访问外部新闻网站
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:opacity-70 transition-opacity"
            style={{ color: tokens.text.muted }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: tokens.text.secondary }}
          >
            部分新闻网站可能需要订阅才能查看完整内容。
          </p>
          <p
            className="text-sm leading-relaxed mb-4"
            style={{ color: tokens.text.secondary }}
          >
            如需无障碍阅读，可考虑安装开源工具
            <span className="font-semibold" style={{ color: tokens.text.primary }}>
              {' '}Bypass Paywalls Clean
            </span>
            （浏览器插件）。本工具与本站无利益关联，仅供您参考使用。
          </p>

          {/* URL Preview */}
          <div
            className="p-3 rounded text-xs font-mono truncate"
            style={{
              backgroundColor: tokens.bg.secondary,
              color: tokens.text.muted,
              border: `1px solid ${tokens.border.default}`,
            }}
          >
            {targetUrl}
          </div>
        </div>

        {/* Checkbox */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border"
              style={{
                borderColor: tokens.border.default,
                backgroundColor: tokens.bg.secondary,
              }}
            />
            <span
              className="text-sm"
              style={{ color: tokens.text.secondary }}
            >
              不再提示（勾选后永久关闭）
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleLearnMore}
            className="flex-1 px-4 py-2.5 rounded text-sm font-medium transition-colors border"
            style={{
              borderColor: tokens.border.default,
              color: tokens.text.secondary,
              backgroundColor: 'transparent',
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <ExternalLink size={14} />
              了解插件
            </span>
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 px-4 py-2.5 rounded text-sm font-bold transition-colors"
            style={{
              backgroundColor: tokens.accent.info,
              color: '#ffffff',
            }}
          >
            {dontShowAgain ? '确认并继续' : '继续访问'}
          </button>
        </div>

        {/* Footer note */}
        <p
          className="mt-4 text-xs text-center"
          style={{ color: tokens.text.muted }}
        >
          提示：今天内再次点击链接不再显示此提示
        </p>
      </div>
    </button>
  );
};
