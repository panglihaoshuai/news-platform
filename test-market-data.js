const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log('=== Bloomberg Terminal Market Data Test ===\n');

  await page.goto('http://localhost:3000/en', { waitUntil: 'networkidle' });

  // Wait for market data to load (60 second refresh interval)
  console.log('Waiting for market data to load...\n');
  await page.waitForTimeout(5000);

  // Check text content for market data
  const text = await page.textContent('body');

  console.log('Market Data Components:');
  console.log('========================\n');

  // Check for market data categories
  console.log('Indices:');
  console.log('  - S&P 500:', text.includes('S&P 500') || text.includes('SPX') ? '✓ Detected' : '✗ Not found');
  console.log('  - NASDAQ:', text.includes('NASDAQ') || text.includes('IXIC') ? '✓ Detected' : '✗ Not found');
  console.log('  - Dow Jones:', text.includes('Dow Jones') || text.includes('DJI') ? '✓ Detected' : '✗ Not found');

  console.log('\nCommodities:');
  console.log('  - Gold:', text.includes('Gold') ? '✓ Detected' : '✗ Not found');
  console.log('  - Oil:', text.includes('Oil') ? '✓ Detected' : '✗ Not found');

  console.log('\nCrypto:');
  console.log('  - Bitcoin:', text.includes('Bitcoin') || text.includes('BTC') ? '✓ Detected' : '✗ Not found');
  console.log('  - Ethereum:', text.includes('Ethereum') || text.includes('ETH') ? '✓ Detected' : '✗ Not found');

  console.log('\nForex:');
  console.log('  - USD/CNY:', text.includes('USD/CNY') || text.includes('USDCNY') ? '✓ Detected' : '✗ Not found');
  console.log('  - EUR/USD:', text.includes('EUR/USD') || text.includes('EURUSD') ? '✓ Detected' : '✗ Not found');

  // Check for price changes (green/red indicators)
  console.log('\nPrice Indicators:');
  console.log('  - Has price data:', text.includes('$') ? '✓ Detected' : '✗ Not found');
  console.log('  - Has change data:', (text.includes('+') || text.includes('-')) ? '✓ Detected' : '✗ Not found');

  // Check console for market data API messages
  console.log('\nConsole Messages (Market Data):');
  const marketMessages = consoleMessages.filter(m =>
    m.includes('MarketData') ||
    m.includes('API') ||
    m.includes('quote') ||
    m.includes('price')
  );

  if (marketMessages.length > 0) {
    marketMessages.forEach(msg => {
      console.log(' ', msg);
    });
  } else {
    console.log('  No market data messages found');
  }

  // Final status
  const errorMessages = consoleMessages.filter(m => m.includes('[error]') && !m.includes('React DevTools'));
  const warningMessages = consoleMessages.filter(m => m.includes('[warning]') && m.includes('MarketData'));

  console.log('\n=== Test Results ===');
  console.log('Errors:', errorMessages.length === 0 ? 'None ✓' : errorMessages.length);
  console.log('Market API Warnings:', warningMessages.length === 0 ? 'None ✓' : warningMessages.length + ' (check API key)');

  const hasMarketData = text.includes('MARKET DATA') && (
    text.includes('S&P 500') ||
    text.includes('Gold') ||
    text.includes('Bitcoin')
  );

  console.log('\nMarket Data Status:', hasMarketData ? 'WORKING ✓' : 'NEEDS CHECK');

  await browser.close();
})();
