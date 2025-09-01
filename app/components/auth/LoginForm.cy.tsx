import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LoginForm } from "./LoginForm";

// Mock useAuth hook for Cypress component testing
const mockUseAuth = () => ({
  user: null,
  isAuthenticated: false,
  login: cy.stub().resolves(),
  signup: cy.stub().resolves(),
  logout: cy.stub().resolves(),
  loginError: null,
  signupError: null,
  isLoading: false,
});

// Component wrapper with React Query
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("LoginForm Component", () => {
  beforeEach(() => {
    // Mock the useAuth hook
    cy.window().then((win) => {
      win.useAuth = mockUseAuth;
    });
  });

  it("renders default authentication options", () => {
    cy.mount(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>,
    );

    // Should show OAuth buttons
    cy.get('[data-testid*="Button"]')
      .contains("Continue with Email")
      .should("be.visible");
    cy.get('[role="button"]')
      .contains("Continue with Google")
      .should("be.visible");
    cy.get('[role="button"]')
      .contains("Sign in with Apple")
      .should("be.visible");

    // Should show terms and privacy links
    cy.get('[data-testid*="a"]')
      .contains("Terms of Service")
      .should("be.visible");
    cy.get('[data-testid*="a"]')
      .contains("Privacy Policy")
      .should("be.visible");
  });

  it("switches to email authentication form", () => {
    cy.mount(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>,
    );

    // Click email authentication
    cy.get('[data-testid*="Button"]').contains("Continue with Email").click();

    // Should show login/signup tabs
    cy.get('[data-testid*="button"]').contains("Sign In").should("be.visible");
    cy.get('[data-testid*="button"]').contains("Sign Up").should("be.visible");

    // Should show back button
    cy.get('[data-testid*="Button"]')
      .contains("Back to other sign-in options")
      .should("be.visible");

    // Should show login form by default (login tab active)
    cy.get('[data-testid*="button"]')
      .contains("Sign In")
      .should("have.class", "border-primary");
  });

  it("toggles between login and signup modes", () => {
    cy.mount(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>,
    );

    // Open email auth
    cy.get('[data-testid*="Button"]').contains("Continue with Email").click();

    // Switch to signup
    cy.get('[data-testid*="button"]').contains("Sign Up").click();
    cy.get('[data-testid*="button"]')
      .contains("Sign Up")
      .should("have.class", "border-primary");

    // Switch back to login
    cy.get('[data-testid*="button"]').contains("Sign In").click();
    cy.get('[data-testid*="button"]')
      .contains("Sign In")
      .should("have.class", "border-primary");
  });

  it("navigates back to main auth screen", () => {
    cy.mount(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>,
    );

    // Open email auth
    cy.get('[data-testid*="Button"]').contains("Continue with Email").click();

    // Click back
    cy.get('[data-testid*="Button"]')
      .contains("Back to other sign-in options")
      .click();

    // Should return to main screen
    cy.get('[data-testid*="Button"]')
      .contains("Continue with Email")
      .should("be.visible");
    cy.get('[role="button"]')
      .contains("Continue with Google")
      .should("be.visible");
  });

  it("displays error message when authentication fails", () => {
    const mockUseAuthWithError = () => ({
      user: null,
      isAuthenticated: false,
      login: cy.stub().resolves(),
      signup: cy.stub().resolves(),
      logout: cy.stub().resolves(),
      loginError: "Invalid email or password. Please try again.",
      signupError: null,
      isLoading: false,
    });

    cy.window().then((win) => {
      win.useAuth = mockUseAuthWithError;
    });

    cy.mount(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>,
    );

    // Error should be visible
    cy.contains("Invalid email or password. Please try again.").should(
      "be.visible",
    );
    cy.get('[class*="border-danger"]').should("exist");
  });

  it("handles keyboard navigation", () => {
    cy.mount(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>,
    );

    // Tab through interactive elements
    cy.get("body").tab();
    cy.focused().should("contain", "Continue with Email");

    cy.focused().tab();
    cy.focused().should("contain", "Continue with Google");

    cy.focused().tab();
    cy.focused().should("contain", "Sign in with Apple");

    // Tab to footer links
    cy.focused().tab();
    cy.focused().should("contain", "Terms of Service");

    cy.focused().tab();
    cy.focused().should("contain", "Privacy Policy");
  });

  it("has proper accessibility attributes", () => {
    cy.mount(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>,
    );

    // Check ARIA labels and roles
    cy.get('[role="button"]').should("have.length.at.least", 3);

    // Links should be accessible
    cy.get('[data-testid*="a"]').each(($link) => {
      cy.wrap($link).should("have.attr", "href");
    });

    // Open email form and check form accessibility
    cy.get('[data-testid*="Button"]').contains("Continue with Email").click();

    // Tab buttons should have proper roles
    cy.get('[data-testid*="button"]')
      .contains("Sign In")
      .should("have.attr", "type")
      .and("not.eq", "submit");
    cy.get('[data-testid*="button"]')
      .contains("Sign Up")
      .should("have.attr", "type")
      .and("not.eq", "submit");
  });

  it("maintains responsive layout", () => {
    cy.mount(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>,
    );

    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('[data-testid*="Button"]')
      .contains("Continue with Email")
      .should("be.visible");

    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('[data-testid*="Button"]')
      .contains("Continue with Email")
      .should("be.visible");

    // Test desktop viewport
    cy.viewport(1200, 800);
    cy.get('[data-testid*="Button"]')
      .contains("Continue with Email")
      .should("be.visible");
  });
});
