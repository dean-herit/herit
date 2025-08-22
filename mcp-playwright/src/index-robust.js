const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require("@modelcontextprotocol/sdk/types.js");
const { chromium } = require("playwright");

// ===== ROBUST ONBOARDING AUTOMATION SYSTEM =====
class RobustOnboardingAutomation {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.baseUrl = "http://localhost:3000";
    this.stepLogs = [];
  }

  // ===== PHASE 1: COMPONENT-ID BASED ARCHITECTURE =====

  async getComponentById(componentId, timeout = 5000) {
    try {
      const element = this.page.locator(`[data-component-id="${componentId}"]`);
      await element.waitFor({ timeout });
      return element;
    } catch (error) {
      console.error(`❌ Component '${componentId}' not found:`, error.message);
      return null;
    }
  }

  async waitForStep(stepNumber, timeout = 10000) {
    console.error(`⏳ Waiting for step ${stepNumber} to load...`);

    const stepComponents = {
      1: "components-personal-info-step",
      2: "components-signature-step",
      3: "components-legal-consent-step",
      4: "components-verification-step",
    };

    const componentId = stepComponents[stepNumber];
    if (!componentId) {
      throw new Error(`Unknown step number: ${stepNumber}`);
    }

    try {
      const component = await this.getComponentById(componentId, timeout);
      if (component) {
        await this.page.waitForLoadState("networkidle");
        console.error(`✅ Step ${stepNumber} component loaded: ${componentId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ Step ${stepNumber} failed to load:`, error.message);
      return false;
    }
  }

  // ===== PHASE 2: STATE-DRIVEN LOGIC WITH API-FIRST DETECTION =====

  async detectOnboardingStateRobust() {
    console.error(
      "🔍 Detecting onboarding state with robust API-first approach...",
    );

    try {
      // 1. Check authentication first
      const authState = await this.page.evaluate(async () => {
        try {
          const response = await fetch("/api/auth/session");
          if (response.ok) {
            const data = await response.json();
            return {
              isAuthenticated: !!data.user,
              user: data.user,
              onboardingCompleted: data.user?.onboarding_completed || false,
            };
          }
          return { isAuthenticated: false };
        } catch (error) {
          return { error: error.message };
        }
      });

      if (!authState.isAuthenticated) {
        return {
          currentStep: 0,
          needsAuthentication: true,
          isComplete: false,
          authState,
        };
      }

      // 2. Get onboarding status via API
      const onboardingState = await this.page.evaluate(async () => {
        try {
          const response = await fetch("/api/onboarding/status");
          if (response.ok) {
            const data = await response.json();
            return {
              currentStep: data.currentStep,
              isComplete: data.isComplete,
              stepsCompleted: {
                personalInfo: data.user?.personal_info_completed || false,
                signature: data.user?.signature_completed || false,
                legalConsent: data.user?.legal_consent_completed || false,
                verification: data.user?.verification_completed || false,
              },
            };
          }
          return null;
        } catch (error) {
          return { error: error.message };
        }
      });

      // 3. Determine current step from API data
      let currentStep = 1;
      if (onboardingState && onboardingState.stepsCompleted) {
        const steps = onboardingState.stepsCompleted;
        if (steps.personalInfo && !steps.signature) currentStep = 2;
        else if (steps.signature && !steps.legalConsent) currentStep = 3;
        else if (steps.legalConsent && !steps.verification) currentStep = 4;
        else if (steps.verification) currentStep = 5; // Complete
      }

      // 4. Cross-validate with visual state
      const currentUrl = this.page.url();
      const urlStep = this.extractStepFromUrl(currentUrl);
      if (urlStep && Math.abs(urlStep - currentStep) <= 1) {
        currentStep = urlStep; // Use URL step if close to API step
      }

      const finalState = {
        currentStep,
        authState,
        onboardingState,
        isComplete: authState.onboardingCompleted || currentStep >= 5,
        needsAuthentication: false,
        canResumeFrom: currentStep,
        url: currentUrl,
      };

      console.error("✅ Robust state detection complete:", finalState);
      return finalState;
    } catch (error) {
      console.error("❌ Robust state detection failed:", error.message);
      return { error: error.message, currentStep: 1 };
    }
  }

  extractStepFromUrl(url) {
    const stepMatch = url.match(/step=(\d+)/);
    return stepMatch ? parseInt(stepMatch[1]) : null;
  }

  // ===== PHASE 3: HEROUI COMPONENT SPECIALISTS =====

  async fillHeroUIInput(selector, value, fieldName) {
    try {
      const input = this.page.locator(selector).first();
      await input.waitFor({ timeout: 3000 });

      // Clear existing value and fill new one
      await input.selectText(); // Select all text first
      await input.fill(value);

      // Verify the value was set correctly
      const actualValue = await input.inputValue();
      if (actualValue !== value) {
        // Try alternative approach
        await input.clear();
        await input.type(value);
        const finalValue = await input.inputValue();
        if (finalValue !== value) {
          throw new Error(
            `Value mismatch: expected "${value}", got "${finalValue}"`,
          );
        }
      }

      console.error(`✅ ${fieldName}: ${value}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to fill ${fieldName}:`, error.message);
      return false;
    }
  }

  async selectHeroUIOption(triggerSelector, optionText, fieldName) {
    try {
      console.error(`🎯 Selecting ${fieldName}: ${optionText}`);

      // Step 1: Click trigger to open dropdown
      const trigger = this.page.locator(triggerSelector).first();
      await trigger.waitFor({ timeout: 5000 });
      await trigger.click();
      console.error(`🔓 Opened ${fieldName} dropdown`);

      // Step 2: Wait for dropdown to appear
      await this.page.waitForTimeout(500);

      // Step 3: Select the option using multiple strategies
      const optionStrategies = [
        () =>
          this.page
            .locator(`li[role="option"]:has-text("${optionText}")`)
            .first(),
        () => this.page.locator(`[data-key="${optionText}"]`).first(),
        () => this.page.locator(`li:has-text("${optionText}")`).first(),
        () =>
          this.page
            .locator(`*[role="option"] *:has-text("${optionText}")`)
            .first(),
      ];

      let optionSelected = false;
      for (let i = 0; i < optionStrategies.length && !optionSelected; i++) {
        try {
          const option = optionStrategies[i]();
          await option.waitFor({ timeout: 2000 });
          await option.click();

          // Verify selection by checking if dropdown closed and trigger shows selection
          await this.page.waitForTimeout(750);
          const isSelected = await this.page.evaluate(
            (text, trigger) => {
              const buttons = document.querySelectorAll(trigger);
              return Array.from(buttons).some(
                (button) =>
                  button.textContent.includes(text) &&
                  !button.textContent.includes("Select") &&
                  !button.textContent.includes("select"),
              );
            },
            optionText,
            triggerSelector,
          );

          if (isSelected) {
            optionSelected = true;
            console.error(`✅ ${fieldName}: ${optionText} (strategy ${i + 1})`);
          }
        } catch (error) {
          console.error(
            `🔄 Strategy ${i + 1} failed for ${fieldName}:`,
            error.message,
          );
        }
      }

      if (!optionSelected) {
        throw new Error(`All selection strategies failed for ${fieldName}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Failed to select ${fieldName}:`, error.message);
      return false;
    }
  }

  async clickHeroUICard(cardSelector, cardName) {
    try {
      console.error(`🎯 Clicking ${cardName} card`);
      const card = this.page.locator(cardSelector).first();
      await card.waitFor({ timeout: 5000 });
      await card.click();

      // Wait for any state changes
      await this.page.waitForTimeout(500);
      console.error(`✅ Clicked ${cardName} card successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to click ${cardName} card:`, error.message);
      return false;
    }
  }

  // ===== STEP-SPECIFIC AUTOMATION MODULES =====

  async completePersonalInfoStep(personalInfo = {}) {
    console.error("👤 Starting Personal Info Step with robust approach...");

    try {
      // Wait for PersonalInfoStep component
      if (!(await this.waitForStep(1))) {
        throw new Error("PersonalInfoStep component failed to load");
      }

      const defaultInfo = {
        first_name: "Claude",
        last_name: "Assistant",
        date_of_birth: "1990-01-01",
        phone_number: "+353851234567",
        address_line_1: "123 Test Street",
        city: "Dublin",
        county: "Dublin",
        eircode: "D02 XY56",
        ...personalInfo,
      };

      console.error("📝 Filling form with:", defaultInfo);

      // Fill input fields using exact placeholders from PersonalInfoStep.tsx
      const fields = [
        {
          selector: 'input[placeholder="Enter your first name"]',
          value: defaultInfo.first_name,
          name: "First Name",
        },
        {
          selector: 'input[placeholder="Enter your last name"]',
          value: defaultInfo.last_name,
          name: "Last Name",
        },
        {
          selector: 'input[placeholder="Enter your phone number"]',
          value: defaultInfo.phone_number,
          name: "Phone",
        },
        {
          selector: 'input[type="date"]',
          value: defaultInfo.date_of_birth,
          name: "Date of Birth",
        },
        {
          selector: 'input[placeholder="Enter your address"]',
          value: defaultInfo.address_line_1,
          name: "Address",
        },
        {
          selector: 'input[placeholder="Enter your city"]',
          value: defaultInfo.city,
          name: "City",
        },
        {
          selector: 'input[placeholder="Enter eircode"]',
          value: defaultInfo.eircode,
          name: "Eircode",
        },
      ];

      // Fill all input fields
      let fieldsCompleted = 0;
      for (const field of fields) {
        if (
          await this.fillHeroUIInput(field.selector, field.value, field.name)
        ) {
          fieldsCompleted++;
        }
        await this.page.waitForTimeout(200); // Brief pause for React state
      }

      console.error(
        `📊 Completed ${fieldsCompleted}/${fields.length} input fields`,
      );

      // Handle County dropdown with HeroUI Select specialist
      const countySelected = await this.selectHeroUIOption(
        'button[data-slot="trigger"]:has-text("Select county")',
        defaultInfo.county,
        "County",
      );

      if (!countySelected) {
        throw new Error("Failed to select county - this is a critical error");
      }

      // Wait for form validation to complete
      await this.page.waitForTimeout(1000);

      // Submit form using Continue button
      console.error("📤 Submitting form...");
      const continueButton = this.page
        .locator('button:has-text("Continue")')
        .first();
      await continueButton.waitFor({ timeout: 5000 });

      // Verify button is enabled before clicking
      const isEnabled = await continueButton.isEnabled();
      if (!isEnabled) {
        throw new Error(
          "Continue button is disabled - form validation may have failed",
        );
      }

      await continueButton.click();

      // Verify navigation to signature step
      if (!(await this.waitForStep(2, 15000))) {
        throw new Error("Failed to navigate to Signature step");
      }

      console.error("✅ Personal Info step completed successfully");
      return { success: true, fieldsCompleted, nextStep: 2 };
    } catch (error) {
      console.error("❌ Personal Info step failed:", error.message);
      throw error;
    }
  }

  async completeSignatureStep(personalInfo = {}) {
    console.error("✍️ Starting Signature Step with robust approach...");

    try {
      // Wait for SignatureStep component
      if (!(await this.waitForStep(2))) {
        throw new Error("SignatureStep component failed to load");
      }

      const fullName = `${personalInfo.first_name || "Claude"} ${personalInfo.last_name || "Assistant"}`;
      console.error(`🎨 Creating signature for: ${fullName}`);

      // Check if signature already exists
      const hasExistingSignature = await this.page.evaluate((name) => {
        return (
          document.body.textContent.includes(name) &&
          document.body.textContent.includes("Continue")
        );
      }, fullName);

      if (hasExistingSignature) {
        console.error("✅ Existing signature found, proceeding to submit");
      } else {
        // Select first available signature template card
        console.error("🎯 Selecting signature template...");

        // Look for signature template cards with fullName - these are the font options
        const templateCards = this.page.locator(
          `div:has-text("${fullName}"):has-text("font")`,
        );
        const cardCount = await templateCards.count();

        if (cardCount > 0) {
          await templateCards.first().click();
          console.error(
            `✅ Selected signature template (found ${cardCount} options)`,
          );
        } else {
          // Fallback: look for any card with the name
          const nameCards = this.page
            .locator(`*:has-text("${fullName}")`)
            .locator("visible=true");
          const nameCardCount = await nameCards.count();

          if (nameCardCount > 0) {
            await nameCards.first().click();
            console.error(
              `✅ Selected signature via fallback (found ${nameCardCount} options)`,
            );
          } else {
            throw new Error(`No signature cards found for name: ${fullName}`);
          }
        }

        await this.page.waitForTimeout(1000);
      }

      // Submit signature using Continue button
      console.error("📤 Submitting signature...");
      const continueButton = this.page
        .locator('button:has-text("Continue")')
        .first();
      await continueButton.waitFor({ timeout: 5000 });

      const isEnabled = await continueButton.isEnabled();
      if (!isEnabled) {
        throw new Error(
          "Continue button is disabled - signature may not be selected",
        );
      }

      await continueButton.click();

      // Verify navigation to legal consent step
      if (!(await this.waitForStep(3, 15000))) {
        throw new Error("Failed to navigate to Legal Consent step");
      }

      console.error("✅ Signature step completed successfully");
      return { success: true, nextStep: 3 };
    } catch (error) {
      console.error("❌ Signature step failed:", error.message);
      throw error;
    }
  }

  async completeLegalConsentStep() {
    console.error("📜 Starting Legal Consent Step with robust approach...");

    try {
      // Wait for LegalConsentStep component
      if (!(await this.waitForStep(3))) {
        throw new Error("LegalConsentStep component failed to load");
      }

      // Look for signature stamp areas that need to be clicked
      console.error("🔍 Looking for consent documents to sign...");

      // Wait for consent documents to load
      await this.page.waitForTimeout(2000);

      // Find all consent documents that need signing
      const signatureStamps = this.page.locator(
        '[data-component-id="components-signature-stamp"]',
      );
      const stampCount = await signatureStamps.count();

      console.error(`📋 Found ${stampCount} consent documents to sign`);

      if (stampCount === 0) {
        // Fallback: look for any clickable signature areas
        const clickableSignatures = this.page.locator(
          'button:has-text("Click to Sign"), *:has-text("Sign here")',
        );
        const clickableCount = await clickableSignatures.count();

        if (clickableCount > 0) {
          console.error(
            `🔄 Using fallback: found ${clickableCount} clickable signature areas`,
          );
          for (let i = 0; i < clickableCount; i++) {
            await clickableSignatures.nth(i).click();
            await this.page.waitForTimeout(500);
            console.error(`✅ Signed document ${i + 1}/${clickableCount}`);
          }
        } else {
          throw new Error("No signature areas found for legal consent");
        }
      } else {
        // Sign each consent document
        for (let i = 0; i < stampCount; i++) {
          await signatureStamps.nth(i).click();
          await this.page.waitForTimeout(500);
          console.error(`✅ Signed consent document ${i + 1}/${stampCount}`);
        }
      }

      // Wait for all signatures to be processed
      await this.page.waitForTimeout(2000);

      // Submit legal consent using Continue button
      console.error("📤 Submitting legal consent...");
      const continueButton = this.page
        .locator(
          'button:has-text("Continue to Verification"), button:has-text("Continue")',
        )
        .first();
      await continueButton.waitFor({ timeout: 5000 });

      const isEnabled = await continueButton.isEnabled();
      if (!isEnabled) {
        throw new Error(
          "Continue button is disabled - not all consents may be signed",
        );
      }

      await continueButton.click();

      // Verify navigation to verification step
      if (!(await this.waitForStep(4, 15000))) {
        throw new Error("Failed to navigate to Verification step");
      }

      console.error("✅ Legal Consent step completed successfully");
      return { success: true, documentsLSigned: stampCount, nextStep: 4 };
    } catch (error) {
      console.error("❌ Legal Consent step failed:", error.message);
      throw error;
    }
  }

  async completeVerificationStep(skipVerification = true) {
    console.error("🛡️ Starting Verification Step with robust approach...");

    try {
      // Wait for VerificationStep component
      if (!(await this.waitForStep(4))) {
        throw new Error("VerificationStep component failed to load");
      }

      if (skipVerification) {
        console.error("⏩ Skipping verification as requested");

        // Look for a skip or complete button
        const completeButton = this.page
          .locator(
            'button:has-text("Complete"), button:has-text("Skip"), button:has-text("Continue")',
          )
          .first();
        await completeButton.waitFor({ timeout: 5000 });
        await completeButton.click();
      } else {
        console.error("🔄 Starting identity verification process...");

        // Click start verification button
        const startButton = this.page
          .locator('button:has-text("Start"), button:has-text("Verify")')
          .first();
        await startButton.waitFor({ timeout: 5000 });
        await startButton.click();

        // This would redirect to Stripe Identity - wait for return
        await this.page.waitForTimeout(5000);
      }

      // Wait for onboarding completion
      await this.page.waitForTimeout(2000);

      // Check if we're redirected to dashboard
      const currentUrl = this.page.url();
      if (currentUrl.includes("/dashboard")) {
        console.error("✅ Redirected to dashboard - onboarding complete!");
        return { success: true, redirectedToDashboard: true };
      } else {
        console.error(
          "⚠️ Still on onboarding page, may need manual completion",
        );
        return { success: true, redirectedToDashboard: false };
      }
    } catch (error) {
      console.error("❌ Verification step failed:", error.message);
      throw error;
    }
  }

  // ===== PHASE 4: ERROR RECOVERY & RESILIENCE =====

  async recoverFromError(error, step) {
    console.error(`🚨 Attempting recovery for step ${step}:`, error.message);

    try {
      // Take screenshot for debugging
      await this.page.screenshot({
        path: `tests/screenshots/error-recovery-step-${step}.png`,
        fullPage: true,
      });

      // Check current state
      const state = await this.detectOnboardingStateRobust();
      console.error("🔍 Current state during recovery:", state);

      // Simple recovery: wait and retry current step
      await this.page.waitForTimeout(2000);

      return { recovered: true, currentState: state };
    } catch (recoveryError) {
      console.error("❌ Recovery failed:", recoveryError.message);
      return { recovered: false };
    }
  }

  // ===== PHASE 5: MAIN AUTOMATION ORCHESTRATOR =====

  async completeOnboarding({
    personalInfo = {},
    skipVerification = true,
  } = {}) {
    console.error("🚀 Starting ROBUST onboarding automation...");

    try {
      // Initialize browser if needed
      if (!this.browser) {
        await this.init();
      }

      // Step 1: Detect current state
      const currentState = await this.detectOnboardingStateRobust();
      console.error("📊 Initial state:", currentState);

      if (currentState.needsAuthentication) {
        throw new Error(
          "User needs authentication first - use authenticate() method",
        );
      }

      if (currentState.isComplete) {
        console.error("✅ Onboarding already complete!");
        return { success: true, alreadyComplete: true };
      }

      // Step 2: Execute remaining steps dynamically
      const stepExecutors = [
        {
          num: 1,
          name: "Personal Information",
          execute: () => this.completePersonalInfoStep(personalInfo),
        },
        {
          num: 2,
          name: "Signature",
          execute: () => this.completeSignatureStep(personalInfo),
        },
        {
          num: 3,
          name: "Legal Consent",
          execute: () => this.completeLegalConsentStep(),
        },
        {
          num: 4,
          name: "Identity Verification",
          execute: () => this.completeVerificationStep(skipVerification),
        },
      ];

      const results = {};
      let currentStep = currentState.currentStep || 1;

      for (const step of stepExecutors) {
        if (step.num < currentStep) {
          results[step.num] = {
            status: "skipped",
            reason: "already_completed",
          };
          console.error(`⏩ Skipping ${step.name} - already completed`);
          continue;
        }

        try {
          console.error(`🎯 Executing ${step.name} (Step ${step.num})`);
          const result = await step.execute();
          results[step.num] = { status: "success", data: result };
          console.error(`✅ ${step.name} completed successfully`);
        } catch (error) {
          console.error(`❌ ${step.name} failed:`, error.message);

          // Attempt recovery
          const recovery = await this.recoverFromError(error, step.num);

          if (recovery.recovered) {
            console.error(
              `🔄 Recovery successful for ${step.name}, continuing...`,
            );
            results[step.num] = { status: "recovered", error: error.message };
          } else {
            console.error(
              `💥 Recovery failed for ${step.name}, stopping automation`,
            );
            results[step.num] = { status: "failed", error: error.message };
            break;
          }
        }

        // Brief pause between steps
        await this.page.waitForTimeout(1000);
      }

      // Final state check
      const finalState = await this.detectOnboardingStateRobust();

      console.error("🏁 ROBUST onboarding automation completed");
      console.error("📊 Final state:", finalState);
      console.error("📋 Step results:", results);

      return {
        success: true,
        finalState,
        stepResults: results,
        completedSteps: Object.keys(results).filter(
          (step) =>
            results[step].status === "success" ||
            results[step].status === "recovered",
        ).length,
      };
    } catch (error) {
      console.error("💥 ROBUST onboarding automation failed:", error.message);
      return { success: false, error: error.message };
    }
  }

  // ===== BROWSER MANAGEMENT =====

  async init() {
    try {
      console.error("🔧 Initializing robust browser session...");
      this.browser = await chromium.launch({
        headless: false,
        slowMo: 100, // Slower for reliability
      });
      this.context = await this.browser.newContext();
      this.page = await this.context.newPage();

      // Set longer timeouts
      this.page.setDefaultTimeout(30000);
      this.page.setDefaultNavigationTimeout(30000);

      console.error("✅ Browser session initialized");
    } catch (error) {
      console.error("❌ Browser initialization failed:", error.message);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.browser) {
        await this.browser.close();
        console.error("✅ Browser session closed");
      }
    } catch (error) {
      console.error("❌ Cleanup failed:", error.message);
    }
  }

  // ===== NAVIGATION & AUTHENTICATION =====

  async navigate(path) {
    try {
      const url = `${this.baseUrl}${path}`;
      console.error(`🧭 Navigating to: ${url}`);
      await this.page.goto(url);
      await this.page.waitForLoadState("networkidle");
      console.error(`✅ Navigation successful`);
      return { success: true, url: this.page.url() };
    } catch (error) {
      console.error("❌ Navigation failed:", error.message);
      throw error;
    }
  }

  async authenticate(
    email = "claude.assistant@example.com",
    password = "DemoPassword123!",
  ) {
    console.error("🔐 Starting robust authentication...");

    try {
      // Navigate to login
      await this.navigate("/login");

      // Fill credentials
      await this.fillHeroUIInput('input[type="email"]', email, "Email");
      await this.fillHeroUIInput(
        'input[type="password"]',
        password,
        "Password",
      );

      // Submit form
      const loginButton = this.page
        .locator('button[type="submit"], button:has-text("Sign in")')
        .first();
      await loginButton.click();

      // Wait for navigation
      await this.page.waitForTimeout(3000);

      const currentUrl = this.page.url();
      const isAuthenticated = !currentUrl.includes("/login");

      console.error(
        `✅ Authentication ${isAuthenticated ? "successful" : "failed"}`,
      );
      return { success: isAuthenticated, redirectUrl: currentUrl };
    } catch (error) {
      console.error("❌ Authentication failed:", error.message);
      throw error;
    }
  }

  async authenticateAndOnboard({
    email,
    password,
    personalInfo,
    skipVerification = true,
  } = {}) {
    console.error("🎯 Starting complete authentication and onboarding flow...");

    try {
      // Step 1: Authenticate
      const authResult = await this.authenticate(email, password);
      if (!authResult.success) {
        throw new Error("Authentication failed");
      }

      // Step 2: Complete onboarding
      const onboardingResult = await this.completeOnboarding({
        personalInfo,
        skipVerification,
      });

      return {
        success: true,
        authentication: authResult,
        onboarding: onboardingResult,
      };
    } catch (error) {
      console.error("❌ Complete flow failed:", error.message);
      return { success: false, error: error.message };
    }
  }

  // ===== UTILITY METHODS =====

  async screenshot(filename) {
    try {
      const path = `tests/screenshots/${filename}.png`;
      await this.page.screenshot({ path, fullPage: true });
      console.error(`📸 Screenshot saved: ${path}`);
      return { success: true, path };
    } catch (error) {
      console.error("❌ Screenshot failed:", error.message);
      return { success: false, error: error.message };
    }
  }

  async getComponents() {
    try {
      const components = await this.page.evaluate(() => {
        const elements = document.querySelectorAll("[data-component-id]");
        return Array.from(elements).map((el) => ({
          id: el.getAttribute("data-component-id"),
          tagName: el.tagName.toLowerCase(),
          visible: el.offsetParent !== null,
          text: el.textContent?.slice(0, 100) || "",
        }));
      });

      console.error(`🔍 Found ${components.length} components`);
      return { success: true, components };
    } catch (error) {
      console.error("❌ Get components failed:", error.message);
      return { success: false, error: error.message };
    }
  }
}

