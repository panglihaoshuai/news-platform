import { strict as assert } from 'node:assert';
import { classifyAircraftType, getAircraftTypeColor } from '../src/lib/military/aircraft-classifier';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    throw error;
  }
}

console.log('\n=== Aircraft Classifier Tests ===\n');

test('classifies bomber from callsign', () => {
  const res = classifyAircraftType({ callsign: 'B52A12', velocity: 220, altitude: 9000 });
  assert.equal(res.type, 'bomber');
});

test('classifies transport from callsign', () => {
  const res = classifyAircraftType({ callsign: 'RCH1234', velocity: 180, altitude: 9000 });
  assert.equal(res.type, 'transport');
});

test('classifies fighter from callsign', () => {
  const res = classifyAircraftType({ callsign: 'VFA41', velocity: 290, altitude: 7000 });
  assert.equal(res.type, 'fighter');
});

test('classifies helicopter from low speed and altitude', () => {
  const res = classifyAircraftType({ callsign: 'UNKNOWN', velocity: 45, altitude: 500 });
  assert.equal(res.type, 'helicopter');
});

test('returns unknown when no clear signal', () => {
  const res = classifyAircraftType({ callsign: 'AB123', velocity: 110, altitude: 2500 });
  assert.equal(res.type, 'unknown');
});

test('returns configured colors', () => {
  assert.equal(getAircraftTypeColor('bomber'), '#ff3b30');
  assert.equal(getAircraftTypeColor('transport'), '#0a84ff');
  assert.equal(getAircraftTypeColor('fighter'), '#ffb000');
  assert.equal(getAircraftTypeColor('helicopter'), '#30d158');
});

console.log('\nAll aircraft classifier tests passed! ✓');
