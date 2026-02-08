const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('=== Bloomberg Terminal Test ===\n');
  
  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Check page title
  const title = await page.title();
  console.log('1. Page title:', title);
  
  // Check for terminal layout structure
  const bodyContent = await page.content();
  console.log('\n2. Page loaded successfully');
  console.log('   HTML length:', bodyContent.length, 'characters');
  
  // Check if React components rendered
  const hasReactRoot = await page.$('#__next') !== null;
  console.log('   Has React root:', hasReactRoot);
  
  // Check for main terminal components by looking for specific content
  const pageText = await page.textContent('body');
  
  // Check for key UI elements
  console.log('\n3. UI Components Check:');
  console.log('   - Global Intel Map:', pageText.includes('Global Intel') || pageText.includes('Intel'));
  console.log('   - News/Events:', pageText.includes('EVENTS') || pageText.includes('events'));
  console.log('   - Online status:', pageText.includes('ONLINE') || pageText.includes('OFFLINE'));
  console.log('   - Market data:', pageText.includes('MARKET') || pageText.includes('Market'));
  console.log('   - Theme switcher:', pageText.includes('dark') || pageText.includes('Dark'));
  
  // Check console for errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Navigate to trigger any console errors
  await page.waitForTimeout(2000);
  
  console.log('\n4. Console Errors:', errors.length === 0 ? 'None' : errors.join('\n   '));
  
  // Take another screenshot
  await page.screenshot({ path: 'bloomberg-terminal-detail.png', fullPage: true });
  console.log('\n5. Detailed screenshot saved to bloomberg-terminal-detail.png');
  
  await browser.close();
  console.log('\n=== Test Complete ===');
})();
