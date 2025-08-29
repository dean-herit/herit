import { chromium } from 'playwright';

async function testRulesClick() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Testing Rules system click functionality...');
    
    // Login first
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'claude.assistant@example.com');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Navigate to Rules page
    console.log('📋 Navigating to Rules page...');
    await page.goto('http://localhost:3000/rules');
    await page.waitForTimeout(2000);
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({ path: 'tests/screenshots/rules-direct-test.png' });
    
    // Check if Create Rule button exists
    const createButton = page.locator('[data-component-id="create-rule-button"]');
    const isVisible = await createButton.isVisible();
    console.log('Create Rule button visible:', isVisible);
    
    if (isVisible) {
      console.log('🖱️ Clicking Create Rule button...');
      await createButton.click();
      console.log('✅ Click successful!');
      
      await page.waitForTimeout(2000);
      
      // Check if modal opened
      const modal = page.locator('[data-component-id="create-rule-modal"]');
      const modalVisible = await modal.isVisible();
      console.log('Create Rule modal visible:', modalVisible);
      
      await page.screenshot({ path: 'tests/screenshots/rules-modal-opened.png' });
      
      if (modalVisible) {
        console.log('🎉 SUCCESS: Create Rule modal opened!');
        
        // Try filling the form
        console.log('✏️ Filling rule name...');
        await page.fill('input[name="name"]', 'Test Rule from MCP');
        
        await page.screenshot({ path: 'tests/screenshots/rules-form-filled.png' });
        console.log('📝 Form filled successfully!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'tests/screenshots/rules-error.png' });
  } finally {
    console.log('🔄 Keeping browser open for 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
    console.log('✨ Test completed!');
  }
}

testRulesClick();
