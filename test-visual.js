const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('=== Bloomberg Terminal Visual Verification ===\n');
  
  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });
  
  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Get page structure
  const html = await page.content();
  
  // Check for key elements in the DOM
  console.log('Page Structure:');
  console.log('  - Total HTML length:', html.length, 'chars');
  console.log('  - Has Next.js data:', html.includes('__NEXT_DATA__'));
  
  // Check for data attributes and classes
  console.log('\nTerminal Components:');
  console.log('  - Has ticker bar:', html.includes('ticker') || html.includes('Ticker'));
  console.log('  - Has status bar:', html.includes('status') || html.includes('Status'));
  console.log('  - Has market panel:', html.includes('market') || html.includes('Market'));
  console.log('  - Has news feed:', html.includes('news') || html.includes('News'));
  
  // Check text content
  const text = await page.textContent('body');
  console.log('\nContent Detection:');
  console.log('  - Has EVENTS count:', text.includes('EVENTS:'));
  console.log('  - Has ONLINE/OFFLINE:', text.includes('ONLINE') || text.includes('OFFLINE'));
  console.log('  - Has MARKET DATA:', text.includes('MARKET DATA'));
  console.log('  - Has time display:', text.includes('UTC') || text.includes('CST'));
  console.log('  - Has theme buttons:', text.includes('dark') && (text.includes('amber') || text.includes('light')));
  
  // Check for animation/scrolling elements
  console.log('\nAnimation Elements:');
  console.log('  - Has pulse animation:', text.includes('pulse') || html.includes('pulse'));
  console.log('  - Has scroll indicators:', text.includes('scroll') || html.includes('scroll'));
  
  console.log('\nConsole Output:');
  consoleMessages.forEach(msg => {
    console.log(' ', msg);
  });
  
  // Final status
  const errorCount = consoleMessages.filter(m => m.includes('[error]')).length;
  console.log('\n=== Result ===');
  console.log('Errors:', errorCount === 0 ? 'None ✓' : errorCount + ' errors found');
  console.log('Status:', errorCount === 0 ? 'PASS ✓' : 'NEEDS FIX');
  
  await browser.close();
})();
