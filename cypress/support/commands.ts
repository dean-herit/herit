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

// Custom commands for testing authentication
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit("/login");
    cy.get('[data-testid*="email"]').type(email);
    cy.get('[data-testid*="password"]').type(password);
    cy.get('[data-testid*="submit"]').click();
    cy.url().should("include", "/dashboard");
  });
});

// Custom command for component testing with providers
Cypress.Commands.add("mountWithProviders", (component: React.ReactElement) => {
  cy.mount(component);
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      mountWithProviders(component: React.ReactElement): Chainable<void>;
    }
  }
}
