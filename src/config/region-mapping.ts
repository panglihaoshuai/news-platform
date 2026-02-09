/**
 * Region Mapping Configuration
 * 
 * Maps geographic regions, countries, and keywords for news classification.
 * Used for geocoding news titles and classifying news by region.
 * 
 * @version 1.0.0
 * @date 2026-02-08
 */

import type { RegionConfig, CountryInfo } from '@/types/unified-news';

/**
 * Region Configuration
 * 
 * Defines major geographic regions with their associated countries and keywords.
 * Used for:
 * - Geocoding: Matching country names in news titles to coordinates
 * - Classification: Categorizing news by geographic region
 */
export const REGION_CONFIG: RegionConfig[] = [
  {
    code: 'GLOBAL',
    name: 'Global',
    description: 'International or multi-regional news',
    countries: [],
    keywords: ['world', 'international', 'global', 'worldwide', 'international'],
    latitude: 0,
    longitude: 0,
    zoom: 1,
  },
  {
    code: 'NA',
    name: 'North America',
    description: 'United States, Canada, Mexico',
    countries: ['US', 'CA', 'MX'],
    keywords: [
      'america',
      'united states',
      'us ',
      'usa',
      'washington',
      'new york',
      'wall street',
      'american',
      'americans',
      'canada',
      'canadian',
      'mexico',
      'mexican',
    ],
    latitude: 40,
    longitude: -100,
    zoom: 3,
  },
  {
    code: 'EU',
    name: 'Europe',
    description: 'European Union and surrounding countries',
    countries: [
      'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'PL', 'SE',
      'NO', 'DK', 'FI', 'IE', 'PT', 'GR', 'CZ', 'HU', 'RO', 'BG', 'SK',
      'HR', 'SI', 'LT', 'LV', 'EE', 'RS', 'BA', 'ME', 'MK', 'AL', 'XK',
      'UA', 'BY', 'MD', 'GE', 'AM', 'AZ', 'TR', 'CY', 'MT', 'IS', 'LU',
    ],
    keywords: [
      'europe',
      'european',
      'britain',
      'british',
      'uk ',
      'united kingdom',
      'london',
      'paris',
      'berlin',
      'brussels',
      'european union',
      'eu ',
      'european commission',
      'european parliament',
      'eurozone',
      'euro area',
    ],
    latitude: 50,
    longitude: 10,
    zoom: 4,
  },
  {
    code: 'AS',
    name: 'Asia',
    description: 'East Asia, South Asia, Southeast Asia',
    countries: [
      'CN', 'JP', 'KR', 'IN', 'SG', 'HK', 'TW', 'TH', 'VN', 'ID', 'MY',
      'PH', 'PK', 'BD', 'LK', 'NP', 'MM', 'KH', 'LA', 'MO', 'MN', 'BT',
      'MV', 'TL', 'NP', 'AF', 'UZ', 'KG', 'TJ', 'KZ', 'TM',
    ],
    keywords: [
      'asia',
      'asian',
      'china',
      'chinese',
      'beijing',
      'shanghai',
      'hong kong',
      'japan',
      'japanese',
      'tokyo',
      'korea',
      'korean',
      'seoul',
      'india',
      'indian',
      'new delhi',
      'mumbai',
      'southeast asia',
      'asean',
      'singapore',
      'thailand',
      'thai',
      'vietnam',
      'vietnamese',
      'indonesia',
      'indonesian',
      'jakarta',
      'malaysia',
      'malaysian',
      'philippines',
      'filipino',
      'manila',
    ],
    latitude: 35,
    longitude: 105,
    zoom: 3,
  },
  {
    code: 'ME',
    name: 'Middle East',
    description: 'Middle East and North Africa (MENA) region',
    countries: [
      'IL', 'PS', 'JO', 'LB', 'SY', 'IQ', 'IR', 'SA', 'AE', 'QA', 'KW',
      'BH', 'OM', 'YE', 'TR', 'EG', 'LY', 'TN', 'DZ', 'MA', 'MR', 'SO',
      'DJ', 'KM', 'SD', 'ML', 'NE', 'TD', 'IR',
    ],
    keywords: [
      'middle east',
      'mena',
      'israel',
      'israeli',
      'palestine',
      'palestinian',
      'gaza',
      'west bank',
      'iran',
      'iranian',
      'tehran',
      'iraq',
      'iraqi',
      'baghdad',
      'saudi',
      'saudi arabia',
      'riyadh',
      'uae',
      'united arab emirates',
      'dubai',
      'abu dhabi',
      'qatar',
      'doha',
      'kuwait',
      'bahrain',
      'oman',
      'lebanon',
      'lebanese',
      'beirut',
      'syria',
      'syrian',
      'damascus',
      'jordan',
      'jordanian',
      'amman',
      'egypt',
      'egyptian',
      'cairo',
      'turkey',
      'turkish',
      'ankara',
      'istanbul',
    ],
    latitude: 30,
    longitude: 45,
    zoom: 4,
  },
  {
    code: 'AF',
    name: 'Africa',
    description: 'Sub-Saharan Africa',
    countries: [
      'ZA', 'NG', 'EG', 'KE', 'ET', 'MA', 'GH', 'TZ', 'UG', 'CM', 'SN',
      'CI', 'DZ', 'SD', 'RW', 'SO', 'MZ', 'ZM', 'ZW', 'BW', 'NA', 'LS',
      'MU', 'MG', 'ML', 'BF', 'TD', 'NE', 'SN', 'GW', 'GN', 'SL', 'LR',
      'BJ', 'TG', 'CD', 'AO', 'TZ', 'MW', 'MZ', 'NG', 'ET', 'EG',
    ],
    keywords: [
      'africa',
      'african',
      'nigeria',
      'nigerian',
      'lagos',
      'south africa',
      'south african',
      'johannesburg',
      'cape town',
      'egypt',
      'egyptian',
      'cairo',
      'kenya',
      'kenyan',
      'nairobi',
      'mombasa',
      'ethiopia',
      'ethiopian',
      'addis ababa',
      'morocco',
      'moroccan',
      'casablanca',
      'algeria',
      'algerian',
      'tunisia',
      'tunisian',
      'ghana',
      'ghanaian',
      'accra',
      'tanzania',
      'tanzanian',
      'dar es salaam',
      'uganda',
      'ugandan',
      'kampala',
      'cameroon',
      'cameroonian',
      'yaounde',
      'douala',
      'senegal',
      'senegalese',
      'dakar',
      'ivory coast',
      'cote d\'ivoire',
      'abidjan',
    ],
    latitude: 0,
    longitude: 20,
    zoom: 3,
  },
  {
    code: 'OC',
    name: 'Oceania',
    description: 'Australia, New Zealand, Pacific Islands',
    countries: ['AU', 'NZ', 'PG', 'FJ', 'WS', 'SB', 'VU', 'TO', 'KI', 'NR', 'TV', 'FJ', 'NC', 'PF'],
    keywords: [
      'australia',
      'australian',
      'sydney',
      'melbourne',
      'brisbane',
      'perth',
      'adelaide',
      'canberra',
      'oceania',
      'pacific',
      'pacific islands',
      'new zealand',
      'new zealand',
      'auckland',
      'wellington',
      'christchurch',
      'fiji',
      'fijian',
      'samoa',
      'samoan',
      'tonga',
      'tongan',
      'vanuatu',
      'papua new guinea',
    ],
    latitude: -25,
    longitude: 135,
    zoom: 4,
  },
  {
    code: 'SA',
    name: 'South America',
    description: 'South American countries',
    countries: [
      'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY',
      'SR', 'GF', 'MQ', 'GP', 'MQ',
    ],
    keywords: [
      'south america',
      'brazil',
      'brazilian',
      'brasilia',
      'sao paulo',
      'rio de janeiro',
      'argentina',
      'argentine',
      'buenos aires',
      'chile',
      'chilean',
      'santiago',
      'colombia',
      'colombian',
      'bogota',
      'peru',
      'peruvian',
      'lima',
      'venezuela',
      'venezuelan',
      'caracas',
      'ecuador',
      'ecuadorian',
      'quito',
      'bolivia',
      'bolivian',
      'la paz',
      'sucre',
      'paraguay',
      'paraguayan',
      'asuncion',
      'uruguay',
      'uruguayan',
      'montevideo',
    ],
    latitude: -15,
    longitude: -60,
    zoom: 3,
  },
  {
    code: 'RU',
    name: 'Russia',
    description: 'Russia and former Soviet states (excluding Baltic)',
    countries: ['RU', 'KG', 'KZ', 'TJ', 'UZ', 'TM'],
    keywords: [
      'russia',
      'russian',
      'moscow',
      'st. petersburg',
      'vladimir putin',
      'kremlin',
      'soviet',
      'soviet union',
      'ussr',
      'kazakhstan',
      'kazakh',
      'almaty',
      'nursultan',
      'uzbekistan',
      'uzbek',
      'tashkent',
      'kyrgyzstan',
      'kyrgyz',
      'bishkek',
      'tajikistan',
      'tajik',
      'dushanbe',
      'turkmenistan',
      'turkmen',
      'ashgabat',
    ],
    latitude: 60,
    longitude: 100,
    zoom: 3,
  },
  {
    code: 'IN',
    name: 'Indian Subcontinent',
    description: 'India, Pakistan, Bangladesh, Sri Lanka, Nepal, Bhutan',
    countries: ['IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV', 'AF'],
    keywords: [
      'india',
      'indian',
      'new delhi',
      'mumbai',
      'delhi',
      'bangalore',
      'kolkata',
      'chennai',
      'modi',
      'narendra modi',
      'pakistan',
      'pakistani',
      'islamabad',
      'karachi',
      'lahore',
      'bangladesh',
      'bangladeshi',
      'dhaka',
      'chittagong',
      'sri lanka',
      'sri lankan',
      'colombo',
      'nepal',
      'nepalese',
      'kathmandu',
      'bhutan',
      'bhutanese',
      'thimphu',
    ],
    latitude: 22,
    longitude: 80,
    zoom: 4,
  },
  {
    code: 'UA',
    name: 'Ukraine',
    description: 'Ukraine and related conflicts',
    countries: ['UA'],
    keywords: [
      'ukraine',
      'ukrainian',
      'kyiv',
      'kiev',
      'odessa',
      'kharkiv',
      'lviv',
      'donbas',
      'crimea',
      'crimean',
      'zelensky',
      'volodymyr',
      'russia-ukraine war',
      'ukraine war',
      'ukraine conflict',
      'putin',
      'nato',
      'nato ',
    ],
    latitude: 49,
    longitude: 32,
    zoom: 5,
  },
];

