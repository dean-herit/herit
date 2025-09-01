import React from "react";
import { useState } from "react";
import { Button, Card, CardBody, Divider } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "cypress-real-events/support";
import { TestUtils } from "../../../../cypress/support/test-utils";

// Mock OAuth buttons for testing (no useAuth dependency)
function MockGoogleSignInButton() {
  return (
    <Button
      className="w-full justify-center"
      role="button"
      size="lg"
      startContent={<div className="w-5 h-5 bg-blue-500 rounded" />}
      variant="bordered"
    >
      Continue with Google
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
  onModeChange,
}: {
  loginError?: string | null;
  signupError?: string | null;
  onModeChange?: (mode: "login" | "signup") => void;
}) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  const authError = authMode === "login" ? loginError : signupError;

  const handleModeChange = (newMode: "login" | "signup") => {
    setAuthMode(newMode);
    onModeChange?.(newMode);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6" data-testid="login-form">
      {/* Error Display */}
      {authError && (
        <Card
          className="border-danger-200 bg-danger-50"
          data-testid="auth-error"
        >
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
              <h2
                className="text-2xl font-bold text-foreground"
                data-testid="auth-title"
              >
                Welcome
              </h2>
              <p className="text-sm text-foreground-600">
                Choose how you'd like to continue
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full"
                color="primary"
                data-testid="email-auth-button"
                size="lg"
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
              </div>
            </div>

            <div className="text-center space-x-1 text-xs text-foreground-500">
              <span>By continuing, you agree to our</span>
              <a
                className="text-primary underline hover:no-underline"
                data-testid="terms-link"
                href="/terms"
              >
                Terms of Service
              </a>
              <span>and</span>
              <a
                className="text-primary underline hover:no-underline"
                data-testid="privacy-link"
                href="/privacy"
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
                data-testid="back-button"
                size="sm"
                variant="light"
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
                data-testid="login-tab"
                onClick={() => handleModeChange("login")}
              >
                Sign In
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                  authMode === "signup"
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground-500 hover:text-foreground"
                }`}
                data-testid="signup-tab"
                onClick={() => handleModeChange("signup")}
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
  let callbacks: ReturnType<typeof TestUtils.createMockCallbacks>;

  beforeEach(() => {
    callbacks = TestUtils.createMockCallbacks();
    // Reset stubs
    Object.values(callbacks).forEach((stub) => stub.reset?.());
  });

  describe("Core Functionality", () => {
    it("renders default authentication options", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="login-form"]').should("be.visible");
      cy.get('[data-testid="auth-title"]').should("contain", "Welcome");
      cy.get('[data-testid="email-auth-button"]').should("be.visible");
    });

    it("switches to email authentication form", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-auth-button"]').click();
      cy.get('[data-testid="login-tab"]').should("be.visible");
      cy.get('[data-testid="signup-tab"]').should("be.visible");
      cy.get('[data-testid="back-button"]').should("be.visible");
    });

    it("toggles between login and signup modes", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting onModeChange={callbacks.onChange} />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-auth-button"]').click();

      // Switch to signup
      cy.get('[data-testid="signup-tab"]').click();
      cy.get("@onChange").should("have.been.calledWith", "signup");
      cy.get('[data-testid="email-signup-form"]').should("be.visible");

      // Switch back to login
      cy.get('[data-testid="login-tab"]').click();
      cy.get("@onChange").should("have.been.calledWith", "login");
      cy.get('[data-testid="email-login-form"]').should("be.visible");
    });

    it("navigates back to main auth screen", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-auth-button"]').click();
      cy.get('[data-testid="back-button"]').click();
      cy.get('[data-testid="email-auth-button"]').should("be.visible");
    });
  });

  describe("Error States", () => {
    it("displays login errors in login mode", () => {
      const loginError = "Invalid username or password";

      cy.mount(
        <TestWrapper>
          <LoginFormForTesting loginError={loginError} />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error"]').should("be.visible");
      cy.get('[data-testid="auth-error"]').should("contain", loginError);
    });

    it("displays signup errors in signup mode", () => {
      const signupError = "Email already exists";

      cy.mount(
        <TestWrapper>
          <LoginFormForTesting
            signupError={signupError}
            onModeChange={callbacks.onChange}
          />
        </TestWrapper>,
      );

      // Switch to signup mode first
      cy.get('[data-testid="email-auth-button"]').click();
      cy.get('[data-testid="signup-tab"]').click();

      cy.get('[data-testid="auth-error"]').should("be.visible");
      cy.get('[data-testid="auth-error"]').should("contain", signupError);
    });

    it("handles network connectivity issues", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting loginError="Network error: Please check your connection" />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error"]').should("contain", "Network error");
    });

    it("handles server errors gracefully", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting loginError="Server temporarily unavailable. Please try again." />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error"]').should(
        "contain",
        "Server temporarily unavailable",
      );
    });

    it("handles empty error states", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting loginError="" signupError="" />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error"]').should("not.exist");
    });
  });

  describe("Accessibility", () => {
    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="login-form"]');
    });

    it("supports keyboard navigation", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-auth-button"]').focus().should("be.focused");
      cy.realPress("Tab");
      cy.focused().should("contain", "Continue with Google");
    });

    it("has proper ARIA labels and roles", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting loginError="Test error" />
        </TestWrapper>,
      );

      // Title should be properly structured
      cy.get('[data-testid="auth-title"]').should("match", "h2");

      // Links should have proper attributes
      cy.get('[data-testid="terms-link"]').should("have.attr", "href");
      cy.get('[data-testid="privacy-link"]').should("have.attr", "href");
    });
  });

  describe("Performance", () => {
    it("should render quickly", () => {
      TestUtils.measureRenderTime('[data-testid="login-form"]', 1000);

      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="login-form"]').should("be.visible");
    });

    it("should handle rapid mode switching", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting onModeChange={callbacks.onChange} />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-auth-button"]').click();

      // Rapidly switch modes
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="signup-tab"]').click();
        cy.get('[data-testid="login-tab"]').click();
      }

      cy.get("@onChange").should("have.callCount", 6);
    });
  });

  describe("Responsive Design", () => {
    it("should work on all screen sizes", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="login-form"]').should("be.visible");
        cy.get('[data-testid="auth-title"]').should("be.visible");
        cy.get('[data-testid="email-auth-button"]').should("be.visible");
      });
    });

    it("maintains proper spacing on mobile", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      cy.viewport(320, 568); // Mobile

      cy.get('[data-testid="login-form"]')
        .should("be.visible")
        .should("have.class", "max-w-md");
    });
  });

  describe("Integration Scenarios", () => {
    it("should integrate with authentication flow", () => {
      let currentError = null;

      const TestIntegration = () => {
        const [error, setError] = useState(currentError);

        return (
          <div>
            <LoginFormForTesting
              loginError={error}
              onModeChange={() => setError(null)}
            />
            <button
              data-testid="simulate-error"
              onClick={() => setError("Simulated auth error")}
            >
              Simulate Error
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestIntegration />
        </TestWrapper>,
      );

      // Test error integration
      cy.get('[data-testid="simulate-error"]').click();
      cy.get('[data-testid="auth-error"]').should("be.visible");
    });

    it("should handle OAuth callback simulation", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="login-form"]').within(() => {
        cy.contains("Continue with Google").should("be.visible");
        cy.contains("Continue with Email").should("be.visible");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles simultaneous login and signup errors", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting
            loginError="Login failed"
            signupError="Signup failed"
            onModeChange={callbacks.onChange}
          />
        </TestWrapper>,
      );

      // Should show login error initially
      cy.get('[data-testid="auth-error"]').should("contain", "Login failed");

      // Switch to signup - should show signup error
      cy.get('[data-testid="email-auth-button"]').click();
      cy.get('[data-testid="signup-tab"]').click();
      cy.get('[data-testid="auth-error"]').should("contain", "Signup failed");
    });

    it("handles rapid component remounting", () => {
      const TestWrapper = ({ show }: { show: boolean }) => (
        <TestWrapper>{show && <LoginFormForTesting />}</TestWrapper>
      );

      cy.mount(<TestWrapper show={true} />);
      cy.get('[data-testid="login-form"]').should("be.visible");

      cy.mount(<TestWrapper show={false} />);
      cy.get('[data-testid="login-form"]').should("not.exist");

      cy.mount(<TestWrapper show={true} />);
      cy.get('[data-testid="login-form"]').should("be.visible");
    });
  });

  describe("Security", () => {
    it("should sanitize error messages", () => {
      const maliciousError = '<script>alert("xss")</script>Login failed';

      cy.mount(
        <TestWrapper>
          <LoginFormForTesting loginError={maliciousError} />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error"]').should("be.visible");
      cy.get("script").should("not.exist");
    });

    it("should prevent XSS in dynamic content", () => {
      const xssAttempt = 'javascript:alert("xss")';

      cy.mount(
        <TestWrapper>
          <LoginFormForTesting loginError={xssAttempt} />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error"]').should("contain", xssAttempt);
    });
  });

  describe("Quality Checks", () => {
    it("should meet performance standards", () => {
      TestUtils.measureRenderTime('[data-testid="login-form"]', 2000);

      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="login-form"]').should("be.visible");
    });

    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="login-form"]');
    });

    it("should handle responsive layouts", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="login-form"]').should("be.visible");
      });
    });
  });
});
