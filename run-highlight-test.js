const { chromium } = require('playwright');
const fs = require('fs');

async function runHighlightTest() {
  console.log('🚀 Starting Playwright highlighting test...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to beneficiaries page
  console.log('📍 Navigating to beneficiaries page...');
  await page.goto('http://localhost:3000/beneficiaries');
  await page.waitForTimeout(2000);
  
  // Read the test script
  const testScript = fs.readFileSync('./test-highlighting.js', 'utf8');
  
  // Inject and execute the highlighting script
  console.log('💉 Injecting highlighting script...');
  await page.evaluate(testScript);
  
  // Wait for highlighting to apply
  await page.waitForTimeout(2000);
  
  // Take screenshot
  console.log('📸 Taking screenshot...');
  await page.screenshot({ 
    path: './tests/screenshots/forced-highlighting-proof.png',
    fullPage: true 
  });
  
  console.log('✅ Screenshot saved to tests/screenshots/forced-highlighting-proof.png');
  
  // Keep browser open for observation
  console.log('👀 Keeping browser open for 5 seconds...');
  await page.waitForTimeout(5000);
  
  await browser.close();
  console.log('🎯 Test complete!');
}

runHighlightTest().catch(console.error);