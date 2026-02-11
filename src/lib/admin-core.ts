export type AdminPriority = 'P0' | 'P1' | 'P2' | 'P3';

const SUPPORTED_LOCALES = new Set(['en', 'zh']);

export interface ManualClassificationInput {
  newsItemId: string;
  categories: string[];
  priority: string;
  notes?: string;
}

export function extractLocaleFromPathname(pathname: string, defaultLocale: 'en' | 'zh' = 'en'): 'en' | 'zh' {
  const parts = pathname.split('/').filter(Boolean);
  const maybeLocale = parts[0] || '';
  if (SUPPORTED_LOCALES.has(maybeLocale)) {
    return maybeLocale as 'en' | 'zh';
  }
  return defaultLocale;
}

export function buildLocalizedAdminPath(locale: 'en' | 'zh', subPath = ''): string {
  if (!subPath) {
    return `/${locale}/admin`;
  }

  const normalized = subPath.startsWith('/') ? subPath : `/${subPath}`;
  return `/${locale}/admin${normalized}`;
}

export function normalizePriority(priority: string): AdminPriority | null {
  const value = (priority || '').toUpperCase();
  if (value === 'P0' || value === 'P1' || value === 'P2' || value === 'P3') {
    return value;
  }
  return null;
}

export function validateManualClassificationInput(input: ManualClassificationInput): {
  valid: boolean;
  error?: string;
  normalized?: { categories: string[]; priority: AdminPriority; notes: string };
} {
  if (!input.newsItemId || !input.newsItemId.trim()) {
    return { valid: false, error: 'newsItemId is required' };
  }

  if (!Array.isArray(input.categories) || input.categories.length === 0) {
    return { valid: false, error: 'categories must contain at least one item' };
  }

  const normalizedCategories = input.categories
    .map((item) => item.trim())
    .filter(Boolean);

  if (normalizedCategories.length === 0) {
    return { valid: false, error: 'categories must contain at least one non-empty item' };
  }

  const priority = normalizePriority(input.priority);
  if (!priority) {
    return { valid: false, error: 'priority must be one of P0,P1,P2,P3' };
  }

  return {
    valid: true,
    normalized: {
      categories: normalizedCategories,
      priority,
      notes: (input.notes || '').trim(),
    },
  };
}

export function parseNewsLimit(rawValue: string | null, fallback = 50, max = 100): number {
  const parsed = Number.parseInt(rawValue || '', 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }
  if (parsed > max) {
    return max;
  }
  return parsed;
}
