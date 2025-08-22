#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium } from "playwright";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PlaywrightMCPServer {
  async checkCurrentStatus() {
    console.error("🕵️ COMPREHENSIVE STATUS CHECK");

    if (!this.page) {
      return {
        content: [
          {
            type: "text",
            text: "Browser not initialized",
          },
        ],
      };
    }

    const pageState = await this.getCurrentPageState();

    // Determine what step we're actually on
    let currentStep = "Unknown";
    let stepNumber = 0;

    if (pageState.hasPersonalForm) {
      currentStep = "Step 1: Personal Information";
      stepNumber = 1;
    } else if (pageState.hasSignatureContent) {
      currentStep = "Step 2: Signature";
      stepNumber = 2;
    } else if (pageState.hasLegalContent || pageState.hasSignButtons > 0) {
      currentStep = "Step 3: Legal Consent";
      stepNumber = 3;
    } else if (pageState.hasVerificationContent) {
      currentStep = "Step 4: Identity Verification";
      stepNumber = 4;
    } else if (pageState.pathname.includes("/dashboard")) {
      currentStep = "Dashboard (Completed)";
      stepNumber = 5;
    }

    const report = `🔍 CURRENT STATUS REPORT:
    
📍 Current Step: ${currentStep}
🔢 Step Number: ${stepNumber}
🌐 URL: ${pageState.url}
📄 Page Title: ${pageState.title || "N/A"}
📝 Step Title: ${pageState.stepTitle || "N/A"}

🔘 Available Actions:
  • Continue Button: ${pageState.hasContinueButton ? "✅" : "❌"}
  • Complete Button: ${pageState.hasCompleteButton ? "✅" : "❌"}  
  • Sign Buttons: ${pageState.hasSignButtons} found
  • Personal Form: ${pageState.hasPersonalForm ? "✅" : "❌"}

⚠️ Issues:
  • Has Errors: ${pageState.hasErrors ? "🚨 YES" : "✅ No"}
  • Loading: ${pageState.hasSpinner ? "⏳ YES" : "✅ No"}
  
📋 Error Messages: ${pageState.errorMessages.length > 0 ? pageState.errorMessages.join(", ") : "None"}

🔗 Step Numbers Found: ${pageState.stepNumbers.join(", ") || "None"}

📄 Page Content Preview: ${pageState.bodyText.substring(0, 200)}...`;

    return {
      content: [
        {
          type: "text",
          text: report,
        },
      ],
    };
  }

  constructor() {
    this.server = new Server(
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

    this.browser = null;
    this.context = null;
    this.page = null;
    this.baseUrl = process.env.BASE_URL || "http://localhost:3000";

    this.setupTools();
    this.setupErrorHandling();
  }

  setupTools() {
    // Tool: List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "check_status",
          description:
            "Get comprehensive status of current page and onboarding step",
          inputSchema: {
            type: "object",
            properties: {},
            required: [],
          },
        },
        {
          name: "navigate",
          description: "Navigate to a page in the application",
          inputSchema: {
            type: "object",
            properties: {
              path: {
                type: "string",
                description:
                  'The path to navigate to (e.g., "/dashboard", "/login")',
              },
              waitForSelector: {
                type: "string",
                description: "Optional selector to wait for after navigation",
              },
            },
            required: ["path"],
          },
        },
        {
          name: "screenshot",
          description:
            "Take a screenshot of the current page or specific component",
          inputSchema: {
            type: "object",
            properties: {
              filename: {
                type: "string",
                description: "Filename for the screenshot (without extension)",
              },
              componentId: {
                type: "string",
                description:
                  "Optional component ID to highlight before screenshot",
              },
              fullPage: {
                type: "boolean",
                description: "Whether to capture the full page (default: true)",
              },
            },
            required: ["filename"],
          },
        },
        {
          name: "click",
          description: "Click an element by selector or component ID",
          inputSchema: {
            type: "object",
            properties: {
              selector: {
                type: "string",
                description: "CSS selector or component ID to click",
              },
              isComponentId: {
                type: "boolean",
                description:
                  "Whether the selector is a component ID (default: false)",
              },
            },
            required: ["selector"],
          },
        },
        {
          name: "get_components",
          description: "Get all components on the current page",
          inputSchema: {
            type: "object",
            properties: {
              visibleOnly: {
                type: "boolean",
                description: "Only return visible components (default: true)",
              },
            },
          },
        },
        {
          name: "visual_mode",
          description: "Toggle visual development mode",
          inputSchema: {
            type: "object",
            properties: {
              enabled: {
                type: "boolean",
                description: "Enable or disable visual mode",
              },
            },
            required: ["enabled"],
          },
        },
        {
          name: "authenticate",
          description:
            "Authenticate with test user credentials to access protected pages",
          inputSchema: {
            type: "object",
            properties: {
              email: {
                type: "string",
                description: "Email for authentication (default: test user)",
                default: "claude.assistant@example.com",
              },
              password: {
                type: "string",
                description:
                  "Password for authentication (default: test password)",
                default: "DemoPassword123!",
              },
            },
          },
        },
        {
          name: "complete_onboarding",
          description:
            "Complete the multi-step onboarding process automatically",
          inputSchema: {
            type: "object",
            properties: {
              personalInfo: {
                type: "object",
                description: "Personal information for onboarding",
                properties: {
                  first_name: { type: "string", default: "Claude" },
                  last_name: { type: "string", default: "Assistant" },
                  date_of_birth: { type: "string", default: "1990-01-01" },
                  phone_number: { type: "string", default: "+353851234567" },
                  address_line_1: {
                    type: "string",
                    default: "123 Test Street",
                  },
                  city: { type: "string", default: "Dublin" },
                  county: { type: "string", default: "Dublin" },
                  eircode: { type: "string", default: "D02 XY56" },
                },
              },
              skipVerification: {
                type: "boolean",
                description: "Skip identity verification for testing",
                default: true,
              },
            },
          },
        },
        {
          name: "authenticate_and_onboard",
          description: "Complete authentication and onboarding in one step",
          inputSchema: {
            type: "object",
            properties: {
              email: {
                type: "string",
                description: "Email for authentication",
                default: "claude.assistant@example.com",
              },
              password: {
                type: "string",
                description: "Password for authentication",
                default: "DemoPassword123!",
              },
              skipVerification: {
                type: "boolean",
                description: "Skip identity verification for testing",
                default: true,
              },
            },
          },
        },
      ],
    }));

    // Tool: Call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Ensure browser is initialized
      if (!this.browser || !this.page) {
        console.error(`Initializing browser for tool: ${name}`);
        await this.initBrowser();
        console.error(
          `Browser initialization complete. Browser: ${!!this.browser}, Page: ${!!this.page}`,
        );
      }

      switch (name) {
        case "check_status":
          return await this.checkCurrentStatus(args);
        case "navigate":
          return await this.navigate(args);
        case "screenshot":
          return await this.screenshot(args);
        case "click":
          return await this.click(args);
        case "get_components":
          return await this.getComponents(args);
        case "visual_mode":
          return await this.toggleVisualMode(args);
        case "authenticate":
          return await this.authenticate(args);
        case "complete_onboarding":
          return await this.completeOnboarding(args);
        case "authenticate_and_onboard":
          return await this.authenticateAndOnboard(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async initBrowser() {
    if (this.browser && this.page) return; // Already initialized and ready

    try {
      console.error("Initializing Playwright browser...");

      // Clean up any existing browser instance
      if (this.browser) {
        await this.browser.close();
      }

      this.browser = await chromium.launch({
        headless: false,
        devtools: true,
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        // Accept all cookies and persist state
        acceptDownloads: true,
      });

      this.page = await this.context.newPage();

      // Validate page object is ready
      if (!this.page) {
        throw new Error("Page object not created properly");
      }

      // Enable visual dev mode by default
      await this.page.addInitScript(() => {
        localStorage.setItem("visualDevMode", "true");
      });

      console.error("Browser initialized successfully");
    } catch (error) {
      console.error("Browser initialization failed:", error);

      // Clean up on failure
      if (this.browser) {
        try {
          await this.browser.close();
        } catch (cleanupError) {
          console.error("Browser cleanup failed:", cleanupError);
        }
        this.browser = null;
        this.context = null;
        this.page = null;
      }

      throw error;
    }
  }

  async navigate({ path, waitForSelector }) {
    const url = `${this.baseUrl}${path}`;
    console.error(`Navigating to: ${url}`);

    // Validate page object is available
    if (!this.page) {
      throw new Error(
        "Browser page not available - initialization may have failed",
      );
    }

    await this.page.goto(url);
    await this.page.waitForLoadState("networkidle");

    if (waitForSelector) {
      await this.page.waitForSelector(waitForSelector, { timeout: 10000 });
    }

    // Wait for React hydration
    await this.page.waitForTimeout(1000);

    return {
      content: [
        {
          type: "text",
          text: `Successfully navigated to ${path}`,
        },
      ],
    };
  }

  async screenshot({ filename, componentId, fullPage = true }) {
    const screenshotPath = join(
      process.cwd(),
      "tests",
      "screenshots",
      `${filename}.png`,
    );

    // Highlight component if specified
    if (componentId) {
      await this.page.evaluate((id) => {
        const element = document.querySelector(`[data-component-id="${id}"]`);
        if (element) {
          element.style.outline = "3px solid #FF1CF7";
          element.style.outlineOffset = "2px";
        }
      }, componentId);

      await this.page.waitForTimeout(500); // Let highlight render
    }

    await this.page.screenshot({
      path: screenshotPath,
      fullPage,
    });

    // Remove highlight
    if (componentId) {
      await this.page.evaluate((id) => {
        const element = document.querySelector(`[data-component-id="${id}"]`);
        if (element) {
          element.style.outline = "";
          element.style.outlineOffset = "";
        }
      }, componentId);
    }

    return {
      content: [
        {
          type: "text",
          text: `Screenshot saved to ${screenshotPath}`,
        },
      ],
    };
  }

  async click({ selector, isComponentId = false }) {
    const actualSelector = isComponentId
      ? `[data-component-id="${selector}"]`
      : selector;

    console.error(`Clicking: ${actualSelector}`);

    await this.page.click(actualSelector);
    await this.page.waitForTimeout(500); // Wait for any animations

    return {
      content: [
        {
          type: "text",
          text: `Clicked element: ${selector}`,
        },
      ],
    };
  }

  async getComponents({ visibleOnly = true }) {
    const components = await this.page.evaluate((onlyVisible) => {
      const elements = Array.from(
        document.querySelectorAll("[data-component-id]"),
      );
      return elements
        .filter((el) => !onlyVisible || el.offsetParent !== null)
        .map((el) => ({
          id: el.getAttribute("data-component-id"),
          category: el.getAttribute("data-component-category") || "unknown",
          visible: el.offsetParent !== null,
          bounds: el.getBoundingClientRect(),
        }));
    }, visibleOnly);

    return {
      content: [
        {
          type: "text",
          text: `Found ${components.length} components:\n${components
            .map((c) => `- ${c.id} (${c.category}) ${c.visible ? "✓" : "✗"}`)
            .join("\n")}`,
        },
      ],
    };
  }

  async toggleVisualMode({ enabled }) {
    if (!this.page) {
      await this.initBrowser();
    }

    await this.page.evaluate((isEnabled) => {
      localStorage.setItem("visualDevMode", isEnabled ? "true" : "false");

      // Trigger storage event to update UI
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "visualDevMode",
          newValue: isEnabled ? "true" : "false",
          oldValue: isEnabled ? "false" : "true",
        }),
      );
    }, enabled);

    await this.page.reload();
    await this.page.waitForLoadState("networkidle");

    return {
      content: [
        {
          type: "text",
          text: `Visual development mode ${enabled ? "enabled" : "disabled"}`,
        },
      ],
    };
  }

  async authenticate({
    email = "claude.assistant@example.com",
    password = "DemoPassword123!",
  }) {
    console.error("Authenticating user...");

    // Validate page object is available
    if (!this.page) {
      throw new Error(
        "Browser page not available - initialization may have failed",
      );
    }

    // Check if already authenticated by trying to access dashboard
    try {
      await this.page.goto(`${this.baseUrl}/dashboard`);
      await this.page.waitForLoadState("networkidle");

      const currentUrl = this.page.url();
      if (currentUrl.includes("/dashboard")) {
        return {
          content: [
            {
              type: "text",
              text: `Already authenticated and on dashboard`,
            },
          ],
        };
      }
    } catch (error) {
      console.error("Dashboard check failed, proceeding with login");
    }

    // Navigate to login page
    console.error("Navigating to login page...");
    await this.page.goto(`${this.baseUrl}/login`);
    await this.page.waitForLoadState("networkidle");

    // Wait for form to be ready
    await this.page.waitForSelector('input[name="email"]', { timeout: 10000 });

    // Fill login form
    console.error("Filling login form...");
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);

    // Submit form
    console.error("Submitting login form...");
    await this.page.click('button[type="submit"]');

    // Wait for authentication to complete
    try {
      // Wait for redirect (could be to onboarding or dashboard)
      await this.page.waitForURL("**/dashboard", { timeout: 10000 });
      await this.page.waitForLoadState("networkidle");

      return {
        content: [
          {
            type: "text",
            text: `Successfully authenticated as ${email} and redirected to dashboard`,
          },
        ],
      };
    } catch (error) {
      // Check if we're on onboarding page
      const currentUrl = this.page.url();
      if (currentUrl.includes("/onboarding")) {
        return {
          content: [
            {
              type: "text",
              text: `Successfully authenticated as ${email} but needs onboarding completion. Currently at: ${currentUrl}`,
            },
          ],
        };
      } else {
        // Check for authentication errors
        const hasError =
          (await this.page
            .locator('[role="alert"], .error, .text-danger')
            .count()) > 0;
        if (hasError) {
          const errorText = await this.page
            .locator('[role="alert"], .error, .text-danger')
            .first()
            .textContent();
          throw new Error(`Authentication failed: ${errorText}`);
        }

        return {
          content: [
            {
              type: "text",
              text: `Authentication completed. Current URL: ${currentUrl}`,
            },
          ],
        };
      }
    }
  }

  // === COMPREHENSIVE STATUS VERIFICATION ===

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
        const hasSignButtons = document.querySelectorAll(
          'button:has-text("Sign"), button[aria-label*="sign" i]',
        ).length;
        const hasContinueButton = !!document.querySelector(
          'button:has-text("Continue")',
        );
        const hasCompleteButton = !!document.querySelector(
          'button:has-text("Complete")',
        );

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

        // Check sidebar step status
        const sidebarSteps = Array.from(
          document.querySelectorAll('[class*="step"], .step'),
        ).map((el) => ({
          text: el.textContent.trim(),
          isActive:
            el.classList.contains("active") ||
            el.getAttribute("aria-current") === "step",
          isCompleted:
            el.classList.contains("completed") ||
            el.classList.contains("complete"),
        }));

        return {
          title,
          url,
          pathname,
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
          sidebarSteps,
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

  async waitForPageChange(previousUrl, timeout = 10000) {
    console.error(`⏳ Waiting for page change from: ${previousUrl}`);

    try {
      await this.page.waitForFunction(
        (prevUrl) => {
          return window.location.href !== prevUrl;
        },
        previousUrl,
        { timeout },
      );

      await this.page.waitForLoadState("networkidle");
      const newUrl = this.page.url();
      console.error(`✅ Page changed to: ${newUrl}`);
      return true;
    } catch (error) {
      console.error(`❌ Page did not change within ${timeout}ms`);
      return false;
    }
  }

  async waitForStepChange(currentStepTitle, timeout = 15000) {
    console.error(`⏳ Waiting for step change from: ${currentStepTitle}`);

    try {
      await this.page.waitForFunction(
        (prevStepTitle) => {
          const stepHeader = document.querySelector("h1");
          const currentTitle = stepHeader ? stepHeader.textContent.trim() : "";
          return currentTitle !== prevStepTitle && currentTitle.length > 0;
        },
        currentStepTitle,
        { timeout },
      );

      const newState = await this.getCurrentPageState();
      console.error(`✅ Step changed to: ${newState.stepTitle}`);
      return newState;
    } catch (error) {
      console.error(`❌ Step did not change within ${timeout}ms`);
      return null;
    }
  }

  async verifyButtonClick(buttonSelector, expectedChange = "page change") {
    console.error(`🔍 Verifying button click: ${buttonSelector}`);

    const beforeState = await this.getCurrentPageState();
    const beforeUrl = this.page.url();

    try {
      const button = this.page.locator(buttonSelector);
      await button.waitFor({ state: "visible", timeout: 5000 });

      // Check if button is enabled
      const isDisabled = await button.getAttribute("disabled");
      if (isDisabled !== null) {
        console.error(`⚠️ Button ${buttonSelector} is disabled`);
        return false;
      }

      await button.click();
      console.error(`✅ Clicked: ${buttonSelector}`);

      // Wait a moment for changes to occur
      await this.page.waitForTimeout(2000);

      // Check if anything changed
      const afterState = await this.getCurrentPageState();
      const afterUrl = this.page.url();

      const urlChanged = beforeUrl !== afterUrl;
      const stepChanged = beforeState.stepTitle !== afterState.stepTitle;
      const hasErrors = afterState.hasErrors;

      if (hasErrors) {
        console.error(
          `❌ Errors detected after click: ${afterState.errorMessages.join(", ")}`,
        );
        return false;
      }

      if (urlChanged || stepChanged) {
        console.error(
          `✅ Button click successful - ${urlChanged ? "URL changed" : "Step changed"}`,
        );
        return true;
      } else {
        console.error(
          `⚠️ Button click may not have worked - no visible changes detected`,
        );
        return false;
      }
    } catch (error) {
      console.error(`❌ Button click failed: ${error.message}`);
      return false;
    }
  }

  // === BULLETPROOF ONBOARDING AUTOMATION ===

  async detectAuthenticationState() {
    console.error("🔐 Detecting authentication state...");

    try {
      const authState = await this.page.evaluate(async () => {
        try {
          // Try to fetch user session
          const response = await fetch("/api/auth/session");
          if (response.ok) {
            const sessionData = await response.json();
            return {
              isAuthenticated: !!sessionData.user,
              user: sessionData.user,
              onboardingCompleted:
                sessionData.user?.onboarding_completed || false,
              sessionValid: true,
            };
          } else if (response.status === 401) {
            return {
              isAuthenticated: false,
              sessionValid: true,
            };
          } else {
            return {
              sessionValid: false,
              error: `Auth API returned ${response.status}`,
            };
          }
        } catch (error) {
          return {
            sessionValid: false,
            error: error.message,
          };
        }
      });

      // Also check current URL for auth state indicators
      const currentUrl = this.page.url();
      const isOnLoginPage =
        currentUrl.includes("/login") || currentUrl.includes("/signup");
      const isOnDashboard = currentUrl.includes("/dashboard");
      const isOnOnboarding = currentUrl.includes("/onboarding");

      const finalAuthState = {
        ...authState,
        currentUrl,
        isOnLoginPage,
        isOnDashboard,
        isOnOnboarding,
        needsAuth: !authState.isAuthenticated && !isOnLoginPage,
        needsOnboarding:
          authState.isAuthenticated &&
          !authState.onboardingCompleted &&
          !isOnOnboarding,
      };

      console.error("🔐 Authentication State:", finalAuthState);
      return finalAuthState;
    } catch (error) {
      console.error("❌ Auth detection error:", error.message);
      return {
        error: error.message,
        currentUrl: this.page.url(),
      };
    }
  }

  async detectOnboardingState() {
    console.error("🔍 Detecting comprehensive onboarding state...");

    try {
      // 1. Get authentication state first
      const authState = await this.detectAuthenticationState();

      // 2. If not authenticated or onboarding complete, return early
      if (!authState.isAuthenticated) {
        return {
          currentStep: 0,
          authState,
          needsAuthentication: true,
          isComplete: false,
        };
      }

      if (authState.onboardingCompleted) {
        return {
          currentStep: 5,
          authState,
          isComplete: true,
          needsRedirectToDashboard: !authState.isOnDashboard,
        };
      }

      // 3. Get detailed onboarding progress via API
      const onboardingApiState = await this.page.evaluate(async () => {
        try {
          const response = await fetch("/api/onboarding/status");
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
            };
          }
          return null;
        } catch (error) {
          return { error: error.message };
        }
      });

      console.error("📊 Onboarding API State:", onboardingApiState);

      // 4. Get visual page state for current step detection
      const visualState = await this.getCurrentPageState();

      // 5. Determine actual current step based on multiple sources
      let currentStep = this.determineCurrentStep(
        onboardingApiState,
        visualState,
      );

      // 6. Cross-validate step detection
      const detectedState = {
        currentStep,
        authState,
        onboardingApiState,
        visualState,
        stepsCompleted: onboardingApiState?.stepsCompleted || {},
        isComplete:
          authState.onboardingCompleted ||
          (onboardingApiState && onboardingApiState.isComplete),
        needsAuthentication: false,
        canResumeFrom: currentStep,
        url: this.page.url(),
      };

      console.error("✅ Complete State Detection:", detectedState);
      return detectedState;
    } catch (error) {
      console.error("❌ Comprehensive state detection error:", error.message);
      return {
        currentStep: 0,
        error: error.message,
        url: this.page.url(),
      };
    }
  }

  determineCurrentStep(apiState, visualState) {
    console.error("🎯 Determining current step from multiple sources...");

    // Priority 1: API state (most reliable)
    if (apiState && apiState.currentStep) {
      console.error(`📊 API indicates step: ${apiState.currentStep}`);
      return apiState.currentStep;
    }

    // Priority 2: Visual content analysis
    if (visualState) {
      if (visualState.pathname && visualState.pathname.includes("/dashboard")) {
        return 5; // Completed
      }

      if (visualState.hasVerificationContent) {
        return 4;
      } else if (
        visualState.hasLegalContent ||
        visualState.hasSignButtons > 0
      ) {
        return 3;
      } else if (visualState.hasSignatureContent) {
        return 2;
      } else if (visualState.hasPersonalForm) {
        return 1;
      }
    }

    // Priority 3: Step completion flags (determine next step)
    if (apiState && apiState.stepsCompleted) {
      const completed = apiState.stepsCompleted;
      if (!completed.personalInfo) return 1;
      if (!completed.signature) return 2;
      if (!completed.legalConsent) return 3;
      if (!completed.verification) return 4;
      return 5; // All completed
    }

    // Fallback: assume step 1
    console.error("⚠️ Could not determine step, defaulting to 1");
    return 1;
  }

  async verifyStepCompletion(stepNumber) {
    console.error(`🔍 Verifying step ${stepNumber} completion...`);

    try {
      // Wait a moment for any pending operations
      await this.page.waitForTimeout(2000);

      const state = await this.detectOnboardingState();

      // Check if we've moved to the next step or beyond
      const isCompleted = state.currentStep > stepNumber || state.isComplete;

      console.error(`✅ Step ${stepNumber} completion status: ${isCompleted}`);
      return isCompleted;
    } catch (error) {
      console.error(`❌ Step verification error:`, error.message);
      return false;
    }
  }

  async logStepProgress(step, action, data = {}) {
    const timestamp = new Date().toISOString();
    console.error(`📝 [${timestamp}] Step ${step}: ${action}`, data);

    // Take diagnostic screenshot
    try {
      await this.page.screenshot({
        path: `tests/screenshots/debug-step-${step}-${action.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`,
        fullPage: true,
      });
    } catch (error) {
      console.error("Screenshot failed:", error.message);
    }
  }

  async recoverFromError(error, currentStep) {
    console.error(`🚨 Error recovery for step ${currentStep}:`, error.message);

    await this.logStepProgress(currentStep, "error-recovery", {
      error: error.message,
    });

    // Try to get current state
    const state = await this.detectOnboardingState();

    // If we're not where we expected, navigate back to onboarding
    if (!state.pageState.isOnOnboarding) {
      console.error("🔄 Navigating back to onboarding...");
      await this.page.goto(`${this.baseUrl}/onboarding`);
      await this.page.waitForLoadState("networkidle");
    }

    return state;
  }

  async completePersonalInfoStep(personalInfo) {
    await this.logStepProgress(1, "starting-personal-info");

    try {
      // Wait for personal info form to be ready
      await this.page.waitForSelector("form", { timeout: 10000 });
      await this.page.waitForLoadState("networkidle");

      console.error("📝 Personal info form found, filling fields...");

      // Use exact selectors based on actual component code
      const fields = [
        {
          selector: 'input[placeholder="Enter your first name"]',
          value: personalInfo.first_name,
          name: "first name",
          required: true,
        },
        {
          selector: 'input[placeholder="Enter your last name"]',
          value: personalInfo.last_name,
          name: "last name",
          required: true,
        },
        {
          selector: 'input[type="date"]',
          value: personalInfo.date_of_birth,
          name: "date of birth",
          required: true,
        },
        {
          selector: 'input[placeholder="Enter your phone number"]',
          value: personalInfo.phone_number,
          name: "phone number",
          required: true,
        },
        {
          selector: 'input[placeholder="Enter your street address"]',
          value: personalInfo.address_line_1,
          name: "address line 1",
          required: true,
        },
        {
          selector: 'input[placeholder="Enter city or town"]',
          value: personalInfo.city,
          name: "city",
          required: true,
        },
        {
          selector: 'input[placeholder="Enter eircode"]',
          value: personalInfo.eircode,
          name: "eircode",
          required: true,
        },
      ];

      // Fill all text fields with retries
      for (const field of fields) {
        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts) {
          try {
            await this.page.waitForSelector(field.selector, { timeout: 5000 });

            // Clear field first
            await this.page.fill(field.selector, "");
            await this.page.waitForTimeout(100);

            // Fill with value
            await this.page.fill(field.selector, field.value);

            // Verify the value was set
            const actualValue = await this.page.inputValue(field.selector);
            if (actualValue === field.value) {
              console.error(`✅ Filled ${field.name}: ${field.value}`);
              break;
            } else {
              throw new Error(
                `Value mismatch: expected "${field.value}", got "${actualValue}"`,
              );
            }
          } catch (error) {
            attempts++;
            console.error(
              `❌ Attempt ${attempts} failed for ${field.name}: ${error.message}`,
            );
            if (attempts >= maxAttempts) {
              if (field.required) {
                throw new Error(
                  `Failed to fill required field ${field.name} after ${maxAttempts} attempts`,
                );
              } else {
                console.error(`⚠️ Skipping optional field ${field.name}`);
              }
            }
            await this.page.waitForTimeout(1000);
          }
        }
      }

      // Handle County Dropdown with multiple strategies
      await this.logStepProgress(1, "selecting-county");
      console.error("🌍 Handling county selection...");

      let countySelected = false;
      const countyStrategies = [
        // Strategy 1: HeroUI Select - click trigger with placeholder text
        async () => {
          // Find the Select trigger button by its placeholder text
          const countyTrigger = this.page
            .locator('button:has-text("Select county")')
            .first();
          await countyTrigger.waitFor({ timeout: 5000 });
          await countyTrigger.click();
          console.error(
            "🎯 County dropdown opened via placeholder text trigger",
          );

          // Wait for dropdown to open and find Dublin option
          await this.page.waitForTimeout(1000);
          const dublinOption = this.page
            .locator('li[role="option"]:has-text("Dublin")')
            .first();
          await dublinOption.waitFor({ timeout: 3000 });
          await dublinOption.click();

          return true;
        },
        // Strategy 2: Alternative HeroUI Select with data-slot
        async () => {
          const countyTrigger = this.page
            .locator('button[data-slot="trigger"]')
            .filter({ hasText: "Select county" })
            .or(
              this.page
                .locator('button[data-slot="trigger"]')
                .filter({ hasText: "County" }),
            );
          await countyTrigger.waitFor({ timeout: 5000 });
          await countyTrigger.click();
          console.error("🎯 County dropdown opened via data-slot trigger");

          // Look for Dublin in the opened listbox
          await this.page.waitForTimeout(1000);
          const dublinOption = this.page
            .locator(
              '[role="listbox"] li:has-text("Dublin"), [role="option"]:has-text("Dublin")',
            )
            .first();
          await dublinOption.waitFor({ timeout: 3000 });
          await dublinOption.click();

          return true;
        },
        // Strategy 3: Generic text-based selection
        async () => {
          // Find any button/element that shows "Select county" and click it
          const selectElement = this.page
            .locator('*:has-text("Select county")')
            .first();
          await selectElement.click();
          console.error("🎯 County dropdown opened via generic text selection");

          await this.page.waitForTimeout(1500);
          // Look for Dublin in various possible dropdown structures
          const dublinOption = this.page
            .locator('*:has-text("Dublin")')
            .filter({
              has: this.page.locator(':not(:has-text("Select county"))'),
            })
            .first();
          await dublinOption.click();

          return true;
        },
      ];

      for (let i = 0; i < countyStrategies.length && !countySelected; i++) {
        try {
          console.error(`🔄 Trying county selection strategy ${i + 1}...`);
          await countyStrategies[i]();

          // Verify selection worked - check if Dublin appears in the trigger button
          await this.page.waitForTimeout(1500);
          const hasSelectedCounty = await this.page.evaluate(() => {
            // Check if the select trigger now shows "Dublin" instead of "Select county"
            const selectTriggers = document.querySelectorAll(
              'button[data-slot="trigger"], button:has-text("Dublin")',
            );
            for (let trigger of selectTriggers) {
              if (
                trigger.textContent.includes("Dublin") &&
                !trigger.textContent.includes("Select county")
              ) {
                return true;
              }
            }
            // Fallback: check if any select element has Dublin as value
            const selectElements = document.querySelectorAll(
              'select, input[name="county"]',
            );
            for (let element of selectElements) {
              if (element.value === "Dublin") {
                return true;
              }
            }
            return false;
          });

          if (hasSelectedCounty) {
            countySelected = true;
            console.error(
              `✅ County selected successfully with strategy ${i + 1}`,
            );
          }
        } catch (error) {
          console.error(`❌ County strategy ${i + 1} failed:`, error.message);
        }
      }

      if (!countySelected) {
        throw new Error("Failed to select county with all strategies");
      }

      // Wait for form validation
      await this.logStepProgress(1, "waiting-for-validation");
      console.error("⏳ Waiting for form validation...");

      // Wait for Continue button to be enabled
      const continueButton = this.page.locator('button:has-text("Continue")');
      await continueButton.waitFor({ state: "visible", timeout: 5000 });

      // Wait for button to be enabled (check multiple times)
      for (let i = 0; i < 10; i++) {
        const isDisabled = await continueButton.getAttribute("disabled");
        if (isDisabled === null) {
          console.error("✅ Continue button is enabled");
          break;
        }
        console.error(
          `⏳ Continue button still disabled, waiting... (${i + 1}/10)`,
        );
        await this.page.waitForTimeout(500);
      }

      // Submit form
      await this.logStepProgress(1, "submitting-form");
      console.error("🚀 Submitting personal info form...");

      // Use form submission instead of button click for better reliability
      const formSubmitted = await this.page.evaluate(() => {
        const form = document.querySelector("form");
        if (form) {
          form.requestSubmit();
          return true;
        }
        return false;
      });

      if (!formSubmitted) {
        // Fallback to button click
        await continueButton.click();
        console.error("📝 Form submitted via button click fallback");
      } else {
        console.error("📝 Form submitted via requestSubmit");
      }

      // Verify navigation to next step
      await this.logStepProgress(1, "verifying-navigation");
      console.error("🔍 Verifying navigation to Step 2...");

      const navigationSuccess = await this.page.waitForFunction(
        () => {
          const stepHeader = document.querySelector("h1");
          const url = window.location.href;
          return (
            (stepHeader && stepHeader.textContent.includes("Signature")) ||
            url.includes("step=2") ||
            document.body.textContent.includes("Choose Your Signature Style")
          );
        },
        { timeout: 15000 },
      );

      if (navigationSuccess) {
        console.error("✅ Successfully navigated to Step 2 (Signature)");
        await this.logStepProgress(1, "completed-successfully");
        return true;
      } else {
        throw new Error("Failed to navigate to Step 2");
      }
    } catch (error) {
      await this.logStepProgress(1, "error-occurred", { error: error.message });
      console.error("❌ Personal info step failed:", error.message);

      // Try recovery
      await this.recoverFromError(error, 1);
      throw error;
    }
  }

  async completeSignatureStep(personalInfo) {
    await this.logStepProgress(2, "starting-signature");

    try {
      // Wait for signature step to load completely
      await this.page.waitForFunction(
        () => {
          const stepHeader = document.querySelector("h1");
          return stepHeader && stepHeader.textContent.includes("Signature");
        },
        { timeout: 10000 },
      );

      await this.page.waitForLoadState("networkidle");
      console.error("📝 Signature step loaded");

      // Check if signature already exists
      const hasExistingSignature = await this.page.evaluate(() => {
        return (
          document.body.textContent.includes("Claude Assistant") ||
          !!document.querySelector('[class*="signature"]')
        );
      });

      if (hasExistingSignature) {
        console.error("✅ Signature already exists, proceeding to submit");
      } else {
        // Create new signature - look for signature templates
        await this.logStepProgress(2, "selecting-signature-template");
        console.error("🎨 Creating new signature...");

        // Wait for signature options to be visible
        await this.page.waitForTimeout(2000);

        // Strategy 1: Look for signature template cards (visible in screenshot)
        let signatureSelected = false;

        // Find signature template cards - they show "Claude Assistant" in different fonts
        const signatureTemplates = await this.page
          .locator('[class*="signature"], .cursor-pointer')
          .all();
        console.error(
          `🎯 Found ${signatureTemplates.length} potential signature templates`,
        );

        if (signatureTemplates.length > 0) {
          // Select the first available signature template
          try {
            await signatureTemplates[0].click();
            console.error("✅ Selected first signature template");
            signatureSelected = true;
            await this.page.waitForTimeout(1500); // Wait for template to render
          } catch (error) {
            console.error(
              "❌ Failed to select signature template:",
              error.message,
            );
          }
        }

        // Strategy 2: If no templates found, look for "Choose Different Type" or creation buttons
        if (!signatureSelected) {
          console.error("🔄 Trying alternative signature creation...");

          const createButtons = [
            'button:has-text("Text")',
            'button:has-text("Create")',
            'button:has-text("Start")',
            '[role="button"]',
          ];

          for (const buttonSelector of createButtons) {
            try {
              const button = this.page.locator(buttonSelector).first();
              if ((await button.count()) > 0) {
                await button.click();
                console.error(`✅ Clicked ${buttonSelector}`);
                signatureSelected = true;
                await this.page.waitForTimeout(1000);
                break;
              }
            } catch (error) {
              console.error(`❌ ${buttonSelector} failed:`, error.message);
            }
          }
        }

        // If we triggered creation, look for text input
        const signatureInput = await this.page
          .locator('input[type="text"], textarea')
          .first();
        if ((await signatureInput.count()) > 0) {
          const signatureName = `${personalInfo.first_name} ${personalInfo.last_name}`;
          await signatureInput.fill(signatureName);
          console.error(`✅ Entered signature text: ${signatureName}`);
          await this.page.waitForTimeout(1000);
        }
      }

      // Submit signature step
      await this.logStepProgress(2, "submitting-signature");
      console.error("🚀 Submitting signature step...");

      // Look for Continue or Submit button
      const submitButtons = [
        'button:has-text("Continue")',
        'button:has-text("Submit")',
        'button:has-text("Next")',
        'button[type="submit"]',
      ];

      let submitted = false;
      for (const buttonSelector of submitButtons) {
        try {
          const button = this.page.locator(buttonSelector);
          if ((await button.count()) > 0) {
            await button.waitFor({ state: "visible", timeout: 3000 });

            // Check if button is enabled
            const isDisabled = await button.getAttribute("disabled");
            if (isDisabled === null) {
              await button.click();
              console.error(`✅ Submitted via ${buttonSelector}`);
              submitted = true;
              break;
            } else {
              console.error(`⚠️ ${buttonSelector} is disabled, trying next...`);
            }
          }
        } catch (error) {
          console.error(`❌ ${buttonSelector} failed:`, error.message);
        }
      }

      if (!submitted) {
        throw new Error("Could not find enabled submit button for signature");
      }

      // Verify navigation to legal consent step
      await this.logStepProgress(2, "verifying-navigation");
      console.error("🔍 Verifying navigation to Step 3 (Legal Consent)...");

      const navigationSuccess = await this.page.waitForFunction(
        () => {
          const stepHeader = document.querySelector("h1");
          const url = window.location.href;
          return (
            (stepHeader &&
              (stepHeader.textContent.includes("Legal") ||
                stepHeader.textContent.includes("Consent"))) ||
            url.includes("step=3") ||
            document.body.textContent.includes("Terms of Service") ||
            document.body.textContent.includes("Legal Consent")
          );
        },
        { timeout: 15000 },
      );

      if (navigationSuccess) {
        console.error("✅ Successfully navigated to Step 3 (Legal Consent)");
        await this.logStepProgress(2, "completed-successfully");
        return true;
      } else {
        throw new Error("Failed to navigate to Step 3");
      }
    } catch (error) {
      await this.logStepProgress(2, "error-occurred", { error: error.message });
      console.error("❌ Signature step failed:", error.message);

      // Try recovery
      await this.recoverFromError(error, 2);
      throw error;
    }
  }

  async completeLegalConsentStep() {
    await this.logStepProgress(3, "starting-legal-consent");

    try {
      // Wait for legal consent step to load
      await this.page.waitForFunction(
        () => {
          const stepHeader = document.querySelector("h1");
          return stepHeader && stepHeader.textContent.includes("Legal");
        },
        { timeout: 10000 },
      );

      await this.page.waitForLoadState("networkidle");
      console.error("📋 Legal consent step loaded");

      // Define the 5 required consents from the component code
      const REQUIRED_CONSENTS = [
        "terms_of_service",
        "privacy_policy",
        "legal_disclaimer",
        "data_processing",
        "electronic_signature",
      ];

      console.error(
        `📝 Processing ${REQUIRED_CONSENTS.length} required consent documents...`,
      );

      // Strategy 1: Look for individual consent signature buttons
      let signedCount = 0;
      for (const consentId of REQUIRED_CONSENTS) {
        await this.logStepProgress(3, `signing-consent-${consentId}`);
        console.error(`✍️ Signing consent: ${consentId}...`);

        let consentSigned = false;
        const signingStrategies = [
          // Strategy A: Look for consent-specific sign buttons
          async () => {
            const signButton = this.page.locator(
              `button:has-text("Sign"):near([id*="${consentId}"], [data-consent-id="${consentId}"])`,
            );
            if ((await signButton.count()) > 0) {
              await signButton.click();
              return true;
            }
            return false;
          },
          // Strategy B: Look for generic sign buttons in consent cards
          async () => {
            const consentCards = await this.page
              .locator('[class*="consent"], [class*="card"]')
              .all();
            for (
              let i = 0;
              i < Math.min(consentCards.length, REQUIRED_CONSENTS.length);
              i++
            ) {
              if (i === REQUIRED_CONSENTS.indexOf(consentId)) {
                const signButton = consentCards[i].locator(
                  'button:has-text("Sign")',
                );
                if ((await signButton.count()) > 0) {
                  await signButton.click();
                  return true;
                }
              }
            }
            return false;
          },
          // Strategy C: Find all sign buttons and click them sequentially
          async () => {
            const allSignButtons = await this.page
              .locator('button:has-text("Sign")')
              .all();
            const consentIndex = REQUIRED_CONSENTS.indexOf(consentId);
            if (allSignButtons[consentIndex]) {
              await allSignButtons[consentIndex].click();
              return true;
            }
            return false;
          },
        ];

        for (
          let strategyIndex = 0;
          strategyIndex < signingStrategies.length && !consentSigned;
          strategyIndex++
        ) {
          try {
            console.error(
              `🔄 Trying signing strategy ${strategyIndex + 1} for ${consentId}...`,
            );
            consentSigned = await signingStrategies[strategyIndex]();

            if (consentSigned) {
              console.error(
                `✅ Successfully signed ${consentId} with strategy ${strategyIndex + 1}`,
              );

              // Wait for signature to process (API call)
              await this.page.waitForTimeout(1500);

              // Look for success indicator or signature stamp
              const hasSignature = await this.page.evaluate(() => {
                return (
                  document.body.textContent.includes("Signed") ||
                  !!document.querySelector('[class*="signature-stamp"]') ||
                  !!document.querySelector(".signed")
                );
              });

              if (hasSignature) {
                signedCount++;
                console.error(`✅ Consent ${consentId} signature confirmed`);
              }
              break;
            }
          } catch (error) {
            console.error(
              `❌ Strategy ${strategyIndex + 1} failed for ${consentId}: ${error.message}`,
            );
          }
        }

        if (!consentSigned) {
          console.error(
            `⚠️ Failed to sign ${consentId}, continuing with others...`,
          );
        }
      }

      console.error(
        `📊 Signed ${signedCount}/${REQUIRED_CONSENTS.length} consent documents`,
      );

      // Strategy 2: Fallback - look for checkboxes if individual signing failed
      if (signedCount === 0) {
        await this.logStepProgress(3, "fallback-checkbox-signing");
        console.error("🔄 Falling back to checkbox-based consent...");

        try {
          await this.page.waitForSelector('input[type="checkbox"]', {
            timeout: 5000,
          });
          const checkboxes = await this.page
            .locator('input[type="checkbox"]')
            .all();
          console.error(`📋 Found ${checkboxes.length} consent checkboxes`);

          for (let i = 0; i < checkboxes.length; i++) {
            const checkbox = checkboxes[i];
            const isChecked = await checkbox.isChecked();
            if (!isChecked) {
              await checkbox.check();
              console.error(`✅ Checked consent checkbox ${i + 1}`);
              signedCount++;
              await this.page.waitForTimeout(300); // Brief pause between checks
            }
          }
        } catch (error) {
          console.error("❌ Checkbox fallback failed:", error.message);
        }
      }

      if (signedCount === 0) {
        throw new Error("Failed to sign any consent documents");
      }

      // Submit legal consent step
      await this.logStepProgress(3, "submitting-consents");
      console.error("🚀 Submitting legal consent step...");

      const submitButtons = [
        'button:has-text("Continue to Verification")',
        'button:has-text("Continue")',
        'button:has-text("Submit")',
        'button:has-text("Next")',
        'button[type="submit"]',
      ];

      let submitted = false;
      for (const buttonSelector of submitButtons) {
        try {
          const button = this.page.locator(buttonSelector);
          if ((await button.count()) > 0) {
            await button.waitFor({ state: "visible", timeout: 3000 });

            // Check if button is enabled
            const isDisabled = await button.getAttribute("disabled");
            if (isDisabled === null) {
              await button.click();
              console.error(`✅ Submitted consents via ${buttonSelector}`);
              submitted = true;
              break;
            } else {
              console.error(`⚠️ ${buttonSelector} is disabled, trying next...`);
            }
          }
        } catch (error) {
          console.error(`❌ ${buttonSelector} failed:`, error.message);
        }
      }

      if (!submitted) {
        throw new Error(
          "Could not find enabled submit button for legal consent",
        );
      }

      // Verify navigation to verification step
      await this.logStepProgress(3, "verifying-navigation");
      console.error("🔍 Verifying navigation to Step 4 (Verification)...");

      const navigationSuccess = await this.page.waitForFunction(
        () => {
          const stepHeader = document.querySelector("h1");
          const url = window.location.href;
          return (
            (stepHeader &&
              (stepHeader.textContent.includes("Verification") ||
                stepHeader.textContent.includes("Identity"))) ||
            url.includes("step=4") ||
            document.body.textContent.includes("Identity Verification") ||
            document.body.textContent.includes("Stripe")
          );
        },
        { timeout: 15000 },
      );

      if (navigationSuccess) {
        console.error("✅ Successfully navigated to Step 4 (Verification)");
        await this.logStepProgress(3, "completed-successfully");
        return true;
      } else {
        throw new Error("Failed to navigate to Step 4");
      }
    } catch (error) {
      await this.logStepProgress(3, "error-occurred", { error: error.message });
      console.error("❌ Legal consent step failed:", error.message);

      // Try recovery
      await this.recoverFromError(error, 3);
      throw error;
    }
  }

  async completeVerificationStep(skipVerification = true) {
    await this.logStepProgress(4, "starting-verification");

    try {
      // Wait for verification step to load
      await this.page.waitForFunction(
        () => {
          const stepHeader = document.querySelector("h1");
          return stepHeader && stepHeader.textContent.includes("Verification");
        },
        { timeout: 10000 },
      );

      await this.page.waitForLoadState("networkidle");
      console.error("🔐 Verification step loaded");

      // Check current verification status
      const verificationState = await this.page.evaluate(async () => {
        try {
          const response = await fetch("/api/onboarding/verification");
          if (response.ok) {
            const data = await response.json();
            return {
              completed: data.verification?.completed,
              status: data.verification?.status,
              stripeStatus: data.verification?.stripeStatus?.status,
            };
          }
        } catch (error) {
          console.error("Failed to fetch verification status:", error);
        }
        return null;
      });

      console.error("🔍 Verification state:", verificationState);

      if (verificationState?.completed) {
        console.error(
          "✅ Verification already completed, proceeding to finalize...",
        );
      } else if (skipVerification) {
        await this.logStepProgress(4, "attempting-skip");
        console.error("⏭️ Attempting to skip verification...");

        let verificationHandled = false;

        // Strategy 1: Look for skip buttons
        const skipStrategies = [
          'button:has-text("Skip")',
          'button:has-text("Complete Later")',
          'button:has-text("Skip for now")',
          'button:has-text("Skip verification")',
          'button:has-text("Continue without")',
          'a:has-text("Skip")',
        ];

        for (const skipSelector of skipStrategies) {
          try {
            const skipButton = this.page.locator(skipSelector);
            if ((await skipButton.count()) > 0) {
              await skipButton.first().click();
              console.error(`✅ Clicked skip button: ${skipSelector}`);
              verificationHandled = true;
              await this.page.waitForTimeout(2000);
              break;
            }
          } catch (error) {
            console.error(
              `❌ Skip strategy failed for ${skipSelector}: ${error.message}`,
            );
          }
        }

        // Strategy 2: Use debug API to complete verification
        if (!verificationHandled) {
          await this.logStepProgress(4, "using-debug-api");
          console.error("🛠️ Using debug API to complete verification...");

          const apiResult = await this.page.evaluate(async () => {
            try {
              const response = await fetch("/api/debug/verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "complete_verification",
                  testMode: true,
                }),
              });

              if (response.ok) {
                return await response.json();
              }
              return { error: `API returned ${response.status}` };
            } catch (error) {
              return { error: error.message };
            }
          });

          console.error("🛠️ Debug API result:", apiResult);

          if (!apiResult.error) {
            verificationHandled = true;
            console.error("✅ Verification completed via debug API");
          }
        }

        // Strategy 3: Manual completion via onboarding complete API
        if (!verificationHandled) {
          await this.logStepProgress(4, "manual-completion");
          console.error("🔧 Attempting manual completion...");

          const completionResult = await this.page.evaluate(async () => {
            try {
              const response = await fetch("/api/onboarding/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });

              if (response.ok) {
                return await response.json();
              }
              return { error: `Completion API returned ${response.status}` };
            } catch (error) {
              return { error: error.message };
            }
          });

          console.error("🔧 Manual completion result:", completionResult);

          if (!completionResult.error) {
            verificationHandled = true;
            console.error("✅ Onboarding completed manually");
          }
        }

        if (!verificationHandled) {
          console.error(
            "⚠️ Could not skip verification automatically, looking for completion buttons...",
          );
        }
      } else {
        // Handle actual Stripe verification flow
        await this.logStepProgress(4, "starting-stripe-verification");
        console.error("🏛️ Starting Stripe verification process...");

        const startButton = this.page.locator(
          'button:has-text("Start"), button:has-text("Begin"), button:has-text("Verify")',
        );
        if ((await startButton.count()) > 0) {
          await startButton.first().click();
          console.error("✅ Started Stripe verification");

          // Wait for external redirect or completion
          // Note: In a real scenario, this would redirect to Stripe and require manual completion
          await this.page.waitForTimeout(5000);
        }
      }

      // Look for final completion buttons regardless of skip/verify path
      await this.logStepProgress(4, "finalizing-onboarding");
      console.error("🏁 Looking for final completion buttons...");

      const completionButtons = [
        'button:has-text("Complete Onboarding")',
        'button:has-text("Finish")',
        'button:has-text("Done")',
        'button:has-text("Go to Dashboard")',
        'button:has-text("Continue to Dashboard")',
        'button:has-text("Complete")',
      ];

      let finalCompleted = false;
      for (const buttonSelector of completionButtons) {
        try {
          const button = this.page.locator(buttonSelector);
          if ((await button.count()) > 0) {
            await button.waitFor({ state: "visible", timeout: 3000 });
            await button.click();
            console.error(`✅ Clicked final completion: ${buttonSelector}`);
            finalCompleted = true;
            break;
          }
        } catch (error) {
          console.error(
            `❌ Completion button failed for ${buttonSelector}: ${error.message}`,
          );
        }
      }

      // Verify final completion and dashboard navigation
      await this.logStepProgress(4, "verifying-completion");
      console.error(
        "🔍 Verifying onboarding completion and dashboard navigation...",
      );

      const completionSuccess = await this.page.waitForFunction(
        () => {
          const url = window.location.href;
          const isDashboard = url.includes("/dashboard");
          const hasCompleteIndicator =
            document.body.textContent.includes("Welcome") ||
            document.body.textContent.includes("Dashboard") ||
            document.body.textContent.includes("completed");

          return isDashboard || hasCompleteIndicator;
        },
        { timeout: 20000 },
      );

      if (completionSuccess) {
        const finalUrl = this.page.url();
        if (finalUrl.includes("/dashboard")) {
          console.error(
            "✅ Successfully completed onboarding and reached dashboard!",
          );
          await this.logStepProgress(4, "onboarding-completed-dashboard");
          return true;
        } else {
          console.error("✅ Onboarding completed but not yet on dashboard");
          await this.logStepProgress(4, "onboarding-completed-other");
          return true;
        }
      } else {
        throw new Error("Failed to complete onboarding verification step");
      }
    } catch (error) {
      await this.logStepProgress(4, "error-occurred", { error: error.message });
      console.error("❌ Verification step failed:", error.message);

      // Try recovery
      await this.recoverFromError(error, 4);
      throw error;
    }
  }

  async completeOnboarding({ personalInfo = {}, skipVerification = true }) {
    console.error("🚀 Starting DYNAMIC STATE-AWARE onboarding automation...");

    const startTime = Date.now();

    try {
      // Validate page object is available
      if (!this.page) {
        throw new Error(
          "Browser page not available - initialization may have failed",
        );
      }

      const defaultPersonalInfo = {
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

      // Phase 1: Comprehensive state detection WITHOUT navigation assumptions
      console.error("🔍 Phase 1: Comprehensive state detection...");
      const currentState = await this.detectOnboardingState();

      console.error("📊 DETECTED STATE:", {
        currentStep: currentState.currentStep,
        needsAuth: currentState.needsAuthentication,
        isComplete: currentState.isComplete,
        canResumeFrom: currentState.canResumeFrom,
        stepsCompleted: currentState.stepsCompleted,
        currentUrl: currentState.url,
      });

      // Phase 2: Handle authentication if needed
      if (currentState.needsAuthentication) {
        console.error("🔐 User not authenticated, need to authenticate first");
        return {
          content: [
            {
              type: "text",
              text: "User not authenticated. Please run authenticate() first, then retry onboarding.",
            },
          ],
        };
      }

      // Phase 3: Handle already completed onboarding
      if (currentState.isComplete) {
        console.error("✅ Onboarding already completed!");

        // Navigate to dashboard if not already there
        if (currentState.needsRedirectToDashboard) {
          console.error("🧭 Redirecting to dashboard...");
          await this.page.goto(`${this.baseUrl}/dashboard`);
          await this.page.waitForLoadState("networkidle");
        }

        return {
          content: [
            {
              type: "text",
              text: "Onboarding already completed! User is now on dashboard.",
            },
          ],
        };
      }

      // Phase 4: Navigate to onboarding page if needed
      if (!currentState.authState.isOnOnboarding) {
        console.error("🧭 Navigating to onboarding page...");
        await this.page.goto(`${this.baseUrl}/onboarding`);
        await this.page.waitForLoadState("networkidle");

        // Re-detect state after navigation
        console.error("🔄 Re-detecting state after navigation...");
        const updatedState = await this.detectOnboardingState();
        Object.assign(currentState, updatedState);
      }

      console.error(
        `📍 DYNAMIC EXECUTION: Starting from step ${currentState.currentStep}`,
      );

      // Phase 5: Dynamic step execution based on actual state
      const stepResults = {};
      const stepExecutors = [
        {
          num: 1,
          name: "Personal Information",
          execute: () => this.completePersonalInfoStep(defaultPersonalInfo),
        },
        {
          num: 2,
          name: "Signature",
          execute: () => this.completeSignatureStep(defaultPersonalInfo),
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

      for (const step of stepExecutors) {
        const isAlreadyCompleted =
          currentState.stepsCompleted[this.getStepCompletionKey(step.num)];
        const shouldExecute =
          currentState.canResumeFrom <= step.num && !isAlreadyCompleted;

        if (!shouldExecute) {
          console.error(
            `⏭️ Skipping Step ${step.num} (${step.name}) - already completed`,
          );
          stepResults[step.num] = {
            status: "skipped",
            reason: "already_completed",
          };
          continue;
        }

        console.error(`🏃 EXECUTING Step ${step.num}: ${step.name}...`);

        try {
          // Execute the step
          await step.execute();

          // Verify step completion with robust checking
          const postStepState = await this.detectOnboardingState();
          const stepAdvanced = postStepState.currentStep > step.num;
          const wasCompleted = await this.verifyStepCompletion(step.num);

          if (stepAdvanced || wasCompleted) {
            console.error(`✅ Step ${step.num} completed successfully`);
            stepResults[step.num] = {
              status: "completed",
              advanced: stepAdvanced,
            };

            // Update current state for next iteration
            Object.assign(currentState, postStepState);
          } else {
            console.error(
              `⚠️ Step ${step.num} execution finished but completion unclear`,
            );
            stepResults[step.num] = { status: "uncertain" };
          }
        } catch (error) {
          console.error(`❌ Step ${step.num} failed:`, error.message);
          stepResults[step.num] = { status: "failed", error: error.message };

          // For critical steps, don't continue
          if (step.num <= 2) {
            console.error(
              `💥 Critical step ${step.num} failed, stopping automation`,
            );
            break;
          }
        }

        // Brief pause between steps
        await this.page.waitForTimeout(1000);
      }

      // Phase 6: Final comprehensive verification
      console.error("🔍 Performing final comprehensive verification...");
      const finalState = await this.detectOnboardingState();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      // Calculate success metrics
      const completedCount = Object.values(stepResults).filter(
        (r) => r.status === "completed",
      ).length;
      const skippedCount = Object.values(stepResults).filter(
        (r) => r.status === "skipped",
      ).length;
      const failedCount = Object.values(stepResults).filter(
        (r) => r.status === "failed",
      ).length;

      console.error(`📊 DYNAMIC ONBOARDING SUMMARY:`);
      console.error(`   ⏱️  Duration: ${duration}s`);
      console.error(`   ✅ Steps executed: ${completedCount}`);
      console.error(`   ⏭️ Steps skipped: ${skippedCount}`);
      console.error(`   ❌ Steps failed: ${failedCount}`);
      console.error(`   🎯 Final state: Step ${finalState.currentStep}`);
      console.error(`   🌐 Final URL: ${finalState.url}`);
      console.error(`   📍 Onboarding complete: ${finalState.isComplete}`);
      console.error(`   📋 Step results:`, stepResults);

      if (finalState.isComplete) {
        console.error("🎉 DYNAMIC ONBOARDING COMPLETED SUCCESSFULLY!");
        return {
          content: [
            {
              type: "text",
              text: `✅ Dynamic state-aware onboarding completed in ${duration}s! Executed: ${completedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}. User is now fully authenticated and ready.`,
            },
          ],
        };
      } else {
        console.error("⚠️ Onboarding not fully completed");
        return {
          content: [
            {
              type: "text",
              text: `⚠️ Onboarding partially completed in ${duration}s. Current step: ${finalState.currentStep}. Executed: ${completedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}.`,
            },
          ],
        };
      }
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(
        `💥 DYNAMIC ONBOARDING FAILED after ${duration}s:`,
        error.message,
      );

      // Final diagnostic screenshot
      try {
        await this.logStepProgress("final", "error-state", {
          error: error.message,
        });
      } catch (screenshotError) {
        console.error(
          "Failed to take error screenshot:",
          screenshotError.message,
        );
      }

      return {
        content: [
          {
            type: "text",
            text: `❌ Dynamic onboarding failed after ${duration}s: ${error.message}. Check debug screenshots for details.`,
          },
        ],
      };
    }
  }

  getStepCompletionKey(stepNumber) {
    const keyMap = {
      1: "personalInfo",
      2: "signature",
      3: "legalConsent",
      4: "verification",
    };
    return keyMap[stepNumber];
  }

  async authenticateAndOnboard({
    email = "claude.assistant@example.com",
    password = "DemoPassword123!",
    skipVerification = true,
  }) {
    console.error("Starting full authentication and onboarding process...");

    // Step 1: Authenticate
    const authResult = await this.authenticate({ email, password });
    console.error("Authentication result:", authResult.content[0].text);

    // Check if we need onboarding
    const currentUrl = this.page.url();
    if (currentUrl.includes("/onboarding")) {
      console.error(
        "User needs onboarding, proceeding with onboarding completion...",
      );
      return await this.completeOnboarding({ skipVerification });
    } else if (currentUrl.includes("/dashboard")) {
      return {
        content: [
          {
            type: "text",
            text: "User fully authenticated and onboarded! Ready to use application features.",
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: `Authentication completed but unexpected state. Current URL: ${currentUrl}`,
          },
        ],
      };
    }
  }

  setupErrorHandling() {
    process.on("SIGINT", async () => {
      await this.cleanup();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      await this.cleanup();
      process.exit(0);
    });
  }

  async cleanup() {
    if (this.browser) {
      console.error("Closing browser...");
      await this.browser.close();
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Playwright MCP Server running on stdio");
  }
}

// Start the server
const server = new PlaywrightMCPServer();
server.run().catch(console.error);
