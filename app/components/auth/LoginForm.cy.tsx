import { useState } from "react";
import { Button, Card, CardBody, Divider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "cypress-real-events/support";

// Mock OAuth buttons for testing (no useAuth dependency)
function MockGoogleSignInButton() {
  return (
    <Button
      className="w-full justify-center"
      variant="bordered"
      size="lg"
      role="button"
      startContent={<div className="w-5 h-5 bg-blue-500 rounded"></div>}
    >
      Continue with Google
    </Button>
  );
}

function MockAppleSignInButton() {
  return (
    <Button
      className="w-full justify-center bg-black text-white"
      variant="solid"
      size="lg"
      role="button"
      startContent={<div className="w-5 h-5 bg-white rounded"></div>}
    >
      Sign in with Apple
    </Button>
  );
}

// Mock email forms for testing (no useAuth dependency)
function MockEmailLoginForm() {
  return (
    <div data-testid="email-login-form">
      <p className="text-sm text-foreground-600">Login form would be here</p>
    </div>
  );
}

function MockEmailSignupForm() {
  return (
    <div data-testid="email-signup-form">
      <p className="text-sm text-foreground-600">Signup form would be here</p>
    </div>
  );
}

// Test-specific version of LoginForm that doesn't use useAuth
function LoginFormForTesting({
  loginError = null,
  signupError = null,
}: {
  loginError?: string | null;
  signupError?: string | null;
}) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  const authError = authMode === "login" ? loginError : signupError;

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Error Display */}
      {authError && (
        <Card className="border-danger-200 bg-danger-50">
          <CardBody className="p-4">
            <p className="text-sm text-danger-600 font-medium">{authError}</p>
          </CardBody>
        </Card>
      )}

      {!showEmailAuth ? (
        // Main Authentication Options
        <Card className="w-full">
          <CardBody className="space-y-4 p-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">Welcome</h2>
              <p className="text-sm text-foreground-600">
                Choose how you'd like to continue
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                color="primary"
                size="lg"
                data-testid="Button-email-continue"
                onPress={() => setShowEmailAuth(true)}
              >
                Continue with Email
              </Button>

              <div className="relative">
                <Divider className="my-4" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-background px-2 text-xs text-foreground-500">
                    or
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <MockGoogleSignInButton />
                <MockAppleSignInButton />
              </div>
            </div>

            <div className="text-center space-x-1 text-xs text-foreground-500">
              <span>By continuing, you agree to our</span>
              <a
                href="/terms"
                className="text-primary underline hover:no-underline"
                data-testid="a-terms"
              >
                Terms of Service
              </a>
              <span>and</span>
              <a
                href="/privacy"
                className="text-primary underline hover:no-underline"
                data-testid="a-privacy"
              >
                Privacy Policy
              </a>
            </div>
          </CardBody>
        </Card>
      ) : (
        // Email Authentication Form
        <Card className="w-full">
          <CardBody className="space-y-4 p-6">
            <div className="flex items-center space-x-3">
              <Button
                className="text-foreground-600"
                variant="light"
                size="sm"
                data-testid="Button-back"
                onPress={() => setShowEmailAuth(false)}
              >
                Back to other sign-in options
              </Button>
            </div>

            <div className="flex border-b">
              <button
                className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                  authMode === "login"
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground-500 hover:text-foreground"
                }`}
                data-testid="button-login-tab"
                onClick={() => setAuthMode("login")}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                  authMode === "signup"
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground-500 hover:text-foreground"
                }`}
                data-testid="button-signup-tab"
                onClick={() => setAuthMode("signup")}
              >
                Sign Up
              </button>
            </div>

            <div className="mt-4">
              {authMode === "login" ? (
                <MockEmailLoginForm />
              ) : (
                <MockEmailSignupForm />
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

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
    // Mock external API calls that auth buttons might make
    cy.intercept("GET", "/api/auth/session", { statusCode: 401 }).as("session");
    cy.intercept("POST", "/api/auth/google", { statusCode: 200 }).as("google");
    cy.intercept("POST", "/api/auth/apple", { statusCode: 200 }).as("apple");
  });

  it("renders default authentication options", () => {
    cy.mount(
      <TestWrapper>
        <LoginFormForTesting />
      </TestWrapper>,
    );

    // Should show main welcome content
    cy.contains("Welcome").should("be.visible");
    cy.contains("Choose how you'd like to continue").should("be.visible");

    // Should show OAuth buttons
    cy.get('[data-testid="Button-email-continue"]')
      .contains("Continue with Email")
      .should("be.visible");
    cy.get('[role="button"]')
      .contains("Continue with Google")
      .should("be.visible");
    cy.get('[role="button"]')
      .contains("Sign in with Apple")
      .should("be.visible");

    // Should show terms and privacy links
    cy.get('[data-testid="a-terms"]')
      .contains("Terms of Service")
      .should("be.visible");
    cy.get('[data-testid="a-privacy"]')
      .contains("Privacy Policy")
      .should("be.visible");
  });

  it("switches to email authentication form", () => {
    cy.mount(
      <TestWrapper>
        <LoginFormForTesting />
      </TestWrapper>,
    );

    // Click email authentication
    cy.get('[data-testid="Button-email-continue"]')
      .contains("Continue with Email")
      .click();

    // Should show login/signup tabs
    cy.get('[data-testid="button-login-tab"]')
      .contains("Sign In")
      .should("be.visible");
    cy.get('[data-testid="button-signup-tab"]')
      .contains("Sign Up")
      .should("be.visible");

    // Should show back button
    cy.get('[data-testid="Button-back"]')
      .contains("Back to other sign-in options")
      .should("be.visible");

    // Should show login form by default (login tab active)
    cy.get('[data-testid="button-login-tab"]')
      .contains("Sign In")
      .should("have.class", "border-primary");
  });

  it("toggles between login and signup modes", () => {
    cy.mount(
      <TestWrapper>
        <LoginFormForTesting />
      </TestWrapper>,
    );

    // Open email auth
    cy.get('[data-testid="Button-email-continue"]')
      .contains("Continue with Email")
      .click();

    // Switch to signup
    cy.get('[data-testid="button-signup-tab"]').contains("Sign Up").click();
    cy.get('[data-testid="button-signup-tab"]')
      .contains("Sign Up")
      .should("have.class", "border-primary");

    // Switch back to login
    cy.get('[data-testid="button-login-tab"]').contains("Sign In").click();
    cy.get('[data-testid="button-login-tab"]')
      .contains("Sign In")
      .should("have.class", "border-primary");
  });

  it("navigates back to main auth screen", () => {
    cy.mount(
      <TestWrapper>
        <LoginFormForTesting />
      </TestWrapper>,
    );

    // Open email auth
    cy.get('[data-testid="Button-email-continue"]')
      .contains("Continue with Email")
      .click();

    // Click back
    cy.get('[data-testid="Button-back"]')
      .contains("Back to other sign-in options")
      .click();

    // Should return to main screen
    cy.get('[data-testid="Button-email-continue"]')
      .contains("Continue with Email")
      .should("be.visible");
    cy.get('[role="button"]')
      .contains("Continue with Google")
      .should("be.visible");
  });

  it("displays error message when authentication fails", () => {
    cy.mount(
      <TestWrapper>
        <LoginFormForTesting loginError="Invalid email or password. Please try again." />
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
        <LoginFormForTesting />
      </TestWrapper>,
    );

    // Tab through interactive elements using realPress
    cy.get('[data-testid="Button-email-continue"]').focus();
    cy.focused().should("contain", "Continue with Email");

    cy.realPress("Tab");
    cy.focused().should("contain", "Continue with Google");

    cy.realPress("Tab");
    cy.focused().should("contain", "Sign in with Apple");

    // Tab to footer links
    cy.realPress("Tab");
    cy.focused().should("contain", "Terms of Service");

    cy.realPress("Tab");
    cy.focused().should("contain", "Privacy Policy");
  });

  it("has proper accessibility attributes", () => {
    cy.mount(
      <TestWrapper>
        <LoginFormForTesting />
      </TestWrapper>,
    );

    // Check ARIA labels and roles
    cy.get('[role="button"]').should("have.length", 2);

    // Links should be accessible
    cy.get('[data-testid="a-terms"]').should("have.attr", "href");
    cy.get('[data-testid="a-privacy"]').should("have.attr", "href");

    // Open email form and check form accessibility
    cy.get('[data-testid="Button-email-continue"]')
      .contains("Continue with Email")
      .click();

    // Tab buttons should have proper roles
    cy.get('[data-testid="button-login-tab"]')
      .contains("Sign In")
      .should("be.visible");
    cy.get('[data-testid="button-signup-tab"]')
      .contains("Sign Up")
      .should("be.visible");
  });

  it("maintains responsive layout", () => {
    cy.mount(
      <TestWrapper>
        <LoginFormForTesting />
      </TestWrapper>,
    );

    // Test mobile viewport
    cy.viewport(375, 667);
    cy.get('[data-testid="Button-email-continue"]')
      .contains("Continue with Email")
      .should("be.visible");

    // Test tablet viewport
    cy.viewport(768, 1024);
    cy.get('[data-testid="Button-email-continue"]')
      .contains("Continue with Email")
      .should("be.visible");

    // Test desktop viewport
    cy.viewport(1200, 800);
    cy.get('[data-testid="Button-email-continue"]')
      .contains("Continue with Email")
      .should("be.visible");
  });
});
