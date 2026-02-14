/**
 * Military Filter Tests
 * TDD RED - Tests for US military aircraft and vessel identification
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isUSMilitaryAircraft,
  isUSMilitaryCallsign,
  isUSMilitaryVessel,
  isUSFlag,
} from '../src/lib/military/military-filter';

test('isUSMilitaryAircraft should identify US military ICAO hex codes', () => {
  // US Department of Defense ICAO prefixes
  assert.equal(isUSMilitaryAircraft('AE12345'), true, 'AE prefix should be US military');
  assert.equal(isUSMilitaryAircraft('AEABCD'), true, 'AE prefix should be US military');
  assert.equal(isUSMilitaryAircraft('AE0000'), true, 'AE0000 should be US military');
  
  // US Coast Guard
  assert.equal(isUSMilitaryAircraft('A00001'), true, 'A0 prefix should be US Coast Guard');
  
  // US Army
  assert.equal(isUSMilitaryAircraft('AD1234'), true, 'AD prefix should be US Army');
});

test('isUSMilitaryAircraft should reject non-US military aircraft', () => {
  // UK military
  assert.equal(isUSMilitaryAircraft('405001'), false, 'UK military should not be US');
  
  // Germany military
  assert.equal(isUSMilitaryAircraft('3A2CF1'), false, 'Germany military should not be US');
  
  // France military
  assert.equal(isUSMilitaryAircraft('380001'), false, 'France military should not be US');
  
  // Russia military
  assert.equal(isUSMilitaryAircraft('150001'), false, 'Russia military should not be US');
  
  // China military
  assert.equal(isUSMilitaryAircraft('7800001'), false, 'China military should not be US');
  
  // Unknown/invalid
  assert.equal(isUSMilitaryAircraft(''), false, 'Empty string should be false');
  assert.equal(isUSMilitaryAircraft('ZZZZZZ'), false, 'Invalid hex should be false');
});

test('isUSMilitaryCallsign should identify US military flight patterns', () => {
  // US Air Force transport callsigns
  assert.equal(isUSMilitaryCallsign('RCH123'), true, 'RCH should be US Air Force');
  assert.equal(isUSMilitaryCallsign('RCH001'), true, 'RCH should be US Air Force');
  assert.equal(isUSMilitaryCallsign('REACH123'), true, 'REACH should be US Air Force');
  assert.equal(isUSMilitaryCallsign('REACH001'), true, 'REACH should be US Air Force');
  
  // US Navy callsigns
  assert.equal(isUSMilitaryCallsign('CNV1234'), true, 'CNV should be US Navy');
  assert.equal(isUSMilitaryCallsign('C130'), true, 'C130 should be US');
  
  // US Army callsigns
  assert.equal(isUSMilitaryCallsign('DOV1234'), true, 'DOV should be US Army');
  
  // US Coast Guard
  assert.equal(isUSMilitaryCallsign('GODHD'), true, 'GODHD should be USCG');
});

test('isUSMilitaryCallsign should reject civilian callsigns', () => {
  assert.equal(isUSMilitaryCallsign('BA2491'), false, 'British Airways should not be US');
  assert.equal(isUSMilitaryCallsign('AAL123'), false, 'American Airlines should not be US');
  assert.equal(isUSMilitaryCallsign('DLH456'), false, 'Lufthansa should not be US');
  assert.equal(isUSMilitaryCallsign('CCA981'), false, 'Air China should not be US');
  assert.equal(isUSMilitaryCallsign(null), false, 'Null callsign should be false');
  assert.equal(isUSMilitaryCallsign(''), false, 'Empty callsign should be false');
});

test('isUSMilitaryVessel should identify US Navy MMSI', () => {
  // US Navy MMSI prefixes
  assert.equal(isUSMilitaryVessel('369970000'), true, 'US Navy MMSI should be identified');
  assert.equal(isUSMilitaryVessel('367001234'), true, 'US Navy MMSI should be identified');
  assert.equal(isUSMilitaryVessel('369914000'), true, 'US Navy MMSI should be identified');
  
  // US Coast Guard
  assert.equal(isUSMilitaryVessel('367000060'), true, 'USCG MMSI should be identified');
});

test('isUSMilitaryVessel should reject non-US vessels', () => {
  // UK Royal Navy
  assert.equal(isUSMilitaryVessel('234567890'), false, 'UK Navy should not be US');
  
  // Japan
  assert.equal(isUSMilitaryVessel('431001234'), false, 'Japan should not be US');
  
  // France
  assert.equal(isUSMilitaryVessel('226001234'), false, 'France should not be US');
  
  // Invalid
  assert.equal(isUSMilitaryVessel(''), false, 'Empty MMSI should be false');
  assert.equal(isUSMilitaryVessel('000000000'), false, 'Zero MMSI should be false');
});

test('isUSFlag should identify US flag', () => {
  assert.equal(isUSFlag('United States'), true);
  assert.equal(isUSFlag('United States of America'), true);
  assert.equal(isUSFlag('USA'), true);
  assert.equal(isUSFlag('US'), true);
  assert.equal(isUSFlag('uNiTeD sTaTeS'), true, 'Should be case insensitive');
  
  assert.equal(isUSFlag('United Kingdom'), false);
  assert.equal(isUSFlag('China'), false);
  assert.equal(isUSFlag('Russia'), false);
  assert.equal(isUSFlag(''), false);
});
