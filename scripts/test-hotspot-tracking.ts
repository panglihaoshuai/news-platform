/**
 * Test script for hotspot tracking functionality
 * 
 * Tests:
 * 1. Destination matching from news
 * 2. Flight direction analysis
 * 3. Hotspot stats generation
 * 
 * @module scripts/test-hotspot-tracking
 */

import type { NewsItem } from '../src/types/news';
import type { MilitaryAircraft, TrajectoryPoint } from '../src/lib/military/types';
import { findDestinationsByNews, HOTSPOT_DESTINATIONS } from '../src/lib/military/destinations';
import { analyzeFlightDirection, getHotspotStats } from '../src/lib/military/trajectory';
import { analyzeHotspots } from '../src/lib/military/hotspot-matcher';

// ============================================================================
// Test Helpers
// ============================================================================

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    console.error(`❌ FAILED: ${message}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual: ${actual}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

// ============================================================================
// Test Cases
// ============================================================================

console.log('\n=== Hotspot Tracking Tests ===\n');

// Test 1: Destination matching
console.log('--- Test 1: News-Destination Matching ---');

const testNews: NewsItem[] = [
  { id: '1', source_id: 'bbc', source_name: 'BBC', source_language: 'en', title: 'US sends troops to Middle East', summary: '', original_url: '', published_at: '', geo_lat: null, geo_lng: null, region_code: null, country_code: null, importance_score: 80, created_at: '' },
  { id: '2', source_id: 'bbc', source_name: 'BBC', source_language: 'en', title: '美军向乌克兰部署军机', summary: '', original_url: '', published_at: '', geo_lat: null, geo_lng: null, region_code: null, country_code: null, importance_score: 75, created_at: '' },
  { id: '3', source_id: 'bbc', source_name: 'BBC', source_language: 'en', title: 'Tensions rise in South China Sea', summary: '', original_url: '', published_at: '', geo_lat: null, geo_lng: null, region_code: null, country_code: null, importance_score: 70, created_at: '' },
];

const news1Destinations = findDestinationsByNews(testNews[0].title);
assertEqual(news1Destinations.length >= 1, true, 'Middle East news should match destination');
assertEqual(news1Destinations[0].id, 'middleeast', 'Should match middleeast');

const news2Destinations = findDestinationsByNews(testNews[1].title);
assertEqual(news2Destinations.length >= 1, true, 'Ukraine news should match destination');
assertEqual(news2Destinations[0].id, 'ukraine', 'Should match ukraine');

const news3Destinations = findDestinationsByNews(testNews[2].title);
assertEqual(news3Destinations.length >= 1, true, 'South China Sea news should match destination');
assertEqual(news3Destinations[0].id, 'pacific', 'Should match pacific');

// Test 2: Flight direction analysis
console.log('\n--- Test 2: Flight Direction Analysis ---');

// Simulate aircraft flying from US (approx 40°N, 100°W) towards Middle East
const trajectory1: TrajectoryPoint[] = [
  { lat: 40, lng: -100, timestamp: Date.now() - 600000 },
  { lat: 38, lng: -80, timestamp: Date.now() - 500000 },
  { lat: 35, lng: -50, timestamp: Date.now() - 400000 },
];

const middleEastCenter: [number, number] = [29, 45];
const analysis1 = analyzeFlightDirection(trajectory1, middleEastCenter);

if (analysis1) {
  assertEqual(analysis1.distanceCoveredKm > 1000, true, 'Flight from US to Middle East should cover >1000km');
  assertEqual(analysis1.isFlyingTowards, true, 'Should be flying towards Middle East');
} else {
  console.error('❌ FAILED: Analysis returned null');
  process.exit(1);
}

// Test 3: Flight NOT towards destination (going south to Mexico/Central America)
const trajectory2: TrajectoryPoint[] = [
  { lat: 40, lng: -100, timestamp: Date.now() - 600000 },
  { lat: 35, lng: -102, timestamp: Date.now() - 500000 },
  { lat: 30, lng: -105, timestamp: Date.now() - 400000 },
];

const analysis2 = analyzeFlightDirection(trajectory2, middleEastCenter);

if (analysis2) {
  assertEqual(analysis2.isFlyingTowards, false, 'Flight going south-southwest should NOT be flying towards Middle East');
} else {
  console.error('❌ FAILED: Analysis returned null');
  process.exit(1);
}

// Test 4: Hotspot stats generation
console.log('\n--- Test 4: Hotspot Stats ---');

const aircraftList: Array<{ aircraft: MilitaryAircraft; trajectory: TrajectoryPoint[] }> = [
  {
    aircraft: {
      id: 'AE12345',
      callsign: 'RCH123',
      originCountry: 'United States',
      longitude: -50,
      latitude: 35,
      altitude: 35000,
      velocity: 250,
      heading: 90,
      timestamp: Date.now(),
      isMilitary: true,
      aircraftType: 'transport',
    },
    trajectory: trajectory1,
  },
  {
    aircraft: {
      id: 'AF67890',
      callsign: 'FALCON1',
      originCountry: 'United States',
      longitude: -90,
      latitude: 45,
      altitude: 40000,
      velocity: 300,
      heading: 0,
      timestamp: Date.now(),
      isMilitary: true,
      aircraftType: 'fighter',
    },
    trajectory: trajectory2,
  },
];

const stats = getHotspotStats(aircraftList, 'middleeast');
assertEqual(stats.totalAircraft >= 1, true, 'Should find at least one aircraft flying to Middle East');
assertEqual(stats.byType.transport || 0, 1, 'Should have 1 transport aircraft');

// Test 5: Complete hotspot analysis with news
console.log('\n--- Test 5: Complete Hotspot Analysis ---');

const analysis = analyzeHotspots(testNews, aircraftList);
assertEqual(analysis.activeHotspots.length >= 2, true, 'Should have at least 2 active hotspots from test news');
assertEqual(analysis.highlightedAircraft.length >= 1, true, 'Should highlight at least 1 aircraft');

// ============================================================================
// Summary
// ============================================================================

console.log('\n=== All Hotspot Tracking Tests Passed! ✓ ===\n');
