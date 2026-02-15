/**
 * AISHub Client Tests
 * 
 * Test cases for US military vessel filter functions used with AIS data
 * 
 * @module scripts/test-aishub-client
 */

import { 
  isUSMilitaryVessel, 
  isUSFlag,
  isUSMilitaryVesselObject 
} from '../src/lib/military/military-filter';
import type { MilitaryVessel } from '../src/lib/military/types';

// ============================================================================
// Test Suite
// ============================================================================

console.log('\n=== AISHub Client Filter Tests ===\n');

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
// Test Cases - MMSI Detection
// ============================================================================

console.log('--- MMSI Prefix Tests ---\n');

// Test 1: US Navy MMSI (369 prefix)
test('US Navy vessel with 369 MMSI should be detected', () => {
  return assertTrue(isUSMilitaryVessel('369123456'), '369 prefix should be US Navy');
});

// Test 2: US Navy auxiliary MMSI (367 prefix)
test('US Navy auxiliary with 367 MMSI should be detected', () => {
  return assertTrue(isUSMilitaryVessel('367123456'), '367 prefix should be US Navy auxiliary');
});

// Test 3: US Coast Guard MMSI (316 prefix)
test('US Coast Guard with 316 MMSI should be detected', () => {
  return assertTrue(isUSMilitaryVessel('316123456'), '316 prefix should be US Coast Guard');
});

// Test 4: Invalid MMSI (starts with 0)
test('MMSI starting with 0 should be invalid', () => {
  return assertFalse(isUSMilitaryVessel('012345678'), 'MMSI cannot start with 0');
});

// Test 5: Short MMSI should be invalid
test('Short MMSI should return false', () => {
  return assertFalse(isUSMilitaryVessel('12345'), 'MMSI must be 9 digits');
});

// Test 6: Null MMSI should return false
test('Null MMSI should return false', () => {
  return assertFalse(isUSMilitaryVessel(null), 'Null MMSI should return false');
});

// Test 7: UK vessel should not be US
test('UK vessel 235 MMSI should not be detected as US', () => {
  return assertFalse(isUSMilitaryVessel('235123456'), '235 is UK');
});

// Test 8: Germany vessel should not be US
test('Germany vessel 211 MMSI should not be detected as US', () => {
  return assertFalse(isUSMilitaryVessel('211123456'), '211 is Germany');
});

// ============================================================================
// Test Cases - US Flag Detection
// ============================================================================

console.log('\n--- US Flag Detection Tests ---\n');

// Test 9: Full country name detection
test('United States should be detected as US flag', () => {
  return assertTrue(isUSFlag('United States'), 'Full name should match');
});

// Test 10: USA abbreviation detection
test('USA should be detected as US flag', () => {
  return assertTrue(isUSFlag('USA'), 'USA should match');
});

// Test 11: Null country should return false
test('Null country should return false', () => {
  return assertFalse(isUSFlag(null), 'Null country should return false');
});

// ============================================================================
// Test Cases - Vessel Name Detection
// ============================================================================

console.log('\n--- Vessel Name Tests ---\n');

// Test 12: USS prefix detection
test('Vessel with USS prefix should be detected', () => {
  return assertTrue(
    isUSMilitaryVesselObject({ id: '123456789', name: 'USS Nimitz', flag: 'Germany' }),
    'USS should indicate US vessel'
  );
});

// Test 13: USNS prefix detection
test('Vessel with USNS prefix should be detected', () => {
  return assertTrue(
    isUSMilitaryVesselObject({ id: '123456789', name: 'USNS Mercy', flag: 'Germany' }),
    'USNS should indicate US vessel'
  );
});

// ============================================================================
// Test Cases - Combined Object Detection
// ============================================================================

console.log('\n--- Combined Object Detection Tests ---\n');

// Test 14: Combined detection via MMSI
test('Vessel object with US military MMSI should be detected', () => {
  const vessel: Pick<MilitaryVessel, 'id' | 'name' | 'flag'> = {
    id: '369123456',
    name: 'USS Test',
    flag: 'Germany', // Non-US, but MMSI should catch it
  };
  return assertTrue(isUSMilitaryVesselObject(vessel), 'Should detect via MMSI');
});

// Test 15: Combined detection via flag
test('Vessel object with US flag should be detected', () => {
  const vessel: Pick<MilitaryVessel, 'id' | 'name' | 'flag'> = {
    id: '211123456', // German MMSI
    name: 'German Ship',
    flag: 'United States',
  };
  return assertTrue(isUSMilitaryVesselObject(vessel), 'Should detect via flag');
});

// Test 16: Combined detection via vessel name
test('Vessel object with USS prefix should be detected', () => {
  const vessel: Pick<MilitaryVessel, 'id' | 'name' | 'flag'> = {
    id: '211123456', // German MMSI
    name: 'USS Enterprise',
    flag: 'Germany',
  };
  return assertTrue(isUSMilitaryVesselObject(vessel), 'Should detect via name');
});

// Test 17: Non-military vessel should not be detected
test('Non-military vessel should not be detected', () => {
  const vessel: Pick<MilitaryVessel, 'id' | 'name' | 'flag'> = {
    id: '211123456', // German MMSI
    name: 'Cargo Ship',
    flag: 'Germany',
  };
  return assertFalse(isUSMilitaryVesselObject(vessel), 'Should not detect as military');
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
