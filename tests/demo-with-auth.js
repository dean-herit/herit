#!/usr/bin/env node

// Demo with Authentication Flow
const { ComponentTestFramework } = require('./playwright-setup');

async function demoWithAuth() {
  console.log('🎬 Visual Development System Demo\n');
  
  const testFramework = new ComponentTestFramework();
  
  try {
    const page = await testFramework.initialize();
    console.log('✅ Browser initialized');
    
    // Start at home page
    await testFramework.navigateTo('/');
    console.log('✅ Navigated to home page');
    
    // Take screenshot of home page
    await page.screenshot({
      path: 'tests/screenshots/demo-1-home.png',
      fullPage: true
    });
    console.log('📸 Screenshot: demo-1-home.png');
    
    // Check what's on the page
    const pageTitle = await page.title();
    console.log(`📄 Page title: "${pageTitle}"`);
    
    // Look for components on current page
    const components = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[data-component-id]'));
      return elements.map(el => ({
        id: el.getAttribute('data-component-id'),
        category: el.getAttribute('data-component-category'),
        visible: el.offsetParent !== null
      }));
    });
    
    console.log(`\n🧩 Found ${components.length} components on page:`);
    components.forEach(comp => {
      console.log(`  - ${comp.id} (${comp.category}) ${comp.visible ? '👁️ visible' : '👻 hidden'}`);
    });
    
    // Check for dev mode button
    const devButtons = await page.locator('button:has-text("🛠️")').count();
    console.log(`\n🛠️ Dev mode buttons found: ${devButtons}`);
    
    if (devButtons > 0) {
      console.log('🎯 Opening dev mode panel...');
      await page.locator('button:has-text("🛠️")').click();
      await page.waitForTimeout(1000);
      
      await page.screenshot({
        path: 'tests/screenshots/demo-2-dev-panel.png',
        fullPage: true
      });
      console.log('📸 Screenshot: demo-2-dev-panel.png (with dev panel)');
      
      // Check if visual mode toggle exists
      const visualToggle = await page.locator('text="Visual Component Mode"').count();
      if (visualToggle > 0) {
        console.log('🎨 Visual Component Mode toggle found!');
        
        // Get current state
        const toggleElement = page.locator('text="Visual Component Mode"').locator('..').locator('input');
        const isEnabled = await toggleElement.isChecked();
        console.log(`🔘 Visual mode currently: ${isEnabled ? 'enabled' : 'disabled'}`);
        
        if (!isEnabled) {
          console.log('🔄 Enabling visual mode...');
          await toggleElement.click();
          await page.waitForTimeout(2000); // Wait for page reload
          
          await page.screenshot({
            path: 'tests/screenshots/demo-3-visual-mode.png',
            fullPage: true
          });
          console.log('📸 Screenshot: demo-3-visual-mode.png (visual mode enabled)');
        }
      }
    }
    
    // Test component hover behavior
    if (components.length > 0) {
      console.log('\n🖱️ Testing component hover behavior...');
      const firstComponent = components[0];
      const componentElement = page.locator(`[data-component-id="${firstComponent.id}"]`);
      
      await componentElement.hover();
      await page.waitForTimeout(1000);
      
      await page.screenshot({
        path: 'tests/screenshots/demo-4-component-hover.png',
        fullPage: true
      });
      console.log('📸 Screenshot: demo-4-component-hover.png (component hover)');
      console.log(`🎯 Hovered over: ${firstComponent.id}`);
    }
    
    // Show component registry stats
    console.log('\n📊 Component Registry Demo:');
    const stats = await page.evaluate(() => {
      // Try to access component registry if available
      if (window.localStorage) {
        const visualMode = localStorage.getItem('visualDevMode');
        return { visualModeInStorage: visualMode };
      }
      return {};
    });
    console.log('💾 Local storage state:', stats);
    
    console.log('\n🎉 Demo Complete!');
    console.log('📁 Screenshots saved in tests/screenshots/:');
    console.log('   • demo-1-home.png - Home page');
    console.log('   • demo-2-dev-panel.png - Dev panel opened');
    console.log('   • demo-3-visual-mode.png - Visual mode enabled');
    console.log('   • demo-4-component-hover.png - Component hover effect');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    
    // Error screenshot
    await testFramework.page.screenshot({
      path: 'tests/screenshots/demo-error.png',
      fullPage: true
    });
    console.log('📸 Error screenshot: demo-error.png');
  } finally {
    await testFramework.close();
  }
}

// Run demo
if (require.main === module) {
  demoWithAuth().catch(console.error);
}

module.exports = { demoWithAuth };