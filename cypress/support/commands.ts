// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/// <reference types="cypress" />
import { TestAuthManager } from '../../tests/test-auth-utils';

// Real Authentication Commands - using actual JWT tokens and database
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit("/login");
    cy.get('[data-testid*="email"]').type(email);
    cy.get('[data-testid*="password"]').type(password);
    cy.get('[data-testid*="submit"]').click();
    cy.url().should("include", "/dashboard");
  });
});

// Real Authentication - creates user with actual JWT tokens
Cypress.Commands.add("loginAsTestUser", (userType: 'standard' | 'admin' | 'onboarding' = 'standard') => {
  cy.task('createAuthenticatedTestUser', { userType }).then((authContext: any) => {
    // Set real authentication cookies
    cy.setCookie('herit_access_token', authContext.accessToken);
    cy.setCookie('herit_refresh_token', authContext.refreshToken);
    
    // Store user context for test cleanup
    Cypress.env('testUserId', authContext.user.id);
    Cypress.env('testUserEmail', authContext.user.email);
  });
});

// Login with specific user data  
Cypress.Commands.add("loginAsCustomTestUser", (userData: {
  email?: string;
  first_name?: string;
  last_name?: string;
  onboarding_completed?: boolean;
  verification_completed?: boolean;
}) => {
  cy.task('createAuthenticatedTestUser', { userData }).then((authContext: any) => {
    cy.setCookie('herit_access_token', authContext.accessToken);
    cy.setCookie('herit_refresh_token', authContext.refreshToken);
    
    Cypress.env('testUserId', authContext.user.id);
    Cypress.env('testUserEmail', authContext.user.email);
  });
});

// Clear authentication
Cypress.Commands.add("logout", () => {
  cy.clearCookie('herit_access_token');
  cy.clearCookie('herit_refresh_token');
  cy.visit('/');
});

// Setup test user with onboarding completed
Cypress.Commands.add(
  "setupTestUser",
  (userData: {
    email: string;
    password?: string;
    onboarding_completed?: boolean;
    assets?: Array<{
      name: string;
      type: string;
      value: number;
      metadata?: any;
    }>;
    beneficiaries?: Array<{
      name: string;
      relationship: string;
      allocation: number;
    }>;
  }) => {
    cy.task("db:seed", {
      user: {
        email: userData.email,
        onboarding_completed: userData.onboarding_completed ?? true,
      },
      assets: userData.assets || [],
      beneficiaries: userData.beneficiaries || [],
    });
  },
);

// Verify audit log entry exists
Cypress.Commands.add("verifyAuditLog", (action: string) => {
  cy.task("db:verify-audit", action).then((audit) => {
    expect(audit).to.not.be.null;
    expect(audit.action).to.eq(action);
  });
});

// Clean up test data
Cypress.Commands.add("cleanupTestData", () => {
  cy.task("db:clean");
});

// Custom command for component testing with providers
Cypress.Commands.add("mountWithProviders", (component: React.ReactElement) => {
  cy.mount(component);
});

// Enhanced Estate Planning Specific Commands

// Asset management commands
Cypress.Commands.add(
  "createAsset",
  (assetData: {
    name: string;
    type: string;
    value: number;
    description?: string;
  }) => {
    cy.visit("/assets/add");
    cy.get('[data-testid*="asset-name"]').type(assetData.name);
    cy.get('[data-testid*="asset-type"]').select(assetData.type);
    cy.get('[data-testid*="asset-value"]').type(assetData.value.toString());

    if (assetData.description) {
      cy.get('[data-testid*="asset-description"]').type(assetData.description);
    }

    cy.get('[data-testid*="submit-button"]').click();
    cy.get('[data-testid*="success-message"]').should("be.visible");
  },
);

// Beneficiary management commands
Cypress.Commands.add(
  "createBeneficiary",
  (beneficiaryData: {
    firstName: string;
    lastName: string;
    relationship: string;
    percentage: number;
    email?: string;
    phone?: string;
  }) => {
    cy.visit("/beneficiaries/add");
    cy.get('[data-testid*="first-name"]').type(beneficiaryData.firstName);
    cy.get('[data-testid*="last-name"]').type(beneficiaryData.lastName);
    cy.get('[data-testid*="relationship"]').select(
      beneficiaryData.relationship,
    );
    cy.get('[data-testid*="percentage"]').type(
      beneficiaryData.percentage.toString(),
    );

    if (beneficiaryData.email) {
      cy.get('[data-testid*="email"]').type(beneficiaryData.email);
    }

    if (beneficiaryData.phone) {
      cy.get('[data-testid*="phone"]').type(beneficiaryData.phone);
    }

    cy.get('[data-testid*="submit-button"]').click();
    cy.get('[data-testid*="success-message"]').should("be.visible");
  },
);

