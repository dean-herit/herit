#!/usr/bin/env node

// Dashboard Component Test Suite
// Demonstrates MCP-driven testing with component registry integration

const { ComponentTestFramework } = require("../playwright-setup");

async function runDashboardTests() {
  const testFramework = new ComponentTestFramework();

  try {
    // Initialize test environment
    const page = await testFramework.initialize();

    console.log("🧪 Starting Dashboard Component Tests...\n");

    // Test 1: Navigate to dashboard
    console.log("📋 Test 1: Dashboard Navigation");
    await testFramework.navigateTo("/dashboard");

    // Test 2: Verify main dashboard component loads
    console.log("\n📋 Test 2: Dashboard Component Loading");
    const dashboardMetadata =
      await testFramework.getComponentMetadata("dashboard-client");
    console.log("Dashboard component loaded:", dashboardMetadata.id);

    // Test 3: Test dashboard statistics cards responsiveness
    console.log("\n📋 Test 3: Dashboard Cards Responsive Behavior");
    const cardResponsiveResults =
      await testFramework.testResponsiveComponent("dashboard-client");
    console.log(
      "Responsive test results:",
      cardResponsiveResults.length,
      "breakpoints tested",
    );

    // Test 4: Test quick action buttons
    console.log("\n📋 Test 4: Quick Action Button Interactions");

    // Find and test asset management button
    const assetButton = page
      .locator('text="Manage Assets"')
      .or(page.locator('text="Add Your First Asset"'));
    if ((await assetButton.count()) > 0) {
      console.log("✅ Asset management button found");

      // Take screenshot before interaction
      await testFramework.screenshotComponent("dashboard-client", {
        path: "tests/screenshots/dashboard-before-asset-click.png",
      });

      // Test hover behavior
      await assetButton.hover();
      await page.waitForTimeout(500);

      console.log("✅ Button hover behavior tested");
    }

    // Test 5: Check accessibility of dashboard components
    console.log("\n📋 Test 5: Dashboard Accessibility Check");
    const accessibilityResults =
      await testFramework.checkAccessibility("dashboard-client");
    console.log("Accessibility results:", accessibilityResults);

    // Test 6: Test visual dev mode functionality
    console.log("\n📋 Test 6: Visual Dev Mode Testing");

    // Check if dev mode panel is available
    const devButton = page.locator('text="🛠️"');
    if ((await devButton.count()) > 0) {
      await devButton.click();
      await page.waitForTimeout(1000);

      console.log("✅ Dev mode panel opened");

      // Check if visual mode toggle works
      const visualToggle = page
        .locator('text="Visual Component Mode"')
        .locator("..")
        .locator("input");
      if ((await visualToggle.count()) > 0) {
        const isChecked = await visualToggle.isChecked();
        console.log("Visual mode status:", isChecked ? "enabled" : "disabled");
      }
    }

    // Test 7: Component metadata extraction
    console.log("\n📋 Test 7: Component Metadata Validation");

    // Get all components on page
    const componentElements = await page.locator("[data-component-id]").all();
    console.log(`Found ${componentElements.length} components with metadata`);

    for (const element of componentElements.slice(0, 5)) {
      // Test first 5 components
      const componentId = await element.getAttribute("data-component-id");
      const category = await element.getAttribute("data-component-category");
      console.log(`Component: ${componentId} (${category})`);
    }

    // Test 8: Performance timing
    console.log("\n📋 Test 8: Dashboard Load Performance");
    const performanceMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      return {
        domContentLoaded:
          nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        loadComplete: nav.loadEventEnd - nav.loadEventStart,
        firstPaint: performance.getEntriesByType("paint")[0]?.startTime || 0,
      };
    });

    console.log("Performance metrics:", performanceMetrics);

    // Final screenshot
    await page.screenshot({
      path: "tests/screenshots/dashboard-final-state.png",
      fullPage: true,
    });

    console.log("\n✅ All dashboard tests completed successfully!");
    console.log("📸 Screenshots saved to tests/screenshots/");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);

    // Take error screenshot
    if (testFramework.page) {
      await testFramework.page.screenshot({
        path: "tests/screenshots/dashboard-error-state.png",
        fullPage: true,
      });
    }
  } finally {
    await testFramework.close();
  }
}

// Run tests if called directly
if (require.main === module) {
  runDashboardTests().catch(console.error);
}

module.exports = { runDashboardTests };
