import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium } from "playwright";

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
      "🔍 Detecting onboarding state with enhanced API-first approach...",
    );

    try {
      // 1. Check authentication first with retry logic
      const authState = await this.page.evaluate(async () => {
        const maxRetries = 3;
        let lastError = null;

        for (let i = 0; i < maxRetries; i++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch("/api/auth/session", {
              signal: controller.signal,
              headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              return {
                isAuthenticated: !!data.user,
                user: data.user,
                onboardingCompleted: data.user?.onboarding_completed || false,
                apiStatus: "success",
                attempt: i + 1,
              };
            } else {
              lastError = {
                status: response.status,
                statusText: response.statusText,
              };
            }
          } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
              // Wait before retry
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        return {
          isAuthenticated: false,
          error: lastError?.message || lastError,
          apiStatus: "failed",
        };
      });

      if (!authState.isAuthenticated) {
        // If auth check failed, try to determine from page state
        const pageState = await this.getCurrentPageState();
        const isOnDashboard = pageState.pathname?.includes("/dashboard");

        if (isOnDashboard) {
          console.error(
            "⚠️ Auth API failed but user appears to be on dashboard",
          );
          return {
            currentStep: 5,
            needsAuthentication: false,
            isComplete: true,
            authState: { isAuthenticated: true, apiFailure: true },
            warning: "Authentication API failed but user appears authenticated",
          };
        }

        return {
          currentStep: 0,
          needsAuthentication: true,
          isComplete: false,
          authState,
        };
      }

      // 2. Get onboarding status via API with enhanced error handling
      const onboardingState = await this.page.evaluate(async () => {
        const maxRetries = 3;
        let lastError = null;

        for (let i = 0; i < maxRetries; i++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch("/api/onboarding/status", {
              signal: controller.signal,
              headers: {
                "Cache-Control": "no-cache",
                Pragma: "no-cache",
              },
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              return {
                currentStep: data.currentStep,
                isComplete: data.isComplete,
                user: data.user,
                onboardingStatus: data.onboardingStatus,
                stepsCompleted: {
                  personalInfo: data.user?.personal_info_completed || false,
                  signature: data.user?.signature_completed || false,
                  legalConsent: data.user?.legal_consent_completed || false,
                  verification: data.user?.verification_completed || false,
                },
                apiStatus: "success",
                attempt: i + 1,
              };
            } else if (response.status === 401) {
              // Re-authentication required
              return {
                authenticationRequired: true,
                status: response.status,
              };
            } else {
              lastError = {
                status: response.status,
                statusText: response.statusText,
              };
            }
          } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        return {
          error: lastError?.message || lastError,
          apiStatus: "failed",
        };
      });

      // Handle API failure by falling back to visual state detection
      if (onboardingState.error || onboardingState.apiStatus === "failed") {
        console.error(
          "⚠️ Onboarding API failed, falling back to visual state detection...",
        );

        const pageState = await this.getCurrentPageState();
        let currentStep = pageState.step || 1;
        let isComplete = pageState.pathname?.includes("/dashboard") || false;

        return {
          currentStep,
          authState,
          onboardingState: { apiFailure: true, fallbackUsed: true },
          isComplete,
          needsAuthentication: false,
          canResumeFrom: currentStep,
          url: this.page.url(),
          warning: "Used visual state detection due to API failure",
        };
      }

      // Handle re-authentication required
      if (onboardingState.authenticationRequired) {
        return {
          currentStep: 0,
          needsAuthentication: true,
          isComplete: false,
          authState: { isAuthenticated: false, sessionExpired: true },
        };
      }

      // 3. Determine current step from API data with visual validation
      let currentStep = 1;
      if (onboardingState && onboardingState.stepsCompleted) {
        const steps = onboardingState.stepsCompleted;
        if (steps.personalInfo && !steps.signature) currentStep = 2;
        else if (steps.signature && !steps.legalConsent) currentStep = 3;
        else if (steps.legalConsent && !steps.verification) currentStep = 4;
        else if (steps.verification) currentStep = 5; // Complete
      }

      // 4. Cross-validate with visual state for accuracy
      const pageState = await this.getCurrentPageState();
      const visualStep = pageState.step;
      const currentUrl = this.page.url();

      // Use visual step if it makes sense or if there's a significant discrepancy
      if (visualStep && Math.abs(visualStep - currentStep) > 1) {
        console.error(
          `⚠️ Step discrepancy: API says ${currentStep}, visual says ${visualStep}. Using visual.`,
        );
        currentStep = visualStep;
      }

      const finalState = {
        currentStep,
        authState,
        onboardingState,
        pageState,
        isComplete:
          authState.onboardingCompleted ||
          currentStep >= 5 ||
          pageState.pathname?.includes("/dashboard"),
        needsAuthentication: false,
        canResumeFrom: currentStep,
        url: currentUrl,
        apiHealth: {
          auth: authState.apiStatus,
          onboarding: onboardingState.apiStatus,
        },
      };

      console.error("✅ Enhanced state detection complete:", finalState);
      return finalState;
    } catch (error) {
      console.error("❌ Enhanced state detection failed:", error.message);

      // Final fallback to basic visual detection
      try {
        const pageState = await this.getCurrentPageState();
        return {
          error: error.message,
          currentStep: pageState.step || 1,
          fallbackState: pageState,
          isComplete: pageState.pathname?.includes("/dashboard") || false,
        };
      } catch (fallbackError) {
        return {
          error: error.message,
          fallbackError: fallbackError.message,
          currentStep: 1,
        };
      }
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

  async selectHeroUICountyDropdown(countyName) {
    try {
      console.error(`🏷️ Selecting county: ${countyName}`);

      // Strategy 1: Find the HeroUI Select with "County" label
      const selectTriggers = [
        // Look for button with data-slot="trigger" inside a select with County label
        () =>
          this.page
            .locator('button[data-slot="trigger"]')
            .filter({ has: this.page.locator("text=County") }),
        // Look for any button with "Select county" text
        () => this.page.locator('button:has-text("Select county")'),
        // Look for HeroUI select trigger near County label
        () =>
          this.page
            .locator('[data-slot="trigger"]')
            .filter({ hasText: /county|County/ }),
        // Fallback: any trigger button in the county area
        () =>
          this.page
            .locator('label:has-text("County")')
            .locator("..")
            .locator('button[data-slot="trigger"]'),
      ];

      let dropdownOpened = false;
      let triggerElement = null;

      // Try different strategies to open the dropdown
      for (let i = 0; i < selectTriggers.length && !dropdownOpened; i++) {
        try {
          const trigger = selectTriggers[i]();
          const count = await trigger.count();

          if (count > 0) {
            triggerElement = trigger.first();
            await triggerElement.waitFor({ timeout: 3000 });
            await triggerElement.click();

            // Wait for dropdown to appear
            await this.page.waitForTimeout(500);

            // Check if dropdown is open by looking for listbox or options
            const dropdownVisible =
              (await this.page
                .locator('[role="listbox"], [data-slot="listbox"]')
                .count()) > 0;

            if (dropdownVisible) {
              dropdownOpened = true;
              console.error(
                `✅ County dropdown opened using strategy ${i + 1}`,
              );
              break;
            }
          }
        } catch (error) {
          console.error(
            `🔄 County dropdown strategy ${i + 1} failed:`,
            error.message,
          );
        }
      }

      if (!dropdownOpened) {
        throw new Error("Could not open county dropdown with any strategy");
      }

      // Now select the county option
      const optionStrategies = [
        // Look for exact text match in SelectItem
        () => this.page.locator(`[data-key="${countyName}"]`),
        // Look for text content match
        () => this.page.locator(`li:has-text("${countyName}")`),
        // Look for option role with text
        () => this.page.locator(`[role="option"]:has-text("${countyName}")`),
        // Look in listbox
        () => this.page.locator(`[role="listbox"] *:has-text("${countyName}")`),
      ];

      let optionSelected = false;

      for (let i = 0; i < optionStrategies.length && !optionSelected; i++) {
        try {
          const option = optionStrategies[i]();
          const optionCount = await option.count();

          if (optionCount > 0) {
            await option.first().click();

            // Wait for selection to process
            await this.page.waitForTimeout(750);

            // Verify selection by checking if the trigger now shows the county name
            const selectionVerified = await this.page.evaluate((county) => {
              // Look for any element that now contains the county name
              const buttons = document.querySelectorAll(
                'button[data-slot="trigger"]',
              );
              return Array.from(buttons).some(
                (button) =>
                  button.textContent.includes(county) &&
                  !button.textContent.includes("Select"),
              );
            }, countyName);

            if (selectionVerified) {
              optionSelected = true;
              console.error(
                `✅ County "${countyName}" selected using strategy ${i + 1}`,
              );
              break;
            }
          }
        } catch (error) {
          console.error(
            `🔄 County option strategy ${i + 1} failed:`,
            error.message,
          );
        }
      }

      if (!optionSelected) {
        throw new Error(
          `Failed to select county "${countyName}" with all strategies`,
        );
      }

      return true;
    } catch (error) {
      console.error(
        `❌ Failed to select county "${countyName}":`,
        error.message,
      );
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

      // Fill input fields using enhanced testid selectors
      const fields = [
        {
          selector: '[data-testid="first-name-input"]',
          fallback: 'input[placeholder="Enter your first name"]',
          value: defaultInfo.first_name,
          name: "First Name",
        },
        {
          selector: '[data-testid="last-name-input"]',
          fallback: 'input[placeholder="Enter your last name"]',
          value: defaultInfo.last_name,
          name: "Last Name",
        },
        {
          selector: '[data-testid="phone-number-input"]',
          fallback: 'input[placeholder="Enter your phone number"]',
          value: defaultInfo.phone_number,
          name: "Phone",
        },
        {
          selector: '[data-testid="date-of-birth-input"]',
          fallback: 'input[type="date"]',
          value: defaultInfo.date_of_birth,
          name: "Date of Birth",
        },
        {
          selector: '[data-testid="address-line-1-input"]',
          fallback: 'input[placeholder="Enter your street address"]',
          value: defaultInfo.address_line_1,
          name: "Address Line 1",
        },
        {
          selector: '[data-testid="city-input"]',
          fallback: 'input[placeholder="Enter city or town"]',
          value: defaultInfo.city,
          name: "City",
        },
        {
          selector: '[data-testid="eircode-input"]',
          fallback: 'input[placeholder="Enter eircode"]',
          value: defaultInfo.eircode,
          name: "Eircode",
        },
      ];

      // PHASE 5: NUCLEAR FORM TARGETING
      console.error("🚀 PHASE 5: NUCLEAR FORM TARGETING ACTIVATED");
      let fieldsCompleted = 0;

      for (const field of fields) {
        console.error(`📝 NUCLEAR TARGETING: ${field.name}`);

        try {
          // Convert legacy field config to nuclear targeting config
          const nuclearField = {
            name: field.name,
            placeholder: field.selector.includes("placeholder")
              ? field.selector.match(/placeholder="([^"]+)"/)?.[1] || field.name
              : field.name,
            value: field.value,
            type: field.selector.includes('type="date"') ? "date" : "text",
          };

          await this.findAndFillFormField(nuclearField);
          fieldsCompleted++;
        } catch (nuclearError) {
          console.error(
            `❌ NUCLEAR TARGETING FAILED for ${field.name}:`,
            nuclearError.message,
          );

          // Enhanced fallback with testid AND placeholder selector
          console.error(`🔄 Attempting enhanced fallback for ${field.name}...`);
          let fallbackSuccess = false;

          // Try testid selector first
          if (
            await this.fillHeroUIInput(field.selector, field.value, field.name)
          ) {
            fallbackSuccess = true;
          }
          // Then try original placeholder fallback
          else if (
            field.fallback &&
            (await this.fillHeroUIInput(
              field.fallback,
              field.value,
              field.name,
            ))
          ) {
            fallbackSuccess = true;
          }

          if (fallbackSuccess) {
            fieldsCompleted++;
            console.error(`✅ Enhanced fallback successful for ${field.name}`);
          } else {
            console.error(`💥 COMPLETE FAILURE for ${field.name}`);
            throw new Error(
              `NUCLEAR FORM FIELD FAILURE: ${field.name} - ${nuclearError.message}`,
            );
          }
        }

        await this.page.waitForTimeout(200); // Brief pause for React state
      }

      console.error(
        `📊 Completed ${fieldsCompleted}/${fields.length} input fields`,
      );

      // PHASE 5: NUCLEAR COUNTY DROPDOWN TARGETING
      console.error("🏷️ NUCLEAR COUNTY TARGETING ACTIVATED...");

      try {
        // Try enhanced testid selector first
        const countySelect = this.page
          .locator('[data-testid="county-select"]')
          .first();
        await countySelect.waitFor({ timeout: 5000 });
        await countySelect.click();

        // Wait for dropdown to open and select the county
        await this.page.waitForTimeout(500);
        const countyOption = this.page
          .locator(`li[data-key="${defaultInfo.county}"]`)
          .first();
        await countyOption.waitFor({ timeout: 3000 });
        await countyOption.click();

        console.error(`✅ ENHANCED COUNTY SELECTION: ${defaultInfo.county}`);
      } catch (enhancedError) {
        console.error(
          `❌ ENHANCED COUNTY TARGETING FAILED:`,
          enhancedError.message,
        );

        try {
          // Nuclear fallback
          const countyResult = await this.findAndSelectOption({
            label: "County",
            option: defaultInfo.county,
          });

          if (countyResult.triggerResult && countyResult.optionResult) {
            console.error(`✅ NUCLEAR COUNTY SELECTION: ${defaultInfo.county}`);
          } else {
            throw new Error("Nuclear county selection failed");
          }
        } catch (nuclearCountyError) {
          console.error(
            `❌ NUCLEAR COUNTY TARGETING FAILED:`,
            nuclearCountyError.message,
          );

          // Fallback to legacy method
          console.error("🔄 Attempting legacy county selection...");
          const countySelected = await this.selectHeroUICountyDropdown(
            defaultInfo.county,
          );

          if (!countySelected) {
            throw new Error(
              `COUNTY FAILURE: Enhanced: ${enhancedError.message}, Nuclear: ${nuclearCountyError.message}, Legacy also failed`,
            );
          } else {
            console.error(
              `✅ Legacy county selection successful: ${defaultInfo.county}`,
            );
          }
        }
      }

      // Wait for form validation to complete
      await this.page.waitForTimeout(1000);

      // Submit form using enhanced Continue button targeting
      console.error("📤 Submitting form...");
      let continueButton = this.page
        .locator('[data-testid="continue-button"]')
        .first();

      try {
        await continueButton.waitFor({ timeout: 5000 });
      } catch (e) {
        console.error(
          "🔄 Testid selector failed, falling back to text selector...",
        );
        continueButton = this.page
          .locator('button:has-text("Continue")')
          .first();
        await continueButton.waitFor({ timeout: 5000 });
      }

      // Verify button is enabled before clicking
      const isEnabled = await continueButton.isEnabled();
      if (!isEnabled) {
        throw new Error(
          "Continue button is disabled - form validation may have failed",
        );
      }

      console.error("🚀 Clicking Continue button with enhanced targeting...");
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
    console.error("✍️ PHASE 1: NUCLEAR SIGNATURE STEP IMPLEMENTATION...");

    try {
      // Wait for SignatureStep component
      if (!(await this.waitForStep(2))) {
        throw new Error("SignatureStep component failed to load");
      }

      // Get user's full name for signature with enhanced detection
      const fullName = await this.page.evaluate((info) => {
        // Try to get from passed personalInfo first
        if (info.first_name && info.last_name) {
          return `${info.first_name} ${info.last_name}`.trim();
        }

        // Try to get from localStorage (saved during personal info)
        const progress = localStorage.getItem("onboarding-progress");
        if (progress) {
          try {
            const parsed = JSON.parse(progress);
            if (
              parsed.personalInfo &&
              parsed.personalInfo.first_name &&
              parsed.personalInfo.last_name
            ) {
              return `${parsed.personalInfo.first_name} ${parsed.personalInfo.last_name}`.trim();
            }
          } catch {}
        }

        // Try to get from auth context or any displayed name
        const bodyText = document.body.textContent || "";
        const nameMatches = bodyText.match(/([A-Z][a-z]+)\s+([A-Z][a-z]+)/g);
        if (nameMatches) {
          // Return first reasonable name match
          for (const match of nameMatches) {
            if (
              match.length > 5 &&
              match.length < 50 &&
              !match.includes("Create") &&
              !match.includes("Step")
            ) {
              return match;
            }
          }
        }

        return "Claude Assistant";
      }, personalInfo);

      console.error(`👤 Using full name for signature: "${fullName}"`);

      // DETECT CURRENT SIGNATURE UI STATE
      const uiState = await this.page.evaluate((name) => {
        const bodyText = document.body.textContent || "";

        return {
          // Screen type detection
          hasInitialChoice:
            bodyText.includes("Create Your Digital Signature") &&
            bodyText.includes("Text Signature"),
          hasFontSelection: bodyText.includes("Choose Your Signature Style"),

          // Component detection
          hasTextSignatureCard: !!Array.from(
            document.querySelectorAll("h4"),
          ).find((h4) => h4.textContent.includes("Text Signature")),
          hasUploadCard: !!Array.from(document.querySelectorAll("h4")).find(
            (h4) => h4.textContent.includes("Upload Signature"),
          ),
          hasFontCards:
            document.querySelectorAll('div[class*="text-3xl"]').length > 0,

          // State indicators
          hasFullNamePreview: bodyText.includes(name),
          hasSelectedCard: !!document.querySelector(
            ".border-primary-500, .bg-primary-50",
          ),
          continueEnabled: !Array.from(
            document.querySelectorAll("button"),
          ).find((btn) => btn.textContent.includes("Continue"))?.disabled,

          // Debug info
          allFontElements: Array.from(
            document.querySelectorAll('div[class*="text-3xl"]'),
          ).map((el) => ({
            text: el.textContent?.trim(),
            classes: el.className,
            hasName: el.textContent?.includes(name),
          })),

          bodyTextSample: bodyText.substring(0, 300),
        };
      }, fullName);

      console.error("🔍 SIGNATURE UI STATE:", uiState);

      // PHASE 1.1: HANDLE INITIAL SIGNATURE TYPE SELECTION (if needed)
      if (
        uiState.hasInitialChoice &&
        uiState.hasTextSignatureCard &&
        !uiState.hasFontSelection
      ) {
        console.error(
          "📝 PHASE 1.1: Clicking Text Signature card to enter font selection...",
        );

        const textSignatureSelectors = [
          // Most specific: Target the Card containing "Text Signature" heading
          'div[data-slot="base"]:has(h4:has-text("Text Signature"))',
          // Target the pressable Card itself
          '[data-pressable="true"]:has(h4:has-text("Text Signature"))',
          // Generic card targeting
          '.cursor-pointer:has(h4:has-text("Text Signature"))',
          // Fallback: any clickable element with Text Signature
          '*:has(h4:has-text("Text Signature"))',
        ];

        let textCardClicked = false;
        for (
          let i = 0;
          i < textSignatureSelectors.length && !textCardClicked;
          i++
        ) {
          try {
            const selector = textSignatureSelectors[i];
            console.error(`🎯 Trying selector ${i + 1}: ${selector}`);

            const element = this.page.locator(selector);
            const count = await element.count();

            if (count > 0) {
              await element.first().click();
              await this.page.waitForTimeout(2000);

              // Verify we moved to font selection
              const movedToFonts = await this.page.evaluate(() => {
                return (
                  document.body.textContent.includes(
                    "Choose Your Signature Style",
                  ) ||
                  document.querySelectorAll('div[class*="text-3xl"]').length > 0
                );
              });

              if (movedToFonts) {
                textCardClicked = true;
                console.error(
                  `✅ Text Signature card clicked successfully with selector ${i + 1}`,
                );
                break;
              }
            }
          } catch (error) {
            console.error(`🔄 Selector ${i + 1} failed:`, error.message);
          }
        }

        if (!textCardClicked) {
          throw new Error(
            "Failed to click Text Signature card - no selectors worked",
          );
        }

        // Wait for font selection screen to load
        await this.page.waitForTimeout(1500);
      }

      if (hasExistingSignature) {
        console.error("✅ Existing signature found, proceeding to submit");
      } else {
        // Select signature template using enhanced HeroUI Card component targeting
        console.error(
          "🎯 Selecting signature template card with enhanced approach...",
        );

        // First, check if we're on the signature choice screen or the font selection screen
        const signatureState = await this.page.evaluate((name) => {
          const bodyText = document.body.textContent;
          return {
            hasChoiceScreen:
              bodyText.includes("Create Your Digital Signature") &&
              bodyText.includes("Text Signature"),
            hasFontSelection:
              bodyText.includes("Choose Your Signature Style") ||
              bodyText.includes("font"),
            hasTextSignatureCard: !!Array.from(
              document.querySelectorAll("h4"),
            ).find((h4) => h4.textContent.includes("Text Signature")),
            hasFullNamePreview: bodyText.includes(name),
          };
        }, fullName);

        console.error("📊 Signature state:", signatureState);

        if (
          signatureState.hasChoiceScreen &&
          signatureState.hasTextSignatureCard
        ) {
          // We're on the signature choice screen - click "Text Signature" card
          console.error("📝 Clicking Text Signature card...");

          const textSignatureCardStrategies = [
            // Look for the Card with "Text Signature" heading
            () =>
              this.page
                .locator('h4:has-text("Text Signature")')
                .locator("..")
                .locator("..")
                .locator(".."),
            // Look for pressable Card with Text Signature content
            () =>
              this.page.locator(
                '[data-pressable="true"]:has(h4:has-text("Text Signature"))',
              ),
            // Look for Card component containing "Text Signature"
            () =>
              this.page.locator(
                'div[data-slot="base"]:has(h4:has-text("Text Signature"))',
              ),
            // Fallback: any clickable element containing "Text Signature"
            () =>
              this.page
                .locator('*:has(h4:has-text("Text Signature"))')
                .filter({ hasText: /cursor-pointer|pressable/ }),
          ];

          let textCardClicked = false;
          for (
            let i = 0;
            i < textSignatureCardStrategies.length && !textCardClicked;
            i++
          ) {
            try {
              const card = textSignatureCardStrategies[i]();
              const cardCount = await card.count();

              if (cardCount > 0) {
                await card.first().click();
                await this.page.waitForTimeout(1500);

                // Check if we've moved to font selection screen
                const movedToFontSelection = await this.page.evaluate(() => {
                  return (
                    document.body.textContent.includes(
                      "Choose Your Signature Style",
                    ) ||
                    document.body.textContent.includes("font") ||
                    !!Array.from(document.querySelectorAll("button")).find(
                      (btn) => btn.textContent.includes("Continue"),
                    )
                  );
                });

                if (movedToFontSelection) {
                  textCardClicked = true;
                  console.error(
                    `✅ Text Signature card clicked using strategy ${i + 1}`,
                  );
                  break;
                }
              }
            } catch (error) {
              console.error(
                `🔄 Text card strategy ${i + 1} failed:`,
                error.message,
              );
            }
          }

          if (!textCardClicked) {
            throw new Error(
              "Failed to click Text Signature card with all strategies",
            );
          }
        }

        // Now we should be on the font selection screen - look for signature templates
        console.error("🎨 Looking for signature template with user name...");

        const signatureCardStrategies = [
          // Look for Card components containing the full name in signature preview
          () =>
            this.page.locator(
              `div[data-slot="base"]:has(*:has-text("${fullName}"))`,
            ),
          // Look for pressable cards containing the name
          () =>
            this.page.locator(
              `[data-pressable="true"]:has(*:has-text("${fullName}"))`,
            ),
          // Look for any clickable card-like structure with our name
          () =>
            this.page.locator(
              `div[class*="cursor-pointer"]:has(*:has-text("${fullName}"))`,
            ),
          // Look for signature preview elements
          () =>
            this.page
              .locator(`*[class*="font-"]:has-text("${fullName}")`)
              .locator("..")
              .locator(".."),
          // Fallback: any card containing our name
          () => this.page.locator(`div:has(*:has-text("${fullName}"))`),
        ];

        let cardSelected = false;

        for (
          let i = 0;
          i < signatureCardStrategies.length && !cardSelected;
          i++
        ) {
          try {
            const cardLocator = signatureCardStrategies[i]();
            const cardCount = await cardLocator.count();

            console.error(
              `🔍 Strategy ${i + 1}: Found ${cardCount} signature cards`,
            );

            if (cardCount > 0) {
              // Click the first available card
              await cardLocator.first().click();
              console.error(
                `✅ Clicked signature card using strategy ${i + 1}`,
              );

              // Wait for React state to update
              await this.page.waitForTimeout(1500);

              // Verify selection by checking for the selected state classes
              const selectionVerification = await this.page.evaluate(() => {
                // Look for cards with selected styling
                const selectedCards = document.querySelectorAll(
                  ".border-primary-500, .bg-primary-50",
                );
                const hasSelectedCard = selectedCards.length > 0;

                // Also check if Continue button is enabled
                const continueButtons = Array.from(
                  document.querySelectorAll("button"),
                ).filter((btn) => btn.textContent.includes("Continue"));
                const continueEnabled = continueButtons.some(
                  (btn) => !btn.disabled,
                );

                return {
                  hasSelectedCard,
                  continueEnabled,
                  selectedCardsCount: selectedCards.length,
                  continueButtonsCount: continueButtons.length,
                };
              });

              console.error(
                `🔍 Selection verification:`,
                selectionVerification,
              );

              if (
                selectionVerification.hasSelectedCard ||
                selectionVerification.continueEnabled
              ) {
                cardSelected = true;
                console.error(
                  `✅ Signature template selected successfully (strategy ${i + 1})`,
                );
              } else {
                console.error(
                  `⚠️ Strategy ${i + 1} clicked but no selection state detected`,
                );
              }
            }
          } catch (error) {
            console.error(`❌ Strategy ${i + 1} failed:`, error.message);
          }
        }

        if (!cardSelected) {
          throw new Error(
            `Failed to select signature template with all strategies for: ${fullName}`,
          );
        }
      }

      // PHASE 1.3: SUBMIT SIGNATURE SELECTION
      console.error("📤 PHASE 1.3: Submitting signature selection...");

      const continueButton = this.page.locator('button:has-text("Continue")');
      await continueButton.waitFor({ timeout: 10000 });

      const isEnabled = await continueButton.isEnabled();
      console.error(`🔘 Continue button enabled: ${isEnabled}`);

      if (!isEnabled) {
        throw new Error(
          "CRITICAL: Continue button is disabled after signature selection",
        );
      }

      await continueButton.click();

      // Verify navigation to legal consent step
      if (!(await this.waitForStep(3, 15000))) {
        throw new Error("CRITICAL: Failed to navigate to Legal Consent step");
      }

      console.error("🎉 PHASE 1 COMPLETE: Signature step nuclear success");
      return { success: true, fullName, nextStep: 3, phase: 1 };
    } catch (error) {
      console.error("💥 PHASE 1 NUCLEAR FAILURE:", error.message);

      // Take debug screenshot
      await this.page.screenshot({
        path: "tests/screenshots/phase1-signature-failure.png",
        fullPage: true,
      });

      throw error;
    }
  }

  async completeLegalConsentStep() {
    console.error(
      "📜 PHASE 2: MILITARY-GRADE LEGAL CONSENT NUCLEAR IMPLEMENTATION...",
    );

    try {
      // Wait for LegalConsentStep component
      if (!(await this.waitForStep(3))) {
        throw new Error("LegalConsentStep component failed to load");
      }

      // Wait for all consent documents to load and check loading state
      await this.page.waitForTimeout(2000);

      // Check if already loading existing consents
      const isLoadingConsents = await this.page.evaluate(() => {
        return document.body.textContent.includes(
          "Loading your existing agreements",
        );
      });

      if (isLoadingConsents) {
        console.error("⏳ Waiting for existing agreements to load...");
        await this.page.waitForTimeout(3000);
      }

      // PHASE 2.1: COMPREHENSIVE LEGAL CONSENT STATE DETECTION
      const consentState = await this.page.evaluate(() => {
        const progressText = document.body.textContent || "";

        return {
          // Progress indicators
          progressMatch: progressText.match(/(\d+)\/(\d+)/),
          allSignedText:
            progressText.includes("All agreements signed") ||
            progressText.includes("All agreements have been signed"),
          remainingMatch: progressText.match(/(\d+)\s+agreements?\s+remaining/),

          // SignatureStamp detection
          signatureStamps: Array.from(
            document.querySelectorAll("button"),
          ).filter(
            (btn) =>
              btn.textContent?.includes("Click to sign") ||
              btn.textContent?.includes("* Click to sign"),
          ).length,

          // Component state analysis
          signatureStampElements: Array.from(document.querySelectorAll("*"))
            .filter((el) => el.textContent?.includes("Click to sign"))
            .map((el) => ({
              tagName: el.tagName,
              textContent: el.textContent?.substring(0, 50),
              isButton: el.tagName === "BUTTON",
              isClickable:
                el.onclick !== null || el.getAttribute("onclick") !== null,
              classes: el.className,
            })),

          // Continue button state
          continueButton: Array.from(document.querySelectorAll("button")).find(
            (btn) =>
              btn.textContent.includes("Continue to Verification") ||
              btn.textContent.includes("Continue"),
          ),
          continueEnabled: !Array.from(
            document.querySelectorAll("button"),
          ).find(
            (btn) =>
              btn.textContent.includes("Continue to Verification") ||
              btn.textContent.includes("Continue"),
          )?.disabled,

          progressText: progressText.substring(0, 500),
        };
      });

      console.error("🔍 PHASE 2.1: Legal consent state analysis:", {
        current: consentState.progressMatch
          ? parseInt(consentState.progressMatch[1])
          : 0,
        total: consentState.progressMatch
          ? parseInt(consentState.progressMatch[2])
          : 5,
        allSigned: consentState.allSignedText,
        remaining: consentState.remainingMatch
          ? parseInt(consentState.remainingMatch[1])
          : null,
        signatureStamps: consentState.signatureStamps,
        continueEnabled: consentState.continueEnabled,
      });

      if (
        consentState.allSignedText ||
        (consentState.remainingMatch &&
          parseInt(consentState.remainingMatch[1]) === 0)
      ) {
        console.error(
          "✅ PHASE 2.1: All documents already signed, proceeding to submit",
        );
      } else {
        // PHASE 2.2: MILITARY-GRADE SIGNATURESTAMP TARGETING
        console.error(
          "📝 PHASE 2.2: Executing military-grade SignatureStamp targeting...",
        );

        const stampTargetingStrategies = [
          // Strategy 1: Target button elements with "Click to sign" text (most specific)
          () =>
            this.page.locator(
              'button:has-text("Click to sign"), button:has-text("* Click to sign")',
            ),

          // Strategy 2: Target any clickable element in SignatureStamp component area
          () =>
            this.page.locator(
              'div:has(button:has-text("Click to sign")) button',
            ),

          // Strategy 3: Target signature line areas that are clickable
          () =>
            this.page.locator(
              'div[class*="border-b"]:has-text("Click to sign")',
            ),

          // Strategy 4: Look for signature-related clickable areas in Card bodies
          () =>
            this.page.locator(
              'div[data-slot="body"]:has-text("Click to sign") button',
            ),

          // Strategy 5: Broader search for any element with signing functionality
          () =>
            this.page
              .locator('*:has-text("Click to sign")')
              .filter({ hasText: /button|clickable|cursor/ }),
        ];

        let signableElements = null;
        let strategyUsed = 0;

        // Find the best strategy for targeting signableelements
        for (let i = 0; i < stampTargetingStrategies.length; i++) {
          try {
            const strategy = stampTargetingStrategies[i];
            const elements = strategy();
            const elementCount = await elements.count();

            console.error(
              `🎯 PHASE 2.2 Strategy ${i + 1}: Found ${elementCount} signable elements`,
            );

            if (elementCount > 0) {
              // Analyze the first few elements
              const elementAnalysis = [];
              for (let j = 0; j < Math.min(elementCount, 3); j++) {
                try {
                  const analysis = await elements.nth(j).evaluate((el) => ({
                    tagName: el.tagName,
                    textContent: el.textContent?.substring(0, 100),
                    className: el.className,
                    isDisabled: el.disabled,
                    isVisible: el.offsetParent !== null,
                  }));
                  elementAnalysis.push(analysis);
                } catch (err) {
                  elementAnalysis.push({ error: err.message });
                }
              }

              console.error(
                `📋 Element analysis for strategy ${i + 1}:`,
                elementAnalysis,
              );

              signableElements = elements;
              strategyUsed = i + 1;
              break;
            }
          } catch (error) {
            console.error(
              `🔄 PHASE 2.2 Strategy ${i + 1} failed:`,
              error.message,
            );
          }
        }

        if (!signableElements) {
          throw new Error(
            "CRITICAL: No SignatureStamp elements found with any targeting strategy",
          );
        }

        // PHASE 2.3: SYSTEMATIC DOCUMENT SIGNING
        const elementsCount = await signableElements.count();
        console.error(
          `📝 PHASE 2.3: Systematic signing of ${elementsCount} documents using strategy ${strategyUsed}...`,
        );

        let documentsAttempted = 0;
        let documentsSuccessful = 0;

        for (let i = 0; i < elementsCount; i++) {
          try {
            documentsAttempted++;
            console.error(
              `📝 PHASE 2.3: Signing document ${i + 1}/${elementsCount}...`,
            );

            // Click the signature element
            await signableElements.nth(i).click();

            // Wait for signature processing and visual feedback
            await this.page.waitForTimeout(2000);

            // Verify signature was applied
            const signatureApplied = await this.page.evaluate((index) => {
              // Look for visual changes indicating signature was applied
              const buttons = Array.from(
                document.querySelectorAll("button"),
              ).filter((btn) => btn.textContent?.includes("Click to sign"));

              // Check if this specific button area changed
              const progressText = document.body.textContent || "";
              const progressMatch = progressText.match(/(\d+)\/(\d+)/);
              const allSigned = progressText.includes("All agreements signed");
              const remaining = progressText.match(
                /(\d+)\s+agreements?\s+remaining/,
              );

              return {
                currentProgress: progressMatch ? parseInt(progressMatch[1]) : 0,
                allSigned,
                remainingCount: remaining ? parseInt(remaining[1]) : null,
                remainingButtons: buttons.length,
              };
            }, i);

            console.error(`📊 Post-signature state:`, signatureApplied);

            if (
              signatureApplied.allSigned ||
              signatureApplied.remainingCount === 0
            ) {
              documentsSuccessful++;
              console.error(
                `✅ Document ${i + 1} signed - ALL DOCUMENTS NOW COMPLETE!`,
              );
              break;
            } else if (signatureApplied.remainingButtons < elementsCount) {
              documentsSuccessful++;
              console.error(`✅ Document ${i + 1} signed successfully`);
            } else {
              console.error(
                `⚠️ Document ${i + 1} - signature state unclear, continuing...`,
              );
            }
          } catch (error) {
            console.error(
              `❌ PHASE 2.3: Failed to sign document ${i + 1}:`,
              error.message,
            );
            // Continue with next document
          }
        }

        console.error(
          `📊 PHASE 2.3 Results: ${documentsSuccessful}/${documentsAttempted} documents signed`,
        );
      }

      // PHASE 2.4: FINAL SUBMISSION VERIFICATION
      const finalProgress = await this.page.evaluate(() => {
        const progressText = document.body.textContent || "";
        const allSignedMatch =
          progressText.includes("All agreements signed") ||
          progressText.includes("All agreements have been signed");
        const remainingMatch = progressText.match(
          /(\d+)\s+agreements?\s+remaining/,
        );
        const progressMatch = progressText.match(/(\d+)\/(\d+)/);

        return {
          allSigned: allSignedMatch,
          remaining: remainingMatch ? parseInt(remainingMatch[1]) : null,
          current: progressMatch ? parseInt(progressMatch[1]) : 0,
          total: progressMatch ? parseInt(progressMatch[2]) : 5,
          progressText: progressText.substring(0, 300),
          continueButtonText:
            Array.from(document.querySelectorAll("button")).find((btn) =>
              btn.textContent.includes("Continue"),
            )?.textContent || "Not found",
        };
      });

      console.error("📈 PHASE 2.4: Final legal consent state:", finalProgress);

      // Try to submit with enhanced button detection
      console.error("📤 PHASE 2.4: Attempting to submit legal consent...");

      const continueButtonStrategies = [
        () => this.page.locator('button:has-text("Continue to Verification")'),
        () => this.page.locator('button:has-text("Continue")'),
        () => this.page.locator('button[type="submit"]'),
        () =>
          this.page
            .locator("button")
            .filter({ hasText: /continue|verification/i }),
      ];

      let continueButton = null;
      let buttonStrategy = 0;

      for (let i = 0; i < continueButtonStrategies.length; i++) {
        try {
          const strategy = continueButtonStrategies[i];
          const button = strategy();
          const count = await button.count();

          if (count > 0) {
            continueButton = button.first();
            buttonStrategy = i + 1;
            console.error(`🔘 Found continue button using strategy ${i + 1}`);
            break;
          }
        } catch (error) {
          console.error(`🔄 Button strategy ${i + 1} failed:`, error.message);
        }
      }

      if (!continueButton) {
        throw new Error("CRITICAL: No continue button found with any strategy");
      }

      await continueButton.waitFor({ timeout: 10000 });

      const isEnabled = await continueButton.isEnabled();
      console.error(`🔘 Continue button enabled: ${isEnabled}`);

      if (!isEnabled) {
        throw new Error(
          `CRITICAL: Continue button is disabled. Final progress: ${JSON.stringify(finalProgress)}`,
        );
      }

      await continueButton.click();

      // Verify navigation to verification step
      if (!(await this.waitForStep(4, 15000))) {
        throw new Error("CRITICAL: Failed to navigate to Verification step");
      }

      console.error("🎉 PHASE 2 COMPLETE: Legal Consent nuclear success");
      return {
        success: true,
        documentsCount: finalProgress.total,
        documentsSignedCount: finalProgress.current,
        finalProgress,
        nextStep: 4,
        phase: 2,
        buttonStrategy,
      };
    } catch (error) {
      console.error("💥 PHASE 2 NUCLEAR FAILURE:", error.message);

      // Take debug screenshot
      await this.page.screenshot({
        path: "tests/screenshots/phase2-legal-consent-failure.png",
        fullPage: true,
      });

      throw error;
    }
  }

  // ===== PHASE 3: NUCLEAR VERIFICATION STATE MACHINE =====
  async completeVerificationStep(skipVerification = true) {
    console.error("🚀 PHASE 3: NUCLEAR VERIFICATION STATE MACHINE ACTIVATED");
    console.error(`🛡️ Skip verification mode: ${skipVerification}`);

    try {
      // Wait for VerificationStep component to load
      if (!(await this.waitForStep(4))) {
        throw new Error(
          "VerificationStep component failed to load within timeout",
        );
      }

      console.error(
        "🔍 VERIFICATION STATE DETECTION: Analyzing current verification state...",
      );

      // NUCLEAR STATE ANALYSIS - Detect exact verification state
      const verificationState = await this.page.evaluate(() => {
        const bodyText = document.body.textContent || "";
        const html = document.documentElement.outerHTML;

        // State detection patterns based on VerificationStep.tsx
        const states = {
          loading: bodyText.includes("Loading verification status"),
          pending:
            bodyText.includes("Secure Identity Verification") &&
            bodyText.includes("Start Identity Verification"),
          in_progress:
            bodyText.includes("Verification In Progress") &&
            bodyText.includes("Session ID:"),
          requires_input:
            bodyText.includes("Additional Input Required") ||
            bodyText.includes("Try Again"),
          completed:
            bodyText.includes("Identity Verified Successfully") ||
            bodyText.includes("Stripe Identity"),
        };

        // Button analysis
        const buttons = {
          startVerification: Array.from(
            document.querySelectorAll("button"),
          ).find((btn) =>
            btn.textContent.includes("Start Identity Verification"),
          ),
          refreshStatus: Array.from(document.querySelectorAll("button")).find(
            (btn) => btn.textContent.includes("Refresh Status"),
          ),
          tryAgain: Array.from(document.querySelectorAll("button")).find(
            (btn) => btn.textContent.includes("Try Again"),
          ),
          completeOnboarding: Array.from(
            document.querySelectorAll("button"),
          ).find((btn) => btn.textContent.includes("Complete Onboarding")),
        };

        // Determine current state
        let currentState = "unknown";
        if (states.loading) currentState = "loading";
        else if (states.completed) currentState = "completed";
        else if (states.in_progress) currentState = "in_progress";
        else if (states.requires_input) currentState = "requires_input";
        else if (states.pending) currentState = "pending";

        return {
          currentState,
          states,
          buttons: {
            startVerification:
              !!buttons.startVerification &&
              !buttons.startVerification.disabled,
            refreshStatus:
              !!buttons.refreshStatus && !buttons.refreshStatus.disabled,
            tryAgain: !!buttons.tryAgain && !buttons.tryAgain.disabled,
            completeOnboarding:
              !!buttons.completeOnboarding &&
              !buttons.completeOnboarding.disabled,
          },
          indicators: {
            hasSessionId: bodyText.includes("Session ID:"),
            hasWarningIcon: html.includes("ExclamationTriangleIcon"),
            hasSuccessIcon: html.includes("CheckCircleIcon"),
            hasSpinner:
              html.includes("animate-spin") || bodyText.includes("Loading"),
          },
        };
      });

      console.error("🎯 VERIFICATION STATE ANALYSIS:", verificationState);

      // STATE MACHINE EXECUTION
      let stateChangeCount = 0;
      const maxStateChanges = 10; // Prevent infinite loops

      while (stateChangeCount < maxStateChanges) {
        console.error(
          `🔄 STATE MACHINE CYCLE ${stateChangeCount + 1}: Current state = ${verificationState.currentState}`,
        );

        if (verificationState.currentState === "loading") {
          // LOADING STATE: Wait for state resolution
          console.error(
            "⏳ LOADING state detected - waiting for state resolution...",
          );
          await this.page.waitForTimeout(3000);
        } else if (verificationState.currentState === "pending") {
          // PENDING STATE: Handle verification start
          if (skipVerification) {
            console.error(
              "🚧 SKIP VERIFICATION mode: Attempting to force completion...",
            );

            // Try to force completion via API call simulation
            const forceCompleteResult = await this.page.evaluate(async () => {
              try {
                // Simulate verification completion
                const response = await fetch("/api/onboarding/verification", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    forceComplete: true,
                    skipVerification: true,
                  }),
                });
                return { success: response.ok, status: response.status };
              } catch (e) {
                return { success: false, error: e.message };
              }
            });

            console.error("🎯 Force completion result:", forceCompleteResult);

            if (!forceCompleteResult.success) {
              // Fallback: Just proceed to complete if button is available
              console.error(
                "🔄 Force completion failed, checking for complete button...",
              );
            }
          } else {
            // REAL VERIFICATION: Start Stripe Identity
            console.error(
              "🛡️ REAL VERIFICATION: Starting Stripe Identity process...",
            );

            const startButton = this.page
              .locator("button")
              .filter({ hasText: "Start Identity Verification" });
            await startButton.waitFor({ timeout: 10000 });
            await startButton.click();

            console.error(
              "🔄 Verification started, waiting for Stripe redirect...",
            );
            await this.page.waitForTimeout(5000);

            // Handle Stripe test mode if present
            await this.handleStripeTestMode();
          }
        } else if (verificationState.currentState === "in_progress") {
          // IN_PROGRESS STATE: Wait for completion or refresh
          console.error("⚡ IN_PROGRESS state - refreshing status...");

          const refreshButton = this.page
            .locator("button")
            .filter({ hasText: "Refresh Status" });
          if ((await refreshButton.count()) > 0) {
            await refreshButton.click();
            await this.page.waitForTimeout(3000);
          } else {
            // Wait and re-analyze
            await this.page.waitForTimeout(5000);
          }
        } else if (verificationState.currentState === "requires_input") {
          // REQUIRES_INPUT STATE: Retry verification
          console.error("⚠️ REQUIRES_INPUT state - attempting retry...");

          const tryAgainButton = this.page
            .locator("button")
            .filter({ hasText: "Try Again" });
          if ((await tryAgainButton.count()) > 0) {
            await tryAgainButton.click();
            await this.page.waitForTimeout(3000);
          } else {
            throw new Error(
              "Verification requires input but no retry button found",
            );
          }
        } else if (verificationState.currentState === "completed") {
          // COMPLETED STATE: Finalize onboarding
          console.error("✅ COMPLETED state - finalizing onboarding...");
          break;
        } else {
          // UNKNOWN STATE: Fallback analysis
          console.error("❓ UNKNOWN state - performing fallback analysis...");

          // Check if complete button is available despite unknown state
          if (verificationState.buttons.completeOnboarding) {
            console.error(
              "🎯 Complete button available despite unknown state - proceeding...",
            );
            break;
          } else {
            throw new Error(
              `Unknown verification state and no complete button available`,
            );
          }
        }

        // Re-analyze state for next cycle
        const newState = await this.page.evaluate(() => {
          const bodyText = document.body.textContent || "";
          if (bodyText.includes("Identity Verified Successfully"))
            return "completed";
          if (bodyText.includes("Verification In Progress"))
            return "in_progress";
          if (bodyText.includes("Additional Input Required"))
            return "requires_input";
          if (bodyText.includes("Start Identity Verification"))
            return "pending";
          if (bodyText.includes("Loading verification status"))
            return "loading";
          return "unknown";
        });

        if (newState !== verificationState.currentState) {
          console.error(
            `🔄 STATE CHANGE: ${verificationState.currentState} → ${newState}`,
          );
          verificationState.currentState = newState;
        }

        stateChangeCount++;
      }

      if (stateChangeCount >= maxStateChanges) {
        throw new Error(
          "Verification state machine exceeded maximum cycles - potential infinite loop",
        );
      }

      // FINAL COMPLETION PHASE
      console.error(
        "🚀 FINAL COMPLETION PHASE: Executing onboarding completion...",
      );

      // Re-check button availability
      const finalButtonState = await this.page.evaluate(() => {
        const completeButton = Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent.includes("Complete Onboarding"));
        return {
          exists: !!completeButton,
          enabled: completeButton && !completeButton.disabled,
          text: completeButton ? completeButton.textContent.trim() : null,
        };
      });

      console.error("🔘 Final button state:", finalButtonState);

      if (!finalButtonState.exists) {
        throw new Error(
          "Complete Onboarding button not found after state machine completion",
        );
      }

      if (!finalButtonState.enabled) {
        throw new Error(
          "Complete Onboarding button is disabled after verification",
        );
      }

      // NUCLEAR COMPLETION EXECUTION
      console.error(
        "💥 NUCLEAR COMPLETION: Executing final completion with API monitoring...",
      );

      // Set up comprehensive network monitoring
      let completionApiCalled = false;
      let completionApiSuccess = false;
      let apiResponse = null;

      const responseHandler = async (response) => {
        if (response.url().includes("/api/onboarding/complete")) {
          completionApiCalled = true;
          completionApiSuccess = response.ok();
          try {
            apiResponse = await response.json();
          } catch (e) {
            apiResponse = null;
          }
          console.error(
            `📡 COMPLETION API: ${response.status()} ${completionApiSuccess ? "SUCCESS" : "FAILED"}`,
          );
          if (apiResponse) console.error("📡 API Response:", apiResponse);
        }
      };

      this.page.on("response", responseHandler);

      // Execute completion click
      const completeButton = this.page
        .locator("button")
        .filter({ hasText: "Complete Onboarding" });
      await completeButton.click();

      // Wait for API completion and potential redirect
      await this.page.waitForTimeout(7000);

      // Remove response handler
      this.page.off("response", responseHandler);

      // FINAL STATE ANALYSIS
      const finalState = await this.page.evaluate(() => {
        return {
          currentUrl: window.location.href,
          isDashboard: window.location.href.includes("/dashboard"),
          isOnboarding: window.location.href.includes("/onboarding"),
          pageTitle: document.title,
          hasOnboardingText: document.body.textContent.includes("onboarding"),
          hasDashboardText: document.body.textContent.includes("dashboard"),
        };
      });

      console.error("🏁 FINAL NUCLEAR STATE:", {
        ...finalState,
        completionApiCalled,
        completionApiSuccess,
        apiResponse,
      });

      // SUCCESS VALIDATION
      if (finalState.isDashboard) {
        console.error(
          "🎉 NUCLEAR SUCCESS: Redirected to dashboard - onboarding COMPLETE!",
        );
        return {
          success: true,
          redirectedToDashboard: true,
          apiCallSuccess: completionApiSuccess,
          finalUrl: finalState.currentUrl,
          apiResponse,
        };
      } else if (completionApiSuccess) {
        console.error(
          "✅ API success without redirect - manual navigation may be needed",
        );
        return {
          success: true,
          redirectedToDashboard: false,
          apiCallSuccess: true,
          finalUrl: finalState.currentUrl,
          apiResponse,
        };
      } else {
        throw new Error(
          `NUCLEAR COMPLETION FAILED: API called: ${completionApiCalled}, Success: ${completionApiSuccess}, URL: ${finalState.currentUrl}`,
        );
      }
    } catch (error) {
      console.error("💥 NUCLEAR VERIFICATION FAILED:", error.message);

      // Capture failure screenshot
      await this.page.screenshot({
        path: "tests/screenshots/nuclear-verification-failure.png",
        fullPage: true,
      });

      throw error;
    }
  }

  // Helper method for Stripe test mode handling
  async handleStripeTestMode() {
    console.error("🧪 Checking for Stripe test mode...");

    try {
      // Wait for potential Stripe redirect
      await this.page.waitForTimeout(3000);

      // Check if we're on a Stripe page
      const currentUrl = this.page.url();
      if (
        currentUrl.includes("stripe.com") ||
        currentUrl.includes("identity")
      ) {
        console.error(
          "🔗 On Stripe Identity page - looking for test completion...",
        );

        // Look for various test mode completion patterns
        const testModeElements = [
          'button:has-text("Submit")',
          'button:has-text("Continue")',
          '[data-testid="submit"]',
          ".SubmitButton",
          'button[type="submit"]',
        ];

        for (const selector of testModeElements) {
          const element = this.page.locator(selector);
          if ((await element.count()) > 0) {
            console.error(`🎯 Found test mode element: ${selector}`);
            await element.click();
            await this.page.waitForTimeout(3000);
            break;
          }
        }

        // Wait for redirect back to onboarding
        await this.page.waitForTimeout(5000);
      }
    } catch (error) {
      console.error("⚠️ Stripe test mode handling error:", error.message);
      // Continue anyway - not critical
    }
  }

  // ===== PHASE 4: NUCLEAR ERROR RECOVERY & RESILIENCE =====

  async recoverFromError(error, step, context = {}) {
    console.error(
      `🚨 PHASE 4: NUCLEAR ERROR RECOVERY ACTIVATED for step ${step}`,
    );
    console.error(`💥 Original error: ${error.message}`);
    console.error(`🔍 Recovery context:`, context);

    try {
      // RECOVERY PHASE 1: Comprehensive diagnostics
      console.error("🔍 RECOVERY PHASE 1: Comprehensive diagnostics...");

      const diagnostics = await this.gatherErrorDiagnostics(error, step);
      console.error("📊 Error diagnostics:", diagnostics);

      // RECOVERY PHASE 2: Intelligent state correction
      console.error("🔧 RECOVERY PHASE 2: Intelligent state correction...");

      const correctionResult = await this.performStateCorrection(
        diagnostics,
        step,
      );
      console.error("⚙️ State correction result:", correctionResult);

      if (correctionResult.success) {
        console.error("✅ NUCLEAR RECOVERY SUCCESSFUL - state corrected");
        return {
          recovered: true,
          currentState: correctionResult.newState,
          diagnostics,
          correctionResult,
        };
      } else {
        // RECOVERY PHASE 3: Fallback strategies
        console.error("🚀 RECOVERY PHASE 3: Executing fallback strategies...");

        const fallbackResult = await this.executeFallbackStrategies(
          diagnostics,
          step,
        );
        console.error("🛡️ Fallback result:", fallbackResult);

        return {
          recovered: fallbackResult.success,
          currentState: fallbackResult.state,
          diagnostics,
          fallbackResult,
          usedFallback: true,
        };
      }
    } catch (recoveryError) {
      console.error("💥 NUCLEAR RECOVERY FAILED:", recoveryError.message);

      // Emergency diagnostics capture
      await this.captureEmergencyDiagnostics(error, recoveryError, step);

      return {
        recovered: false,
        originalError: error.message,
        recoveryError: recoveryError.message,
        step,
      };
    }
  }

  async gatherErrorDiagnostics(error, step) {
    console.error("📊 Gathering comprehensive error diagnostics...");

    try {
      // Capture current page state
      const pageState = await this.getCurrentPageState();

      // Take diagnostic screenshot
      const screenshotPath = `tests/screenshots/diagnostic-step-${step}-${Date.now()}.png`;
      await this.page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      // Analyze DOM for error indicators
      const domAnalysis = await this.page.evaluate(() => {
        return {
          // Error elements
          errorElements: Array.from(
            document.querySelectorAll(
              '[role="alert"], .error, .text-danger, [class*="error"], [data-error]',
            ),
          ).map((el) => ({
            tagName: el.tagName,
            className: el.className,
            text: el.textContent.trim(),
          })),

          // Form validation states
          invalidFields: Array.from(
            document.querySelectorAll(
              "input:invalid, select:invalid, textarea:invalid",
            ),
          ).map((el) => ({
            name: el.name,
            type: el.type,
            validationMessage: el.validationMessage,
          })),

          // Button states
          buttons: Array.from(document.querySelectorAll("button")).map(
            (el) => ({
              text: el.textContent.trim(),
              disabled: el.disabled,
              className: el.className,
            }),
          ),

          // Network/loading indicators
          loadingElements: Array.from(
            document.querySelectorAll(
              '[aria-busy="true"], .spinner, [class*="loading"], [class*="spin"]',
            ),
          ).length,

          // Console errors
          hasConsoleErrors: !!window.__consoleErrors || false,

          // Accessibility issues
          missingLabels: Array.from(
            document.querySelectorAll(
              "input:not([aria-label]):not([aria-labelledby]):not([placeholder])",
            ),
          ).length,

          // Step indicators
          stepIndicators: Array.from(
            document.querySelectorAll('[class*="step"], [aria-current="step"]'),
          ).map((el) => ({
            text: el.textContent.trim(),
            className: el.className,
            ariaCurrent: el.getAttribute("aria-current"),
          })),
        };
      });

      // Check for network issues
      const networkState = await this.page.evaluate(() => ({
        online: navigator.onLine,
        connection: navigator.connection
          ? {
              effectiveType: navigator.connection.effectiveType,
              downlink: navigator.connection.downlink,
              rtt: navigator.connection.rtt,
            }
          : null,
      }));

      // Analyze error patterns
      const errorPattern = this.analyzeErrorPattern(error);

      return {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          pattern: errorPattern,
        },
        step,
        pageState,
        domAnalysis,
        networkState,
        screenshotPath,
        url: this.page.url(),
      };
    } catch (diagnosticError) {
      console.error("❌ Diagnostic gathering failed:", diagnosticError.message);
      return {
        error: error.message,
        step,
        diagnosticError: diagnosticError.message,
        url: this.page.url(),
      };
    }
  }

  analyzeErrorPattern(error) {
    const message = error.message.toLowerCase();

    // Common error patterns and their likely causes
    const patterns = {
      timeout: message.includes("timeout") || message.includes("waiting"),
      elementNotFound:
        message.includes("not found") || message.includes("no element"),
      clickFailed:
        message.includes("click") &&
        (message.includes("failed") || message.includes("error")),
      networkError:
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("request"),
      authError:
        message.includes("auth") ||
        message.includes("login") ||
        message.includes("unauthorized"),
      validationError:
        message.includes("validation") ||
        message.includes("required") ||
        message.includes("invalid"),
      navigationError:
        message.includes("navigate") ||
        message.includes("redirect") ||
        message.includes("url"),
      scriptError:
        message.includes("script") ||
        message.includes("evaluate") ||
        message.includes("function"),
    };

    // Return the matching patterns
    return Object.keys(patterns).filter((key) => patterns[key]);
  }

  async performStateCorrection(diagnostics, step) {
    console.error("🔧 Performing intelligent state correction...");

    try {
      const { error, pageState, domAnalysis } = diagnostics;

      // CORRECTION STRATEGY 1: Handle timeout errors
      if (error.pattern.includes("timeout")) {
        console.error("⏰ Timeout detected - implementing timeout recovery...");

        // Wait longer and retry
        await this.page.waitForTimeout(5000);

        // Check if elements appeared
        const newState = await this.getCurrentPageState();
        if (
          newState.step !== pageState.step ||
          newState.hasErrors !== pageState.hasErrors
        ) {
          return { success: true, newState, strategy: "timeout_wait" };
        }
      }

      // CORRECTION STRATEGY 2: Handle missing elements
      if (error.pattern.includes("elementNotFound")) {
        console.error(
          "🎯 Element not found - implementing element recovery...",
        );

        // Try to trigger any pending React updates
        await this.page.evaluate(() => {
          // Force React to flush updates
          if (window.flushSync) window.flushSync(() => {});
          // Dispatch resize event to trigger re-renders
          window.dispatchEvent(new Event("resize"));
        });

        await this.page.waitForTimeout(2000);

        // Scroll to ensure element visibility
        await this.page.evaluate(() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        });

        await this.page.waitForTimeout(1000);

        // Check if element appeared
        const newState = await this.getCurrentPageState();
        return { success: true, newState, strategy: "element_recovery" };
      }

      // CORRECTION STRATEGY 3: Handle validation errors
      if (
        error.pattern.includes("validationError") ||
        domAnalysis.invalidFields.length > 0
      ) {
        console.error(
          "✅ Validation errors detected - implementing form correction...",
        );

        // Clear and refill invalid fields
        for (const field of domAnalysis.invalidFields) {
          const selector = `input[name="${field.name}"], select[name="${field.name}"], textarea[name="${field.name}"]`;
          try {
            await this.page.locator(selector).clear();
            await this.page.waitForTimeout(500);

            // Provide appropriate test data based on field type/name
            const testValue = this.getTestValueForField(field);
            if (testValue) {
              await this.page.locator(selector).fill(testValue);
              await this.page.waitForTimeout(500);
            }
          } catch (fieldError) {
            console.error(
              `⚠️ Could not correct field ${field.name}:`,
              fieldError.message,
            );
          }
        }

        const newState = await this.getCurrentPageState();
        return { success: true, newState, strategy: "validation_correction" };
      }

      // CORRECTION STRATEGY 4: Handle navigation issues
      if (error.pattern.includes("navigationError")) {
        console.error(
          "🧭 Navigation error - implementing navigation correction...",
        );

        // Force reload current page
        await this.page.reload({ waitUntil: "networkidle" });
        await this.page.waitForTimeout(3000);

        const newState = await this.getCurrentPageState();
        return { success: true, newState, strategy: "navigation_reload" };
      }

      // CORRECTION STRATEGY 5: Clear any blocking overlays
      console.error("🚫 Attempting to clear blocking overlays...");

      await this.page.evaluate(() => {
        // Remove common blocking elements
        const selectors = [
          '[role="dialog"]',
          ".modal",
          ".overlay",
          '[class*="backdrop"]',
          '[aria-modal="true"]',
        ];

        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            if (el.style.display !== "none") {
              el.style.display = "none";
            }
          });
        });
      });

      const newState = await this.getCurrentPageState();
      return { success: true, newState, strategy: "overlay_clearing" };
    } catch (correctionError) {
      console.error("❌ State correction failed:", correctionError.message);
      return { success: false, error: correctionError.message };
    }
  }

  getTestValueForField(field) {
    const name = field.name.toLowerCase();
    const type = field.type.toLowerCase();

    // Provide appropriate test values
    if (name.includes("email")) return "test@example.com";
    if (name.includes("first") && name.includes("name")) return "Test";
    if (name.includes("last") && name.includes("name")) return "User";
    if (name.includes("phone")) return "+353 1 234 5678";
    if (name.includes("date") && type === "date") return "1990-01-01";
    if (name.includes("address")) return "123 Test Street";
    if (name.includes("city")) return "Dublin";
    if (name.includes("county")) return "Dublin";
    if (name.includes("eircode") || name.includes("postal")) return "D01 A2B3";
    if (type === "number") return "123";
    if (type === "tel") return "+353123456789";

    return "Test Value";
  }

  async executeFallbackStrategies(diagnostics, step) {
    console.error("🛡️ Executing fallback strategies...");

    try {
      // FALLBACK STRATEGY 1: Force step progression
      console.error("🚀 Fallback 1: Attempting force step progression...");

      // Look for any continue/next buttons and try clicking them
      const progressButtons = await this.page.locator("button").filter({
        hasText: /continue|next|save|submit|proceed/i,
      });

      const buttonCount = await progressButtons.count();
      if (buttonCount > 0) {
        console.error(
          `🎯 Found ${buttonCount} progress button(s), attempting click...`,
        );

        for (let i = 0; i < buttonCount; i++) {
          try {
            const button = progressButtons.nth(i);
            if (await button.isEnabled()) {
              await button.click();
              await this.page.waitForTimeout(3000);

              const newState = await this.getCurrentPageState();
              if (newState.step > step) {
                return {
                  success: true,
                  state: newState,
                  strategy: "force_progression",
                };
              }
            }
          } catch (buttonError) {
            console.error(`⚠️ Button ${i} click failed:`, buttonError.message);
          }
        }
      }

      // FALLBACK STRATEGY 2: URL navigation
      console.error("🧭 Fallback 2: Attempting direct URL navigation...");

      const currentUrl = this.page.url();
      const stepUrls = [
        "/onboarding?step=1",
        "/onboarding?step=2",
        "/onboarding?step=3",
        "/onboarding?step=4",
        "/dashboard",
      ];

      // Try navigating to next step URL
      const nextStepIndex = Math.min(step, stepUrls.length - 1);
      const nextUrl = new URL(stepUrls[nextStepIndex], currentUrl).href;

      console.error(`🔄 Navigating to: ${nextUrl}`);
      await this.page.goto(nextUrl, {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      const navigationState = await this.getCurrentPageState();
      return {
        success: true,
        state: navigationState,
        strategy: "url_navigation",
      };
    } catch (fallbackError) {
      console.error(
        "❌ All fallback strategies failed:",
        fallbackError.message,
      );

      // LAST RESORT: Page refresh
      console.error("🔄 Last resort: Page refresh...");
      try {
        await this.page.reload({ waitUntil: "networkidle" });
        const refreshState = await this.getCurrentPageState();
        return { success: true, state: refreshState, strategy: "page_refresh" };
      } catch (refreshError) {
        return { success: false, error: refreshError.message };
      }
    }
  }

  async captureEmergencyDiagnostics(originalError, recoveryError, step) {
    console.error("🚨 Capturing emergency diagnostics...");

    try {
      const timestamp = Date.now();

      // Emergency screenshot
      await this.page.screenshot({
        path: `tests/screenshots/emergency-${step}-${timestamp}.png`,
        fullPage: true,
      });

      // Emergency page source
      const pageContent = await this.page.content();
      require("fs").writeFileSync(
        `tests/screenshots/emergency-${step}-${timestamp}.html`,
        pageContent,
      );

      // Emergency diagnostics log
      const emergencyLog = {
        timestamp: new Date().toISOString(),
        step,
        originalError: originalError.message,
        recoveryError: recoveryError.message,
        url: this.page.url(),
        userAgent: await this.page.evaluate(() => navigator.userAgent),
        viewport: await this.page.viewportSize(),
      };

      require("fs").writeFileSync(
        `tests/screenshots/emergency-${step}-${timestamp}.json`,
        JSON.stringify(emergencyLog, null, 2),
      );

      console.error(
        "📋 Emergency diagnostics captured:",
        `emergency-${step}-${timestamp}.*`,
      );
    } catch (emergencyError) {
      console.error(
        "💥 Emergency diagnostics capture failed:",
        emergencyError.message,
      );
    }
  }

  // ===== PHASE 5: NUCLEAR COMPONENT TARGETING SYSTEM =====

  async findElementWithFallbacks(targetConfig) {
    console.error(
      `🎯 PHASE 5: Nuclear targeting for ${targetConfig.name || "element"}`,
    );

    const strategies = targetConfig.strategies || [];
    const timeout = targetConfig.timeout || 10000;
    const required = targetConfig.required !== false;

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      const strategyName = strategy.name || `Strategy ${i + 1}`;

      console.error(
        `🔍 Trying strategy ${i + 1}/${strategies.length}: ${strategyName}`,
      );

      try {
        const element = await strategy.locate(this.page);
        const count = await element.count();

        if (count > 0) {
          // Verify element is actually interactable if needed
          if (strategy.verifyInteractable) {
            const isVisible = await element.first().isVisible();
            const isEnabled = await element.first().isEnabled();

            if (!isVisible || !isEnabled) {
              console.error(
                `⚠️ Element found but not interactable (visible: ${isVisible}, enabled: ${isEnabled})`,
              );
              continue;
            }
          }

          console.error(
            `✅ SUCCESS: Found element using ${strategyName} (count: ${count})`,
          );
          return { element, strategy: strategyName, count };
        } else {
          console.error(`❌ No elements found with ${strategyName}`);
        }
      } catch (strategyError) {
        console.error(
          `❌ Strategy ${strategyName} failed:`,
          strategyError.message,
        );
      }

      // Small delay between strategies to allow for DOM updates
      if (i < strategies.length - 1) {
        await this.page.waitForTimeout(1000);
      }
    }

    // If all strategies fail
    if (required) {
      throw new Error(
        `NUCLEAR TARGETING FAILED: Could not locate ${targetConfig.name} using any of ${strategies.length} strategies`,
      );
    } else {
      console.error(`⚠️ Optional element not found: ${targetConfig.name}`);
      return { element: null, strategy: "none", count: 0 };
    }
  }

  // Enhanced HeroUI Component Targeting
  createHeroUITargetConfig(componentType, options = {}) {
    const configs = {
      button: {
        name: `Button: ${options.text || options.role || "unknown"}`,
        strategies: [
          {
            name: "Data Component ID",
            locate: (page) =>
              page
                .locator(`[data-component-id*="button"]`)
                .filter({ hasText: options.text }),
            verifyInteractable: true,
          },
          {
            name: "HeroUI Button with Text",
            locate: (page) =>
              page
                .locator('button[data-slot="base"]')
                .filter({ hasText: options.text }),
            verifyInteractable: true,
          },
          {
            name: "Generic Button with Text",
            locate: (page) =>
              page.locator("button").filter({ hasText: options.text }),
            verifyInteractable: true,
          },
          {
            name: "Button by Role",
            locate: (page) => page.locator(`button[role="${options.role}"]`),
            verifyInteractable: true,
          },
          {
            name: "Button by Data Attributes",
            locate: (page) =>
              page.locator(`button[data-testid="${options.testId}"]`),
            verifyInteractable: true,
          },
        ],
      },

      input: {
        name: `Input: ${options.placeholder || options.name || "unknown"}`,
        strategies: [
          {
            name: "Data Component ID",
            locate: (page) =>
              page
                .locator(`[data-component-id*="input"]`)
                .filter({ hasText: options.placeholder }),
          },
          {
            name: "HeroUI Input",
            locate: (page) =>
              page
                .locator('input[data-slot="input"]')
                .filter({ hasText: options.placeholder }),
          },
          {
            name: "Input by Placeholder",
            locate: (page) =>
              page.locator(`input[placeholder*="${options.placeholder}"]`),
          },
          {
            name: "Input by Name",
            locate: (page) => page.locator(`input[name="${options.name}"]`),
          },
          {
            name: "Input by Label Association",
            locate: (page) =>
              page
                .locator(`label:has-text("${options.label}")`)
                .locator("input"),
          },
        ],
      },

      select: {
        name: `Select: ${options.label || options.placeholder || "unknown"}`,
        strategies: [
          {
            name: "HeroUI Select Trigger",
            locate: (page) =>
              page
                .locator('button[data-slot="trigger"]')
                .filter({ hasText: options.label }),
            verifyInteractable: true,
          },
          {
            name: "Select by Label",
            locate: (page) =>
              page
                .locator(`label:has-text("${options.label}")`)
                .locator('button[data-slot="trigger"]'),
            verifyInteractable: true,
          },
          {
            name: "Generic Select",
            locate: (page) =>
              page.locator("select").filter({ hasText: options.label }),
            verifyInteractable: true,
          },
          {
            name: "Combobox Role",
            locate: (page) =>
              page
                .locator('[role="combobox"]')
                .filter({ hasText: options.label }),
            verifyInteractable: true,
          },
        ],
      },

      card: {
        name: `Card: ${options.title || "unknown"}`,
        strategies: [
          {
            name: "HeroUI Card with Title",
            locate: (page) =>
              page
                .locator('[data-slot="base"]')
                .filter({ hasText: options.title }),
          },
          {
            name: "Generic Card",
            locate: (page) =>
              page
                .locator('.card, [class*="card"]')
                .filter({ hasText: options.title }),
          },
          {
            name: "Article Element",
            locate: (page) =>
              page.locator("article").filter({ hasText: options.title }),
          },
        ],
      },

      modal: {
        name: "Modal Dialog",
        strategies: [
          {
            name: "HeroUI Modal",
            locate: (page) =>
              page.locator('[data-slot="wrapper"][role="dialog"]'),
          },
          {
            name: "Generic Modal",
            locate: (page) =>
              page.locator('[role="dialog"], [aria-modal="true"]'),
          },
          {
            name: "Modal Class",
            locate: (page) => page.locator('.modal, [class*="modal"]'),
          },
        ],
      },
    };

    return (
      configs[componentType] || {
        name: `Unknown component: ${componentType}`,
        strategies: [],
      }
    );
  }

  // Enhanced form field targeting
  async findAndFillFormField(fieldConfig) {
    console.error(`📝 NUCLEAR FORM FIELD TARGETING: ${fieldConfig.name}`);

    const targetConfig = {
      name: `Form Field: ${fieldConfig.name}`,
      strategies: [
        {
          name: "Component ID Match",
          locate: (page) =>
            page.locator(
              `[data-component-id*="${fieldConfig.name.toLowerCase()}"]`,
            ),
        },
        {
          name: "Placeholder Exact Match",
          locate: (page) =>
            page.locator(`input[placeholder="${fieldConfig.placeholder}"]`),
        },
        {
          name: "Placeholder Partial Match",
          locate: (page) =>
            page.locator(`input[placeholder*="${fieldConfig.placeholder}"]`),
        },
        {
          name: "Name Attribute",
          locate: (page) =>
            page.locator(`input[name="${fieldConfig.name.toLowerCase()}"]`),
        },
        {
          name: "Label Association",
          locate: (page) =>
            page
              .locator(
                `label:has-text("${fieldConfig.label || fieldConfig.name}")`,
              )
              .locator("input"),
        },
        {
          name: "Type-based Fallback",
          locate: (page) =>
            page.locator(`input[type="${fieldConfig.type || "text"}"]`).first(),
        },
      ],
    };

    const result = await this.findElementWithFallbacks(targetConfig);

    if (result.element) {
      // Clear and fill the field
      await result.element.first().clear();
      await this.page.waitForTimeout(500);

      if (fieldConfig.value) {
        await result.element.first().fill(fieldConfig.value);
        await this.page.waitForTimeout(500);

        // Verify the value was set
        const actualValue = await result.element.first().inputValue();
        if (actualValue !== fieldConfig.value) {
          console.error(
            `⚠️ Value mismatch: expected "${fieldConfig.value}", got "${actualValue}"`,
          );
        } else {
          console.error(
            `✅ Successfully filled ${fieldConfig.name} with "${fieldConfig.value}"`,
          );
        }
      }
    }

    return result;
  }

  // Enhanced button targeting and clicking
  async findAndClickButton(buttonConfig) {
    console.error(
      `🖱️ NUCLEAR BUTTON TARGETING: ${buttonConfig.text || buttonConfig.role}`,
    );

    const targetConfig = this.createHeroUITargetConfig("button", buttonConfig);
    const result = await this.findElementWithFallbacks(targetConfig);

    if (result.element) {
      // Additional verification for buttons
      const isVisible = await result.element.first().isVisible();
      const isEnabled = await result.element.first().isEnabled();

      console.error(
        `🔘 Button state: visible=${isVisible}, enabled=${isEnabled}`,
      );

      if (!isVisible) {
        // Try to scroll the button into view
        await result.element.first().scrollIntoViewIfNeeded();
        await this.page.waitForTimeout(1000);
      }

      if (isEnabled) {
        await result.element.first().click();
        await this.page.waitForTimeout(1000);
        console.error(
          `✅ Successfully clicked button: ${buttonConfig.text || buttonConfig.role}`,
        );
      } else {
        throw new Error(
          `Button is disabled: ${buttonConfig.text || buttonConfig.role}`,
        );
      }
    }

    return result;
  }

  // Enhanced select/dropdown targeting
  async findAndSelectOption(selectConfig) {
    console.error(
      `🎛️ NUCLEAR SELECT TARGETING: ${selectConfig.label} -> ${selectConfig.option}`,
    );

    // Step 1: Find and click the select trigger
    const triggerConfig = this.createHeroUITargetConfig("select", selectConfig);
    const triggerResult = await this.findElementWithFallbacks(triggerConfig);

    if (!triggerResult.element) {
      throw new Error(
        `Could not find select trigger for: ${selectConfig.label}`,
      );
    }

    // Click to open dropdown
    await triggerResult.element.first().click();
    await this.page.waitForTimeout(2000);

    // Step 2: Find and click the option
    const optionConfig = {
      name: `Select Option: ${selectConfig.option}`,
      strategies: [
        {
          name: "Data Key Match",
          locate: (page) => page.locator(`[data-key="${selectConfig.option}"]`),
        },
        {
          name: "Option Role with Text",
          locate: (page) =>
            page
              .locator('[role="option"]')
              .filter({ hasText: selectConfig.option }),
        },
        {
          name: "List Item with Text",
          locate: (page) =>
            page.locator("li").filter({ hasText: selectConfig.option }),
        },
        {
          name: "Generic Option Element",
          locate: (page) =>
            page.locator(`option:has-text("${selectConfig.option}")`),
        },
        {
          name: "Dropdown Item by Text",
          locate: (page) =>
            page
              .locator('[role="listbox"] *')
              .filter({ hasText: selectConfig.option }),
        },
      ],
    };

    const optionResult = await this.findElementWithFallbacks(optionConfig);

    if (optionResult.element) {
      await optionResult.element.first().click();
      await this.page.waitForTimeout(1000);
      console.error(`✅ Successfully selected option: ${selectConfig.option}`);
    }

    return { triggerResult, optionResult };
  }

  // ===== PHASE 6: NUCLEAR INTEGRATION TESTING & API VALIDATION =====

  async validateAPIEndpoint(endpoint, expectedResponse = {}) {
    console.error(`🧪 PHASE 6: API validation for ${endpoint}`);

    try {
      const response = await this.page.evaluate(async (url) => {
        try {
          const res = await fetch(url);
          return {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
            data: res.ok ? await res.json() : null,
            error: !res.ok ? await res.text() : null,
          };
        } catch (error) {
          return {
            ok: false,
            status: 0,
            error: error.message,
          };
        }
      }, endpoint);

      console.error(`📡 API Response for ${endpoint}:`, response);

      // Validate response structure if expected response provided
      if (expectedResponse.requiredFields) {
        const missing = expectedResponse.requiredFields.filter(
          (field) => !response.data || !(field in response.data),
        );

        if (missing.length > 0) {
          throw new Error(
            `API validation failed: missing fields ${missing.join(", ")}`,
          );
        }
      }

      return response;
    } catch (error) {
      console.error(`❌ API validation failed for ${endpoint}:`, error.message);
      throw error;
    }
  }

  async validateOnboardingProgress() {
    console.error("🔬 NUCLEAR ONBOARDING PROGRESS VALIDATION");

    try {
      const progressValidation = await this.validateAPIEndpoint(
        "/api/onboarding/status",
        {
          requiredFields: ["currentStep", "completedSteps", "canProceed"],
        },
      );

      if (!progressValidation.ok) {
        throw new Error(
          `Onboarding status API failed: ${progressValidation.error}`,
        );
      }

      const status = progressValidation.data;
      console.error("📊 Onboarding Progress Validation:", status);

      return {
        valid: true,
        currentStep: status.currentStep,
        completedSteps: status.completedSteps,
        canProceed: status.canProceed,
        personalInfoComplete: status.completedSteps?.includes("personal_info"),
        signatureComplete: status.completedSteps?.includes("signature"),
        legalConsentComplete: status.completedSteps?.includes("legal_consent"),
        verificationComplete: status.completedSteps?.includes("verification"),
      };
    } catch (error) {
      console.error("❌ Onboarding progress validation failed:", error.message);
      return { valid: false, error: error.message };
    }
  }

  async validateFormSubmission(step, expectedData = {}) {
    console.error(`📋 NUCLEAR FORM SUBMISSION VALIDATION for ${step}`);

    // Set up network interception for the specific step
    let submissionCaptured = false;
    let submissionData = null;
    let submissionError = null;

    const handleResponse = async (response) => {
      const url = response.url();

      if (url.includes(`/api/onboarding/${step}`)) {
        submissionCaptured = true;
        console.error(`📡 Captured ${step} submission: ${response.status()}`);

        try {
          if (response.ok()) {
            submissionData = await response.json();
          } else {
            submissionError = await response.text();
          }
        } catch (parseError) {
          console.error("⚠️ Could not parse response:", parseError.message);
        }
      }
    };

    this.page.on("response", handleResponse);

    // Wait for potential submission (should be called after form submission)
    await this.page.waitForTimeout(3000);

    // Remove listener
    this.page.off("response", handleResponse);

    const validation = {
      submissionCaptured,
      submissionData,
      submissionError,
      valid: submissionCaptured && !submissionError,
    };

    console.error(`📊 ${step} submission validation:`, validation);

    // Validate expected data if provided
    if (validation.valid && expectedData.requiredFields) {
      const missing = expectedData.requiredFields.filter(
        (field) => !submissionData || !(field in submissionData),
      );

      if (missing.length > 0) {
        validation.valid = false;
        validation.missingFields = missing;
        console.error(
          `❌ Missing required fields in ${step} response:`,
          missing,
        );
      }
    }

    return validation;
  }

  async validateStepCompletion(step) {
    console.error(`✅ NUCLEAR STEP COMPLETION VALIDATION: ${step}`);

    try {
      // Get current page state
      const pageState = await this.getCurrentPageState();

      // Validate against onboarding API
      const progressValidation = await this.validateOnboardingProgress();

      // Check for step-specific completion indicators
      const stepValidations = {
        1: {
          // Personal Info
          pageIndicators: pageState.hasPersonalForm === false, // Should move past personal form
          apiIndicators: progressValidation.personalInfoComplete,
          description: "Personal information collected and saved",
        },
        2: {
          // Signature
          pageIndicators:
            pageState.hasSignatureContent === false || pageState.step > 2,
          apiIndicators: progressValidation.signatureComplete,
          description: "Digital signature created and stored",
        },
        3: {
          // Legal Consent
          pageIndicators:
            pageState.hasLegalContent === false || pageState.step > 3,
          apiIndicators: progressValidation.legalConsentComplete,
          description: "Legal agreements signed and recorded",
        },
        4: {
          // Verification
          pageIndicators:
            pageState.step > 4 || pageState.pathname.includes("/dashboard"),
          apiIndicators: progressValidation.verificationComplete,
          description: "Identity verification completed",
        },
      };

      const validation = stepValidations[step];

      if (validation) {
        const isComplete =
          validation.pageIndicators && validation.apiIndicators;

        console.error(`🔍 Step ${step} validation:`, {
          pageIndicators: validation.pageIndicators,
          apiIndicators: validation.apiIndicators,
          isComplete,
          description: validation.description,
        });

        return {
          step,
          complete: isComplete,
          pageValidation: validation.pageIndicators,
          apiValidation: validation.apiIndicators,
          description: validation.description,
        };
      } else {
        throw new Error(`No validation logic defined for step ${step}`);
      }
    } catch (error) {
      console.error(
        `❌ Step ${step} completion validation failed:`,
        error.message,
      );
      return {
        step,
        complete: false,
        error: error.message,
      };
    }
  }

  async validateDashboardAccess() {
    console.error("🏠 NUCLEAR DASHBOARD ACCESS VALIDATION");

    try {
      // Try to navigate to dashboard
      await this.page.goto("/dashboard", {
        waitUntil: "networkidle",
        timeout: 10000,
      });

      // Check if we're actually on the dashboard
      const currentUrl = this.page.url();
      const isDashboard = currentUrl.includes("/dashboard");

      if (!isDashboard) {
        throw new Error(`Not on dashboard, current URL: ${currentUrl}`);
      }

      // Validate dashboard content
      const dashboardValidation = await this.page.evaluate(() => {
        return {
          hasWelcomeText:
            document.body.textContent.includes("Welcome") ||
            document.body.textContent.includes("Dashboard"),
          hasNavigation: !!document.querySelector('nav, [role="navigation"]'),
          hasContent:
            document.querySelectorAll(
              'main, [role="main"], .dashboard, [class*="dashboard"]',
            ).length > 0,
          url: window.location.href,
          title: document.title,
        };
      });

      console.error("🏠 Dashboard validation:", dashboardValidation);

      return {
        accessible: true,
        url: currentUrl,
        ...dashboardValidation,
      };
    } catch (error) {
      console.error("❌ Dashboard access validation failed:", error.message);
      return {
        accessible: false,
        error: error.message,
      };
    }
  }

  async runComprehensiveValidation() {
    console.error("🔬 NUCLEAR COMPREHENSIVE VALIDATION SUITE");

    const validationResults = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    // Test 1: Onboarding Progress API
    console.error("🧪 Test 1: Onboarding Progress API");
    try {
      const progressResult = await this.validateOnboardingProgress();
      validationResults.tests.push({
        name: "Onboarding Progress API",
        passed: progressResult.valid,
        result: progressResult,
      });
    } catch (error) {
      validationResults.tests.push({
        name: "Onboarding Progress API",
        passed: false,
        error: error.message,
      });
    }

    // Test 2: Authentication State
    console.error("🧪 Test 2: Authentication State");
    try {
      const authResult = await this.validateAPIEndpoint("/api/auth/session");
      validationResults.tests.push({
        name: "Authentication State",
        passed: authResult.ok,
        result: authResult,
      });
    } catch (error) {
      validationResults.tests.push({
        name: "Authentication State",
        passed: false,
        error: error.message,
      });
    }

    // Test 3: Dashboard Access
    console.error("🧪 Test 3: Dashboard Access");
    try {
      const dashboardResult = await this.validateDashboardAccess();
      validationResults.tests.push({
        name: "Dashboard Access",
        passed: dashboardResult.accessible,
        result: dashboardResult,
      });
    } catch (error) {
      validationResults.tests.push({
        name: "Dashboard Access",
        passed: false,
        error: error.message,
      });
    }

    // Calculate overall results
    const totalTests = validationResults.tests.length;
    const passedTests = validationResults.tests.filter((t) => t.passed).length;
    const failedTests = totalTests - passedTests;

    validationResults.summary = {
      totalTests,
      passedTests,
      failedTests,
      successRate: Math.round((passedTests / totalTests) * 100),
      overallPassed: failedTests === 0,
    };

    console.error("📊 COMPREHENSIVE VALIDATION RESULTS:");
    console.error(
      `✅ Passed: ${passedTests}/${totalTests} (${validationResults.summary.successRate}%)`,
    );
    console.error(`❌ Failed: ${failedTests}/${totalTests}`);

    if (validationResults.summary.overallPassed) {
      console.error("🎉 ALL NUCLEAR VALIDATION TESTS PASSED!");
    } else {
      console.error(
        "💥 Some validation tests failed - system not fully operational",
      );
    }

    return validationResults;
  }

  // ===== PHASE 6: MAIN AUTOMATION ORCHESTRATOR =====

  async completeOnboarding({
    personalInfo = {},
    skipVerification = true,
  } = {}) {
    console.error(
      "🚀 Starting BULLETPROOF onboarding automation with smart state management...",
    );

    try {
      // Initialize browser if needed
      if (!this.browser) {
        await this.init();
      }

      // Step 1: Comprehensive state detection
      const initialState = await this.detectOnboardingStateRobust();
      console.error("📊 Initial state detection:", initialState);

      if (initialState.needsAuthentication) {
        throw new Error(
          "User needs authentication first - use authenticate() method",
        );
      }

      if (initialState.isComplete) {
        console.error(
          "✅ Onboarding already complete! Verifying dashboard access...",
        );

        // Test dashboard access to confirm completion
        const dashboardTest = await this.testDashboardAccess();
        if (dashboardTest.success) {
          return {
            success: true,
            alreadyComplete: true,
            dashboardAccessible: true,
          };
        } else {
          console.error(
            "⚠️ Onboarding marked complete but dashboard inaccessible - continuing...",
          );
        }
      }

      // Step 2: Smart step execution with state verification
      const stepExecutors = [
        {
          num: 1,
          name: "Personal Information",
          execute: () => this.completePersonalInfoStep(personalInfo),
          checkComplete: () => this.verifyStepCompletion(1),
        },
        {
          num: 2,
          name: "Signature",
          execute: () => this.completeSignatureStep(personalInfo),
          checkComplete: () => this.verifyStepCompletion(2),
        },
        {
          num: 3,
          name: "Legal Consent",
          execute: () => this.completeLegalConsentStep(),
          checkComplete: () => this.verifyStepCompletion(3),
        },
        {
          num: 4,
          name: "Identity Verification",
          execute: () => this.completeVerificationStep(skipVerification),
          checkComplete: () => this.verifyStepCompletion(4),
        },
      ];

      const results = {};
      let currentStep = initialState.currentStep || 1;

      for (const step of stepExecutors) {
        // Smart skip logic: check if step is already complete
        const isAlreadyComplete = await step.checkComplete();

        if (step.num < currentStep || isAlreadyComplete) {
          results[step.num] = {
            status: "skipped",
            reason: isAlreadyComplete
              ? "verified_complete"
              : "already_completed",
            verified: isAlreadyComplete,
          };
          console.error(
            `⏩ Skipping ${step.name} - ${isAlreadyComplete ? "verified complete" : "already completed"}`,
          );
          continue;
        }

        try {
          console.error(`🎯 Executing ${step.name} (Step ${step.num})`);

          // Pre-execution state check
          const preState = await this.getCurrentPageState();
          console.error(
            `📍 Pre-execution state: ${preState.step} - ${preState.description}`,
          );

          const result = await step.execute();

          // Post-execution verification
          await this.page.waitForTimeout(1000);
          const postState = await this.getCurrentPageState();
          const stepComplete = await step.checkComplete();

          console.error(
            `📍 Post-execution state: ${postState.step} - ${postState.description}`,
          );
          console.error(
            `✅ Step ${step.num} verification: ${stepComplete ? "COMPLETE" : "INCOMPLETE"}`,
          );

          results[step.num] = {
            status: stepComplete ? "success" : "partial",
            data: result,
            preState,
            postState,
            verified: stepComplete,
          };

          if (!stepComplete) {
            console.error(
              `⚠️ ${step.name} executed but verification failed - may need manual intervention`,
            );
          }
        } catch (error) {
          console.error(`❌ ${step.name} failed:`, error.message);

          // Enhanced recovery with state-aware retry
          const recovery = await this.recoverFromError(error, step.num);

          if (recovery.recovered) {
            // Verify recovery actually worked
            const recoveryVerified = await step.checkComplete();

            results[step.num] = {
              status: recoveryVerified ? "recovered" : "recovery_partial",
              error: error.message,
              verified: recoveryVerified,
              recoveryState: recovery.currentState,
            };

            console.error(
              `🔄 Recovery ${recoveryVerified ? "successful and verified" : "partial"} for ${step.name}`,
            );

            if (!recoveryVerified) {
              console.error(
                `💥 Recovery for ${step.name} unverified - stopping automation`,
              );
              break;
            }
          } else {
            console.error(
              `💥 Recovery failed for ${step.name}, stopping automation`,
            );
            results[step.num] = {
              status: "failed",
              error: error.message,
              verified: false,
            };
            break;
          }
        }

        // Inter-step state validation
        await this.page.waitForTimeout(1000);
      }

      // Comprehensive final validation
      const finalState = await this.detectOnboardingStateRobust();
      const dashboardTest = await this.testDashboardAccess();

      console.error("🏁 BULLETPROOF onboarding automation completed");
      console.error("📊 Final state:", finalState);
      console.error("🏠 Dashboard access test:", dashboardTest);
      console.error("📋 Step results:", results);

      const allStepsSuccessful = Object.values(results).every(
        (result) =>
          result.status === "success" ||
          result.status === "recovered" ||
          result.status === "skipped",
      );

      return {
        success:
          allStepsSuccessful &&
          (finalState.isComplete || dashboardTest.success),
        finalState,
        dashboardAccessible: dashboardTest.success,
        stepResults: results,
        completedSteps: Object.keys(results).filter((step) =>
          ["success", "recovered", "skipped"].includes(results[step].status),
        ).length,
        verifiedSteps: Object.keys(results).filter(
          (step) => results[step].verified === true,
        ).length,
      };
    } catch (error) {
      console.error(
        "💥 BULLETPROOF onboarding automation failed:",
        error.message,
      );
      return { success: false, error: error.message };
    }
  }

  // Enhanced method to verify individual step completion
  async verifyStepCompletion(stepNumber) {
    try {
      console.error(`🔍 Verifying step ${stepNumber} completion...`);

      const stepCompletionChecks = {
        1: async () => {
          // Personal Info: Multi-layer verification
          console.error("👤 Verifying Personal Info step completion...");

          // Check 1: Current page state
          const currentState = await this.getCurrentPageState();
          if (currentState.step >= 2) {
            console.error(
              "✅ Personal Info: Visual state shows step 2 or higher",
            );
            return true;
          }

          // Check 2: API verification
          const apiCheck = await this.page.evaluate(async () => {
            try {
              const response = await fetch("/api/onboarding/status");
              if (response.ok) {
                const data = await response.json();
                return data.user?.personal_info_completed || false;
              }
            } catch {}
            return false;
          });

          if (apiCheck) {
            console.error("✅ Personal Info: API confirms completion");
            return true;
          }

          // Check 3: Visual indicators
          const visualCheck = await this.page.evaluate(() => {
            // Look for Continue button availability or step 2 content
            const hasStep2Content =
              document.body.textContent.includes("Signature") ||
              document.body.textContent.includes("Choose Your Signature");
            const continueDisabled =
              Array.from(document.querySelectorAll("button")).find((btn) =>
                btn.textContent.includes("Continue"),
              )?.disabled === false;

            return hasStep2Content || continueDisabled;
          });

          console.error(
            `📊 Personal Info verification - API: ${apiCheck}, Visual: ${visualCheck}, State: ${currentState.step}`,
          );
          return visualCheck;
        },

        2: async () => {
          // Signature: Enhanced verification
          console.error("✍️ Verifying Signature step completion...");

          // Check 1: Current page state
          const currentState = await this.getCurrentPageState();
          if (currentState.step >= 3) {
            console.error("✅ Signature: Visual state shows step 3 or higher");
            return true;
          }

          // Check 2: API verification
          const apiCheck = await this.page.evaluate(async () => {
            try {
              const response = await fetch("/api/onboarding/status");
              if (response.ok) {
                const data = await response.json();
                return data.user?.signature_completed || false;
              }
            } catch {}
            return false;
          });

          if (apiCheck) {
            console.error("✅ Signature: API confirms completion");
            return true;
          }

          // Check 3: Visual indicators
          const visualCheck = await this.page.evaluate(() => {
            // Look for Legal Consent content or signature completion indicators
            const hasLegalContent =
              document.body.textContent.includes("Legal Consent") ||
              document.body.textContent.includes("Legal Agreements");
            const hasSelectedSignature = document.querySelector(
              ".border-primary-500, .text-primary-500",
            );

            return hasLegalContent || hasSelectedSignature;
          });

          console.error(
            `📊 Signature verification - API: ${apiCheck}, Visual: ${visualCheck}, State: ${currentState.step}`,
          );
          return visualCheck;
        },

        3: async () => {
          // Legal Consent: Comprehensive verification
          console.error("📜 Verifying Legal Consent step completion...");

          // Check 1: Current page state
          const currentState = await this.getCurrentPageState();
          if (currentState.step >= 4) {
            console.error(
              "✅ Legal Consent: Visual state shows step 4 or higher",
            );
            return true;
          }

          // Check 2: API verification
          const apiCheck = await this.page.evaluate(async () => {
            try {
              const response = await fetch("/api/onboarding/status");
              if (response.ok) {
                const data = await response.json();
                return data.user?.legal_consent_completed || false;
              }
            } catch {}
            return false;
          });

          if (apiCheck) {
            console.error("✅ Legal Consent: API confirms completion");
            return true;
          }

          // Check 3: Visual progress indicators
          const visualCheck = await this.page.evaluate(() => {
            const progressText = document.body.textContent || "";

            // Look for completion indicators
            const allSigned =
              progressText.includes("All agreements signed") ||
              progressText.includes("5/5") ||
              progressText.includes("0 agreements remaining");

            // Look for verification content (next step)
            const hasVerificationContent =
              progressText.includes("Identity Verification") ||
              progressText.includes("Verification Step");

            // Check if Continue button is enabled
            const continueEnabled = !Array.from(
              document.querySelectorAll("button"),
            ).find((btn) => btn.textContent.includes("Continue"))?.disabled;

            return allSigned || hasVerificationContent || continueEnabled;
          });

          console.error(
            `📊 Legal Consent verification - API: ${apiCheck}, Visual: ${visualCheck}, State: ${currentState.step}`,
          );
          return visualCheck;
        },

        4: async () => {
          // Verification: Multi-approach verification
          console.error("🛡️ Verifying Verification step completion...");

          // Check 1: Dashboard access test
          const dashboardTest = await this.testDashboardAccess();
          if (dashboardTest.success) {
            console.error("✅ Verification: Dashboard access successful");
            return true;
          }

          // Check 2: API verification
          const apiCheck = await this.page.evaluate(async () => {
            try {
              const response = await fetch("/api/onboarding/status");
              if (response.ok) {
                const data = await response.json();
                return (
                  data.user?.verification_completed || data.isComplete || false
                );
              }
            } catch {}
            return false;
          });

          if (apiCheck) {
            console.error("✅ Verification: API confirms completion");
            return true;
          }

          // Check 3: Visual indicators
          const visualCheck = await this.page.evaluate(() => {
            const bodyText = document.body.textContent || "";

            // Look for completion indicators
            const verificationComplete =
              bodyText.includes("Identity Verified Successfully") ||
              bodyText.includes("Verification Complete") ||
              bodyText.includes("Complete Onboarding");

            // Check if we're on dashboard already
            const onDashboard = window.location.href.includes("/dashboard");

            return verificationComplete || onDashboard;
          });

          console.error(
            `📊 Verification verification - Dashboard: ${dashboardTest.success}, API: ${apiCheck}, Visual: ${visualCheck}`,
          );
          return visualCheck || dashboardTest.success;
        },
      };

      const checker = stepCompletionChecks[stepNumber];
      if (!checker) {
        console.error(`❌ No verification method for step ${stepNumber}`);
        return false;
      }

      const result = await checker();
      console.error(
        `📋 Step ${stepNumber} completion verification result: ${result}`,
      );
      return result;
    } catch (error) {
      console.error(
        `❌ Step ${stepNumber} completion verification failed:`,
        error.message,
      );
      return false;
    }
  }

  // Helper method to test dashboard access
  async testDashboardAccess() {
    try {
      console.error("🏠 Testing dashboard access...");

      const currentUrl = this.page.url();

      // Try navigating to dashboard
      await this.page.goto(`${this.baseUrl}/dashboard`);
      await this.page.waitForTimeout(2000);

      const finalUrl = this.page.url();
      const isOnDashboard =
        finalUrl.includes("/dashboard") && !finalUrl.includes("/onboarding");

      // Navigate back to where we were if dashboard test failed
      if (!isOnDashboard) {
        await this.page.goto(currentUrl);
        await this.page.waitForTimeout(1000);
      }

      return {
        success: isOnDashboard,
        finalUrl,
        redirectedToOnboarding: finalUrl.includes("/onboarding"),
      };
    } catch (error) {
      console.error("❌ Dashboard access test failed:", error.message);
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

  // ===== PAGE STATE DETECTION =====
  async getCurrentPageState() {
    console.error("🔍 Getting comprehensive page state...");

    try {
      const pageState = await this.page.evaluate(() => {
        // Get page title and URL
        const title = document.title;
        const url = window.location.href;
        const pathname = window.location.pathname;

        // Check for step indicators
        const stepHeader = document.querySelector("h1");
        const stepTitle = stepHeader ? stepHeader.textContent.trim() : "";

        // Look for step numbers in various places
        const stepNumbers = Array.from(document.querySelectorAll("*"))
          .filter((el) => {
            const text = el.textContent;
            return (
              text &&
              (text.includes("Step 1") ||
                text.includes("Step 2") ||
                text.includes("Step 3") ||
                text.includes("Step 4"))
            );
          })
          .map((el) => el.textContent.trim());

        // Check for specific content markers
        const hasPersonalForm = !!document.querySelector(
          'input[placeholder*="first name" i], input[placeholder*="Enter your first name"]',
        );
        const hasSignatureContent =
          document.body.textContent.includes("Signature") ||
          document.body.textContent.includes("Choose Your Signature");
        const hasLegalContent =
          document.body.textContent.includes("Legal Consent") ||
          document.body.textContent.includes("Terms of Service");
        const hasVerificationContent =
          document.body.textContent.includes("Identity Verification") ||
          document.body.textContent.includes("Stripe");
        const hasSignButtons = Array.from(
          document.querySelectorAll("button"),
        ).filter(
          (btn) =>
            btn.textContent.toLowerCase().includes("sign") ||
            (btn.getAttribute("aria-label") &&
              btn.getAttribute("aria-label").toLowerCase().includes("sign")),
        ).length;
        const hasContinueButton = !!Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent.toLowerCase().includes("continue"));
        const hasCompleteButton = !!Array.from(
          document.querySelectorAll("button"),
        ).find((btn) => btn.textContent.toLowerCase().includes("complete"));

        // Check for error states
        const hasErrors = !!document.querySelector(
          '[role="alert"], .error, .text-danger, [class*="error"]',
        );
        const errorMessages = Array.from(
          document.querySelectorAll('[role="alert"], .error, .text-danger'),
        ).map((el) => el.textContent);

        // Check for loading states
        const hasSpinner = !!document.querySelector(
          '[role="progressbar"], .spinner, [class*="loading"]',
        );

        // Determine current step
        let step = 1;
        let description = "Unknown step";

        if (hasPersonalForm) {
          step = 1;
          description = "Personal Information Step";
        } else if (hasSignatureContent) {
          step = 2;
          description = "Signature Step";
        } else if (hasLegalContent) {
          step = 3;
          description = "Legal Consent Step";
        } else if (hasVerificationContent) {
          step = 4;
          description = "Verification Step";
        } else if (pathname.includes("/dashboard")) {
          step = 5;
          description = "Onboarding Complete - Dashboard";
        }

        return {
          title,
          url,
          pathname,
          step,
          description,
          stepTitle,
          stepNumbers,
          hasPersonalForm,
          hasSignatureContent,
          hasLegalContent,
          hasVerificationContent,
          hasSignButtons,
          hasContinueButton,
          hasCompleteButton,
          hasErrors,
          errorMessages,
          hasSpinner,
          bodyText: document.body.textContent.substring(0, 500), // First 500 chars for debugging
        };
      });

      console.error("📊 Page State:", pageState);
      return pageState;
    } catch (error) {
      console.error("❌ Failed to get page state:", error.message);
      return { error: error.message, url: this.page.url() };
    }
  }

  // ===== NUCLEAR FORM FIELD TARGETING =====
  async findAndFillFormField(fieldConfig) {
    console.error(`📝 NUCLEAR FORM FIELD TARGETING: ${fieldConfig.name}`);

    const strategies = [
      {
        name: "Placeholder Exact Match",
        locate: (page) =>
          page.locator(`input[placeholder="${fieldConfig.placeholder}"]`),
      },
      {
        name: "Placeholder Partial Match",
        locate: (page) =>
          page.locator(`input[placeholder*="${fieldConfig.placeholder}"]`),
      },
      {
        name: "Name Attribute",
        locate: (page) =>
          page.locator(`input[name="${fieldConfig.name.toLowerCase()}"]`),
      },
      {
        name: "Type-based Fallback",
        locate: (page) =>
          page.locator(`input[type="${fieldConfig.type || "text"}"]`).first(),
      },
    ];

    let elementFound = false;

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      console.error(
        `🔍 Trying strategy ${i + 1}/${strategies.length}: ${strategy.name}`,
      );

      try {
        const element = await strategy.locate(this.page);
        const count = await element.count();

        if (count > 0) {
          console.error(
            `✅ SUCCESS: Found element using ${strategy.name} (count: ${count})`,
          );

          // Clear and fill the field
          await element.first().clear();
          await this.page.waitForTimeout(500);

          if (fieldConfig.value) {
            await element.first().fill(fieldConfig.value);
            await this.page.waitForTimeout(500);

            // Verify the value was set
            const actualValue = await element.first().inputValue();
            if (actualValue !== fieldConfig.value) {
              console.error(
                `⚠️ Value mismatch: expected "${fieldConfig.value}", got "${actualValue}"`,
              );
            } else {
              console.error(
                `✅ Successfully filled ${fieldConfig.name} with "${fieldConfig.value}"`,
              );
            }
          }

          elementFound = true;
          break;
        } else {
          console.error(`❌ No elements found with ${strategy.name}`);
        }
      } catch (strategyError) {
        console.error(
          `❌ Strategy ${strategy.name} failed:`,
          strategyError.message,
        );
      }

      // Small delay between strategies
      if (i < strategies.length - 1) {
        await this.page.waitForTimeout(1000);
      }
    }

    if (!elementFound) {
      throw new Error(
        `NUCLEAR FIELD TARGETING FAILED: Could not locate ${fieldConfig.name} using any strategy`,
      );
    }

    return { success: elementFound };
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

  // ===== PAGE STATE DETECTION =====

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

// ES module equivalent of require.main === module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Server failed to start:", error);
    process.exit(1);
  });
}
