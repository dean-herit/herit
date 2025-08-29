// MCP Playwright Test for Rules System
// This test validates the Rules creation, viewing, editing, and deletion functionality

const { chromium } = require('playwright');

async function testRulesSystem() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🚀 Starting Rules System Test');

  try {
    // 1. Navigate to login page
    console.log('1️⃣ Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    
    // 2. Login with test credentials
    console.log('2️⃣ Logging in with test user...');
    await page.fill('input[name="email"]', 'claude.assistant@example.com');
    await page.fill('input[name="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    console.log('✅ Login successful');

    // 3. Navigate to Rules page
    console.log('3️⃣ Navigating to Rules page...');
    await page.goto('http://localhost:3000/rules');
    await page.waitForSelector('[data-component-id="rules-page"]');
    
    // 4. Click Create Rule button
    console.log('4️⃣ Opening Create Rule modal...');
    await page.click('[data-component-id="create-rule-button"]');
    await page.waitForSelector('[data-component-id="create-rule-modal"]', { timeout: 5000 });
    
    // 5. Fill in rule details - Step 1: Basic Information
    console.log('5️⃣ Filling rule basic information...');
    await page.fill('input[name="name"]', 'College Graduation Rule');
    await page.fill('textarea[name="description"]', 'Assets allocated when beneficiary completes college');
    
    // Click next step
    await page.click('button:has-text("Next")');
    
    // 6. Step 2: Add Conditions
    console.log('6️⃣ Adding rule conditions...');
    await page.waitForSelector('text=Rule Conditions');
    
    // Select condition type
    await page.click('button[aria-label="Condition Type"]');
    await page.click('li[data-key="education-completed"]');
    
    // Select operator
    await page.click('button[aria-label="Operator"]');
    await page.click('li[data-key="equal"]');
    
    // Enter value
    await page.fill('input[name="conditions.0.value"]', 'college degree');
    
    // Click next step
    await page.click('button:has-text("Next")');
    
    // 7. Step 3: Asset Allocations
    console.log('7️⃣ Setting asset allocations...');
    await page.waitForSelector('text=Asset Allocations');
    
    // Select asset
    await page.click('button[aria-label="Select Asset"]');
    await page.click('li:has-text("Family Home")');
    
    // Select beneficiary
    await page.click('button[aria-label="Select Beneficiary"]');
    await page.click('li:has-text("John Doe")');
    
    // Set allocation percentage
    await page.fill('input[name="allocations.0.allocation_percentage"]', '50');
    
    // Add another allocation
    await page.click('button:has-text("Add Allocation")');
    
    // Select second asset
    await page.click('button[aria-label="Select Asset"]:nth-of-type(2)');
    await page.click('li:has-text("Savings Account")');
    
    // Select second beneficiary
    await page.click('button[aria-label="Select Beneficiary"]:nth-of-type(2)');
    await page.click('li:has-text("Jane Doe")');
    
    // Set second allocation
    await page.fill('input[name="allocations.1.allocation_percentage"]', '30');
    
    // Click next step
    await page.click('button:has-text("Next")');
    
    // 8. Step 4: Review and Create
    console.log('8️⃣ Reviewing and creating rule...');
    await page.waitForSelector('text=Review & Create');
    
    // Submit the rule
    await page.click('button:has-text("Create Rule")');
    
    // Wait for success
    await page.waitForSelector('[data-component-id="rules-grid"]', { timeout: 5000 });
    console.log('✅ Rule created successfully');
    
    // 9. Verify rule appears in list
    console.log('9️⃣ Verifying rule in list...');
    const ruleCard = await page.waitForSelector('text=College Graduation Rule');
    if (ruleCard) {
      console.log('✅ Rule appears in the list');
    }
    
    // 10. Test viewing the rule
    console.log('🔟 Testing view rule...');
    await page.click('button[aria-label="View rule"]');
    await page.waitForSelector('[data-component-id="view-rule-modal"]');
    await page.click('button:has-text("Close")');
    console.log('✅ View rule works');
    
    // 11. Test editing the rule
    console.log('1️⃣1️⃣ Testing edit rule...');
    await page.click('button[aria-label="Edit rule"]');
    await page.waitForSelector('[data-component-id="edit-rule-modal"]');
    
    // Update the name
    await page.fill('input[name="name"]', 'Updated College Rule');
    await page.click('button:has-text("Save Changes")');
    
    // Verify update
    await page.waitForSelector('text=Updated College Rule');
    console.log('✅ Edit rule works');
    
    // 12. Test deleting the rule
    console.log('1️⃣2️⃣ Testing delete rule...');
    await page.click('button[aria-label="Delete rule"]');
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    // Verify rule is removed
    await page.waitForSelector('[data-component-id="empty-rules-state"]', { timeout: 5000 });
    console.log('✅ Delete rule works');
    
    console.log('🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Take screenshot on failure
    await page.screenshot({ path: 'tests/screenshots/rules-test-failure.png' });
    console.log('📸 Screenshot saved to tests/screenshots/rules-test-failure.png');
    
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testRulesSystem()
  .then(() => {
    console.log('✨ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });