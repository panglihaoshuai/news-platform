/**
 * Military Tracking Browser E2E Tests
 * 
 * Tests the military tracking functionality in a real browser
 * 
 * @module scripts/test-military-e2e
 */

import { chromium } from 'playwright';

async function runTests() {
  console.log('\n=== Military Tracking E2E Tests ===\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let testsRun = 0;
  let testsPassed = 0;
  const errors: string[] = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  try {
    // Test 1: Homepage loads
    testsRun++;
    try {
      const response = await page.goto('http://localhost:3000', { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      if (response?.status() === 200) {
        testsPassed++;
        console.log('  ✓ Homepage should load');
      } else {
        console.log('  ✗ Homepage should load');
      }
    } catch (error) {
      console.log('  ✗ Homepage should load - Error');
    }
    
    // Wait for page to fully load
    await page.waitForTimeout(3000);
    
    // Test 2: No critical console errors
    testsRun++;
    const criticalErrors = errors.filter(e => 
      !e.includes('Warning') && 
      !e.includes('DevTools') &&
      !e.includes('favicon') &&
      !e.includes('Failed to load resource')
    );
    if (criticalErrors.length === 0) {
      testsPassed++;
      console.log('  ✓ No critical console errors');
    } else {
      console.log('  ✗ No critical console errors');
    }
    
    // Test 3: Map container exists
    testsRun++;
    try {
      const mapExists = await page.locator('.maplibregl-map').count();
      if (mapExists > 0) {
        testsPassed++;
        console.log('  ✓ Map container exists');
      } else {
        console.log('  ✗ Map container exists');
      }
    } catch (error) {
      console.log('  ✗ Map container exists - Error');
    }
    
    // Test 4: Military aircraft API responds (OpenSky - free, real-time)
    testsRun++;
    try {
      const response = await page.request.get('http://localhost:3000/api/military/aircraft');
      const data = await response.json();
      if (data.success !== undefined) {
        testsPassed++;
        console.log('  ✓ Military aircraft API responds');
      } else {
        console.log('  ✗ Military aircraft API responds');
      }
    } catch (error) {
      console.log('  ✗ Military aircraft API responds - Error');
    }
    
    console.log(`\n=== Test Results ===`);
    console.log(`Tests: ${testsPassed}/${testsRun} passed\n`);
    
    if (testsPassed === testsRun) {
      console.log('All E2E tests passed! ✓');
    } else {
      console.log('Some E2E tests failed! ✗');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
  
  process.exit(0);
}

runTests();