// Document management commands
Cypress.Commands.add(
  "uploadDocument",
  (documentData: { file: string; category: string; description?: string }) => {
    cy.visit("/documents");
    cy.get('[data-testid*="upload-button"]').click();

    cy.get('[data-testid*="file-input"]').selectFile(documentData.file);
    cy.get('[data-testid*="document-category"]').select(documentData.category);

    if (documentData.description) {
      cy.get('[data-testid*="document-description"]').type(
        documentData.description,
      );
    }

    cy.get('[data-testid*="upload-submit"]').click();
    cy.get('[data-testid*="upload-success"]').should("be.visible");
  },
);

// Onboarding flow commands
Cypress.Commands.add(
  "completeOnboarding",
  (userData: {
    personalInfo: {
      firstName: string;
      lastName: string;
      dateOfBirth: string;
      phone: string;
      address: string;
      city: string;
      eircode: string;
    };
    skipVerification?: boolean;
  }) => {
    cy.visit("/onboarding");

    // Step 1: Personal Information
    cy.get('[data-testid*="first-name"]').type(userData.personalInfo.firstName);
    cy.get('[data-testid*="last-name"]').type(userData.personalInfo.lastName);
    cy.get('[data-testid*="date-of-birth"]').type(
      userData.personalInfo.dateOfBirth,
    );
    cy.get('[data-testid*="phone"]').type(userData.personalInfo.phone);
    cy.get('[data-testid*="address"]').type(userData.personalInfo.address);
    cy.get('[data-testid*="city"]').type(userData.personalInfo.city);
    cy.get('[data-testid*="eircode"]').type(userData.personalInfo.eircode);
    cy.get('[data-testid*="continue"]').click();

    // Step 2: Signature
    cy.get('[data-testid*="signature-canvas"]').should("be.visible");
    cy.get('[data-testid*="signature-canvas"]')
      .trigger("mousedown", { which: 1, pageX: 100, pageY: 100 })
      .trigger("mousemove", { which: 1, pageX: 150, pageY: 120 })
      .trigger("mousemove", { which: 1, pageX: 200, pageY: 100 })
      .trigger("mouseup");
    cy.get('[data-testid*="continue"]').click();

    // Step 3: Legal Consent
    cy.get('[data-testid*="terms-checkbox"]').check();
    cy.get('[data-testid*="privacy-checkbox"]').check();
    cy.get('[data-testid*="continue"]').click();

    // Step 4: Verification (optional skip)
    if (userData.skipVerification) {
      cy.get('[data-testid*="skip-verification"]').click();
    } else {
      cy.get('[data-testid*="start-verification"]').click();
      // Mock successful verification
      cy.window().then((win) => {
        win.postMessage(
          {
            type: "stripe-verification-complete",
            sessionId: "vs_test_123",
            status: "verified",
          },
          "*",
        );
      });
    }

    cy.url().should("include", "/dashboard");
  },
);

// Advanced testing utilities
Cypress.Commands.add("waitForLoadingToFinish", (timeout = 10000) => {
  cy.get('[data-testid*="loading"]', { timeout }).should("not.exist");
  cy.get('[data-testid*="spinner"]', { timeout }).should("not.exist");
});

Cypress.Commands.add("checkAccessibility", () => {
  // Check for basic accessibility requirements
  cy.get('[data-testid*="main-content"]').should("have.attr", "role", "main");
  cy.get("h1").should("exist").and("be.visible");

  // Check for skip links
  cy.get("body").tab();
  cy.focused().should("contain.text", "Skip to main content");

  // Check form labels
  cy.get("input").each(($input) => {
    const id = $input.attr("id");
    if (id) {
      cy.get(`label[for="${id}"]`).should("exist");
    }
  });
});

Cypress.Commands.add(
  "testResponsiveDesign",
  (breakpoints = [375, 768, 1024, 1280]) => {
    breakpoints.forEach((width) => {
      cy.viewport(width, 720);
      cy.wait(500); // Allow time for responsive changes

      // Check that content is still accessible at this breakpoint
      cy.get('[data-testid*="main-content"]').should("be.visible");

      if (width < 768) {
        // Mobile-specific checks
        cy.get('[data-testid*="mobile-menu"]').should("be.visible");
      } else {
        // Desktop-specific checks
        cy.get('[data-testid*="desktop-nav"]').should("be.visible");
      }
    });
  },
);

