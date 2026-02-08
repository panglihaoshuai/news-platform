const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Opening http://localhost:3000/en...');
  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });
  
  // Wait for the page to fully load
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'bloomberg-terminal-screenshot.png', fullPage: true });
  console.log('Screenshot saved to bloomberg-terminal-screenshot.png');
  
  // Check page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check if main components exist
  const hasTerminalLayout = await page.$('[class*="terminal"]') !== null || await page.$('[class*="layout"]') !== null;
  console.log('Has terminal layout:', hasTerminalLayout);
  
  await browser.close();
  console.log('Test completed!');
})();
