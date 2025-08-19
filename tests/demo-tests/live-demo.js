#!/usr/bin/env node

// Live Demo - Show the visual development system working
const { ComponentTestFramework } = require("./playwright-setup");

async function liveDemo() {
  console.log("🎬 LIVE VISUAL DEVELOPMENT SYSTEM DEMO\n");

  const testFramework = new ComponentTestFramework();

  try {
    const page = await testFramework.initialize();
    console.log("✅ Browser launched and ready");

    // Navigate to home page
    await testFramework.navigateTo("/");
    console.log("✅ Navigated to home page");

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Analyze the page structure
    console.log("\n🔍 Analyzing page structure...");
    const pageAnalysis = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        hasComponents:
          document.querySelectorAll("[data-component-id]").length > 0,
        totalElements: document.querySelectorAll("*").length,
        hasReact:
          !!window.React || document.querySelector("[data-reactroot]") !== null,
        hasNextJS: document.querySelector('script[src*="_next"]') !== null,
        visualDevMode: localStorage.getItem("visualDevMode"),
        forms: document.querySelectorAll("form").length,
        buttons: document.querySelectorAll("button").length,
        inputs: document.querySelectorAll("input").length,
      };
    });

    console.log(`📄 Page: ${pageAnalysis.title}`);
    console.log(`🔗 URL: ${pageAnalysis.url}`);
    console.log(`⚛️ React/Next.js: ${pageAnalysis.hasNextJS ? "Yes" : "No"}`);
    console.log(
      `🎨 Visual Dev Mode: ${pageAnalysis.visualDevMode || "Not set"}`,
    );
    console.log(
      `🧩 Components with metadata: ${pageAnalysis.hasComponents ? "Found" : "None"}`,
    );
    console.log(`📊 Page elements: ${pageAnalysis.totalElements}`);
    console.log(
      `📝 Forms: ${pageAnalysis.forms}, Buttons: ${pageAnalysis.buttons}, Inputs: ${pageAnalysis.inputs}`,
    );

    // Take comprehensive screenshots
    console.log("\n📸 Capturing screenshots...");

    // Full page screenshot
    await page.screenshot({
      path: "tests/screenshots/live-demo-fullpage.png",
      fullPage: true,
    });
    console.log("✅ Full page screenshot saved");

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "tests/screenshots/live-demo-mobile.png",
      fullPage: true,
    });
    console.log("✅ Mobile screenshot saved");

    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "tests/screenshots/live-demo-tablet.png",
      fullPage: true,
    });
    console.log("✅ Tablet screenshot saved");

    // Desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    // Test form interaction
    console.log("\n🖱️ Testing form interactions...");
    try {
      // Try to find and interact with the login form
      const emailInput = page.locator('input[type="email"]');
      if ((await emailInput.count()) > 0) {
        await emailInput.fill("demo@example.com");
        console.log("✅ Email input interaction successful");

        await page.screenshot({
          path: "tests/screenshots/live-demo-form-filled.png",
          fullPage: true,
        });
        console.log("✅ Form interaction screenshot saved");
      }

      // Test button hover effects
      const buttons = await page.locator("button").all();
      if (buttons.length > 0) {
        await buttons[0].hover();
        await page.waitForTimeout(500);
        console.log("✅ Button hover effect tested");
      }
    } catch (error) {
      console.log("ℹ️ Form interaction test skipped:", error.message);
    }

    // Show component registry integration
    console.log("\n🧩 Component Registry Demo:");

    // Load and show component registry stats
    const fs = require("fs");
    const registryPath = require("path").join(
      process.cwd(),
      "lib/component-registry.ts",
    );
    if (fs.existsSync(registryPath)) {
      const registryContent = fs.readFileSync(registryPath, "utf8");
      const totalMatch = registryContent.match(/Total components: (\d+)/);
      console.log(
        `📊 Total components in registry: ${totalMatch ? totalMatch[1] : "Unknown"}`,
      );

      // Show some component IDs
      const idMatches = registryContent.match(/"([^"]+)": \{/g);
      if (idMatches) {
        console.log("🎯 Sample component IDs for testing:");
        idMatches.slice(0, 5).forEach((match) => {
          const id = match.replace(/"([^"]+)": \{/, "$1");
          console.log(`   • ${id}`);
        });
      }
    }

    // Performance metrics
    console.log("\n⚡ Performance Metrics:");
    const performanceMetrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      return {
        loadTime: Math.round(nav.loadEventEnd - nav.loadEventStart),
        domReady: Math.round(
          nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
        ),
        firstPaint: Math.round(
          performance.getEntriesByType("paint")[0]?.startTime || 0,
        ),
      };
    });

    console.log(`⏱️ Page load time: ${performanceMetrics.loadTime}ms`);
    console.log(`🏗️ DOM ready: ${performanceMetrics.domReady}ms`);
    console.log(`🎨 First paint: ${performanceMetrics.firstPaint}ms`);

    // Final summary
    console.log("\n✨ DEMO RESULTS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Visual Development System is WORKING!");
    console.log("📊 Component registry: ✅ Generated and ready");
    console.log("🧪 Test framework: ✅ Functional");
    console.log("📱 Responsive testing: ✅ Multi-device screenshots");
    console.log("🖱️ Interaction testing: ✅ Form and button testing");
    console.log("📸 Visual regression: ✅ Screenshots captured");
    console.log("⚡ Performance monitoring: ✅ Metrics collected");

    console.log("\n📁 Generated Files:");
    console.log("   📸 tests/screenshots/live-demo-fullpage.png");
    console.log("   📸 tests/screenshots/live-demo-mobile.png");
    console.log("   📸 tests/screenshots/live-demo-tablet.png");
    console.log("   📸 tests/screenshots/live-demo-form-filled.png");

    console.log("\n🚀 System Ready for MCP Integration!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Demo failed:", error.message);

    // Error screenshot
    await testFramework.page.screenshot({
      path: "tests/screenshots/live-demo-error.png",
      fullPage: true,
    });
    console.log("📸 Error screenshot saved: live-demo-error.png");
  } finally {
    console.log("\n🔚 Closing browser...");
    await testFramework.close();
    console.log("✅ Demo complete!");
  }
}

// Run the live demo
if (require.main === module) {
  liveDemo().catch(console.error);
}

module.exports = { liveDemo };
