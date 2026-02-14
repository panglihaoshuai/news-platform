/**
 * US Overseas Military Bases Database
 * 
 * Static data for US military bases worldwide
 * 
 * @module src/lib/military/us-bases
 */

import type { USBase } from './types';

/**
 * Complete list of US overseas military bases
 * 
 * Data includes:
 * - Geographic coordinates (lat/lng)
 * - Region classification
 * - Base type (air, naval, combined, ground, logistics)
 * - Branch (Air Force, Navy, Army, Marines, etc.)
 * - Status (active, planned, closed)
 */
export const US_OVERSEAS_BASES: USBase[] = [
  // ============================================================================
  // PACIFIC REGION
  // ============================================================================
  
  // Japan
  {
    id: 'usfj-yokota',
    name: 'Yokota Air Base',
    nameCn: '横田空军基地',
    location: { lat: 35.7486, lng: 139.3486 },
    region: 'pacific',
    country: 'Japan',
    type: ['air', 'combined'],
    branch: ['airforce', 'army'],
    status: 'active',
  },
  {
    id: 'usfj-kadena',
    name: 'Kadena Air Base',
    nameCn: '嘉手纳空军基地',
    location: { lat: 26.3556, lng: 127.7678 },
    region: 'pacific',
    country: 'Japan',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  {
    id: 'usfj-sasebo',
    name: 'Sasebo Naval Base',
    nameCn: '佐世保海军基地',
    location: { lat: 33.1855, lng: 129.7496 },
    region: 'pacific',
    country: 'Japan',
    type: ['naval'],
    branch: ['navy'],
    status: 'active',
  },
  {
    id: 'usfj-yokosuka',
    name: 'Yokosuka Naval Base',
    nameCn: '横须贺海军基地',
    location: { lat: 35.2506, lng: 139.6726 },
    region: 'pacific',
    country: 'Japan',
    type: ['naval'],
    branch: ['navy'],
    status: 'active',
  },
  {
    id: 'usfj-misawa',
    name: 'Misawa Air Base',
    nameCn: '三泽空军基地',
    location: { lat: 40.7032, lng: 141.3675 },
    region: 'pacific',
    country: 'Japan',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  
  // South Korea
  {
    id: 'usk-osan',
    name: 'Osan Air Base',
    nameCn: '乌山空军基地',
    location: { lat: 37.0906, lng: 127.0294 },
    region: 'pacific',
    country: 'South Korea',
    type: ['air', 'combined'],
    branch: ['airforce'],
    status: 'active',
  },
  {
    id: 'usk-kunsan',
    name: 'Kunsan Air Base',
    nameCn: '群山空军基地',
    location: { lat: 35.9038, lng: 126.6168 },
    region: 'pacific',
    country: 'South Korea',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  {
    id: 'usk-camp-humphreys',
    name: 'Camp Humphreys',
    nameCn: '汉弗莱营',
    location: { lat: 36.9925, lng: 127.0294 },
    region: 'pacific',
    country: 'South Korea',
    type: ['ground', 'combined'],
    branch: ['army', 'marines'],
    status: 'active',
  },
  
  // Guam
  {
    id: 'usgu-andersen',
    name: 'Andersen Air Force Base',
    nameCn: '安德森空军基地',
    location: { lat: 13.5833, lng: 144.9333 },
    region: 'pacific',
    country: 'Guam',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  {
    id: 'usgu-naval-base',
    name: 'Naval Base Guam',
    nameCn: '关岛海军基地',
    location: { lat: 13.4445, lng: 144.7935 },
    region: 'pacific',
    country: 'Guam',
    type: ['naval', 'combined'],
    branch: ['navy'],
    status: 'active',
  },
  
  // Hawaii
  {
    id: 'ushi-pearl-harbor',
    name: 'Pearl Harbor Naval Base',
    nameCn: '珍珠港海军基地',
    location: { lat: 21.3645, lng: -157.9500 },
    region: 'pacific',
    country: 'USA',
    type: ['naval'],
    branch: ['navy'],
    status: 'active',
  },
  {
    id: 'ushi-hickam',
    name: 'Hickam Air Force Base',
    nameCn: '希卡姆空军基地',
    location: { lat: 21.3181, lng: -157.9225 },
    region: 'pacific',
    country: 'USA',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  
  // Alaska
  {
    id: 'usak-elmendorf',
    name: 'Joint Base Elmendorf-Richardson',
    nameCn: '埃尔门多夫-理查森联合基地',
    location: { lat: 61.2511, lng: -149.8061 },
    region: 'pacific',
    country: 'USA',
    type: ['air', 'ground', 'combined'],
    branch: ['airforce', 'army'],
    status: 'active',
  },
  
  // ============================================================================
  // MIDDLE EAST REGION
  // ============================================================================
  
  // Qatar
  {
    id: 'umw-al-udeid',
    name: 'Al Udeid Air Base',
    nameCn: '乌代德空军基地',
    location: { lat: 25.1154, lng: 51.3204 },
    region: 'middleeast',
    country: 'Qatar',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  
  // UAE
  {
    id: 'uae-al-dhafra',
    name: 'Al Dhafra Air Base',
    nameCn: '扎弗拉空军基地',
    location: { lat: 24.4332, lng: 54.5471 },
    region: 'middleeast',
    country: 'UAE',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  
  // Kuwait
  {
    id: 'kuw-ali-al Salem',
    name: 'Ali Al Salem Air Base',
    nameCn: '阿里·阿尔·萨利姆空军基地',
    location: { lat: 29.3383, lng: 47.5208 },
    region: 'middleeast',
    country: 'Kuwait',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  
  // Bahrain
  {
    id: 'bhr-naval-base',
    name: 'Naval Support Activity Bahrain',
    nameCn: '巴林海军支援基地',
    location: { lat: 26.0667, lng: 50.5577 },
    region: 'middleeast',
    country: 'Bahrain',
    type: ['naval'],
    branch: ['navy'],
    status: 'active',
  },
  
  // Saudi Arabia
  {
    id: 'sa-prince-sultan',
    name: 'Prince Sultan Air Base',
    nameCn: '苏丹亲王空军基地',
    location: { lat: 24.0633, lng: 46.5000 },
    region: 'middleeast',
    country: 'Saudi Arabia',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  
  // Iraq (limited presence)
  {
    id: 'irq-al-asad',
    name: 'Al Asad Air Base',
    nameCn: '阿萨德空军基地',
    location: { lat: 33.8528, lng: 41.1586 },
    region: 'middleeast',
    country: 'Iraq',
    type: ['air', 'ground'],
    branch: ['airforce', 'marines'],
    status: 'active',
  },
  
  // ============================================================================
  // EUROPE REGION
  // ============================================================================
  
  // Germany
  {
    id: 'deu-ramstein',
    name: 'Ramstein Air Base',
    nameCn: '拉姆施泰因空军基地',
    location: { lat: 49.4369, lng: 7.6003 },
    region: 'europe',
    country: 'Germany',
    type: ['air', 'combined'],
    branch: ['airforce'],
    status: 'active',
  },
  {
    id: 'deu-spangdahlem',
    name: 'Spangdahlem Air Base',
    nameCn: '施庞达勒姆空军基地',
    location: { lat: 49.9725, lng: 6.6989 },
    region: 'europe',
    country: 'Germany',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  {
    id: 'deu-grafenwoehr',
    name: 'Grafenwöhr Training Area',
    nameCn: '格拉芬沃训练区',
    location: { lat: 49.7167, lng: 11.9000 },
    region: 'europe',
    country: 'Germany',
    type: ['ground'],
    branch: ['army'],
    status: 'active',
  },
  
  // United Kingdom
  {
    id: 'gbr-lakenheath',
    name: 'RAF Lakenheath',
    nameCn: '莱肯希思空军基地',
    location: { lat: 52.4093, lng: 0.5630 },
    region: 'europe',
    country: 'UK',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  {
    id: 'gbr-mildenhall',
    name: 'RAF Mildenhall',
    nameCn: '米尔登霍尔空军基地',
    location: { lat: 52.3617, lng: 0.4864 },
    region: 'europe',
    country: 'UK',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  {
    id: 'gbr-royal-warrants',
    name: 'Royal Wootton Bassett (Logistics)',
    nameCn: '皇家伍顿巴西特后勤基地',
    location: { lat: 51.5417, lng: -1.9292 },
    region: 'europe',
    country: 'UK',
    type: ['logistics'],
    branch: ['army'],
    status: 'active',
  },
  
  // Italy
  {
    id: 'ita-aviano',
    name: 'Aviano Air Base',
    nameCn: '阿维亚诺空军基地',
    location: { lat: 46.0319, lng: 12.5964 },
    region: 'europe',
    country: 'Italy',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  {
    id: 'ita-naval-sigonella',
    name: 'Naval Air Station Sigonella',
    nameCn: '锡戈内拉海军航空站',
    location: { lat: 37.3958, lng: 15.0656 },
    region: 'europe',
    country: 'Italy',
    type: ['naval', 'air'],
    branch: ['navy'],
    status: 'active',
  },
  
  // Spain
  {
    id: 'esp-morón',
    name: 'Morón Air Base',
    nameCn: '莫龙空军基地',
    location: { lat: 37.1744, lng: -5.6094 },
    region: 'europe',
    country: 'Spain',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  
  // Turkey (Incirlik - access sometimes limited)
  {
    id: 'tur-incirlik',
    name: 'Incirlik Air Base',
    nameCn: '因吉尔利克空军基地',
    location: { lat: 37.0018, lng: 35.4256 },
    region: 'europe',
    country: 'Turkey',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  
  // Poland
  {
    id: 'pol-redzikowo',
    name: 'Redzikowo Naval Base',
    nameCn: '雷迪科沃海军基地',
    location: { lat: 54.4567, lng: 17.0328 },
    region: 'europe',
    country: 'Poland',
    type: ['naval'],
    branch: ['navy'],
    status: 'active',
  },
  {
    id: 'pol-poznan',
    name: 'Poznan Logistics Hub',
    nameCn: '波兹南后勤中心',
    location: { lat: 52.4064, lng: 16.9253 },
    region: 'europe',
    country: 'Poland',
    type: ['logistics'],
    branch: ['army'],
    status: 'active',
  },
  
  // ============================================================================
  // INDIAN OCEAN REGION
  // ============================================================================
  
  // Diego Garcia
  {
    id: 'dga-diego-garcia',
    name: 'Diego Garcia Naval Support Facility',
    nameCn: '迭戈加西亚海军支援设施',
    location: { lat: -7.3000, lng: 72.4000 },
    region: 'india',
    country: 'British Indian Ocean Territory',
    type: ['naval', 'logistics'],
    branch: ['navy'],
    status: 'active',
  },
  
  // Djibouti
  {
    id: 'dji-camp-lemonnier',
    name: 'Camp Lemonnier',
    nameCn: '勒蒙尼尔营地',
    location: { lat: 11.5888, lng: 43.1456 },
    region: 'india',
    country: 'Djibouti',
    type: ['combined', 'logistics'],
    branch: ['navy', 'marines'],
    status: 'active',
  },
  
  // ============================================================================
  // AMERICAS REGION (excluding continental US)
  // ============================================================================
  
  // Cuba (Guantanamo Bay)
  {
    id: 'cub-gtmo',
    name: 'Guantanamo Bay Naval Base',
    nameCn: '关塔那摩海军基地',
    location: { lat: 19.8968, lng: -75.1447 },
    region: 'americas',
    country: 'Cuba',
    type: ['naval', 'ground'],
    branch: ['navy'],
    status: 'active',
  },
  
  // Puerto Rico
  {
    id: 'pri-roosevelt-roads',
    name: 'Roosevelt Roads Naval Station',
    nameCn: '罗斯福路海军站',
    location: { lat: 18.2553, lng: -66.3117 },
    region: 'americas',
    country: 'Puerto Rico',
    type: ['naval'],
    branch: ['navy'],
    status: 'active',
  },
  
  // Panama
  {
    id: 'pma-howard',
    name: 'Howard Air Force Base',
    nameCn: '霍华德空军基地',
    location: { lat: 8.9147, lng: -79.6011 },
    region: 'americas',
    country: 'Panama',
    type: ['air'],
    branch: ['airforce'],
    status: 'active',
  },
  
  // ============================================================================
  // AFRICA REGION
  // ============================================================================
  
  // Niger
  {
    id: 'ner-air-base-201',
    name: 'Air Base 201',
    nameCn: '201空军基地',
    location: { lat: 13.4775, lng: 2.1717 },
    region: 'africa',
    country: 'Niger',
    type: ['air', 'logistics'],
    branch: ['airforce'],
    status: 'active',
  },
  
  // ============================================================================
  // SHIPS AT SEA (Pre-positioned)
  // ============================================================================
  
  // These are not bases but represent pre-positioned naval assets
  {
    id: 'ship-5th-fleet',
    name: 'US 5th Fleet (Bahrain)',
    nameCn: '美国第五舰队（巴林）',
    location: { lat: 26.0667, lng: 50.5577 },
    region: 'middleeast',
    country: 'Bahrain',
    type: ['naval'],
    branch: ['navy'],
    status: 'active',
  },
  {
    id: 'ship-7th-fleet',
    name: 'US 7th Fleet (Japan)',
    nameCn: '美国第七舰队（日本）',
    location: { lat: 35.2506, lng: 139.6726 },
    region: 'pacific',
    country: 'Japan',
    type: ['naval'],
    branch: ['navy'],
    status: 'active',
  },
  {
    id: 'ship-6th-fleet',
    name: 'US 6th Fleet (Europe)',
    nameCn: '美国第六舰队（欧洲）',
    location: { lat: 40.6918, lng: 14.6285 },
    region: 'europe',
    country: 'Italy',
    type: ['naval'],
    branch: ['navy'],
    status: 'active',
  },
];

/**
 * Get bases by region
 * 
 * @param region - Region filter
 * @returns Array of US bases in the region
 */
export function getBasesByRegion(region: USBase['region']): USBase[] {
  return US_OVERSEAS_BASES.filter(base => base.region === region);
}

/**
 * Get bases by country
 * 
 * @param country - Country filter
 * @returns Array of US bases in the country
 */
export function getBasesByCountry(country: string): USBase[] {
  return US_OVERSEAS_BASES.filter(base => 
    base.country.toLowerCase() === country.toLowerCase()
  );
}

/**
 * Get bases by type
 * 
 * @param type - Base type filter
 * @returns Array of US bases of the specified type
 */
export function getBasesByType(type: USBase['type'][number]): USBase[] {
  return US_OVERSEAS_BASES.filter(base => base.type.includes(type));
}

/**
 * Get bases by branch
 * 
 * @param branch - Military branch filter
 * @returns Array of US bases for the specified branch
 */
export function getBasesByBranch(branch: USBase['branch'][number]): USBase[] {
  return US_OVERSEAS_BASES.filter(base => base.branch.includes(branch));
}

/**
 * Get base by ID
 * 
 * @param id - Base ID
 * @returns US base or undefined
 */
export function getBaseById(id: string): USBase | undefined {
  return US_OVERSEAS_BASES.find(base => base.id === id);
}

/**
 * Get total count of overseas bases
 */
export function getBaseCount(): number {
  return US_OVERSEAS_BASES.length;
}

/**
 * Region statistics
 */
export const REGION_STATS = {
  pacific: getBasesByRegion('pacific').length,
  middleeast: getBasesByRegion('middleeast').length,
  europe: getBasesByRegion('europe').length,
  india: getBasesByRegion('india').length,
  americas: getBasesByRegion('americas').length,
  africa: getBasesByRegion('africa').length,
};

/**
 * Branch statistics
 */
export const BRANCH_STATS: Record<USBase['branch'][number], number> = {
  airforce: getBasesByBranch('airforce').length,
  navy: getBasesByBranch('navy').length,
  army: getBasesByBranch('army').length,
  marines: getBasesByBranch('marines').length,
  coastguard: getBasesByBranch('coastguard').length,
  nationalguard: getBasesByBranch('nationalguard').length,
};