Cypress.Commands.add(
  "mockNetworkConditions",
  (condition: "slow-3g" | "fast-3g" | "offline") => {
    const conditions = {
      "slow-3g": {
        downloadThroughput: 50000,
        uploadThroughput: 50000,
        latency: 2000,
      },
      "fast-3g": {
        downloadThroughput: 750000,
        uploadThroughput: 250000,
        latency: 150,
      },
      offline: { offline: true },
    };

    cy.wrap(null).then(() => {
      if (condition === "offline") {
        // Simulate offline by intercepting all requests
        cy.intercept("**/*", { forceNetworkError: true }).as("offline");
      } else {
        // Note: Cypress doesn't support network throttling directly
        // This would need to be implemented with Chrome DevTools Protocol
        cy.log(`Simulating ${condition} network conditions`);
      }
    });
  },
);

Cypress.Commands.add("generateTestReport", (testName: string, results: any) => {
  cy.task("generateTestReport", {
    testName,
    results,
    timestamp: new Date().toISOString(),
  });
});

// Database and API testing commands
Cypress.Commands.add(
  "verifyDatabaseState",
  (table: string, expectedCount: number) => {
    cy.task("db:count", { table }).then((count) => {
      expect(count).to.equal(expectedCount);
    });
  },
);

Cypress.Commands.add(
  "testApiEndpoint",
  (method: string, endpoint: string, expectedStatus = 200) => {
    cy.request({
      method: method.toUpperCase(),
      url: endpoint,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(expectedStatus);

      if (expectedStatus === 200) {
        expect(response.body).to.not.be.empty;
      }
    });
  },
);

// Performance testing commands
Cypress.Commands.add("measurePageLoadTime", (url: string) => {
  cy.visit(url);
  cy.window().then((win) => {
    const loadTime =
      win.performance.timing.loadEventEnd -
      win.performance.timing.navigationStart;
    cy.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
  });
});

Cypress.Commands.add(
  "measureInteractionTime",
  (selector: string, action = "click") => {
    const start = performance.now();

    if (action === "click") {
      cy.get(selector).click();
    } else if (action === "type") {
      cy.get(selector).type("test");
    }

    cy.then(() => {
      const end = performance.now();
      const interactionTime = end - start;
      cy.log(`Interaction time: ${interactionTime.toFixed(2)}ms`);
      expect(interactionTime).to.be.lessThan(100); // Should respond within 100ms
    });
  },
);

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      loginAsTestUser(userType?: 'standard' | 'admin' | 'onboarding'): Chainable<void>;
      loginAsCustomTestUser(userData: {
        email?: string;
        first_name?: string;
        last_name?: string;
        onboarding_completed?: boolean;
        verification_completed?: boolean;
      }): Chainable<void>;
      logout(): Chainable<void>;
      setupTestUser(userData: {
        email: string;
        password?: string;
        onboarding_completed?: boolean;
        assets?: Array<{
          name: string;
          type: string;
          value: number;
          metadata?: any;
        }>;
        beneficiaries?: Array<{
          name: string;
          relationship: string;
          allocation: number;
        }>;
      }): Chainable<void>;
      verifyAuditLog(action: string): Chainable<void>;
      cleanupTestData(): Chainable<void>;
      mountWithProviders(component: React.ReactElement): Chainable<void>;

      // Enhanced Estate Planning Commands
      createAsset(assetData: {
        name: string;
        type: string;
        value: number;
        description?: string;
      }): Chainable<void>;

      createBeneficiary(beneficiaryData: {
        firstName: string;
        lastName: string;
        relationship: string;
        percentage: number;
        email?: string;
        phone?: string;
      }): Chainable<void>;

      uploadDocument(documentData: {
        file: string;
        category: string;
        description?: string;
      }): Chainable<void>;

      completeOnboarding(userData: {
        personalInfo: {
          firstName: string;
          lastName: string;
          dateOfBirth: string;
          phone: string;
          address: string;
          city: string;
          eircode: string;
        };
        skipVerification?: boolean;
      }): Chainable<void>;

      // Advanced Testing Utilities
      waitForLoadingToFinish(timeout?: number): Chainable<void>;
      checkAccessibility(): Chainable<void>;
      testResponsiveDesign(breakpoints?: number[]): Chainable<void>;
      mockNetworkConditions(
        condition: "slow-3g" | "fast-3g" | "offline",
      ): Chainable<void>;
      generateTestReport(testName: string, results: any): Chainable<void>;

      // Database and API Testing
      verifyDatabaseState(
        table: string,
        expectedCount: number,
      ): Chainable<void>;
      testApiEndpoint(
        method: string,
        endpoint: string,
        expectedStatus?: number,
      ): Chainable<void>;

      // Performance Testing
      measurePageLoadTime(url: string): Chainable<void>;
      measureInteractionTime(
        selector: string,
        action?: "click" | "type",
      ): Chainable<void>;
    }
  }
}
