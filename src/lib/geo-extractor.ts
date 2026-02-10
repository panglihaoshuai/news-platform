/**
 * Geo Extractor
 * Extracts event locations from news titles using keyword matching
 * 
 * Features:
 * - Supports 100+ global cities and countries
 * - Maps to latitude/longitude coordinates
 * - Confidence scoring based on context
 * 
 * @version 1.0.0
 * @date 2026-02-09
 */

import type { RegionCode } from '@/types/unified-news';

// ============================================================================
// Location Database
// ============================================================================

interface LocationEntry {
  country: string;
  countryCode: string;
  region: RegionCode;
  city?: string;
  lat: number;
  lng: number;
  keywords: string[];
  contextKeywords?: string[];  // Keywords that add confidence
}

const LOCATIONS: LocationEntry[] = [
  // North America
  { country: 'United States', countryCode: 'US', region: 'NA', city: 'Washington DC', lat: 38.9072, lng: -77.0369, keywords: ['washington', 'washington dc', 'washington d.c.'] },
  { country: 'United States', countryCode: 'US', region: 'NA', city: 'New York', lat: 40.7128, lng: -74.0060, keywords: ['new york', 'nyc', 'new york city'] },
  { country: 'United States', countryCode: 'US', region: 'NA', city: 'Los Angeles', lat: 34.0522, lng: -118.2437, keywords: ['los angeles', 'la', 'hollywood'] },
  { country: 'United States', countryCode: 'US', region: 'NA', city: 'Chicago', lat: 41.8781, lng: -87.6298, keywords: ['chicago'] },
  { country: 'United States', countryCode: 'US', region: 'NA', city: 'San Francisco', lat: 37.7749, lng: -122.4194, keywords: ['san francisco', 'sf', 'silicon valley'] },
  { country: 'United States', countryCode: 'US', region: 'NA', city: 'Texas', lat: 31.9686, lng: -99.9018, keywords: ['texas', 'houston', 'dallas', 'austin'] },
  { country: 'United States', countryCode: 'US', region: 'NA', city: 'Florida', lat: 27.6648, lng: -81.5158, keywords: ['florida', 'miami', 'orlando'] },
  { country: 'United States', countryCode: 'US', region: 'NA', city: 'Alaska', lat: 64.2008, lng: -152.4937, keywords: ['alaska'] },
  { country: 'Canada', countryCode: 'CA', region: 'NA', city: 'Ottawa', lat: 45.4215, lng: -75.6972, keywords: ['ottawa', 'canada'] },
  { country: 'Canada', countryCode: 'CA', region: 'NA', city: 'Toronto', lat: 43.6532, lng: -79.3832, keywords: ['toronto'] },
  { country: 'Canada', countryCode: 'CA', region: 'NA', city: 'Quebec', lat: 46.8178, lng: -71.2074, keywords: ['quebec', 'montreal'] },
  { country: 'Mexico', countryCode: 'MX', region: 'SA', city: 'Mexico City', lat: 19.4326, lng: -99.1332, keywords: ['mexico', 'mexico city', 'mexican'] },
  
  // Europe
  { country: 'United Kingdom', countryCode: 'GB', region: 'EU', city: 'London', lat: 51.5074, lng: -0.1278, keywords: ['london', 'uk', 'united kingdom', 'britain', 'british'] },
  { country: 'United Kingdom', countryCode: 'GB', region: 'EU', city: 'Scotland', lat: 56.4907, lng: -4.2026, keywords: ['scotland', 'edinburgh'] },
  { country: 'United Kingdom', countryCode: 'GB', region: 'EU', city: 'Northern Ireland', lat: 54.7877, lng: -7.5544, keywords: ['northern ireland', 'belfast'] },
  { country: 'France', countryCode: 'FR', region: 'EU', city: 'Paris', lat: 48.8566, lng: 2.3522, keywords: ['paris', 'france', 'french'] },
  { country: 'France', countryCode: 'FR', region: 'EU', city: 'Nice', lat: 43.7102, lng: 7.2620, keywords: ['nice'] },
  { country: 'Germany', countryCode: 'DE', region: 'EU', city: 'Berlin', lat: 52.5200, lng: 13.4050, keywords: ['berlin', 'germany', 'german'] },
  { country: 'Germany', countryCode: 'DE', region: 'EU', city: 'Munich', lat: 48.1351, lng: 11.5820, keywords: ['munich'] },
  { country: 'Italy', countryCode: 'IT', region: 'EU', city: 'Rome', lat: 41.9028, lng: 12.4964, keywords: ['rome', 'italy', 'italian', 'rome'] },
  { country: 'Italy', countryCode: 'IT', region: 'EU', city: 'Milan', lat: 45.4642, lng: 9.1900, keywords: ['milan', 'milano'] },
  { country: 'Spain', countryCode: 'ES', region: 'EU', city: 'Madrid', lat: 40.4168, lng: -3.7038, keywords: ['madrid', 'spain', 'spanish'] },
  { country: 'Spain', countryCode: 'ES', region: 'EU', city: 'Barcelona', lat: 41.3851, lng: 2.1734, keywords: ['barcelona', 'catalonia'] },
  { country: 'Portugal', countryCode: 'PT', region: 'EU', city: 'Lisbon', lat: 38.7223, lng: -9.1393, keywords: ['lisbon', 'portugal', 'portuguese'] },
  { country: 'Netherlands', countryCode: 'NL', region: 'EU', city: 'Amsterdam', lat: 52.3676, lng: 4.9041, keywords: ['amsterdam', 'netherlands', 'dutch'] },
  { country: 'Belgium', countryCode: 'BE', region: 'EU', city: 'Brussels', lat: 50.8476, lng: 4.3572, keywords: ['brussels', 'belgium', 'belgian'] },
  { country: 'Poland', countryCode: 'PL', region: 'EU', city: 'Warsaw', lat: 52.2297, lng: 21.0122, keywords: ['warsaw', 'poland', 'polish'] },
  { country: 'Austria', countryCode: 'AT', region: 'EU', city: 'Vienna', lat: 48.2082, lng: 16.3738, keywords: ['vienna', 'austria', 'austrian'] },
  { country: 'Switzerland', countryCode: 'CH', region: 'EU', city: 'Zurich', lat: 47.3769, lng: 8.5417, keywords: ['zurich', 'switzerland', 'swiss', 'geneva'] },
  { country: 'Sweden', countryCode: 'SE', region: 'EU', city: 'Stockholm', lat: 59.3293, lng: 18.0686, keywords: ['stockholm', 'sweden', 'swedish'] },
  { country: 'Norway', countryCode: 'NO', region: 'EU', city: 'Oslo', lat: 59.9139, lng: 10.7522, keywords: ['oslo', 'norway', 'norwegian'] },
  { country: 'Russia', countryCode: 'RU', region: 'RU', city: 'Moscow', lat: 55.7558, lng: 37.6173, keywords: ['moscow', 'russia', 'russian', 'kremlin'] },
  { country: 'Russia', countryCode: 'RU', region: 'RU', city: 'St. Petersburg', lat: 59.9343, lng: 30.3351, keywords: ['st. petersburg', 'st petersburg'] },
  { country: 'Ukraine', countryCode: 'UA', region: 'UA', city: 'Kyiv', lat: 50.4501, lng: 30.5234, keywords: ['kyiv', 'kiev', 'ukraine', 'ukrainian'] },
  { country: 'Ukraine', countryCode: 'UA', region: 'UA', city: 'Donetsk', lat: 48.0158, lng: 37.8028, keywords: ['donetsk', 'donbas'] },
  { country: 'Belarus', countryCode: 'BY', region: 'EU', city: 'Minsk', lat: 53.9006, lng: 27.5590, keywords: ['minsk', 'belarus', 'belarusian'] },
  { country: 'Greece', countryCode: 'GR', region: 'EU', city: 'Athens', lat: 37.9838, lng: 23.7275, keywords: ['athens', 'greece', 'greek'] },
  { country: 'Turkey', countryCode: 'TR', region: 'ME', city: 'Istanbul', lat: 41.0082, lng: 28.9784, keywords: ['istanbul', 'turkey', 'turkish', 'ankara'] },
  { country: 'Ireland', countryCode: 'IE', region: 'EU', city: 'Dublin', lat: 53.3498, lng: -6.2603, keywords: ['dublin', 'ireland', 'irish'] },
  
  // Middle East
  { country: 'Israel', countryCode: 'IL', region: 'ME', city: 'Jerusalem', lat: 31.7683, lng: 35.2137, keywords: ['jerusalem', 'israel', 'israeli'] },
  { country: 'Israel', countryCode: 'IL', region: 'ME', city: 'Tel Aviv', lat: 32.0853, lng: 34.7818, keywords: ['tel aviv', 'tel-aviv'] },
  { country: 'Palestine', countryCode: 'PS', region: 'ME', city: 'Gaza', lat: 31.5, lng: 34.45, keywords: ['gaza', 'gaza strip', 'palestine', 'palestinian'] },
  { country: 'Palestine', countryCode: 'PS', region: 'ME', city: 'West Bank', lat: 31.9, lng: 35.2, keywords: ['west bank'] },
  { country: 'Saudi Arabia', countryCode: 'SA', region: 'ME', city: 'Riyadh', lat: 24.7136, lng: 46.6753, keywords: ['riyadh', 'saudi', 'saudi arabia'] },
  { country: 'Saudi Arabia', countryCode: 'SA', region: 'ME', city: 'Jeddah', lat: 21.4858, lng: 39.1925, keywords: ['jeddah'] },
  { country: 'Iran', countryCode: 'IR', region: 'ME', city: 'Tehran', lat: 35.6892, lng: 51.3890, keywords: ['tehran', 'iran', 'iranian'] },
  { country: 'United Arab Emirates', countryCode: 'AE', region: 'ME', city: 'Dubai', lat: 25.2048, lng: 55.2708, keywords: ['dubai', 'uae', 'abu dhabi'] },
  { country: 'Qatar', countryCode: 'QA', region: 'ME', city: 'Doha', lat: 25.3548, lng: 51.5564, keywords: ['doha', 'qatar'] },
  { country: 'Egypt', countryCode: 'EG', region: 'AF', city: 'Cairo', lat: 30.0444, lng: 31.2357, keywords: ['cairo', 'egypt', 'egyptian', 'alexandria'] },
  { country: 'Lebanon', countryCode: 'LB', region: 'ME', city: 'Beirut', lat: 33.8886, lng: 35.4955, keywords: ['beirut', 'lebanon', 'lebanese'] },
  { country: 'Syria', countryCode: 'SY', region: 'ME', city: 'Damascus', lat: 33.5138, lng: 36.2765, keywords: ['damascus', 'syria', 'syrian'] },
  { country: 'Iraq', countryCode: 'IQ', region: 'ME', city: 'Baghdad', lat: 33.3152, lng: 44.3661, keywords: ['baghdad', 'iraq', 'iraqi'] },
  { country: 'Yemen', countryCode: 'YE', region: 'ME', city: 'Sanaa', lat: 15.3525, lng: 44.2077, keywords: ['sanaa', 'yemen', 'yemeni'] },
  
  // Asia-Pacific
  { country: 'China', countryCode: 'CN', region: 'AS', city: 'Beijing', lat: 39.9042, lng: 116.4074, keywords: ['beijing', 'china', 'chinese', 'peking'] },
  { country: 'China', countryCode: 'CN', region: 'AS', city: 'Shanghai', lat: 31.2304, lng: 121.4737, keywords: ['shanghai'] },
  { country: 'China', countryCode: 'CN', region: 'AS', city: 'Hong Kong', lat: 22.3193, lng: 114.1694, keywords: ['hong kong', 'hk', 'hongkong'] },
  { country: 'China', countryCode: 'CN', region: 'AS', city: 'Shenzhen', lat: 22.5431, lng: 114.0579, keywords: ['shenzhen', 'guangzhou'] },
  { country: 'China', countryCode: 'CN', region: 'AS', city: 'Taiwan', lat: 25.0330, lng: 121.5654, keywords: ['taiwan', 'taipei', 'taiwanese'] },
  { country: 'Japan', countryCode: 'JP', region: 'AS', city: 'Tokyo', lat: 35.6762, lng: 139.6503, keywords: ['tokyo', 'japan', 'japanese'] },
  { country: 'Japan', countryCode: 'JP', region: 'AS', city: 'Osaka', lat: 34.6937, lng: 135.5023, keywords: ['osaka'] },
  { country: 'South Korea', countryCode: 'KR', region: 'AS', city: 'Seoul', lat: 37.5665, lng: 126.9780, keywords: ['seoul', 'south korea', 'korean', 'korea'] },
  { country: 'North Korea', countryCode: 'KP', region: 'AS', city: 'Pyongyang', lat: 39.0392, lng: 125.7625, keywords: ['pyongyang', 'north korea'] },
  { country: 'India', countryCode: 'IN', region: 'IN', city: 'New Delhi', lat: 28.6139, lng: 77.2090, keywords: ['new delhi', 'delhi', 'india', 'indian'] },
  { country: 'India', countryCode: 'IN', region: 'IN', city: 'Mumbai', lat: 19.0760, lng: 72.8777, keywords: ['mumbai', 'bombay'] },
  { country: 'India', countryCode: 'IN', region: 'IN', city: 'Bangalore', lat: 12.9716, lng: 77.5946, keywords: ['bangalore', 'bengaluru'] },
  { country: 'Pakistan', countryCode: 'PK', region: 'AS', city: 'Islamabad', lat: 33.6844, lng: 73.0479, keywords: ['islamabad', 'pakistan', 'pakistani', 'karachi', 'lahore'] },
  { country: 'Bangladesh', countryCode: 'BD', region: 'AS', city: 'Dhaka', lat: 23.8103, lng: 90.4125, keywords: ['dhaka', 'bangladesh', 'bangladeshi'] },
  { country: 'Singapore', countryCode: 'SG', region: 'AS', city: 'Singapore', lat: 1.3521, lng: 103.8198, keywords: ['singapore', 'singaporean'] },
  { country: 'Thailand', countryCode: 'TH', region: 'AS', city: 'Bangkok', lat: 13.7563, lng: 100.5018, keywords: ['bangkok', 'thailand', 'thai'] },
  { country: 'Vietnam', countryCode: 'VN', region: 'AS', city: 'Hanoi', lat: 21.0285, lng: 105.8542, keywords: ['hanoi', 'vietnam', 'vietnamese', 'ho chi minh'] },
  { country: 'Indonesia', countryCode: 'ID', region: 'AS', city: 'Jakarta', lat: -6.2088, lng: 106.8456, keywords: ['jakarta', 'indonesia', 'indonesian', 'bali'] },
  { country: 'Malaysia', countryCode: 'MY', region: 'AS', city: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, keywords: ['kuala lumpur', 'malaysia', 'malaysian'] },
  { country: 'Philippines', countryCode: 'PH', region: 'AS', city: 'Manila', lat: 14.5995, lng: 120.9842, keywords: ['manila', 'philippines', 'philippine', 'filipino'] },
  { country: 'Australia', countryCode: 'AU', region: 'OC', city: 'Sydney', lat: -33.8688, lng: 151.2093, keywords: ['sydney', 'australia', 'australian'] },
  { country: 'Australia', countryCode: 'AU', region: 'OC', city: 'Melbourne', lat: -37.8136, lng: 144.9631, keywords: ['melbourne'] },
  { country: 'Australia', countryCode: 'AU', region: 'OC', city: 'Canberra', lat: -35.2809, lng: 149.1300, keywords: ['canberra'] },
  { country: 'New Zealand', countryCode: 'NZ', region: 'OC', city: 'Wellington', lat: -41.2865, lng: 174.7762, keywords: ['wellington', 'new zealand', 'auckland'] },
  
  // Africa
  { country: 'South Africa', countryCode: 'ZA', region: 'AF', city: 'Johannesburg', lat: -26.2041, lng: 28.0473, keywords: ['johannesburg', 'south africa', 'south african', 'pretoria', 'cape town'] },
  { country: 'Kenya', countryCode: 'KE', region: 'AF', city: 'Nairobi', lat: -1.2921, lng: 36.8219, keywords: ['nairobi', 'kenya', 'kenyan', 'east africa'] },
  { country: 'Nigeria', countryCode: 'NG', region: 'AF', city: 'Abuja', lat: 9.0765, lng: 7.3986, keywords: ['abuja', 'nigeria', 'nigerian', 'lagos'] },
  { country: 'Egypt', countryCode: 'EG', region: 'AF', city: 'Cairo', lat: 30.0444, lng: 31.2357, keywords: ['cairo', 'egypt', 'egyptian'] },
  { country: 'Ghana', countryCode: 'GH', region: 'AF', city: 'Accra', lat: 5.6037, lng: -0.1870, keywords: ['accra', 'ghana', 'ghanaian'] },
  { country: 'Ethiopia', countryCode: 'ET', region: 'AF', city: 'Addis Ababa', lat: 9.0222, lng: 38.7468, keywords: ['addis ababa', 'ethiopia', 'ethiopian'] },
  { country: 'Democratic Republic of Congo', countryCode: 'CD', region: 'AF', city: 'Kinshasa', lat: -4.4419, lng: 15.2663, keywords: ['kinshasa', 'dr congo', 'congo'] },
  { country: 'Morocco', countryCode: 'MA', region: 'AF', city: 'Rabat', lat: 33.5731, lng: -7.5898, keywords: ['rabat', 'morocco', 'moroccan', 'casablanca'] },
  { country: 'Algeria', countryCode: 'DZ', region: 'AF', city: 'Algiers', lat: 36.7378, lng: 3.0864, keywords: ['algiers', 'algeria', 'algerian'] },
  { country: 'Sudan', countryCode: 'SD', region: 'AF', city: 'Khartoum', lat: 15.5007, lng: 32.5599, keywords: ['khartoum', 'sudan', 'sudanese'] },
  
  // Latin America
  { country: 'Brazil', countryCode: 'BR', region: 'SA', city: 'Brasília', lat: -15.7942, lng: -47.8822, keywords: ['brasilia', 'brazil', 'brazilian'] },
  { country: 'Brazil', countryCode: 'BR', region: 'SA', city: 'São Paulo', lat: -23.5505, lng: -46.6333, keywords: ['sao paulo', 'sao paulo', 'rio de janeiro', 'rio'] },
  { country: 'Argentina', countryCode: 'AR', region: 'SA', city: 'Buenos Aires', lat: -34.6037, lng: -58.3816, keywords: ['buenos aires', 'argentina', 'argentine'] },
  { country: 'Chile', countryCode: 'CL', region: 'SA', city: 'Santiago', lat: -33.4489, lng: -70.6693, keywords: ['santiago', 'chile', 'chilean'] },
  { country: 'Colombia', countryCode: 'CO', region: 'SA', city: 'Bogotá', lat: 4.7110, lng: -74.0721, keywords: ['bogota', 'bogotá', 'colombia', 'colombian'] },
  { country: 'Peru', countryCode: 'PE', region: 'SA', city: 'Lima', lat: -12.0464, lng: -77.0428, keywords: ['lima', 'peru', 'peruvian'] },
  { country: 'Venezuela', countryCode: 'VE', region: 'SA', city: 'Caracas', lat: 10.4806, lng: -66.9036, keywords: ['caracas', 'venezuela', 'venezuelan'] },
  { country: 'Cuba', countryCode: 'CU', region: 'SA', city: 'Havana', lat: 23.1136, lng: -82.3666, keywords: ['havana', 'cuba', 'cuban'] },
];

