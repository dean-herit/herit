#!/usr/bin/env node

// Comprehensive Component Test Suite
// MCP-driven testing for all major components with visual feedback

const { ComponentTestFramework } = require('./playwright-setup');
const { runDashboardTests } = require('./dashboard-component-test');

// Component registry for testing priority
const TEST_COMPONENTS = [
  { id: 'dashboard-client', category: 'business', priority: 'high' },
  { id: 'nav-bar', category: 'navigation', priority: 'high' },
  { id: 'asset-form', category: 'input', priority: 'high' },
  { id: 'asset-card', category: 'data-display', priority: 'medium' },
  { id: 'beneficiary-form', category: 'input', priority: 'medium' },
  { id: 'step-indicator', category: 'ui', priority: 'medium' },
  { id: 'logo-component', category: 'ui', priority: 'low' }
];

class ComponentTestSuite {
  constructor() {
    this.testFramework = new ComponentTestFramework();
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Component Test Suite\n');
    
    try {
      await this.testFramework.initialize();
      
      // Run specific dashboard tests first
      console.log('📋 Running Dashboard-Specific Tests...');
      await runDashboardTests();
      
      // Run general component tests
      console.log('\n🧪 Running General Component Tests...\n');
      
      for (const component of TEST_COMPONENTS) {
        await this.testComponent(component);
      }
      
      // Run cross-component integration tests
      await this.runIntegrationTests();
      
      // Generate test report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      await this.testFramework.close();
    }
  }

  async testComponent(component) {
    console.log(`\n🧩 Testing Component: ${component.id} (${component.category})`);
    
    const testResult = {
      componentId: component.id,
      category: component.category,
      priority: component.priority,
      tests: [],
      startTime: new Date()
    };

    try {
      // Navigate to a page likely to contain this component
      const testPage = this.getTestPageForComponent(component);
      await this.testFramework.navigateTo(testPage);
      
      // Test 1: Component existence and visibility
      const existenceTest = await this.testComponentExistence(component.id);
      testResult.tests.push(existenceTest);
      
      if (existenceTest.passed) {
        // Test 2: Component metadata
        const metadataTest = await this.testComponentMetadata(component.id);
        testResult.tests.push(metadataTest);
        
        // Test 3: Responsive behavior
        const responsiveTest = await this.testComponentResponsive(component.id);
        testResult.tests.push(responsiveTest);
        
        // Test 4: Accessibility
        const accessibilityTest = await this.testComponentAccessibility(component.id);
        testResult.tests.push(accessibilityTest);
        
        // Test 5: Visual regression (screenshot)
        const visualTest = await this.testComponentVisual(component.id);
        testResult.tests.push(visualTest);
        
        this.results.passed++;
      } else {
        console.log(`⏭️  Skipping further tests for ${component.id} (not found)`);
        this.results.skipped++;
      }
      
    } catch (error) {
      console.log(`❌ Component test failed: ${error.message}`);
      testResult.error = error.message;
      this.results.failed++;
    }
    
    testResult.endTime = new Date();
    testResult.duration = testResult.endTime - testResult.startTime;
    this.results.tests.push(testResult);
  }

  async testComponentExistence(componentId) {
    try {
      await this.testFramework.waitForComponent(componentId, 5000);
      console.log(`✅ ${componentId}: Exists and visible`);
      return { test: 'existence', passed: true };
    } catch (error) {
      console.log(`❌ ${componentId}: Not found or not visible`);
      return { test: 'existence', passed: false, error: error.message };
    }
  }

  async testComponentMetadata(componentId) {
    try {
      const metadata = await this.testFramework.getComponentMetadata(componentId);
      const hasValidMetadata = metadata.id === componentId && metadata.category;
      
      console.log(`${hasValidMetadata ? '✅' : '❌'} ${componentId}: Metadata ${hasValidMetadata ? 'valid' : 'invalid'}`);
      return { test: 'metadata', passed: hasValidMetadata, data: metadata };
    } catch (error) {
      console.log(`❌ ${componentId}: Metadata test failed`);
      return { test: 'metadata', passed: false, error: error.message };
    }
  }

  async testComponentResponsive(componentId) {
    try {
      const results = await this.testFramework.testResponsiveComponent(componentId, [
        { name: 'mobile', width: 375, height: 667 },
        { name: 'desktop', width: 1280, height: 720 }
      ]);
      
      const allVisible = results.every(r => r.visible);
      console.log(`${allVisible ? '✅' : '⚠️'} ${componentId}: Responsive ${allVisible ? 'passed' : 'needs review'}`);
      return { test: 'responsive', passed: allVisible, data: results };
    } catch (error) {
      console.log(`❌ ${componentId}: Responsive test failed`);
      return { test: 'responsive', passed: false, error: error.message };
    }
  }

  async testComponentAccessibility(componentId) {
    try {
      const accessibility = await this.testFramework.checkAccessibility(componentId);
      const score = Object.values(accessibility).filter(v => v === true).length;
      
      console.log(`${score > 2 ? '✅' : '⚠️'} ${componentId}: Accessibility score ${score}/6`);
      return { test: 'accessibility', passed: score > 2, data: accessibility, score };
    } catch (error) {
      console.log(`❌ ${componentId}: Accessibility test failed`);
      return { test: 'accessibility', passed: false, error: error.message };
    }
  }

  async testComponentVisual(componentId) {
    try {
      await this.testFramework.screenshotComponent(componentId, {
        path: `tests/screenshots/component-${componentId}-${Date.now()}.png`
      });
      
      console.log(`✅ ${componentId}: Visual regression screenshot captured`);
      return { test: 'visual', passed: true };
    } catch (error) {
      console.log(`❌ ${componentId}: Visual test failed`);
      return { test: 'visual', passed: false, error: error.message };
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    
    // Test navigation flow
    try {
      await this.testFramework.navigateTo('/');
      await this.testFramework.navigateTo('/dashboard');
      await this.testFramework.navigateTo('/assets');
      console.log('✅ Navigation flow test passed');
    } catch (error) {
      console.log('❌ Navigation flow test failed:', error.message);
    }
  }

  getTestPageForComponent(component) {
    // Map component categories to likely test pages
    const pageMapping = {
      'business': '/dashboard',
      'navigation': '/dashboard',
      'input': '/assets/add-v2',
      'data-display': '/assets',
      'authentication': '/',
      'ui': '/dashboard'
    };
    
    return pageMapping[component.category] || '/dashboard';
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.tests.length,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped
      },
      details: this.results.tests
    };

    // Save detailed report
    const fs = require('fs').promises;
    await fs.writeFile(
      'tests/test-report.json',
      JSON.stringify(report, null, 2)
    );

    // Print summary
    console.log('\n📊 Test Suite Summary:');
    console.log(`Total components tested: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⏭️  Skipped: ${report.summary.skipped}`);
    console.log('\n📄 Detailed report saved to: tests/test-report.json');
    console.log('📸 Screenshots saved to: tests/screenshots/');
  }
}

// Run test suite if called directly
if (require.main === module) {
  const testSuite = new ComponentTestSuite();
  testSuite.runAllTests().catch(console.error);
}

module.exports = { ComponentTestSuite };