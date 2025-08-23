const { chromium } = require('playwright');

async function testAddPageHighlighting() {
  console.log('🚀 Testing highlighting on /beneficiaries/add page...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Navigate to login
  console.log('📍 Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.waitForTimeout(2000);
  
  // Login
  await page.fill('input[type="email"]', 'claude.assistant@example.com');
  await page.fill('input[type="password"]', 'DemoPassword123!');
  await page.click('button:has-text("Log In")');
  await page.waitForTimeout(3000);
  
  // Navigate to /beneficiaries/add
  console.log('📍 Navigating to /beneficiaries/add...');
  await page.goto('http://localhost:3000/beneficiaries/add');
  await page.waitForTimeout(3000);
  
  console.log('📍 Current URL:', page.url());
  
  // Apply highlighting
  console.log('🎨 Applying highlighting to /beneficiaries/add page...');
  
  const highlightScript = `
    (function() {
      console.log('🎨 ADD PAGE HIGHLIGHTING TEST');
      
      // Enable visual dev mode
      localStorage.setItem('visualDevMode', 'true');
      localStorage.setItem('highlightingEnabled', 'true');
      
      // Find all components
      const components = document.querySelectorAll('[data-component-id]');
      console.log('Found ' + components.length + ' components on ADD page');
      
      // List component IDs
      const componentList = [];
      components.forEach((comp, i) => {
        const id = comp.getAttribute('data-component-id');
        const category = comp.getAttribute('data-component-category') || 'ui';
        componentList.push({id, category});
        
        // Apply highlighting
        comp.style.outline = '4px solid #f59e0b';
        comp.style.outlineOffset = '2px';
        comp.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
        comp.style.boxShadow = '0 0 0 6px rgba(245, 158, 11, 0.3), 0 0 25px rgba(245, 158, 11, 0.2)';
        comp.style.position = 'relative';
        comp.style.zIndex = '1000';
        comp.style.borderRadius = '8px';
      });
      
      // Add banner
      const banner = document.createElement('div');
      banner.style.cssText = \`
        position: fixed;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
        color: white;
        padding: 20px 40px;
        border-radius: 12px;
        font-size: 20px;
        font-weight: bold;
        z-index: 100000;
        box-shadow: 0 15px 50px rgba(0,0,0,0.3);
      \`;
      banner.innerHTML = '🔥 ADD PAGE: ' + components.length + ' components highlighted!';
      document.body.appendChild(banner);
      
      console.log('Components found:', componentList);
      return components.length;
    })();
  `;
  
  const count = await page.evaluate(highlightScript);
  console.log(`✅ Highlighted ${count} components on /beneficiaries/add`);
  
  await page.waitForTimeout(2000);
  
  // Screenshot
  console.log('📸 Taking screenshot...');
  await page.screenshot({ 
    path: './tests/screenshots/add-page-highlighting-proof.png',
    fullPage: true 
  });
  
  console.log('✅ Screenshot saved!');
  console.log('👀 Keeping open for inspection...');
  await page.waitForTimeout(10000);
  
  await browser.close();
  console.log('🎯 Test complete!');
}

testAddPageHighlighting().catch(console.error);