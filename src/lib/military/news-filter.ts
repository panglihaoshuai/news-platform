import type { NewsItem } from '@/types/news';

const MILITARY_KEYWORDS = [
  'military',
  'army',
  'navy',
  'air force',
  'defense',
  'defence',
  'pentagon',
  'fighter',
  'bomber',
  'helicopter',
  'aircraft',
  'missile',
  'troop',
  'base',
  'nato',
  'carrier',
  'drone',
  'warship',
  'combat',
  'sortie',
  'deployment',
  'usaf',
  'us navy',
  'marine corps',
];

export function isMilitaryNews(item: Pick<NewsItem, 'title'>): boolean {
  const title = (item.title || '').toLowerCase();
  return MILITARY_KEYWORDS.some((k) => title.includes(k));
}

export function sortMilitaryFirst(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => {
    const am = isMilitaryNews(a) ? 1 : 0;
    const bm = isMilitaryNews(b) ? 1 : 0;
    if (am !== bm) return bm - am;
    if (a.importance_score !== b.importance_score) return b.importance_score - a.importance_score;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });
}
