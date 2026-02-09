/**
 * Data Cleaner Module
 * 
 * Cleans and normalizes news data from various sources.
 * Handles HTML stripping, special characters, URL standardization, etc.
 * 
 * Design Decision: NO image extraction
 * - Images are not stored, only text content is preserved
 * - Users access original_url to view images on source site
 * 
 * @version 1.0.0
 * @date 2026-02-08
 */

import * as cheerio from 'cheerio';
import type { RegionConfig, CountryInfo } from '@/types/unified-news';
import { REGION_CONFIG, COUNTRIES, CITY_KEYWORDS } from '@/config/region-mapping';

/**
 * Data Cleaner Class
 * 
 * Provides methods for cleaning and normalizing news data.
 */
export class DataCleaner {
  // ============================================================================
  // Title Cleaning
  // ============================================================================

  /**
   * Clean title by removing HTML tags and normalizing
   */
  cleanTitle(title: string): string {
    if (!title) return '';
    
    return title
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Replace common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&ndash;/g, '-')
      .replace(/&mdash;/g, '--')
      .replace(/&bull;/g, '•')
      .replace(/&hellip;/g, '...')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Trim
      .trim();
  }

  /**
   * Validate title (minimum length, no empty after cleaning)
   */
  isValidTitle(title: string): boolean {
    const cleaned = this.cleanTitle(title);
    return cleaned.length >= 5;
  }

  // ============================================================================
  // Summary/Description Cleaning
  // ============================================================================

  /**
   * Clean summary/description
   * - Removes HTML tags
   * - Limits length
   * - Normalizes whitespace
   */
  cleanSummary(summary: string, maxLength: number = 800): string {
    if (!summary) return '';
    
    try {
      // Parse HTML and extract text
      const $ = cheerio.load(summary);
      const text = $('body').text();
      
      return text
        // Remove HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        // Limit length
        .substring(0, maxLength)
        // Trim
        .trim();
    } catch {
      // Fallback: simple regex replacement
      return summary
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .substring(0, maxLength)
        .trim();
    }
  }

  /**
   * Extract plain text from HTML content
   */
  extractText(html: string): string {
    if (!html) return '';
    
    try {
      const $ = cheerio.load(html);
      $('script').remove();
      $('style').remove();
      $('iframe').remove();
      $('noscript').remove();
      $('nav').remove();
      $('footer').remove();
      $('header').remove();
      
      return $('body')
        .text()
        .replace(/\s+/g, ' ')
        .trim();
    } catch {
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  }

  // ============================================================================
  // URL Cleaning
  // ============================================================================

  /**
   * Standardize URL
   * - Handles relative URLs
   * - Validates URL format
   */
  standardizeUrl(url: string, baseUrl?: string): string {
    if (!url) return '';
    
    try {
      // Handle relative URLs
      if (baseUrl && url.startsWith('/')) {
        const baseUrlObj = new URL(baseUrl);
        return `${baseUrlObj.origin}${url}`;
      }
      
      // Handle protocol-relative URLs
      if (url.startsWith('//')) {
        return `https:${url}`;
      }
      
      // Validate URL
      const urlObj = new URL(url);
      
      // Remove tracking parameters
      const cleanParams = new URLSearchParams(urlObj.search);
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'msclkid'];
      
      trackingParams.forEach((param) => {
        cleanParams.delete(param);
      });
      
      urlObj.search = cleanParams.toString();
      
      return urlObj.toString();
    } catch {
      return '';
    }
  }

  /**
   * Validate URL format
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  // ============================================================================
  // Date/Time Cleaning
  // ============================================================================

  /**
   * Standardize date to ISO 8601
   */
  standardizeDate(dateString: string): string {
    if (!dateString) {
      return new Date().toISOString();
    }
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        // Try parsing common formats
        const parsed = this.parseDate(dateString);
        if (parsed) {
          return parsed.toISOString();
        }
        return new Date().toISOString();
      }
      
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  /**
   * Parse various date formats
   */
  private parseDate(dateString: string): Date | null {
    // Common RSS date formats
    const formats = [
      // RFC 2822
      /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} [A-Z]{3}$/,
      // ISO-like
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      // US format
      /^\d{1,2}\/\d{1,2}\/\d{4}/,
      // European format
      /^\d{1,2}-\d{1,2}-\d{4}/,
    ];
    
    // Common date patterns
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try specific patterns
    // "Wed, 08 Feb 2026 14:30:00 GMT"
    const rfc2822 = dateString.match(/^[A-Z][a-z]{2}, (\d{2}) ([A-Z][a-z]{2}) (\d{4}) (\d{2}):(\d{2}):(\d{2})/);
    if (rfc2822) {
      const months: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
      };
      const [, day, month, year, hour, min, sec] = rfc2822;
      return new Date(
        parseInt(year),
        months[month],
        parseInt(day),
        parseInt(hour),
        parseInt(min),
        parseInt(sec)
      );
    }
    
    return null;
  }

  /**
   * Calculate hours ago from now
   */
  getHoursAgo(dateString: string): number {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return Infinity;
    
    return (Date.now() - date.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Check if date is within time window
   */
  isWithinTimeWindow(dateString: string, hoursWindow: number): boolean {
    return this.getHoursAgo(dateString) <= hoursWindow;
  }

  // ============================================================================
  // HTML Cleaning
  // ============================================================================

  /**
   * Clean HTML content
   * Removes scripts, styles, iframes, etc.
   */
  cleanHtml(html: string): string {
    if (!html) return '';
    
    try {
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $('script').remove();
      $('style').remove();
      $('iframe').remove();
      $('noscript').remove();
      $('nav').remove();
      $('header').remove();
      $('footer').remove();
      $('aside').remove();
      $('form').remove();
      $('button').remove();
      $('input').remove();
      $('select').remove();
      $('textarea').remove();
      
      // Remove comments
      $('*').contents().each(function () {
        if (this.type === 'comment') {
          $(this).remove();
        }
      });
      
      return $('body').html() || '';
    } catch {
      return html;
    }
  }

  /**
   * Remove all HTML tags
   */
  stripHtml(html: string): string {
    if (!html) return '';
    
    try {
      const $ = cheerio.load(html);
      return $('body').text().replace(/\s+/g, ' ').trim();
    } catch {
      return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    }
  }

  // ============================================================================
  // Text Utilities
  // ============================================================================

  /**
   * Truncate text to maximum length
   */
  truncate(text: string, maxLength: number, suffix: string = '...'): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length).trim() + suffix;
  }

  /**
   * Convert to sentence case
   */
  toSentenceCase(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  /**
   * Remove duplicate whitespace
   */
  normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Remove special characters except basic punctuation
   */
  removeSpecialChars(text: string): string {
    return text.replace(/[^\w\s.,!?;:'"()-]/g, '');
  }

  // ============================================================================
  // Geocoding Helpers
  // ============================================================================

  /**
   * Geocode news title to geographic coordinates
   * 
   * Priority:
   * 1. City names (most specific)
   * 2. Country names
   * 3. Region keywords
   */
  geocode(title: string): {
    lat: number | null;
    lng: number | null;
    code: string | null;
    region: string | null;
  } {
    const lowerTitle = title.toLowerCase();
    
    // 1. Check city keywords first (most specific)
    for (const [city, info] of Object.entries(CITY_KEYWORDS)) {
      for (const keyword of info.keywords) {
        if (lowerTitle.includes(keyword.toLowerCase())) {
          return {
            lat: info.lat,
            lng: info.lng,
            code: info.country,
            region: this.getRegionForCountry(info.country),
          };
        }
      }
    }
    
    // 2. Check country names
    for (const country of COUNTRIES) {
      if (lowerTitle.includes(country.name.toLowerCase())) {
        return {
          lat: country.latitude,
          lng: country.longitude,
          code: country.code,
          region: country.region,
        };
      }
      
      // Check keywords
      if (country.keywords) {
        for (const keyword of country.keywords) {
          if (lowerTitle.includes(keyword.toLowerCase())) {
            return {
              lat: country.latitude,
              lng: country.longitude,
              code: country.code,
              region: country.region,
            };
          }
        }
      }
    }
    
    // 3. Check region keywords
    for (const region of REGION_CONFIG) {
      for (const keyword of region.keywords) {
        if (lowerTitle.includes(keyword.toLowerCase())) {
          return {
            lat: region.latitude,
            lng: region.longitude,
            code: null,
            region: region.code,
          };
        }
      }
    }
    
    // No match found
    return {
      lat: null,
      lng: null,
      code: null,
      region: null,
    };
  }

  /**
   * Get region code for a country
   */
  private getRegionForCountry(countryCode: string): string | null {
    const country = COUNTRIES.find((c) => c.code === countryCode);
    return country?.region || null;
  }

  // ============================================================================
  // Language Detection
  // ============================================================================

  /**
   * Detect language from text
   */
  detectLanguage(text: string): 'en' | 'zh' | 'other' {
    if (!text) return 'en';
    
    // Chinese characters pattern
    const chinesePattern = /[\u4e00-\u9fa5]/;
    const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff]/;
    const koreanPattern = /[\uac00-\ud7af]/;
    const arabicPattern = /[\u0600-\u06ff]/;
    const russianPattern = /[\u0400-\u04ff]/;
    
    if (chinesePattern.test(text)) return 'zh';
    if (japanesePattern.test(text)) return 'other';
    if (koreanPattern.test(text)) return 'other';
    if (arabicPattern.test(text)) return 'other';
    if (russianPattern.test(text)) return 'other';
    
    return 'en';
  }

  // ============================================================================
  // Validation
  // ============================================================================

  /**
   * Validate news item
   */
  validateNewsItem(item: {
    title: string;
    summary: string;
    url: string;
    date: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.isValidTitle(item.title)) {
      errors.push('Invalid or too short title');
    }
    
    if (!item.summary || item.summary.length < 10) {
      errors.push('Summary too short or empty');
    }
    
    if (!this.isValidUrl(item.url)) {
      errors.push('Invalid URL');
    }
    
    if (!item.date || isNaN(new Date(item.date).getTime())) {
      errors.push('Invalid publication date');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const dataCleaner = new DataCleaner();
export default DataCleaner;
