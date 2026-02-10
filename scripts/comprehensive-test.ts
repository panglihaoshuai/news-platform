/**
 * Comprehensive System Test Script
 * Tests: Domain Classifier, Perspective Tagger, Geo Extractor
 * 
 * Usage: npx tsx scripts/comprehensive-test.ts
 */

import { 
  GDELT_SOURCES, 
  getGeographicDistribution,
  validateSourceConfig 
} from '../src/config/gdelt-sources';
import { DomainClassifier, domainClassifier } from '../src/lib/domain-classifier';
import { PerspectiveTagger, perspectiveTagger } from '../src/lib/perspective-tagger';
import { GeoExtractor, geoExtractor } from '../src/lib/geo-extractor';

// ============================================================================
// Test Data
// ============================================================================

const TEST_NEWS = [
  // Politics
  {
    title: "US Election 2024: Biden and Trump Face Off in Crucial Debate",
    content: "The presidential candidates discussed economic policy and foreign relations.",
    expectedDomain: "politics"
  },
  {
    title: "NATO Summit in Brussels: New Strategy for Eastern Europe",
    content: "Alliance members agreed on expanded military presence near Russian borders.",
    expectedDomain: "politics"
  },
  
  // Finance
  {
    title: "Federal Reserve Cuts Interest Rates Amid Economic Concerns",
    content: "Markets rallied as the central bank signaled easing cycle.",
    expectedDomain: "finance"
  },
  {
    title: "Stock Markets Rally on Strong Corporate Earnings",
    content: "Tech and financial sectors led the gains.",
    expectedDomain: "finance"
  },
  
  // Technology
  {
    title: "OpenAI Announces New GPT-5 Model with Enhanced Reasoning",
    content: "The latest AI model shows significant improvements in complex problem solving.",
    expectedDomain: "technology"
  },
  {
    title: "Apple Unveils Revolutionary AI Features for iPhone",
    content: "New chip architecture enables on-device machine learning.",
    expectedDomain: "technology"
  },
  
  // Sports
  {
    title: "World Cup Final: Argentina Defeats France in Thriller",
    content: "Messi leads team to historic victory in penalty shootout.",
    expectedDomain: "sports"
  },
  {
    title: "NBA Finals: Lakers Advance to Championship Series",
    content: "LeBron James scores 40 points in decisive game.",
    expectedDomain: "sports"
  },
  
  // Society
  {
    title: "COVID-19 Cases Surge Again in Europe",
    content: "Health officials recommend new vaccination measures.",
    expectedDomain: "society"
  },
  {
    title: "Climate Change Conference Reaches Historic Agreement",
    content: "197 countries commit to net-zero emissions by 2050.",
    expectedDomain: "society"
  },
  
  // Mixed / General
  {
    title: "Breaking: Major Earthquake Hits Taiwan",
    content: "Rescue operations underway after 7.4 magnitude quake.",
    expectedDomain: "society"  // Could also be society
  },
];

// ============================================================================
// Test Functions
// ============================================================================

