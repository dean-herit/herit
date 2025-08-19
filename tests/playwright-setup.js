// Puppeteer MCP Test Framework Setup
// This file provides utilities for MCP-driven testing with component registry integration

const { chromium } = require('playwright'); // Using Playwright for better MCP compatibility

class ComponentTestFramework {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  }

  async initialize() {
    console.log('🚀 Initializing Component Test Framework...');
    
    this.browser = await chromium.launch({
      headless: false, // Keep visible for MCP debugging
      devtools: true,
      args: ['--no-sandbox', '--disable-web-security']
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      permissions: ['clipboard-read', 'clipboard-write']
    });

    this.page = await this.context.newPage();
    
    // Enable visual dev mode for component identification
    await this.page.addInitScript(() => {
      localStorage.setItem('visualDevMode', 'true');
      console.log('🎨 Visual Dev Mode enabled for testing');
    });

    console.log('✅ Test framework initialized');
    return this.page;
  }

  /**
   * Navigate to a specific page and wait for it to load
   */
  async navigateTo(path = '/') {
    const url = `${this.baseUrl}${path}`;
    console.log(`🧭 Navigating to: ${url}`);
    
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    
    // Wait for React to hydrate
    await this.page.waitForTimeout(1000);
    
    return this.page;
  }

  /**
   * Wait for and interact with a component by its registry ID
   */
  async waitForComponent(componentId, timeout = 10000) {
    console.log(`⏳ Waiting for component: ${componentId}`);
    
    const selector = `[data-component-id="${componentId}"]`;
    await this.page.waitForSelector(selector, { timeout });
    
    const element = this.page.locator(selector);
    await element.waitFor({ state: 'visible' });
    
    console.log(`✅ Component found: ${componentId}`);
    return element;
  }

  /**
   * Get component metadata by hovering over it
   */
  async getComponentMetadata(componentId) {
    const element = await this.waitForComponent(componentId);
    
    // Hover to trigger metadata overlay
    await element.hover();
    await this.page.waitForTimeout(500);
    
    // Extract metadata from data attributes
    const metadata = await element.evaluate((el) => ({
      id: el.getAttribute('data-component-id'),
      category: el.getAttribute('data-component-category'),
      testId: el.getAttribute('data-testid'),
      boundingBox: el.getBoundingClientRect()
    }));
    
    console.log(`📊 Component metadata:`, metadata);
    return metadata;
  }

  /**
   * Test component interaction patterns
   */
  async testComponentInteraction(componentId, interactions = []) {
    console.log(`🧪 Testing interactions for: ${componentId}`);
    
    const element = await this.waitForComponent(componentId);
    const results = [];
    
    for (const interaction of interactions) {
      try {
        switch (interaction.type) {
          case 'click':
            await element.click();
            break;
          case 'hover':
            await element.hover();
            break;
          case 'fill':
            await element.fill(interaction.value);
            break;
          case 'select':
            await element.selectOption(interaction.value);
            break;
        }
        
        // Wait for any state changes
        await this.page.waitForTimeout(500);
        
        results.push({
          interaction: interaction.type,
          success: true,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Interaction ${interaction.type} successful`);
        
      } catch (error) {
        console.log(`❌ Interaction ${interaction.type} failed:`, error.message);
        results.push({
          interaction: interaction.type,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  /**
   * Capture screenshot of specific component
   */
  async screenshotComponent(componentId, options = {}) {
    const element = await this.waitForComponent(componentId);
    
    const screenshot = await element.screenshot({
      path: options.path || `screenshots/${componentId}-${Date.now()}.png`,
      ...options
    });
    
    console.log(`📸 Screenshot captured for: ${componentId}`);
    return screenshot;
  }

  /**
   * Test responsive behavior at different breakpoints
   */
  async testResponsiveComponent(componentId, breakpoints = []) {
    console.log(`📱 Testing responsive behavior: ${componentId}`);
    
    const results = [];
    const defaultBreakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'wide', width: 1920, height: 1080 }
    ];
    
    const testBreakpoints = breakpoints.length > 0 ? breakpoints : defaultBreakpoints;
    
    for (const breakpoint of testBreakpoints) {
      await this.page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      
      await this.page.waitForTimeout(500);
      
      const element = await this.waitForComponent(componentId);
      const isVisible = await element.isVisible();
      const boundingBox = await element.boundingBox();
      
      results.push({
        breakpoint: breakpoint.name,
        dimensions: `${breakpoint.width}x${breakpoint.height}`,
        visible: isVisible,
        elementBox: boundingBox,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📊 ${breakpoint.name}: ${isVisible ? 'visible' : 'hidden'}`);
    }
    
    return results;
  }

  /**
   * Run accessibility checks on component
   */
  async checkAccessibility(componentId) {
    console.log(`♿ Running accessibility checks: ${componentId}`);
    
    const element = await this.waitForComponent(componentId);
    
    const accessibility = await element.evaluate((el) => {
      return {
        hasAriaLabel: !!el.getAttribute('aria-label'),
        hasAriaDescribedBy: !!el.getAttribute('aria-describedby'),
        hasRole: !!el.getAttribute('role'),
        tabIndex: el.tabIndex,
        focusable: el.tabIndex >= 0 || ['INPUT', 'BUTTON', 'A', 'TEXTAREA', 'SELECT'].includes(el.tagName),
        hasAltText: el.tagName === 'IMG' ? !!el.getAttribute('alt') : null
      };
    });
    
    console.log('♿ Accessibility results:', accessibility);
    return accessibility;
  }

  /**
   * Close the test framework
   */
  async close() {
    console.log('🔚 Closing test framework...');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    console.log('✅ Test framework closed');
  }
}

module.exports = { ComponentTestFramework };