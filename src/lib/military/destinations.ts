/**
 * News Hotspot Destinations Configuration
 * 
 * Maps news keywords to geographic regions for aircraft tracking.
 * When news reports deployment to a region, we track aircraft flying toward it.
 * 
 * @module src/lib/military/destinations
 */

export interface HotspotDestination {
  /** Unique ID */
  id: string;
  /** Display name (English) */
  name: string;
  /** Display name (Chinese) */
  nameZh: string;
  /** Center coordinates [lat, lng] */
  center: [number, number];
  /** Search radius in km */
  radiusKm: number;
  /** News keywords to trigger this hotspot (case-insensitive) */
  keywords: string[];
  /** Related region IDs */
  related?: string[];
}

export const HOTSPOT_DESTINATIONS: HotspotDestination[] = [
  {
    id: 'middleeast',
    name: 'Middle East',
    nameZh: '中东',
    center: [29.0, 45.0],
    radiusKm: 1500,
    keywords: [
      'middle east', 'middleeast',
      '中东', '波斯湾', '海湾地区',
      'iran', 'iranian', '伊朗',
      'iraq', '伊拉克',
      'syria', 'syrian', '叙利亚',
      'yemen', 'yemeni', '也门',
      'gulf', '波斯湾', '阿拉伯湾',
      'saudi', 'saudi arabia', '沙特',
      'uae', 'emirates', '阿联酋',
      'qatar', '卡塔尔',
      'israel', '以色列',
      'palestin', '巴勒斯坦',
    ],
  },
  {
    id: 'ukraine',
    name: 'Ukraine',
    nameZh: '乌克兰',
    center: [48.0, 31.0],
    radiusKm: 1000,
    keywords: [
      'ukraine', 'ukrainian', '乌克兰',
      'kyiv', 'kiev', '基辅',
      'russia', 'russian', '俄罗斯',
      'moscow', '莫斯科',
      'putin', '普京',
      'zelen', '泽连斯基',
      'war', '战争', '冲突',
      'invasion', '侵略',
    ],
  },
  {
    id: 'pacific',
    name: 'Pacific / South China Sea',
    nameZh: '太平洋/南海',
    center: [18.0, 120.0],
    radiusKm: 2000,
    keywords: [
      'pacific', '太平洋',
      'south china sea', '南中国海', '南海',
      'taiwan', 'taiwanese', '台湾',
      'taiwan strait', '台海',
      'china', 'chinese', '中国', '中共',
      'beijing', '北京',
      'philippines', '菲律宾',
      'south china sea', '南海',
      'east china sea', '东海',
      'japan', 'japanese', '日本',
      'korea', 'korean', '朝鲜', '韩国',
      'seoul', '首尔',
      'pyongyang', '平壤',
      'indopacific', 'indo-pacific', '印太',
    ],
  },
  {
    id: 'europe',
    name: 'Europe',
    nameZh: '欧洲',
    center: [48.0, 10.0],
    radiusKm: 1500,
    keywords: [
      'europe', 'european', '欧洲',
      'nato', '北约',
      'poland', 'polish', '波兰',
      'germany', 'german', '德国',
      'uk', 'britain', 'british', '英国',
      'france', 'french', '法国',
      'italy', 'italian', '意大利',
      'baltic', '波罗的海',
      'romania', '罗马尼亚',
    ],
  },
  {
    id: 'africa',
    name: 'Africa',
    nameZh: '非洲',
    center: [5.0, 20.0],
    radiusKm: 1500,
    keywords: [
      'africa', 'african', '非洲',
      'sahara', '撒哈拉',
      'sudan', '苏丹',
      'somalia', '索马里',
      'egypt', 'egyptian', '埃及',
      'libya', 'libyan', '利比亚',
    ],
  },
  {
    id: 'centralasia',
    name: 'Central Asia',
    nameZh: '中亚',
    center: [42.0, 65.0],
    radiusKm: 1200,
    keywords: [
      'central asia', 'centralasia', '中亚',
      'afghanistan', 'afghan', '阿富汗',
      'kazakhstan', '哈萨克斯坦',
      'uzbekistan', '乌兹别克斯坦',
      'taliban', '塔利班',
    ],
  },
];

/**
 * Get destination by ID
 */
export function getDestinationById(id: string): HotspotDestination | undefined {
  return HOTSPOT_DESTINATIONS.find(d => d.id === id);
}

/**
 * Find destinations matching news content
 */
export function findDestinationsByNews(title: string, content?: string): HotspotDestination[] {
  const text = `${title} ${content || ''}`.toLowerCase();
  
  return HOTSPOT_DESTINATIONS.filter(dest => 
    dest.keywords.some(keyword => text.includes(keyword.toLowerCase()))
  );
}

/**
 * Get all destination IDs
 */
export function getAllDestinationIds(): string[] {
  return HOTSPOT_DESTINATIONS.map(d => d.id);
}
