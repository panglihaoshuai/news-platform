import { strict as assert } from 'node:assert';
import { calculateBaseActivity, countAircraftNearBase } from '../src/lib/military/density-calculator';
import type { MilitaryAircraft, USBase } from '../src/lib/military/types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    throw error;
  }
}

const base: USBase = {
  id: 'test-base',
  name: 'Test Base',
  nameCn: '测试基地',
  location: { lat: 35, lng: 140 },
  region: 'pacific',
  country: 'Japan',
  type: ['air'],
  branch: ['airforce'],
  status: 'active',
};

const nearAircraft = (id: string): MilitaryAircraft => ({
  id,
  callsign: 'RCH1',
  originCountry: 'United States',
  longitude: 140.2,
  latitude: 35.1,
  altitude: 8000,
  velocity: 200,
  heading: 90,
  timestamp: Date.now() / 1000,
  isMilitary: true,
});

const farAircraft = (id: string): MilitaryAircraft => ({
  ...nearAircraft(id),
  latitude: 10,
  longitude: 10,
});

console.log('\n=== Density Calculator Tests ===\n');

test('counts only nearby aircraft', () => {
  const count = countAircraftNearBase([nearAircraft('a1'), farAircraft('a2')], base, 120);
  assert.equal(count, 1);
});

test('detects surge with high ratio and min count', () => {
  const aircraft = [nearAircraft('a1'), nearAircraft('a2'), nearAircraft('a3'), nearAircraft('a4'), nearAircraft('a5')];
  const { activity } = calculateBaseActivity(aircraft, [base], { 'test-base': 2 });
  assert.equal(activity[0].isSurge, true);
});

test('does not detect surge on low count', () => {
  const aircraft = [nearAircraft('a1'), nearAircraft('a2')];
  const { activity } = calculateBaseActivity(aircraft, [base], { 'test-base': 1 });
  assert.equal(activity[0].isSurge, false);
});

console.log('\nAll density calculator tests passed! ✓');
