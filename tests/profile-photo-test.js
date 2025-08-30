const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("Navigating to onboarding page...");
    await page.goto("http://localhost:3000/onboarding");
    await page.waitForTimeout(2000);

    // Fill out the personal info form with required fields
    console.log("Filling out personal info form...");
    await page.fill("#onboarding-name", "Test User Profile");
    await page.fill("#onboarding-email", "testprofile@example.com");
    await page.fill("#onboarding-phone", "+353 1 234 5678");
    await page.fill("#date-of-birth-input", "1990-01-01");
    await page.fill("#onboarding-address1", "123 Test Street");
    await page.fill("#onboarding-city", "Dublin");
    await page.fill("#onboarding-eircode", "D02 XY56");

    // Select county
    await page.click("#onboarding-county");
    await page.waitForTimeout(500);
    await page.click('li[data-key="Dublin"]');
    await page.waitForTimeout(500);

    // Add a profile photo URL
    console.log("Adding profile photo URL...");
    const photoUrl =
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80";
    await page.fill("#photo-url-input", photoUrl);
    await page.waitForTimeout(1000);

    // Take screenshot of form with photo
    console.log("Taking screenshot of form with photo...");
    await page.screenshot({
      path: "tests/screenshots/profile-photo-form-filled.png",
      fullPage: true,
    });

    // Submit the form
    console.log("Submitting form...");
    await page.click("#onboarding-submit");
    await page.waitForTimeout(3000);

    // Should be redirected to signature step
    console.log("Taking screenshot after form submission...");
    await page.screenshot({
      path: "tests/screenshots/after-personal-info-submit.png",
      fullPage: true,
    });

    // Navigate to dashboard to check navbar avatar
    console.log("Navigating to dashboard to check navbar avatar...");
    await page.goto("http://localhost:3000/dashboard");
    await page.waitForTimeout(2000);

    // Take screenshot of dashboard with navbar
    console.log("Taking screenshot of dashboard with navbar...");
    await page.screenshot({
      path: "tests/screenshots/dashboard-with-profile-photo.png",
      fullPage: true,
    });

    // Check if avatar image is loaded
    const avatarImg = await page.locator('img[src*="unsplash"]').first();
    const isVisible = await avatarImg.isVisible().catch(() => false);

    if (isVisible) {
      console.log("✅ SUCCESS: Profile photo is displaying in navbar avatar!");
    } else {
      console.log(
        "❌ FAILED: Profile photo is not displaying in navbar avatar",
      );

      // Debug: Check what's in the navbar
      const navbarContent = await page
        .textContent(".navbar, nav, header")
        .catch(() => "No navbar found");
      console.log("Navbar content:", navbarContent.substring(0, 200));
    }
  } catch (error) {
    console.error("Test error:", error);
    await page.screenshot({
      path: "tests/screenshots/profile-photo-test-error.png",
      fullPage: true,
    });
  } finally {
    await browser.close();
  }
})();
