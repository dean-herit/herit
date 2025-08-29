const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: true });

  // iPhone 14 Pro viewport
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Navigate to signup page
  await page.goto("http://localhost:3000/signup");
  await page.waitForTimeout(2000); // Wait for page to fully load

  // Take screenshot
  await page.screenshot({
    path: "tests/screenshots/mobile-signup-fixed.png",
    fullPage: false,
  });

  await browser.close();
  console.log("Screenshot saved to tests/screenshots/mobile-signup-fixed.png");
})();
