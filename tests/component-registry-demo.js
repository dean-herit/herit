#!/usr/bin/env node

// Component Registry Demo - Show what we've built
const fs = require('fs');
const path = require('path');

async function componentRegistryDemo() {
  console.log('🎬 Component Registry & Visual Development System Demo\n');
  
  try {
    // Load the component registry
    const registryPath = path.join(process.cwd(), 'lib/component-registry.ts');
    const registryContent = await fs.promises.readFile(registryPath, 'utf8');
    
    console.log('📊 Component Registry Statistics:');
    
    // Extract stats from the generated file
    const totalMatch = registryContent.match(/Total components: (\d+)/);
    const totalComponents = totalMatch ? totalMatch[1] : 'unknown';
    
    console.log(`   Total Components Discovered: ${totalComponents}`);
    
    // Show category breakdown
    const categoryMatches = registryContent.match(/ComponentCategory\.(\w+)/g);
    if (categoryMatches) {
      const categories = {};
      categoryMatches.forEach(match => {
        const category = match.replace('ComponentCategory.', '');
        categories[category] = (categories[category] || 0) + 1;
      });
      
      console.log('\n🗂️ Components by Category:');
      Object.entries(categories).forEach(([category, count]) => {
        const emoji = {
          'UI': '🎨',
          'LAYOUT': '📐',
          'NAVIGATION': '🧭',
          'INPUT': '📝',
          'BUSINESS': '💼',
          'AUTHENTICATION': '🔐',
          'FEEDBACK': '💬',
          'DATA_DISPLAY': '📊'
        }[category] || '📦';
        
        console.log(`   ${emoji} ${category.toLowerCase().replace('_', '-')}: ${count} components`);
      });
    }
    
    // Show some example component IDs
    const componentIdMatches = registryContent.match(/"([^"]+)": \{/g);
    if (componentIdMatches) {
      const sampleIds = componentIdMatches.slice(0, 8).map(match => 
        match.replace(/"([^"]+)": \{/, '$1')
      );
      
      console.log('\n🧩 Sample Component IDs (for testing):');
      sampleIds.forEach(id => {
        console.log(`   📌 ${id}`);
      });
    }
    
    console.log('\n🛠️ Visual Development Features:');
    console.log('   ✅ Component registry with AST-based discovery');
    console.log('   ✅ Visual dev mode with component overlays');
    console.log('   ✅ Component metadata on hover');
    console.log('   ✅ Dev panel with statistics');
    console.log('   ✅ Puppeteer test framework integration');
    console.log('   ✅ MCP-ready for visual workflows');
    
    console.log('\n🧪 Test Framework Capabilities:');
    console.log('   🎯 Component targeting by ID');
    console.log('   📱 Responsive behavior testing');
    console.log('   ♿ Accessibility checking');
    console.log('   📸 Visual regression screenshots');
    console.log('   🖱️ Interaction testing');
    console.log('   📊 Performance monitoring');
    
    console.log('\n🎮 How to Use:');
    console.log('   1. Navigate to /dashboard (after login)');
    console.log('   2. Look for 🛠️ button in bottom-right');
    console.log('   3. Toggle "Visual Component Mode"');
    console.log('   4. Hover over components to see metadata');
    console.log('   5. Use component IDs in MCP tests');
    
    console.log('\n📁 Generated Files:');
    console.log('   📄 lib/component-registry.ts - Auto-generated registry');
    console.log('   📄 CLAUDE.md - MCP configuration guide');
    console.log('   📄 tests/ - Complete test framework');
    console.log('   📸 tests/screenshots/ - Visual test results');
    
    console.log('\n🚀 Next Steps:');
    console.log('   • Run tests: node tests/component-test-suite.js');
    console.log('   • Visual demo: node tests/demo-with-auth.js');
    console.log('   • MCP integration: Use component IDs for reliable testing');
    
    // Show the screenshot that was captured
    const screenshotPath = 'tests/screenshots/demo-1-home.png';
    if (fs.existsSync(screenshotPath)) {
      console.log('\n📸 Latest Screenshot Available:');
      console.log(`   ${screenshotPath} - Shows working home page with login form`);
    }
    
    console.log('\n✨ Visual Development System Ready!');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

// Run demo
if (require.main === module) {
  componentRegistryDemo().catch(console.error);
}

module.exports = { componentRegistryDemo };