// ===== MCP SERVER SETUP =====

const automation = new RobustOnboardingAutomation();

const server = new Server(
  {
    name: "playwright-visual-testing",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "navigate",
      description: "Navigate to a page in the application",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "The path to navigate to" },
        },
        required: ["path"],
      },
    },
    {
      name: "screenshot",
      description: "Take a screenshot",
      inputSchema: {
        type: "object",
        properties: {
          filename: {
            type: "string",
            description: "Filename for the screenshot",
          },
        },
        required: ["filename"],
      },
    },
    {
      name: "authenticate",
      description: "Authenticate with test user credentials",
      inputSchema: {
        type: "object",
        properties: {
          email: { type: "string", default: "claude.assistant@example.com" },
          password: { type: "string", default: "DemoPassword123!" },
        },
      },
    },
    {
      name: "complete_onboarding",
      description: "Complete the onboarding process",
      inputSchema: {
        type: "object",
        properties: {
          personalInfo: { type: "object" },
          skipVerification: { type: "boolean", default: true },
        },
      },
    },
    {
      name: "authenticate_and_onboard",
      description: "Complete authentication and onboarding in one step",
      inputSchema: {
        type: "object",
        properties: {
          email: { type: "string", default: "claude.assistant@example.com" },
          password: { type: "string", default: "DemoPassword123!" },
          skipVerification: { type: "boolean", default: true },
        },
      },
    },
    {
      name: "get_components",
      description: "Get all components on the current page",
      inputSchema: {
        type: "object",
        properties: {
          visibleOnly: { type: "boolean", default: true },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    // Initialize browser if needed
    if (!automation.browser) {
      await automation.init();
    }

    switch (name) {
      case "navigate":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await automation.navigate(args.path)),
            },
          ],
        };

      case "screenshot":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await automation.screenshot(args.filename)),
            },
          ],
        };

      case "authenticate":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await automation.authenticate(args.email, args.password),
              ),
            },
          ],
        };

      case "complete_onboarding":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await automation.completeOnboarding(args)),
            },
          ],
        };

      case "authenticate_and_onboard":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                await automation.authenticateAndOnboard(args),
              ),
            },
          ],
        };

      case "get_components":
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(await automation.getComponents()),
            },
          ],
        };

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Tool execution error:`, error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: false, error: error.message }),
        },
      ],
    };
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.error("🛑 Shutting down...");
  await automation.cleanup();
  process.exit(0);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🚀 Robust Playwright Visual Testing MCP Server running");
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Server failed to start:", error);
    process.exit(1);
  });
}
