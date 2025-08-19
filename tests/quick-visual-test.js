#!/usr/bin/env node

// Quick Visual Development System Test
// Validates the visual dev mode and component registry integration

const { ComponentTestFramework } = require('./playwright-setup');

async function quickVisualTest() {
  console.log('🧪 Quick Visual Development System Test\n');
  
  const testFramework = new ComponentTestFramework();
  
  try {
    // Initialize and navigate
    const page = await testFramework.initialize();
    console.log('✅ Test framework initialized');
    
    await testFramework.navigateTo('/dashboard');
    console.log('✅ Navigated to dashboard');
    
    // Test 1: Check if dashboard component exists
    try {
      await testFramework.waitForComponent('dashboard-client', 5000);
      console.log('✅ Dashboard component found');
    } catch (error) {
      console.log('❌ Dashboard component not found');
    }
    
    // Test 2: Check if visual dev mode toggle exists
    const devButton = page.locator('text="🛠️"');
    const hasDevButton = await devButton.count() > 0;
    console.log(`${hasDevButton ? '✅' : '❌'} Dev mode toggle ${hasDevButton ? 'available' : 'not available'}`);
    
    if (hasDevButton) {
      // Test 3: Open dev panel
      await devButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Dev panel opened');
      
      // Test 4: Check visual mode toggle
      const visualToggle = page.locator('text="Visual Component Mode"');
      const hasVisualToggle = await visualToggle.count() > 0;
      console.log(`${hasVisualToggle ? '✅' : '❌'} Visual mode toggle ${hasVisualToggle ? 'found' : 'not found'}`);
      
      // Test 5: Take screenshot
      await page.screenshot({
        path: 'tests/screenshots/visual-dev-mode-demo.png',
        fullPage: true
      });
      console.log('✅ Screenshot captured: visual-dev-mode-demo.png');
      
      // Test 6: Check component registry stats
      const componentStats = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[data-component-id]'));
        return {
          totalComponentsOnPage: elements.length,
          componentIds: elements.map(el => el.getAttribute('data-component-id')).slice(0, 5)
        };
      });
      
      console.log(`✅ Found ${componentStats.totalComponentsOnPage} components on page`);
      console.log(`✅ Sample component IDs: ${componentStats.componentIds.join(', ')}`);
    }
    
    console.log('\n🎉 Visual Development System Test Complete!');
    console.log('📸 Screenshot saved to: tests/screenshots/visual-dev-mode-demo.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Error screenshot
    if (testFramework.page) {
      await testFramework.page.screenshot({
        path: 'tests/screenshots/visual-test-error.png'
      });
    }
  } finally {
    await testFramework.close();
  }
}

// Run test if called directly
if (require.main === module) {
  quickVisualTest().catch(console.error);
}

module.exports = { quickVisualTest };