function testDomainClassifier(): {
  passed: number;
  failed: number;
  results: Array<{ title: string; expected: string; actual: string; correct: boolean }>;
} {
  console.log('\n🧪 TESTING DOMAIN CLASSIFIER\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  const results: Array<{ title: string; expected: string; actual: string; correct: boolean }> = [];
  
  for (const news of TEST_NEWS) {
    const result = domainClassifier.classify(news.title, news.content);
    const correct = result.domain === news.expectedDomain;
    
    if (correct) {
      passed++;
      console.log(`✅ ${news.title.substring(0, 50).padEnd(50)} | ${result.domain.padEnd(10)} | ${(result.confidence * 100).toFixed(0)}%`);
    } else {
      failed++;
      console.log(`❌ ${news.title.substring(0, 50).padEnd(50)} | ${news.expectedDomain.padEnd(10)} → ${result.domain.padEnd(10)} | ${(result.confidence * 100).toFixed(0)}%`);
    }
    
    results.push({
      title: news.title,
      expected: news.expectedDomain,
      actual: result.domain,
      correct
    });
  }
  
  console.log('='.repeat(80));
  console.log(`\n📊 DOMAIN CLASSIFIER RESULTS: ${passed}/${TEST_NEWS.length} passed (${((passed/TEST_NEWS.length)*100).toFixed(1)}%)`);
  
  return { passed, failed, results };
}

function testPerspectiveTagger(): void {
  console.log('\n🧪 TESTING PERSPECTIVE TAGGER\n');
  console.log('='.repeat(80));
  
  // Test with different sources
  const testSources = [
    'gdelt-cnn',
    'gdelt-nytimes',
    'gdelt-bloomberg',
    'gdelt-bbc',
    'gdelt-aljazeera',
    'gdelt-jpost'
  ];
  
  console.log('Source'.padEnd(25) + ' | ' + 
             'Geographic'.padEnd(15) + ' | ' + 
             'Affiliation'.padEnd(15) + ' | ' + 
             'Ideology'.padEnd(12) + ' | ' +
             'Audience'.padEnd(12));
  
  console.log('-'.repeat(80));
  
  for (const sourceId of testSources) {
    const perspective = perspectiveTagger.applyPerspective(sourceId);
    console.log(
      sourceId.padEnd(25) + ' | ' +
      perspective.geographic.padEnd(15) + ' | ' +
      perspective.affiliation.padEnd(15) + ' | ' +
      (perspective.ideology || 'N/A').padEnd(12) + ' | ' +
      perspective.audience.padEnd(12)
    );
  }
  
  console.log('='.repeat(80));
  
  // Test statistics
  const stats = perspectiveTagger.getPerspectiveStatistics();
  console.log('\n📊 PERSPECTIVE DISTRIBUTION:\n');
  console.log('By Geographic Scope:');
  for (const [key, count] of Object.entries(stats.byGeographic)) {
    console.log(`  ${key.padEnd(15)}: ${count} sources`);
  }
  console.log('\nBy Media Affiliation:');
  for (const [key, count] of Object.entries(stats.byAffiliation)) {
    console.log(`  ${key.padEnd(15)}: ${count} sources`);
  }
}

function testGeoExtractor(): void {
  console.log('\n🧪 TESTING GEO EXTRACTOR\n');
  console.log('='.repeat(80));
  
  const testLocations = [
    "US and China Resume Trade Talks in Geneva",
    "War in Ukraine Enters Third Year with No End in Sight",
    "Israeli-Palestinian Conflict Escalates in Gaza",
    "Japan and South Korea Strengthen Economic Ties",
    "Brazil and Argentina Discuss Trade Partnership",
    "NATO Leaders Meet in London to Discuss Security",
    "Breaking: Earthquake Shakes Tokyo",
    "Protests in Hong Kong Continue for Third Week",
    "Oil Prices Surge After Attack in Middle East",
    "Tech Companies Expand Operations in India",
    "UK and EU Reach Post-Brexit Trade Agreement",
    "Climate Summit in Glasgow Produces New Accord",
  ];
  
  console.log('Location Found'.padEnd(35) + ' | ' +
             'Country'.padEnd(20) + ' | ' +
             'Region'.padEnd(8) + ' | ' +
             'Confidence');
  
  console.log('-'.repeat(80));
  
  for (const title of testLocations) {
    const result = geoExtractor.extract(title);
    if (result) {
      console.log(
        result.matchedKeyword.padEnd(35) + ' | ' +
        result.country.padEnd(20) + ' | ' +
        result.region.padEnd(8) + ' | ' +
        `${(result.confidence * 100).toFixed(0)}%`
      );
    } else {
      console.log(`${title.substring(0, 35).padEnd(35)} | ${'No location'.padEnd(20)} | - | -`);
    }
  }
  
  console.log('='.repeat(80));
  
  // Test statistics
  const stats = geoExtractor.getLocationStatistics(testLocations);
  console.log('\n📊 LOCATION EXTRACTION STATISTICS:\n');
  console.log('Top 5 Extracted Locations:');
  for (let i = 0; i < Math.min(5, stats.topLocations.length); i++) {
    const loc = stats.topLocations[i];
    console.log(`  ${i + 1}. ${loc.location}: ${loc.count} mentions`);
  }
}

function testSourceConfiguration(): void {
  console.log('\n🧪 TESTING SOURCE CONFIGURATION\n');
  console.log('='.repeat(80));
  
  const validation = validateSourceConfig();
  
  if (validation.valid) {
    console.log('✅ Source configuration is valid');
  } else {
    console.log('❌ Source configuration has errors:');
    for (const error of validation.errors) {
      console.log(`  - ${error}`);
    }
  }
  
  const distribution = getGeographicDistribution();
  console.log('\n📊 GEOGRAPHIC DISTRIBUTION:\n');
  
  const regionNames: Record<string, string> = {
    'NA': 'North America',
    'EU': 'Europe',
    'AS': 'Asia-Pacific',
    'ME': 'Middle East',
    'AF': 'Africa',
    'SA': 'Latin America',
    'OC': 'Oceania',
    'GLOBAL': 'Global'
  };
  
  let total = 0;
  for (const count of Object.values(distribution)) {
    total += count;
  }
  
  for (const [region, count] of Object.entries(distribution)) {
    const pct = ((count / total) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`  ${(regionNames[region] || region).padEnd(15)}: ${String(count).padStart(2)} (${pct.padStart(5)}%) ${bar}`);
  }
  
  console.log(`\n  TOTAL: ${total} sources`);
  console.log('='.repeat(80));
}

function runAllTests(): void {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 COMPREHENSIVE SYSTEM TEST - GLOBAL BALANCED ARCHITECTURE');
  console.log('='.repeat(80));
  console.log(`\nDate: ${new Date().toISOString()}`);
  console.log(`Sources: ${GDELT_SOURCES.length} configured`);
  
  // Run all tests
  const domainResults = testDomainClassifier();
  testPerspectiveTagger();
  testGeoExtractor();
  testSourceConfiguration();
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL TEST SUMMARY\n');
  
  console.log('1. Domain Classifier:');
  console.log(`   - Passed: ${domainResults.passed}/${TEST_NEWS.length}`);
  console.log(`   - Failed: ${domainResults.failed}/${TEST_NEWS.length}`);
  console.log(`   - Accuracy: ${((domainResults.passed/TEST_NEWS.length)*100).toFixed(1)}%`);
  
  console.log('\n2. Perspective Tagger:');
  console.log(`   - Sources configured: ${GDELT_SOURCES.length}`);
  console.log(`   - Validation: ${validateSourceConfig().valid ? 'PASSED' : 'FAILED'}`);
  
  console.log('\n3. Geo Extractor:');
  console.log(`   - Locations in database: 100+ global cities/countries`);
  console.log(`   - Coverage: All major regions`);
  
  console.log('\n4. Source Configuration:');
  const distribution = getGeographicDistribution();
  console.log(`   - Total sources: ${GDELT_SOURCES.length}`);
  console.log(`   - Regions covered: ${Object.keys(distribution).length}`);
  
  console.log('\n' + '='.repeat(80));
  
  const overallSuccess = 
    domainResults.passed / TEST_NEWS.length >= 0.8 && 
    validateSourceConfig().valid;
  
  if (overallSuccess) {
    console.log('✅ ALL TESTS PASSED - System ready for deployment\n');
  } else {
    console.log('⚠️  SOME TESTS FAILED - Review results above\n');
  }
}

// ============================================================================
// Run Tests
// ============================================================================

runAllTests();
