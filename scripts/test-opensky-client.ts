/**
 * OpenSky Client Tests
 * 
 * Test cases for US military aircraft filter functions used with OpenSky data
 * 
 * @module scripts/test-opensky-client
 */

import { 
  isUSMilitaryAircraft, 
  isUSMilitaryCallsign, 
  isUSFlag,
  isUSMilitaryAircraftObject 
} from '../src/lib/military/military-filter';
import type { MilitaryAircraft } from '../src/lib/military/types';

// ============================================================================
// Test Suite
// ============================================================================

console.log('\n=== OpenSky Client Filter Tests ===\n');

let testsRun = 0;
let testsPassed = 0;

function test(name: string, fn: () => boolean): void {
  testsRun++;
  try {
    const result = fn();
    if (result) {
      testsPassed++;
      console.log(`  ✓ ${name}`);
    } else {
      console.log(`  ✗ ${name}`);
    }
  } catch (error) {
    console.log(`  ✗ ${name} - Error: ${error}`);
  }
}

function assertTrue(value: boolean, message: string): boolean {
  if (value) return true;
  console.log(`    Expected: true, Actual: false - ${message}`);
  return false;
}

function assertFalse(value: boolean, message: string): boolean {
  if (!value) return true;
  console.log(`    Expected: false, Actual: true - ${message}`);
  return false;
}

// ============================================================================
// Test Cases - ICAO Hex Prefix Detection
// ============================================================================

console.log('--- ICAO Hex Prefix Tests ---\n');

// Test 1: US Air Force aircraft detection (AF prefix)
test('US Air Force aircraft with AF prefix should be detected', () => {
  return assertTrue(isUSMilitaryAircraft('AF1234'), 'AF prefix should be US Air Force');
});

// Test 2: US Army aircraft detection (AD prefix)
test('US Army aircraft with AD prefix should be detected', () => {
  return assertTrue(isUSMilitaryAircraft('AD1234'), 'AD prefix should be US Army');
});

// Test 3: US Navy aircraft detection (AE prefix)
test('US Navy aircraft with AE prefix should be detected', () => {
  return assertTrue(isUSMilitaryAircraft('AE5678'), 'AE prefix should be US Navy/DoD');
});

// Test 4: US Coast Guard detection (A0 prefix)
test('US Coast Guard aircraft with A0 prefix should be detected', () => {
  return assertTrue(isUSMilitaryAircraft('A0FFFF'), 'A0 prefix should be US Coast Guard');
});

// Test 5: Civilian aircraft should not be detected
test('Civilian aircraft should not be detected as military', () => {
  return assertFalse(isUSMilitaryAircraft('ABCDEF'), 'Non-military prefix should return false');
});

// Test 6: Null ICAO should return false
test('Null ICAO should return false', () => {
  return assertFalse(isUSMilitaryAircraft(null), 'Null ICAO should return false');
});

// Test 7: Empty ICAO should return false
test('Empty ICAO should return false', () => {
  return assertFalse(isUSMilitaryAircraft(''), 'Empty ICAO should return false');
});

// Test 8: Short ICAO should return false
test('Short ICAO should return false', () => {
  return assertFalse(isUSMilitaryAircraft('AE'), 'Short ICAO should return false');
});

// ============================================================================
// Test Cases - Callsign Pattern Detection
// ============================================================================

console.log('\n--- Callsign Pattern Tests ---\n');

// Test 9: US Air Force RCH callsign
test('US Air Force RCH callsign should be detected', () => {
  return assertTrue(isUSMilitaryCallsign('RCH1234'), 'RCH prefix should be US Air Force transport');
});

// Test 10: US Air Force REACH callsign
test('US Air Force REACH callsign should be detected', () => {
  return assertTrue(isUSMilitaryCallsign('REACH1'), 'REACH prefix should be US Air Force');
});

// Test 11: US Navy VFA callsign
test('US Navy VFA callsign should be detected', () => {
  return assertTrue(isUSMilitaryCallsign('VFA41'), 'VFA should be US Navy fighter');
});

// Test 12: US Coast Guard callsign
test('US Coast Guard GODHD callsign should be detected', () => {
  return assertTrue(isUSMilitaryCallsign('GODHD123'), 'GODHD should be US Coast Guard');
});

// Test 13: Civilian callsign should not be detected
test('Civilian BA callsign should not be detected', () => {
  return assertFalse(isUSMilitaryCallsign('BA249'), 'BA is British Airways');
});

// Test 14: Null callsign should return false
test('Null callsign should return false', () => {
  return assertFalse(isUSMilitaryCallsign(null), 'Null callsign should return false');
});

// ============================================================================
// Test Cases - US Flag Detection
// ============================================================================

console.log('\n--- US Flag Detection Tests ---\n');

// Test 15: Full country name detection
test('United States should be detected as US flag', () => {
  return assertTrue(isUSFlag('United States'), 'Full name should match');
});

// Test 16: USA abbreviation detection
test('USA abbreviation should be detected as US flag', () => {
  return assertTrue(isUSFlag('USA'), 'USA should match');
});

// Test 17: US abbreviation detection
test('US abbreviation should be detected as US flag', () => {
  return assertTrue(isUSFlag('US'), 'US should match');
});

// Test 18: Case insensitive detection
test('Case insensitive detection should work', () => {
  return assertTrue(isUSFlag('UNITED STATES'), 'Uppercase should match');
});

// Test 19: Other countries should not match
test('Germany should not be detected as US flag', () => {
  return assertFalse(isUSFlag('Germany'), 'Germany should not match');
});

// Test 20: Null country should return false
test('Null country should return false', () => {
  return assertFalse(isUSFlag(null), 'Null country should return false');
});

// ============================================================================
// Test Cases - Combined Aircraft Object Detection
// ============================================================================

console.log('\n--- Combined Object Detection Tests ---\n');

// Test 21: Combined detection via ICAO
test('Aircraft object with US military ICAO should be detected', () => {
  const aircraft: Pick<MilitaryAircraft, 'id' | 'callsign' | 'originCountry'> = {
    id: 'AE1234',
    callsign: 'RCH123',
    originCountry: 'Germany', // Non-US, but ICAO should catch it
  };
  return assertTrue(isUSMilitaryAircraftObject(aircraft), 'Should detect via ICAO');
});

// Test 22: Combined detection via callsign
test('Aircraft object with US military callsign should be detected', () => {
  const aircraft: Pick<MilitaryAircraft, 'id' | 'callsign' | 'originCountry'> = {
    id: 'ABCDEF', // Civilian
    callsign: 'RCH123',
    originCountry: 'Germany',
  };
  return assertTrue(isUSMilitaryAircraftObject(aircraft), 'Should detect via callsign');
});

// Test 23: Combined detection via origin country
test('Aircraft object with US origin country should be detected', () => {
  const aircraft: Pick<MilitaryAircraft, 'id' | 'callsign' | 'originCountry'> = {
    id: 'ABCDEF', // Civilian
    callsign: null,
    originCountry: 'United States',
  };
  return assertTrue(isUSMilitaryAircraftObject(aircraft), 'Should detect via origin country');
});

// ============================================================================
// Summary
// ============================================================================

console.log(`\n=== Test Results ===`);
console.log(`Tests: ${testsPassed}/${testsRun} passed\n`);

if (testsPassed === testsRun) {
  console.log('All tests passed! ✓');
  process.exit(0);
} else {
  console.log('Some tests failed! ✗');
  process.exit(1);
}
