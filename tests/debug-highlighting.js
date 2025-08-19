#!/usr/bin/env node

// Debug Visual Component Highlighting
const { ComponentTestFramework } = require('./playwright-setup');

const TEST_USER = {
  email: 'claude.phase2@example.com',
  password: 'Phase2Demo123!'
};

async function debugHighlighting() {
  console.log('🐛 DEBUG: Visual Component Highlighting\n');
  
  const testFramework = new ComponentTestFramework();
  
  try {
    const page = await testFramework.initialize();
    console.log('✅ Browser initialized');
    
    // Navigate to dashboard
    await testFramework.navigateTo('/login');
    await page.waitForTimeout(1000);
    
    try {
      await page.fill('input[name="email"]', TEST_USER.email);
      await page.fill('input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('ℹ️ Login skipped');
    }
    
    await testFramework.navigateTo('/dashboard');
    await page.waitForTimeout(3000);
    
    console.log('\n🔍 DEBUGGING COMPONENT DETECTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Check what's actually on the page
    const debugInfo = await page.evaluate(() => {
      const results = {
        componentsWithDataId: document.querySelectorAll('[data-component-id]').length,
        componentsWithDataIdList: Array.from(document.querySelectorAll('[data-component-id]')).map(el => ({
          id: el.getAttribute('data-component-id'),
          tagName: el.tagName,
          className: el.className,
          rect: el.getBoundingClientRect()
        })),
        visualDevMode: localStorage.getItem('visualDevMode'),
        highlightingEnabled: localStorage.getItem('highlightingEnabled'),
        boundaryOverlay: localStorage.getItem('boundaryOverlay'),
        showTooltips: localStorage.getItem('showTooltips'),
        hasHighlightManager: typeof window.highlightManager !== 'undefined',
        hasComponentHighlighter: !!document.querySelector('[data-component-highlighter]'),
        devPanelExists: document.querySelectorAll('button').length > 0,
        allButtonText: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim() || btn.innerHTML),
        visualDevPanelOpen: !!document.querySelector('[data-testid="visual-dev-panel"]') || document.textContent?.includes('Visual Dev Mode'),
        supportsHighlightAPI: typeof CSS !== 'undefined' && 'highlights' in CSS
      };
      
      return results;
    });
    
    console.log('🧩 Components with data-component-id:', debugInfo.componentsWithDataId);
    
    if (debugInfo.componentsWithDataIdList.length > 0) {
      console.log('📋 Component List:');
      debugInfo.componentsWithDataIdList.forEach((comp, index) => {
        console.log(`   ${index + 1}. ${comp.id} (${comp.tagName}) - ${comp.rect.width}x${comp.rect.height}`);
      });
    }
    
    console.log('\n⚙️ Settings:');
    console.log('   visualDevMode:', debugInfo.visualDevMode);
    console.log('   highlightingEnabled:', debugInfo.highlightingEnabled);
    console.log('   boundaryOverlay:', debugInfo.boundaryOverlay);
    console.log('   showTooltips:', debugInfo.showTooltips);
    
    console.log('\n🔧 System Status:');
    console.log('   hasHighlightManager:', debugInfo.hasHighlightManager);
    console.log('   hasComponentHighlighter:', debugInfo.hasComponentHighlighter);
    console.log('   supportsHighlightAPI:', debugInfo.supportsHighlightAPI);
    console.log('   visualDevPanelOpen:', debugInfo.visualDevPanelOpen);
    
    console.log('\n🔘 Buttons found:', debugInfo.allButtonText.length);
    debugInfo.allButtonText.slice(0, 5).forEach((text, index) => {
      console.log(`   ${index + 1}. "${text}"`);
    });
    
    // Try to enable visual dev mode manually
    console.log('\n🎨 MANUALLY ENABLING VISUAL DEV MODE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    await page.evaluate(() => {
      localStorage.setItem('visualDevMode', 'true');
      localStorage.setItem('highlightingEnabled', 'true');
      localStorage.setItem('showTooltips', 'true');
      localStorage.setItem('boundaryOverlay', 'true');
      console.log('🎨 Visual Dev Mode settings enabled manually');
    });
    
    // Test keyboard shortcuts
    console.log('⌨️ Testing Ctrl+H shortcut...');
    await page.keyboard.down('Control');
    await page.keyboard.press('h');
    await page.keyboard.up('Control');
    await page.waitForTimeout(2000);
    
    // Check if anything changed
    const afterShortcut = await page.evaluate(() => {
      return {
        highlightedElements: document.querySelectorAll('.highlighted, [data-highlighted="true"]').length,
        cssHighlights: typeof CSS !== 'undefined' && CSS.highlights ? CSS.highlights.size : 0,
        visualEffects: Array.from(document.querySelectorAll('*')).some(el => 
          el.style.outline || el.style.backgroundColor?.includes('rgba') || el.style.border?.includes('highlight')
        )
      };
    });
    
    console.log('📊 After Ctrl+H:');
    console.log('   highlightedElements:', afterShortcut.highlightedElements);
    console.log('   cssHighlights:', afterShortcut.cssHighlights);
    console.log('   visualEffects:', afterShortcut.visualEffects);
    
    await page.screenshot({
      path: 'tests/screenshots/debug-highlighting.png',
      fullPage: true
    });
    
    console.log('\n📸 Screenshot saved: debug-highlighting.png');
    
  } catch (error) {
    console.error('\n❌ Debug failed:', error.message);
    await testFramework.page.screenshot({
      path: 'tests/screenshots/debug-error.png',
      fullPage: true
    });
    
  } finally {
    await testFramework.close();
  }
}

if (require.main === module) {
  debugHighlighting().catch(console.error);
}

module.exports = { debugHighlighting };