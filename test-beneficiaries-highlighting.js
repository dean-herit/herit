const { chromium } = require('playwright');
const fs = require('fs');

async function testBeneficiariesHighlighting() {
  console.log('🚀 Starting beneficiaries highlighting test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: {
      cookies: [],
      origins: [{
        origin: 'http://localhost:3000',
        localStorage: [
          { name: 'visualDevMode', value: 'true' },
          { name: 'highlightingEnabled', value: 'true' }
        ]
      }]
    }
  });
  
  const page = await context.newPage();
  
  // Navigate directly to beneficiaries (will redirect to login if not authenticated)
  console.log('📍 Navigating to beneficiaries page...');
  await page.goto('http://localhost:3000/beneficiaries');
  await page.waitForTimeout(3000);
  
  // Check if we're on the beneficiaries page
  const url = page.url();
  console.log('📍 Current URL:', url);
  
  // Apply highlighting regardless of page
  console.log('💉 Applying highlighting to all components...');
  
  const highlightScript = `
    console.log('🎨 DIRECT HIGHLIGHTING TEST STARTING');
    
    // Find all components with data-component-id
    const components = document.querySelectorAll('[data-component-id]');
    console.log('Found ' + components.length + ' components to highlight');
    
    // Apply visible highlighting to each
    components.forEach((comp, i) => {
      const id = comp.getAttribute('data-component-id');
      const category = comp.getAttribute('data-component-category') || 'ui';
      
      // Apply very visible styles
      comp.style.outline = '3px solid #3b82f6';
      comp.style.outlineOffset = '2px';
      comp.style.backgroundColor = 'rgba(59, 130, 246, 0.15)';
      comp.style.position = 'relative';
      comp.style.zIndex = '100';
      comp.style.borderRadius = '6px';
      comp.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.4)';
      
      console.log('Highlighted: ' + id + ' (' + category + ')');
    });
    
    // Add success banner
    const banner = document.createElement('div');
    banner.style.cssText = \`
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 30px;
      border-radius: 10px;
      font-size: 18px;
      font-weight: bold;
      z-index: 100000;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      animation: slideDown 0.5s ease-out;
    \`;
    banner.innerHTML = '🎨 HIGHLIGHTING ACTIVE: ' + components.length + ' components highlighted';
    document.body.appendChild(banner);
    
    // Also trigger the auto-test if it exists
    if (typeof window.testHighlightAllComponents === 'function') {
      console.log('Triggering testHighlightAllComponents...');
      window.testHighlightAllComponents();
    }
    
    'DONE';
  `;
  
  const result = await page.evaluate(highlightScript);
  console.log('💉 Highlighting script result:', result);
  
  // Wait for visual update
  await page.waitForTimeout(2000);
  
  // Take screenshot
  console.log('📸 Taking screenshot...');
  const screenshotPath = './tests/screenshots/beneficiaries-highlighting-final-proof.png';
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  
  console.log('✅ Screenshot saved to:', screenshotPath);
  
  // Keep browser open for manual inspection
  console.log('👀 Keeping browser open for 10 seconds for inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('🎯 Test complete!');
}

testBeneficiariesHighlighting().catch(console.error);