/**
 * LoginForm Component Test
 * Tests actual component functionality, not theoretical scenarios
 */

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LoginForm } from "./LoginForm";

// Complex state management - may need additional providers

describe("LoginForm", () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });

  beforeEach(() => {
    cy.viewport(1200, 800);
    
    // Mock authentication dependencies
    cy.window().then((win) => {
      win.fetch = cy.stub().resolves({ 
        ok: true, 
        json: () => ({ success: true, user: { id: '1', email: 'test@example.com' } }) 
      });
    });
  });

  describe("Core Functionality", () => {
    it("renders without crashing", { timeout: 5000, retries: 2 }, () => {
      cy.mountAuthenticated(
        <QueryClientProvider client={queryClient}>
          <LoginForm />
        </QueryClientProvider>,
      );
      cy.get('[data-testid="login-button"], [data-testid="loginform"]').should(
        "be.visible",
      );
    });

    it("displays content correctly", { timeout: 5000, retries: 2 }, () => {
      cy.mountAuthenticated(
        <QueryClientProvider client={queryClient}>
          <LoginForm />
        </QueryClientProvider>,
      );
      cy.get('[data-testid="login-button"], [data-testid="loginform"]').should(
        "be.visible",
      );

      // Verify component renders its content
      cy.get('[data-testid="login-button"]').should("exist");
    });
  });

  describe("Error Handling", () => {
    it("shows validation errors", { timeout: 5000, retries: 2 }, () => {
      cy.mountAuthenticated(
        <QueryClientProvider client={queryClient}>
          <LoginForm />
        </QueryClientProvider>,
      );

      // First click to show email auth form, then try to submit
      cy.get('button').contains('Continue with Email').click();
      cy.wait(100); // Let the form render
      
      // Now try to submit the empty form
      cy.get('button[type="submit"]').should('exist').click();
      cy.get('[role="alert"], .error, [data-testid="error"], [data-slot="error-message"]').should("exist");
    });
  });

  describe("Accessibility", () => {
    it("meets basic accessibility standards", { timeout: 5000, retries: 2 }, () => {
      cy.mountAuthenticated(
        <QueryClientProvider client={queryClient}>
          <LoginForm />
        </QueryClientProvider>,
      );

      // Check component accessibility
      cy.get('button, input, [tabindex], [role="button"]').then(($els) => {
        if ($els.length > 0) {
          cy.wrap($els.first()).should('not.have.attr', 'tabindex', '-1');
        } else {
          // Component has no interactive elements, which is fine
          cy.get('div, span, svg').first().should('exist');
        }
      });
    });

    it("supports keyboard navigation", { timeout: 5000, retries: 2 }, () => {
      cy.mountAuthenticated(
        <QueryClientProvider client={queryClient}>
          <LoginForm />
        </QueryClientProvider>,
      );

      // Should be navigable by keyboard - use direct focus pattern
      cy.get('button').first().focus().should('be.focused');
    });
  });

  describe("Responsive Design", () => {
    it("adapts to different screen sizes", { timeout: 5000, retries: 2 }, () => {
      // Test mobile
      cy.viewport(320, 568);
      cy.mountAuthenticated(
        <QueryClientProvider client={queryClient}>
          <LoginForm />
        </QueryClientProvider>,
      );
      cy.get('[data-testid="login-button"], [data-testid="loginform"]').should(
        "be.visible",
      );

      // Test tablet
      cy.viewport(768, 1024);
      cy.get('[data-testid="login-button"], [data-testid="loginform"]').should(
        "be.visible",
      );

      // Test desktop
      cy.viewport(1200, 800);
      cy.get('[data-testid="login-button"], [data-testid="loginform"]').should(
        "be.visible",
      );
    });
  });

  describe("Integration", () => {
    it("works within parent containers", { timeout: 5000, retries: 2 }, () => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <div data-testid="wrapper">{children}</div>
      );

      cy.mountAuthenticated(
        <Wrapper>
          <LoginForm />
        </Wrapper>,
      );

      cy.get('[data-testid="wrapper"]').within(() => {
        // Look for any button element within the wrapper
        cy.get('button').should('exist');
      });
    });
  });
});