/**
 * Country Information Database
 * Extended country data for geocoding
 */
export const COUNTRIES: CountryInfo[] = [
  // Major Countries with coordinates
  { code: 'US', name: 'United States', latitude: 37.0902, longitude: -95.7129, region: 'NA' },
  { code: 'GB', name: 'United Kingdom', latitude: 55.3781, longitude: -3.4360, region: 'EU' },
  { code: 'FR', name: 'France', latitude: 46.2276, longitude: 2.2137, region: 'EU' },
  { code: 'DE', name: 'Germany', latitude: 51.1657, longitude: 10.4515, region: 'EU' },
  { code: 'CN', name: 'China', latitude: 35.8617, longitude: 104.1954, region: 'AS' },
  { code: 'JP', name: 'Japan', latitude: 36.2048, longitude: 138.2529, region: 'AS' },
  { code: 'KR', name: 'South Korea', latitude: 35.9078, longitude: 127.7669, region: 'AS' },
  { code: 'IN', name: 'India', latitude: 20.5937, longitude: 78.9629, region: 'IN' },
  { code: 'BR', name: 'Brazil', latitude: -14.2350, longitude: -51.9253, region: 'SA' },
  { code: 'RU', name: 'Russia', latitude: 61.5240, longitude: 105.3188, region: 'RU' },
  { code: 'AU', name: 'Australia', latitude: -25.2744, longitude: 133.7751, region: 'OC' },
  { code: 'CA', name: 'Canada', latitude: 56.1304, longitude: -106.3468, region: 'NA' },
  { code: 'MX', name: 'Mexico', latitude: 23.6345, longitude: -102.5528, region: 'NA' },
  { code: 'ES', name: 'Spain', latitude: 40.4637, longitude: -3.7492, region: 'EU' },
  { code: 'IT', name: 'Italy', latitude: 41.8719, longitude: 12.5674, region: 'EU' },
  { code: 'ID', name: 'Indonesia', latitude: -0.7893, longitude: 113.9213, region: 'AS' },
  { code: 'SA', name: 'Saudi Arabia', latitude: 23.8859, longitude: 45.0792, region: 'ME' },
  { code: 'ZA', name: 'South Africa', latitude: -30.5595, longitude: 22.9375, region: 'AF' },
  { code: 'NG', name: 'Nigeria', latitude: 9.0820, longitude: 8.6753, region: 'AF' },
  { code: 'UA', name: 'Ukraine', latitude: 48.3794, longitude: 31.1656, region: 'UA' },
  { code: 'TR', name: 'Turkey', latitude: 38.9637, longitude: 35.2433, region: 'ME' },
  { code: 'IR', name: 'Iran', latitude: 32.4279, longitude: 53.6880, region: 'ME' },
  { code: 'IL', name: 'Israel', latitude: 31.0461, longitude: 34.8516, region: 'ME' },
  { code: 'PS', name: 'Palestine', latitude: 31.9522, longitude: 35.2332, region: 'ME' },
  { code: 'EG', name: 'Egypt', latitude: 26.8206, longitude: 30.8025, region: 'AF' },
  { code: 'TH', name: 'Thailand', latitude: 15.8700, longitude: 100.9925, region: 'AS' },
  { code: 'VN', name: 'Vietnam', latitude: 14.0583, longitude: 108.2772, region: 'AS' },
  { code: 'MY', name: 'Malaysia', latitude: 4.2105, longitude: 101.9758, region: 'AS' },
  { code: 'SG', name: 'Singapore', latitude: 1.3521, longitude: 103.8198, region: 'AS' },
  { code: 'HK', name: 'Hong Kong', latitude: 22.3193, longitude: 114.1694, region: 'AS' },
  { code: 'TW', name: 'Taiwan', latitude: 23.6978, longitude: 120.9605, region: 'AS' },
  { code: 'PK', name: 'Pakistan', latitude: 30.3753, longitude: 69.3451, region: 'IN' },
  { code: 'BD', name: 'Bangladesh', latitude: 23.6850, longitude: 90.3563, region: 'IN' },
  { code: 'LK', name: 'Sri Lanka', latitude: 7.8731, longitude: 80.7718, region: 'IN' },
  { code: 'NP', name: 'Nepal', latitude: 28.3949, longitude: 84.1240, region: 'IN' },
  { code: 'AF', name: 'Afghanistan', latitude: 33.9391, longitude: 67.7100, region: 'AS' },
  // Add more countries as needed
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get region by code
 */
export function getRegionByCode(code: string): RegionConfig | undefined {
  return REGION_CONFIG.find((region) => region.code === code);
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): CountryInfo | undefined {
  return COUNTRIES.find((country) => country.code === code);
}

/**
 * Find region by keyword in text
 */
export function findRegionByKeyword(text: string): RegionConfig | null {
  const lowerText = text.toLowerCase();
  
  for (const region of REGION_CONFIG) {
    for (const keyword of region.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return region;
      }
    }
  }
  
  return null;
}

