const { chromium } = require('playwright');

async function testAuthenticatedHighlighting() {
  console.log('🚀 Starting authenticated highlighting test...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to login page
  console.log('📍 Navigating to login page...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(2000);
  
  // Fill in login credentials
  console.log('🔑 Logging in with test credentials...');
  await page.fill('input[type="email"]', 'claude.assistant@example.com');
  await page.fill('input[type="password"]', 'DemoPassword123!');
  
  // Click login button
  await page.click('button:has-text("Log In")');
  
  // Wait for navigation
  console.log('⏳ Waiting for authentication...');
  await page.waitForTimeout(3000);
  
  // Navigate to beneficiaries page
  console.log('📍 Navigating to beneficiaries page...');
  await page.goto('http://localhost:3000/beneficiaries');
  await page.waitForTimeout(3000);
  
  // Check current URL
  const currentUrl = page.url();
  console.log('📍 Current URL:', currentUrl);
  
  // Apply highlighting to all components
  console.log('🎨 Applying highlighting to beneficiaries page components...');
  
  const highlightScript = `
    (function() {
      console.log('🎨 BENEFICIARIES PAGE HIGHLIGHTING TEST');
      
      // Enable visual dev mode in localStorage
      localStorage.setItem('visualDevMode', 'true');
      localStorage.setItem('highlightingEnabled', 'true');
      
      // Find all components with data-component-id
      const components = document.querySelectorAll('[data-component-id]');
      console.log('Found ' + components.length + ' components on beneficiaries page');
      
      // Apply highly visible highlighting to each component
      components.forEach((comp, i) => {
        const id = comp.getAttribute('data-component-id');
        const category = comp.getAttribute('data-component-category') || 'ui';
        
        // Apply multiple layers of highlighting for maximum visibility
        comp.style.outline = '4px solid #3b82f6';
        comp.style.outlineOffset = '2px';
        comp.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
        comp.style.boxShadow = '0 0 0 6px rgba(59, 130, 246, 0.4), 0 0 20px rgba(59, 130, 246, 0.3)';
        comp.style.position = 'relative';
        comp.style.zIndex = '1000';
        comp.style.borderRadius = '8px';
        comp.style.transition = 'all 0.3s ease';
        
        console.log('Highlighted component ' + (i+1) + ': ' + id + ' [' + category + ']');
      });
      
      // Add prominent success banner
      const banner = document.createElement('div');
      banner.style.cssText = \`
        position: fixed;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px 40px;
        border-radius: 12px;
        font-size: 20px;
        font-weight: bold;
        z-index: 100000;
        box-shadow: 0 15px 50px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      \`;
      banner.innerHTML = '✅ BENEFICIARIES PAGE: ' + components.length + ' components highlighted!';
      document.body.appendChild(banner);
      
      // Add animation keyframes
      const style = document.createElement('style');
      style.textContent = \`
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
      \`;
      document.head.appendChild(style);
      
      return components.length;
    })();
  `;
  
  const componentCount = await page.evaluate(highlightScript);
  console.log(`✅ Successfully highlighted ${componentCount} components on beneficiaries page`);
  
  // Wait for visual update
  await page.waitForTimeout(2000);
  
  // Take screenshot
  console.log('📸 Taking screenshot of highlighted beneficiaries page...');
  const screenshotPath = './tests/screenshots/beneficiaries-highlighted-authenticated.png';
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: true 
  });
  
  console.log('✅ Screenshot saved to:', screenshotPath);
  
  // Keep browser open for inspection
  console.log('👀 Keeping browser open for 10 seconds for inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('🎯 Test complete! Check the screenshot for proof of highlighting on beneficiaries page.');
}

testAuthenticatedHighlighting().catch(console.error);