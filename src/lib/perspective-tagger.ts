/**
 * Perspective Tagger
 * Automatically applies perspective tags to news articles based on source configuration
 * 
 * Tags: geographic scope, media affiliation, political ideology, target audience
 * 
 * @version 1.0.0
 * @date 2026-02-09
 */

import { 
  getEnabledGdeltSources, 
  getGdeltSourceByDomain 
} from '@/config/gdelt-sources';
import type { 
  PerspectiveTags, 
  GeographicPerspective, 
  MediaAffiliation, 
  PoliticalIdeology,
  TargetAudience,
  NewsSourceConfig,
  Domain,
  DomainWeights
} from '@/types/unified-news';

// ============================================================================
// Perspective Tag Templates by Region
// ============================================================================

const REGION_PERSPECTIVES: Record<string, Omit<PerspectiveTags, 'description'>> = {
  // North America
  'NA': {
    geographic: 'regional',
    affiliation: 'independent',
    audience: 'domestic',
  },
  
  // Europe
  'EU': {
    geographic: 'international',
    affiliation: 'independent',
    audience: 'international',
  },
  
  // Asia-Pacific
  'AS': {
    geographic: 'regional',
    affiliation: 'independent',
    audience: 'regional',
  },
  
  // Middle East
  'ME': {
    geographic: 'regional',
    affiliation: 'semi-official',
    audience: 'international',
  },
  
  // Africa
  'AF': {
    geographic: 'regional',
    affiliation: 'independent',
    audience: 'regional',
  },
  
  // Latin America
  'SA': {
    geographic: 'regional',
    affiliation: 'independent',
    audience: 'domestic',
  },
  
  // Oceania
  'OC': {
    geographic: 'regional',
    affiliation: 'official',
    audience: 'international',
  },
};

// ============================================================================
// Ideology Mapping by Source (Western Media)
// ============================================================================

const SOURCE_IDEOLOGIES: Record<string, PoliticalIdeology> = {
  // Progressive
  'gdelt-nytimes': 'progressive',
  'gdelt-haaretz': 'progressive',
  'gdelt-aljazeera': 'progressive',
  'gdelt-guardian': 'progressive',
  
  // Conservative
  'gdelt-wsj': 'conservative',
  'gdelt-jpost': 'conservative',
  'gdelt-fox': 'conservative',
  'gdelt-washingtonpost': 'conservative',
  
  // Centrist (default for most)
};

// ============================================================================
// Domain Weights by Source
// ============================================================================

const SOURCE_DOMAIN_WEIGHTS: Record<string, Record<Domain, number>> = {
  'gdelt-cnn': { politics: 30, finance: 15, technology: 10, sports: 3, society: 2, general: 40 },
  'gdelt-nytimes': { politics: 35, finance: 15, technology: 10, sports: 3, society: 2, general: 35 },
  'gdelt-bloomberg': { politics: 20, finance: 50, technology: 20, sports: 2, society: 3, general: 5 },
  'gdelt-wsj': { politics: 25, finance: 45, technology: 10, sports: 2, society: 3, general: 15 },
  'gdelt-bbc': { politics: 30, finance: 10, technology: 5, sports: 3, society: 2, general: 50 },
  'gdelt-reuters': { politics: 25, finance: 35, technology: 10, sports: 2, society: 3, general: 25 },
  'gdelt-afp': { politics: 30, finance: 15, technology: 5, sports: 3, society: 2, general: 45 },
  'gdelt-dw': { politics: 25, finance: 15, technology: 5, sports: 3, society: 2, general: 50 },
  'gdelt-aljazeera': { politics: 35, finance: 10, technology: 5, sports: 3, society: 7, general: 40 },
  'gdelt-haaretz': { politics: 40, finance: 10, technology: 5, sports: 2, society: 3, general: 40 },
  'gdelt-jpost': { politics: 40, finance: 10, technology: 5, sports: 2, society: 3, general: 40 },
};

// ============================================================================
// Perspective Tagger Class
// ============================================================================

export class PerspectiveTagger {
  private sourceCache: Map<string, PerspectiveTags>;
  private domainWeightsCache: Map<string, DomainWeights>;
  
  constructor() {
    this.sourceCache = new Map();
    this.domainWeightsCache = new Map();
    
    // Pre-populate cache from configured sources
    const sources = getEnabledGdeltSources();
    for (const source of sources) {
      if (source.perspectiveTags) {
        this.sourceCache.set(source.id, source.perspectiveTags);
        this.sourceCache.set(source.config.domain!, source.perspectiveTags);
      }
      if (source.domainWeights) {
        this.domainWeightsCache.set(source.id, source.domainWeights);
        this.domainWeightsCache.set(source.config.domain!, source.domainWeights);
      }
    }
  }
  
  /**
   * Get perspective tags for a source
   */
  getPerspective(sourceId: string): PerspectiveTags | null {
    return this.sourceCache.get(sourceId) || null;
  }
  
  /**
   * Get perspective tags by domain
   */
  getPerspectiveByDomain(domain: string): PerspectiveTags | null {
    return this.sourceCache.get(domain) || null;
  }
  
