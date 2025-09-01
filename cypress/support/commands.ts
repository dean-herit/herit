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

// Advanced authentication commands
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit("/login");
    cy.get('[data-testid*="email"]').type(email);
    cy.get('[data-testid*="password"]').type(password);
    cy.get('[data-testid*="submit"]').click();
    cy.url().should("include", "/dashboard");
  });
});

// Login via API for faster tests
Cypress.Commands.add("loginWithAPI", (email: string, password: string) => {
  cy.request({
    method: "POST",
    url: "/api/auth/signin/credentials",
    body: { email, password },
  }).then((response) => {
    expect(response.status).to.eq(200);
    // Set session cookie from response
    cy.setCookie("next-auth.session-token", response.body.sessionToken);
  });
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

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      loginWithAPI(email: string, password: string): Chainable<void>;
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
    }
  }
}
