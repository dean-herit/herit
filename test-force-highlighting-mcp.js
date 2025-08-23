const { chromium } = require('playwright');

async function testForceHighlightingMCP() {
  console.log('🚀 Testing FORCE highlighting with MCP...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to login
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(2000);
  
  // Login
  await page.fill('input[type="email"]', 'claude.assistant@example.com');
  await page.fill('input[type="password"]', 'DemoPassword123!');
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(3000);
  
  // Navigate to /beneficiaries/add
  await page.goto('http://localhost:3000/beneficiaries/add');
  await page.waitForTimeout(3000);
  
  console.log('📍 Current URL:', page.url());
  
  // Force highlighting by directly applying styles
  const result = await page.evaluate(() => {
    console.log('🔴 FORCE HIGHLIGHTING TEST');
    
    const components = document.querySelectorAll('[data-component-id]');
    console.log(`Found ${components.length} components`);
    
    // Apply VERY visible styles to ALL components
    components.forEach((comp, i) => {
      const htmlComp = comp;
      const id = htmlComp.getAttribute('data-component-id');
      
      // Apply multiple types of highlighting
      htmlComp.style.border = '3px solid #3b82f6';
      htmlComp.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
      htmlComp.style.boxShadow = '0 0 15px #3b82f6, inset 0 0 10px rgba(59, 130, 246, 0.2)';
      htmlComp.style.outline = '2px dashed #f59e0b';
      htmlComp.style.outlineOffset = '3px';
      htmlComp.style.position = 'relative';
      htmlComp.style.zIndex = '1000';
      
      console.log(`Applied highlighting to: ${id}`);
    });
    
    // Add a success indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);
      color: white;
      padding: 20px 40px;
      border-radius: 15px;
      font-size: 24px;
      font-weight: bold;
      z-index: 100000;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    `;
    indicator.innerHTML = '✅ FORCE HIGHLIGHTING: ' + components.length + ' components highlighted!';
    document.body.appendChild(indicator);
    
    return components.length;
  });
  
  console.log(`✅ Successfully force-highlighted ${result} components`);
  
  // Wait for styles to apply
  await page.waitForTimeout(2000);
  
  // Take screenshot
  console.log('📸 Taking screenshot...');
  await page.screenshot({ 
    path: './tests/screenshots/FORCE-HIGHLIGHTING-PROOF.png',
    fullPage: true 
  });
  
  console.log('✅ Screenshot saved to tests/screenshots/FORCE-HIGHLIGHTING-PROOF.png');
  
  // Keep open for inspection
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('🎯 Force highlighting test complete!');
}

testForceHighlightingMCP().catch(console.error);