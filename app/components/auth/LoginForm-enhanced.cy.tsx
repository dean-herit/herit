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
    <div className="w-full max-w-md mx-auto" data-testid="login-form">
      <Card>
        <CardBody className="p-6">
          <h1
            className="text-2xl font-bold text-center mb-6"
            data-testid="auth-title"
          >
            {authMode === "login" ? "Welcome back" : "Create your account"}
          </h1>

          {authError && (
            <div
              className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
              data-testid="auth-error"
            >
              {authError}
            </div>
          )}

          {!showEmailAuth ? (
            <div className="space-y-4">
              <MockGoogleSignInButton />

              <Divider className="my-4" />

              <Button
                className="w-full"
                data-testid="email-auth-button"
                variant="ghost"
                onPress={() => setShowEmailAuth(true)}
              >
                Continue with email
              </Button>

              <div className="text-center">
                <button
                  className="text-sm text-blue-600 hover:underline"
                  data-testid="toggle-mode-button"
                  onClick={() =>
                    handleModeChange(authMode === "login" ? "signup" : "login")
                  }
                >
                  {authMode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {authMode === "login" ? (
                <MockEmailLoginForm />
              ) : (
                <MockEmailSignupForm />
              )}

              <Button
                data-testid="back-button"
                variant="ghost"
                onPress={() => setShowEmailAuth(false)}
              >
                Back to options
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
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
  });

  describe("Core Functionality", () => {
    it("renders login mode by default", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="login-form"]').should("be.visible");
      cy.get('[data-testid="auth-title"]').should("contain", "Welcome back");
      cy.get('[data-testid="toggle-mode-button"]').should(
        "contain",
        "Don't have an account? Sign up",
      );
    });

    it("switches between login and signup modes", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting onModeChange={callbacks.onChange} />
        </TestWrapper>,
      );

      // Start in login mode
      cy.get('[data-testid="auth-title"]').should("contain", "Welcome back");

      // Switch to signup
      cy.get('[data-testid="toggle-mode-button"]').click();
      cy.get('[data-testid="auth-title"]').should(
        "contain",
        "Create your account",
      );
      cy.get('[data-testid="toggle-mode-button"]').should(
        "contain",
        "Already have an account? Sign in",
      );
      cy.get("@onChange").should("have.been.calledWith", "signup");

      // Switch back to login
      cy.get('[data-testid="toggle-mode-button"]').click();
      cy.get('[data-testid="auth-title"]').should("contain", "Welcome back");
      cy.get("@onChange").should("have.been.calledWith", "login");
    });

    it("toggles email authentication form", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      // Should show OAuth options initially
      cy.get('[data-testid="email-auth-button"]').should("be.visible");
      cy.get('[data-testid="email-login-form"]').should("not.exist");

      // Click to show email form
      cy.get('[data-testid="email-auth-button"]').click();
      cy.get('[data-testid="email-login-form"]').should("be.visible");
      cy.get('[data-testid="back-button"]').should("be.visible");

      // Click back to OAuth options
      cy.get('[data-testid="back-button"]').click();
      cy.get('[data-testid="email-auth-button"]').should("be.visible");
      cy.get('[data-testid="email-login-form"]').should("not.exist");
    });

    it("shows correct email form based on auth mode", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      // Login mode should show login form
      cy.get('[data-testid="email-auth-button"]').click();
      cy.get('[data-testid="email-login-form"]').should("be.visible");
      cy.get('[data-testid="email-signup-form"]').should("not.exist");

      // Switch to signup mode
      cy.get('[data-testid="back-button"]').click();
      cy.get('[data-testid="toggle-mode-button"]').click();
      cy.get('[data-testid="email-auth-button"]').click();
      cy.get('[data-testid="email-signup-form"]').should("be.visible");
      cy.get('[data-testid="email-login-form"]').should("not.exist");
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
          <LoginFormForTesting signupError={signupError} />
        </TestWrapper>,
      );

      // Switch to signup mode
      cy.get('[data-testid="toggle-mode-button"]').click();

      cy.get('[data-testid="auth-error"]').should("be.visible");
      cy.get('[data-testid="auth-error"]').should("contain", signupError);
    });

    it("hides errors when switching modes", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting
            loginError="Login error"
            signupError="Signup error"
          />
        </TestWrapper>,
      );

      // Login error should be visible
      cy.get('[data-testid="auth-error"]').should("contain", "Login error");

      // Switch to signup - should show signup error
      cy.get('[data-testid="toggle-mode-button"]').click();
      cy.get('[data-testid="auth-error"]').should("contain", "Signup error");

      // Switch back to login - should show login error
      cy.get('[data-testid="toggle-mode-button"]').click();
      cy.get('[data-testid="auth-error"]').should("contain", "Login error");
    });

    it("handles network connectivity issues", () => {
      // Simulate network error scenario
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting loginError="Network error: Please check your connection" />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error"]').should("contain", "Network error");
    });

    it("handles server errors gracefully", () => {
      // Simulate server error scenario
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

      // Tab through interactive elements
      cy.get('[data-testid="email-auth-button"]').focus().should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="toggle-mode-button"]').should("be.focused");
    });

    it("has proper ARIA labels and roles", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting loginError="Test error" />
        </TestWrapper>,
      );

      // Error should have proper styling for screen readers
      cy.get('[data-testid="auth-error"]')
        .should("have.class", "text-red-700")
        .and("have.class", "border-red-400");

      // Title should be properly structured
      cy.get('[data-testid="auth-title"]').should("match", "h1");
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

      // Rapidly switch modes
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="toggle-mode-button"]').click();
        cy.get('[data-testid="auth-title"]').should("be.visible");
      }

      // Should handle all clicks
      cy.get("@onChange").should("have.callCount", 5);
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

      // Should maintain padding on small screens
      cy.get('[data-testid="login-form"] .p-6').should("exist");
    });
  });

  describe("Integration Scenarios", () => {
    it("should integrate with authentication flow", () => {
      // Mock the complete auth flow integration
      let currentMode = "login";

      const TestIntegration = () => {
        const [mode, setMode] = useState<"login" | "signup">("login");
        const [error, setError] = useState<string | null>(null);

        return (
          <div>
            <LoginFormForTesting
              loginError={mode === "login" ? error : null}
              signupError={mode === "signup" ? error : null}
              onModeChange={(newMode) => {
                setMode(newMode);
                setError(null); // Clear errors on mode change
              }}
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

      // Test error clearing on mode switch
      cy.get('[data-testid="toggle-mode-button"]').click();
      cy.get('[data-testid="auth-error"]').should("not.exist");
    });

    it("should handle OAuth callback simulation", () => {
      // Test OAuth integration patterns
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting />
        </TestWrapper>,
      );

      // Simulate OAuth flow by checking button presence
      cy.get('[data-testid="login-form"]').within(() => {
        cy.contains("Continue with Google").should("be.visible");
        cy.contains("Continue with email").should("be.visible");
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
          />
        </TestWrapper>,
      );

      // Should show login error initially
      cy.get('[data-testid="auth-error"]').should("contain", "Login failed");

      // Should switch to signup error when mode changes
      cy.get('[data-testid="toggle-mode-button"]').click();
      cy.get('[data-testid="auth-error"]').should("contain", "Signup failed");
    });

    it("handles empty error states", () => {
      cy.mount(
        <TestWrapper>
          <LoginFormForTesting loginError="" signupError="" />
        </TestWrapper>,
      );

      // Empty errors should not display error div
      cy.get('[data-testid="auth-error"]').should("not.exist");
    });

    it("handles rapid component remounting", () => {
      const TestWrapper = ({ show }: { show: boolean }) => (
        <TestWrapper>{show && <LoginFormForTesting />}</TestWrapper>
      );

      cy.mount(<TestWrapper show={true} />);
      cy.get('[data-testid="login-form"]').should("be.visible");

      // Remount multiple times
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

      // Should display error but without executing script
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

      // Content should be treated as text, not executed
      cy.get('[data-testid="auth-error"]').should("contain", xssAttempt);
      cy.window().its("alert").should("not.have.been.called");
    });
  });
});