// ============================================================================
// Geo Extractor Class
// ============================================================================

export class GeoExtractor {
  private locationIndex: Map<string, LocationEntry>;
  
  constructor() {
    this.locationIndex = new Map();
    
    // Build keyword-to-location index
    for (const location of LOCATIONS) {
      for (const keyword of location.keywords) {
        const key = keyword.toLowerCase();
        // Store the most specific location (city > country)
        if (!this.locationIndex.has(key)) {
          this.locationIndex.set(key, location);
        }
      }
    }
  }
  
  /**
   * Extract location from a news title
   */
  extract(title: string): {
    country: string;
    countryCode: string;
    region: RegionCode;
    city?: string;
    lat: number;
    lng: number;
    confidence: number;
    matchedKeyword: string;
  } | null {
    const lowerTitle = title.toLowerCase();
    
    // Find matching locations
    const matches: Array<{ entry: LocationEntry; keyword: string; position: number }> = [];
    
    for (const [keyword, entry] of this.locationIndex) {
      const position = lowerTitle.indexOf(keyword);
      if (position !== -1) {
        matches.push({ entry, keyword, position });
      }
    }
    
    // If no matches, return null
    if (matches.length === 0) {
      return null;
    }
    
    // Sort by keyword length (longer = more specific = higher confidence)
    matches.sort((a, b) => {
      if (b.keyword.length !== a.keyword.length) {
        return b.keyword.length - a.keyword.length;
      }
      // Then by position (earlier = more important)
      return a.position - b.position;
    });
    
    const best = matches[0];
    
    // Calculate confidence based on:
    // - Keyword specificity (city > country)
    // - Position in title (earlier = higher confidence)
    // - Context match
    let confidence = 0.7;
    
    if (best.entry.city) {
      confidence += 0.15;  // City is more specific
    }
    
    if (best.position < 50) {
      confidence += 0.1;  // Early in title = more likely the main topic
    }
    
    // Cap at 0.95
    confidence = Math.min(0.95, confidence);
    
    return {
      country: best.entry.country,
      countryCode: best.entry.countryCode,
      region: best.entry.region,
      city: best.entry.city,
      lat: best.entry.lat,
      lng: best.entry.lng,
      confidence,
      matchedKeyword: best.keyword,
    };
  }
  