/**
 * Find country by name in text
 */
export function findCountryByName(text: string): CountryInfo | null {
  const lowerText = text.toLowerCase();
  
  for (const country of COUNTRIES) {
    if (lowerText.includes(country.name.toLowerCase())) {
      return country;
    }
    // Check alternative names
    if (country.keywords) {
      for (const keyword of country.keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return country;
        }
      }
    }
  }
  
  return null;
}

/**
 * Get all countries in a region
 */
export function getCountriesByRegion(regionCode: string): CountryInfo[] {
  return COUNTRIES.filter((country) => country.region === regionCode);
}

/**
 * Get region priority (higher = more important for display)
 */
export function getRegionPriority(code: string): number {
  const priorityMap: Record<string, number> = {
    'GLOBAL': 0,
    'NA': 10,
    'EU': 10,
    'AS': 9,
    'ME': 8,
    'AF': 7,
    'RU': 6,
    'IN': 6,
    'UA': 8,
    'SA': 5,
    'OC': 4,
  };
  
  return priorityMap[code] ?? 5;
}

// ============================================================================
// City Keywords (for finer geocoding)
// ============================================================================

export const CITY_KEYWORDS: Record<string, { country: string; lat: number; lng: number; keywords: string[] }> = {
  'new york': { country: 'US', lat: 40.7128, lng: -74.0060, keywords: ['new york', 'nyc', 'manhattan', 'wall street'] },
  'washington': { country: 'US', lat: 38.9072, lng: -77.0369, keywords: ['washington', 'washington dc', 'washington d.c.'] },
  'los angeles': { country: 'US', lat: 34.0522, lng: -118.2437, keywords: ['los angeles', 'la ', 'hollywood'] },
  'london': { country: 'GB', lat: 51.5074, lng: -0.1278, keywords: ['london', 'uk ', 'british'] },
  'paris': { country: 'FR', lat: 48.8566, lng: 2.3522, keywords: ['paris', 'parisian', 'french'] },
  'berlin': { country: 'DE', lat: 52.5200, lng: 13.4050, keywords: ['berlin', 'german'] },
  'beijing': { country: 'CN', lat: 39.9042, lng: 116.4074, keywords: ['beijing', 'peking', 'chinese'] },
  'shanghai': { country: 'CN', lat: 31.2304, lng: 121.4737, keywords: ['shanghai'] },
  'tokyo': { country: 'JP', lat: 35.6762, lng: 139.6503, keywords: ['tokyo', 'japanese'] },
  'seoul': { country: 'KR', lat: 37.5665, lng: 126.9780, keywords: ['seoul', 'korean'] },
  'moscow': { country: 'RU', lat: 55.7558, lng: 37.6173, keywords: ['moscow', 'russian'] },
  'dubai': { country: 'AE', lat: 25.2048, lng: 55.2708, keywords: ['dubai', 'uae '] },
  'singapore': { country: 'SG', lat: 1.3521, lng: 103.8198, keywords: ['singapore', 'singaporean'] },
  'hong kong': { country: 'HK', lat: 22.3193, lng: 114.1694, keywords: ['hong kong', 'hongkong'] },
  'mumbai': { country: 'IN', lat: 19.0760, lng: 72.8777, keywords: ['mumbai', 'bombay'] },
  'new delhi': { country: 'IN', lat: 28.6139, lng: 77.2090, keywords: ['new delhi', 'delhi'] },
  'sydney': { country: 'AU', lat: -33.8688, lng: 151.2093, keywords: ['sydney', 'australian'] },
  'toronto': { country: 'CA', lat: 43.6532, lng: -79.3832, keywords: ['toronto', 'canadian'] },
  'bangkok': { country: 'TH', lat: 13.7563, lng: 100.5018, keywords: ['bangkok', 'thai'] },
  'istanbul': { country: 'TR', lat: 41.0082, lng: 28.9784, keywords: ['istanbul', 'turkish'] },
  'cairo': { country: 'EG', lat: 30.0444, lng: 31.2357, keywords: ['cairo', 'egyptian'] },
  'johannesburg': { country: 'ZA', lat: -26.2041, lng: 28.0473, keywords: ['johannesburg', 'johannesburg'] },
  'mexico city': { country: 'MX', lat: 19.4326, lng: -99.1332, keywords: ['mexico city', 'mexico city', 'cdmx'] },
  'sao paulo': { country: 'BR', lat: -23.5505, lng: -46.6333, keywords: ['sao paulo', 'são paulo'] },
  'buenos aires': { country: 'AR', lat: -34.6037, lng: -58.3816, keywords: ['buenos aires'] },
  'tel aviv': { country: 'IL', lat: 32.0853, lng: 34.7818, keywords: ['tel aviv', 'tel-aviv'] },
  'kyiv': { country: 'UA', lat: 50.4501, lng: 30.5234, keywords: ['kyiv', 'kiev'] },
  'tehran': { country: 'IR', lat: 35.6892, lng: 51.3890, keywords: ['tehran', 'iranian'] },
};

/**
 * Find city by keyword in text
 */
export function findCityByKeyword(text: string): { city: string; country: string; lat: number; lng: number } | null {
  const lowerText = text.toLowerCase();
  
  for (const [city, info] of Object.entries(CITY_KEYWORDS)) {
    for (const keyword of info.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return {
          city,
          country: info.country,
          lat: info.lat,
          lng: info.lng,
        };
      }
    }
  }
  
  return null;
}

// ============================================================================
// Configuration Export
// ============================================================================

export default REGION_CONFIG;