  /**
   * Get domain weights for a source
   */
  getDomainWeights(sourceId: string): Record<Domain, number> | null {
    const weights = this.domainWeightsCache.get(sourceId);
    if (!weights) return null;
    
    // Convert DomainWeights (all optional) to Record<Domain, number> with defaults
    return {
      politics: weights.politics ?? 20,
      finance: weights.finance ?? 20,
      technology: weights.technology ?? 10,
      sports: weights.sports ?? 5,
      society: weights.society ?? 5,
      general: weights.general ?? 40,
    };
  }
  
  /**
   * Apply perspective tags to a news article
   */
  applyPerspective(
    sourceId: string,
    options?: {
      overrideGeographic?: GeographicPerspective;
      overrideAffiliation?: MediaAffiliation;
      overrideAudience?: TargetAudience;
    }
  ): PerspectiveTags {
    const defaultTags = this.sourceCache.get(sourceId);
    
    if (defaultTags) {
      return {
        geographic: options?.overrideGeographic || defaultTags.geographic,
        affiliation: options?.overrideAffiliation || defaultTags.affiliation,
        audience: options?.overrideAudience || defaultTags.audience,
        ideology: defaultTags.ideology,
        description: defaultTags.description,
      };
    }
    
    // Fallback: Create default tags based on source ID pattern
    const region = this.extractRegion(sourceId);
    const basePerspective = REGION_PERSPECTIVES[region] || REGION_PERSPECTIVES['NA'];
    const ideology = SOURCE_IDEOLOGIES[sourceId];
    
    return {
      geographic: options?.overrideGeographic || basePerspective.geographic,
      affiliation: options?.overrideAffiliation || basePerspective.affiliation,
      audience: options?.overrideAudience || basePerspective.audience,
      ideology,
      description: this.generateDescription(sourceId, basePerspective, ideology),
    };
  }
  
  /**
   * Extract region from source ID
   */
  private extractRegion(sourceId: string): string {
    // Try to extract region from ID patterns
    const regionPatterns: Record<string, RegExp> = {
      'NA': /cnn|nytimes|bloomberg|wsj/i,
      'EU': /bbc|reuters|afp|dw|france24|guardian/i,
      'AS': /japan|korea|india|china|zaobao|straitstimes/i,
      'ME': /aljazeera|haaretz|jpost|israel/i,
      'AF': /africanews|news24|eastafrican|ahram/i,
      'SA': /globo|clarin|reforma|latin/i,
      'OC': /abc australia|australian/i,
    };
    
    for (const [region, pattern] of Object.entries(regionPatterns)) {
      if (pattern.test(sourceId)) {
        return region;
      }
    }
    
    return 'NA'; // Default to North America
  }
  
  /**
   * Generate description for fallback tags
   */
  private generateDescription(
    sourceId: string,
    perspective: Omit<PerspectiveTags, 'description'>,
    ideology?: PoliticalIdeology
  ): string {
    const parts: string[] = [];
    
    // Geographic description
    if (perspective.geographic === 'global') {
      parts.push('Global perspective');
    } else if (perspective.geographic === 'international') {
      parts.push('International perspective');
    } else {
      parts.push('Regional perspective');
    }
    
    // Affiliation description
    if (perspective.affiliation === 'official') {
      parts.push('public broadcaster');
    } else if (perspective.affiliation === 'independent') {
      parts.push('independent media');
    } else if (perspective.affiliation === 'semi-official') {
      parts.push('state-affiliated media');
    }
    
    // Ideology description (for Western media)
    if (ideology === 'progressive') {
      parts.push('progressive');
    } else if (ideology === 'conservative') {
      parts.push('conservative');
    }
    
    return parts.join(' ');
  }
  
  /**
   * Get summary statistics of perspectives
   */
  getPerspectiveStatistics(): {
    byGeographic: Record<GeographicPerspective, number>;
    byAffiliation: Record<MediaAffiliation, number>;
    byIdeology: Record<PoliticalIdeology | 'undefined', number>;
    byAudience: Record<TargetAudience, number>;
  } {
    const byGeographic: Record<GeographicPerspective, number> = {
      local: 0,
      regional: 0,
      international: 0,
      global: 0,
    };
    
    const byAffiliation: Record<MediaAffiliation, number> = {
      official: 0,
      independent: 0,
      opposition: 0,
      neutral: 0,
      'semi-official': 0,
    };
    
    const byIdeology: Record<PoliticalIdeology | 'undefined', number> = {
      progressive: 0,
      centrist: 0,
      conservative: 0,
      undefined: 0,
    };
    
    const byAudience: Record<TargetAudience, number> = {
      domestic: 0,
      diaspora: 0,
      international: 0,
      regional: 0,
    };
    
    for (const tags of this.sourceCache.values()) {
      byGeographic[tags.geographic]++;
      byAffiliation[tags.affiliation]++;
      byAudience[tags.audience]++;
      if (tags.ideology) {
        byIdeology[tags.ideology]++;
      } else {
        byIdeology['undefined']++;
      }
    }
    
    return { byGeographic, byAffiliation, byIdeology, byAudience };
  }
}

// ============================================================================
// Export
// ============================================================================

export const perspectiveTagger = new PerspectiveTagger();

export default PerspectiveTagger;