  /**
   * Extract all locations from a news title
   */
  extractAll(title: string): Array<{
    country: string;
    countryCode: string;
    region: RegionCode;
    city?: string;
    lat: number;
    lng: number;
    confidence: number;
    matchedKeyword: string;
  }> {
    const lowerTitle = title.toLowerCase();
    const matches: Array<{ entry: LocationEntry; keyword: string; position: number }> = [];
    
    for (const [keyword, entry] of this.locationIndex) {
      const position = lowerTitle.indexOf(keyword);
      if (position !== -1) {
        matches.push({ entry, keyword, position });
      }
    }
    
    // Sort and deduplicate by country
    const uniqueCountries = new Map<string, typeof matches[0]>();
    
    for (const match of matches) {
      if (!uniqueCountries.has(match.entry.countryCode)) {
        uniqueCountries.set(match.entry.countryCode, match);
      }
    }
    
    return Array.from(uniqueCountries.values())
      .sort((a, b) => a.position - b.position)
      .map(match => ({
        country: match.entry.country,
        countryCode: match.entry.countryCode,
        region: match.entry.region,
        city: match.entry.city,
        lat: match.entry.lat,
        lng: match.entry.lng,
        confidence: match.entry.city ? 0.85 : 0.7,
        matchedKeyword: match.keyword,
      }));
  }
  
  /**
   * Get statistics about extracted locations
   */
  getLocationStatistics(titles: string[]): {
    locationCounts: Record<string, number>;
    regionCounts: Record<RegionCode, number>;
    topLocations: Array<{ location: string; count: number }>;
  } {
    const locationCounts: Record<string, number> = {};
    const regionCounts: Record<RegionCode, number> = {
      'NA': 0, 'EU': 0, 'AS': 0, 'ME': 0, 'AF': 0, 'SA': 0, 
      'OC': 0, 'RU': 0, 'UA': 0, 'IN': 0, 'GLOBAL': 0
    };
    
    for (const title of titles) {
      const locations = this.extractAll(title);
      for (const loc of locations) {
        const key = loc.city ? `${loc.city}, ${loc.country}` : loc.country;
        locationCounts[key] = (locationCounts[key] || 0) + 1;
        regionCounts[loc.region] = (regionCounts[loc.region] || 0) + 1;
      }
    }
    
    const topLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));
    
    return { locationCounts, regionCounts, topLocations };
  }
}

// ============================================================================
// Export
// ============================================================================

export const geoExtractor = new GeoExtractor();

export default GeoExtractor;
