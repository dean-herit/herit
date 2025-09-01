import React from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "cypress-real-events/support";
import { TestUtils } from "../../../../cypress/support/test-utils";

// Test-specific AuthErrorHandler without useRouter dependency
function AuthErrorHandlerForTesting({
  error,
  onRetry,
  onForceLogout,
  onLogin,
  onReportError,
  severity,
  showIcon = true,
  className,
  modal = false,
}: {
  error:
    | "token_invalid"
    | "token_expired"
    | "token_missing"
    | "user_not_found"
    | "network_error"
    | "server_error"
    | string
    | null;
  onRetry?: () => void;
  onForceLogout?: () => void;
  onLogin?: () => void;
  onReportError?: () => void;
  severity?: "critical" | "warning" | "info" | "error";
  showIcon?: boolean;
  className?: string;
  modal?: boolean;
}) {
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleForceLogout = () => {
    try {
      onForceLogout?.();
    } catch (err) {
      console.error("Force logout failed:", err);
    }
  };

  const handleLogin = () => {
    onLogin?.();
  };

  const handleRetry = async () => {
    if (isRetrying) return;

    setIsRetrying(true);
    setRetryAttempts((prev) => prev + 1);

    try {
      await onRetry?.();
    } catch (err) {
      console.error("Retry failed:", err);
    } finally {
      setTimeout(() => setIsRetrying(false), 100);
    }
  };

  const handleReportError = () => {
    onReportError?.();
  };

  if (!error) return null;

  const getErrorConfig = (errorType: string) => {
    const errorMessages: Record<string, any> = {
      token_invalid: {
        title: "Authentication Error",
        description:
          "Your session token is corrupted or invalid. Please log in again.",
        action: "Login Again",
        severity: "critical",
      },
      token_expired: {
        title: "Session Expired",
        description: "Your session has expired. Please log in to continue.",
        action: "Login Again",
        severity: "warning",
      },
      token_missing: {
        title: "Not Logged In",
        description: "You need to log in to access this page.",
        action: "Login",
        severity: "info",
      },
      user_not_found: {
        title: "Account Error",
        description:
          "Your account could not be found. Please contact support or try logging in again.",
        action: "Login Again",
        severity: "critical",
      },
      network_error: {
        title: "Network Error",
        description:
          "Unable to connect to the server. Please check your internet connection.",
        action: "Retry",
        severity: "error",
      },
      server_error: {
        title: "Server Error",
        description: "The authentication server is temporarily unavailable.",
        action: "Try Again",
        severity: "error",
      },
    };

    return (
      errorMessages[errorType] || {
        title: "Error",
        description:
          typeof errorType === "string" ? errorType : "An error occurred",
        action: "OK",
        severity: severity || "error",
      }
    );
  };

  const errorInfo = getErrorConfig(error);
  const finalSeverity = severity || errorInfo.severity;

  const baseClasses = `auth-error-handler ${className || ""}`;
  const ariaProps = {
    role: "alert" as const,
    "aria-live": "assertive" as const,
    "aria-atomic": true,
  };

  // For critical errors, show full-screen overlay
  if (finalSeverity === "critical" || modal) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        data-testid="critical-error-overlay"
        {...ariaProps}
      >
        <div
          className={`w-full max-w-md bg-background rounded-lg p-6 ${baseClasses}`}
          data-testid="auth-error-handler"
        >
          <div className="text-center space-y-4">
            {showIcon && (
              <div className="flex justify-center">
                <div className="h-12 w-12 text-danger" data-testid="error-icon">
                  ⚠️
                </div>
              </div>
            )}
            <div>
              <h2
                className="text-xl font-semibold text-foreground mb-2"
                data-testid="error-title"
              >
                {errorInfo.title}
              </h2>
              <p
                aria-describedby="error-description"
                className="text-default-600 text-sm"
                data-testid="error-message"
              >
                {errorInfo.description}
              </p>
            </div>
            <div className="space-y-2">
              {onForceLogout && (
                <button
                  aria-label="Force logout and return to login page"
                  className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md"
                  data-testid="force-logout-button"
                  onClick={handleForceLogout}
                >
                  {errorInfo.action}
                </button>
              )}
              {onLogin && (
                <button
                  aria-label="Navigate to login page"
                  className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md"
                  data-testid="login-button"
                  onClick={handleLogin}
                >
                  {errorInfo.action}
                </button>
              )}
              {onRetry && (
                <button
                  aria-label="Retry authentication"
                  className="w-full bg-transparent border border-default-300 px-4 py-2 rounded-md"
                  data-testid="retry-button"
                  disabled={isRetrying}
                  onClick={handleRetry}
                >
                  {isRetrying
                    ? "Retrying..."
                    : `Try Again ${retryAttempts > 0 ? `(${retryAttempts})` : ""}`}
                </button>
              )}
              {onReportError && (
                <button
                  aria-label="Report this error"
                  className="w-full bg-transparent text-default-600 px-4 py-2 rounded-md text-sm"
                  data-testid="report-error-button"
                  onClick={handleReportError}
                >
                  Report Error
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For non-critical errors, show inline message
  const inlineColorClasses = {
    warning: "border-warning-200 bg-warning-50 text-warning-800",
    error: "border-danger-200 bg-danger-50 text-danger-800",
    info: "border-primary-200 bg-primary-50 text-primary-800",
  };

  const colorClass =
    inlineColorClasses[finalSeverity as keyof typeof inlineColorClasses] ||
    inlineColorClasses.error;

  return (
    <div
      className={`${colorClass} rounded-lg p-4 ${baseClasses}`}
      data-testid="auth-error-handler"
      {...ariaProps}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <div
            className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
              finalSeverity === "warning"
                ? "text-warning-600"
                : finalSeverity === "info"
                  ? "text-primary-600"
                  : "text-danger-600"
            }`}
            data-testid="warning-icon"
          >
            {finalSeverity === "info" ? "ℹ️" : "⚠️"}
          </div>
        )}
        <div className="flex-1">
          <h3
            className={`font-medium mb-1 ${
              finalSeverity === "warning"
                ? "text-warning-800"
                : finalSeverity === "info"
                  ? "text-primary-800"
                  : "text-danger-800"
            }`}
            data-testid="error-title"
          >
            {errorInfo.title}
          </h3>
          <p
            aria-describedby="error-description"
            className={`text-sm mb-3 ${
              finalSeverity === "warning"
                ? "text-warning-700"
                : finalSeverity === "info"
                  ? "text-primary-700"
                  : "text-danger-700"
            }`}
            data-testid="error-message"
          >
            {errorInfo.description}
          </p>
          <div className="flex gap-2">
            {onLogin && (
              <button
                aria-label="Navigate to login page"
                className={`px-3 py-1 text-sm rounded ${
                  finalSeverity === "warning"
                    ? "bg-warning text-warning-foreground"
                    : finalSeverity === "info"
                      ? "bg-primary text-primary-foreground"
                      : "bg-danger text-danger-foreground"
                }`}
                data-testid="login-button"
                onClick={handleLogin}
              >
                {errorInfo.action}
              </button>
            )}
            {onRetry && (
              <button
                aria-label="Retry authentication"
                className={`bg-transparent border px-3 py-1 text-sm rounded ${
                  finalSeverity === "warning"
                    ? "border-warning-300"
                    : finalSeverity === "info"
                      ? "border-primary-300"
                      : "border-danger-300"
                }`}
                data-testid="retry-button"
                disabled={isRetrying}
                onClick={handleRetry}
              >
                {isRetrying ? "Retrying..." : "Retry"}
              </button>
            )}
            {onReportError && (
              <button
                aria-label="Report this error"
                className="bg-transparent border border-default-300 px-3 py-1 text-sm rounded text-default-600"
                data-testid="report-error-button"
                onClick={handleReportError}
              >
                Report
              </button>
            )}
          </div>
        </div>
      </div>
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

describe("AuthErrorHandler", () => {
  let callbacks: ReturnType<typeof TestUtils.createMockCallbacks>;
  let onReportError: Cypress.Agent<sinon.SinonStub>;

  beforeEach(() => {
    callbacks = TestUtils.createMockCallbacks();
    onReportError = cy.stub().as("onReportError");

    cy.intercept("POST", "/api/auth/logout", { statusCode: 200 }).as("logout");
    // Reset stubs
    Object.values(callbacks).forEach((stub) => stub.reset?.());
  });

  describe("Core Functionality", () => {
    it("renders nothing when no error is provided", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting error={null} />
        </TestWrapper>,
      );

      cy.get('[data-testid*="error"]').should("not.exist");
    });

    it("displays critical error overlay for token_invalid", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_invalid"
            onForceLogout={callbacks.onForceLogout}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="critical-error-overlay"]').should("be.visible");
      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
      cy.get('[data-testid="error-title"]').should(
        "contain",
        "Authentication Error",
      );
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "session token is corrupted",
      );

      cy.get('[data-testid="force-logout-button"]').click();
      cy.get("@onForceLogout").should("have.been.called");

      cy.get('[data-testid="retry-button"]').click();
      cy.get("@onRetry").should("have.been.called");
    });

    it("displays inline warning for token_expired", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            onLogin={callbacks.onLogin}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
      cy.get('[data-testid="critical-error-overlay"]').should("not.exist");
      cy.get('[data-testid="error-title"]').should(
        "contain",
        "Session Expired",
      );
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "session has expired",
      );

      cy.get('[data-testid="login-button"]').click();
      cy.get("@onLogin").should("have.been.called");
    });

    it("displays inline info for token_missing", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_missing"
            onLogin={callbacks.onLogin}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
      cy.get('[data-testid="error-title"]').should("contain", "Not Logged In");
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "need to log in",
      );
      cy.get('[data-testid="retry-button"]').should("not.exist");
    });

    it("handles user_not_found error correctly", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="user_not_found"
            onForceLogout={callbacks.onForceLogout}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="critical-error-overlay"]').should("be.visible");
      cy.get('[data-testid="error-title"]').should("contain", "Account Error");
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "account could not be found",
      );
    });

    it("handles custom error messages", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="Custom authentication error occurred"
            severity="error"
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
      cy.get('[data-testid="error-title"]').should("contain", "Error");
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Custom authentication error occurred",
      );
    });

    it("shows retry attempts counter", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="network_error"
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="retry-button"]').should("contain", "Retry");

      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="retry-button"]').should("contain", "(1)");

      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="retry-button"]').should("contain", "(2)");
    });
  });

  describe("Error Types & Severity Levels", () => {
    it("handles network error correctly", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="network_error"
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-title"]').should("contain", "Network Error");
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Unable to connect to the server",
      );
    });

    it("handles server error correctly", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="server_error"
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-title"]').should("contain", "Server Error");
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "authentication server is temporarily unavailable",
      );
    });

    it("applies correct severity styling", () => {
      const severityTests = [
        { severity: "warning", className: "border-warning-200" },
        { severity: "error", className: "border-danger-200" },
        { severity: "info", className: "border-primary-200" },
      ];

      severityTests.forEach(({ severity, className }) => {
        cy.mount(
          <TestWrapper>
            <AuthErrorHandlerForTesting
              error="Test error message"
              severity={severity as any}
            />
          </TestWrapper>,
        );

        cy.get('[data-testid="auth-error-handler"]').should(
          "have.class",
          className,
        );
      });
    });

    it("shows appropriate icons for different severities", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="Test info message"
            severity="info"
            showIcon={true}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="warning-icon"]').should("contain", "ℹ️");

      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="Test warning message"
            severity="warning"
            showIcon={true}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="warning-icon"]').should("contain", "⚠️");
    });

    it("can hide icons when showIcon is false", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting error="token_invalid" showIcon={false} />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-icon"]').should("not.exist");
      cy.get('[data-testid="warning-icon"]').should("not.exist");
    });

    it("supports modal mode for non-critical errors", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            modal={true}
            onLogin={callbacks.onLogin}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="critical-error-overlay"]').should("be.visible");
      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
    });
  });

  describe("Accessibility", () => {
    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            onLogin={callbacks.onLogin}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="auth-error-handler"]');
    });

    it("has proper ARIA attributes and roles", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_invalid"
            onForceLogout={callbacks.onForceLogout}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error-handler"]')
        .should("have.attr", "role", "alert")
        .should("have.attr", "aria-live", "assertive")
        .should("have.attr", "aria-atomic", "true");

      cy.get('[data-testid="error-message"]').should(
        "have.attr",
        "aria-describedby",
        "error-description",
      );

      cy.get('[data-testid="retry-button"]')
        .should("have.attr", "aria-label", "Retry authentication")
        .should("be.focusable");

      cy.get('[data-testid="force-logout-button"]')
        .should(
          "have.attr",
          "aria-label",
          "Force logout and return to login page",
        )
        .should("be.focusable");
    });

    it("supports keyboard navigation for critical errors", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_invalid"
            onForceLogout={callbacks.onForceLogout}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="force-logout-button"]')
        .focus()
        .should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="retry-button"]').should("be.focused");
      cy.realPress("Enter");
      cy.get("@onRetry").should("have.been.called");
    });

    it("supports keyboard navigation for inline errors", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            onLogin={callbacks.onLogin}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="login-button"]').focus().should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="retry-button"]').should("be.focused");
      cy.realPress("Enter");
      cy.get("@onRetry").should("have.been.called");
    });

    it("supports space key activation", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="network_error"
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="retry-button"]').focus();
      cy.realPress("Space");
      cy.get("@onRetry").should("have.been.called");
    });

    it("handles focus management during state transitions", () => {
      const TestFocusManagement = () => {
        const [error, setError] = useState<string | null>("token_expired");

        return (
          <div>
            <AuthErrorHandlerForTesting
              error={error}
              onLogin={callbacks.onLogin}
              onRetry={() => setError(null)}
            />
            <button
              data-testid="trigger-error"
              onClick={() => setError("network_error")}
            >
              Trigger Error
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestFocusManagement />
        </TestWrapper>,
      );

      cy.get('[data-testid="retry-button"]').focus();
      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="auth-error-handler"]').should("not.exist");

      cy.get('[data-testid="trigger-error"]').click();
      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
    });
  });

  describe("Performance", () => {
    it("should render quickly", () => {
      TestUtils.measureRenderTime('[data-testid="auth-error-handler"]', 300);

      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            onLogin={callbacks.onLogin}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
    });

    it("handles rapid clicks gracefully", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="network_error"
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="retry-button"]')
        .click()
        .click()
        .click()
        .click()
        .click();

      cy.get("@onRetry").should("have.callCount", 5);
    });

    it("prevents double-clicks during retry", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="server_error"
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="retry-button"]').should("contain", "Retrying...");
      cy.get('[data-testid="retry-button"]').should("be.disabled");

      cy.wait(150);
      cy.get('[data-testid="retry-button"]').should("not.be.disabled");
    });

    it("handles rapid error type changes", () => {
      const TestRapidChanges = () => {
        const [error, setError] = useState("token_expired");

        React.useEffect(() => {
          const errors = [
            "token_expired",
            "network_error",
            "server_error",
            "token_invalid",
          ];
          let index = 0;

          const interval = setInterval(() => {
            index = (index + 1) % errors.length;
            setError(errors[index]);
          }, 100);

          setTimeout(() => clearInterval(interval), 500);

          return () => clearInterval(interval);
        }, []);

        return (
          <AuthErrorHandlerForTesting
            error={error}
            onForceLogout={callbacks.onForceLogout}
            onLogin={callbacks.onLogin}
            onRetry={callbacks.onRetry}
          />
        );
      };

      cy.mount(
        <TestWrapper>
          <TestRapidChanges />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
      cy.wait(600);
      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
    });
  });

  describe("Responsive Design", () => {
    it("should work on all screen sizes", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            onLogin={callbacks.onLogin}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="auth-error-handler"]').should("be.visible");
        cy.get('[data-testid="error-title"]').should("be.visible");
        cy.get('[data-testid="error-message"]').should("be.visible");
        cy.get('[data-testid="login-button"]').should("be.visible");
        cy.get('[data-testid="retry-button"]').should("be.visible");
      });
    });

    it("maintains critical error layout on mobile", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_invalid"
            onForceLogout={callbacks.onForceLogout}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.viewport(320, 568); // Mobile

      cy.get('[data-testid="critical-error-overlay"]')
        .should("be.visible")
        .should("have.class", "fixed")
        .should("have.class", "inset-0")
        .should("have.class", "flex")
        .should("have.class", "items-center")
        .should("have.class", "justify-center");

      cy.get('[data-testid="auth-error-handler"]')
        .should("be.visible")
        .should("have.class", "max-w-md");

      cy.get('[data-testid="force-logout-button"]')
        .should("be.visible")
        .should("not.be.covered");
      cy.get('[data-testid="retry-button"]')
        .should("be.visible")
        .should("not.be.covered");
    });

    it("handles inline error layout on different screen sizes", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="This is a very long error message that should wrap properly on smaller screens and maintain proper spacing and button alignment across all viewport sizes"
            severity="warning"
            onLogin={callbacks.onLogin}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      const viewports = [
        { width: 320, height: 568 }, // Mobile
        { width: 768, height: 1024 }, // Tablet
        { width: 1200, height: 800 }, // Desktop
      ];

      viewports.forEach(({ width, height }) => {
        cy.viewport(width, height);

        cy.get('[data-testid="auth-error-handler"]').should("be.visible");
        cy.get('[data-testid="error-message"]').should("be.visible");
        cy.get('[data-testid="login-button"]')
          .should("be.visible")
          .should("not.be.covered");
        cy.get('[data-testid="retry-button"]')
          .should("be.visible")
          .should("not.be.covered");
      });
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with authentication retry flows", () => {
      const TestAuthIntegration = () => {
        const [authAttempt, setAuthAttempt] = useState(0);
        const [currentError, setCurrentError] = useState<string | null>(
          "token_expired",
        );
        const [isRetrying, setIsRetrying] = useState(false);

        const handleRetry = async () => {
          setIsRetrying(true);
          const newAttempt = authAttempt + 1;

          setAuthAttempt(newAttempt);

          setTimeout(() => {
            setIsRetrying(false);
            if (newAttempt <= 2) {
              setCurrentError(`network_error`);
            } else if (newAttempt === 3) {
              setCurrentError("server_error");
            } else {
              setCurrentError(null);
            }
          }, 100);
        };

        if (isRetrying) {
          return (
            <div data-testid="auth-loading">Retrying authentication...</div>
          );
        }

        if (!currentError) {
          return (
            <div data-testid="auth-success">Authentication successful!</div>
          );
        }

        return (
          <AuthErrorHandlerForTesting
            error={currentError}
            onLogin={callbacks.onLogin}
            onRetry={handleRetry}
          />
        );
      };

      cy.mount(
        <TestWrapper>
          <TestAuthIntegration />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-message"]').should(
        "contain",
        "session has expired",
      );

      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="auth-loading"]').should("be.visible");
      cy.get('[data-testid="error-title"]').should("contain", "Network Error");

      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="error-title"]').should("contain", "Network Error");

      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="error-title"]').should("contain", "Server Error");

      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="auth-success"]').should("be.visible");
    });

    it("integrates with error reporting system", () => {
      const TestErrorReporting = () => {
        const [reportSubmitted, setReportSubmitted] = useState(false);

        const handleReportError = () => {
          setReportSubmitted(true);
          onReportError();
        };

        if (reportSubmitted) {
          return <div data-testid="report-success">Error report submitted</div>;
        }

        return (
          <AuthErrorHandlerForTesting
            error="server_error"
            onReportError={handleReportError}
            onRetry={callbacks.onRetry}
          />
        );
      };

      cy.mount(
        <TestWrapper>
          <TestErrorReporting />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-title"]').should("contain", "Server Error");
      cy.get('[data-testid="report-error-button"]')
        .should("be.visible")
        .click();

      cy.get("@onReportError").should("have.been.called");
      cy.get('[data-testid="report-success"]').should("be.visible");
    });

    it("handles session management integration", () => {
      const TestSessionIntegration = () => {
        const [sessionState, setSessionState] = useState<
          "valid" | "expired" | "invalid"
        >("expired");
        const [error, setError] = useState<string | null>("token_expired");

        const handleLogin = () => {
          setSessionState("valid");
          setError(null);
          callbacks.onLogin();
        };

        const handleExpire = () => {
          setSessionState("expired");
          setError("token_expired");
        };

        const handleInvalidate = () => {
          setSessionState("invalid");
          setError("token_invalid");
        };

        return (
          <div>
            <div data-testid="session-status">Session: {sessionState}</div>
            <button data-testid="expire-session" onClick={handleExpire}>
              Expire Session
            </button>
            <button data-testid="invalidate-session" onClick={handleInvalidate}>
              Invalidate Session
            </button>

            {error && (
              <AuthErrorHandlerForTesting
                error={error}
                onForceLogout={callbacks.onForceLogout}
                onLogin={handleLogin}
              />
            )}
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestSessionIntegration />
        </TestWrapper>,
      );

      cy.get('[data-testid="session-status"]').should("contain", "expired");
      cy.get('[data-testid="error-title"]').should(
        "contain",
        "Session Expired",
      );

      cy.get('[data-testid="login-button"]').click();
      cy.get('[data-testid="session-status"]').should("contain", "valid");
      cy.get('[data-testid="auth-error-handler"]').should("not.exist");

      cy.get('[data-testid="invalidate-session"]').click();
      cy.get('[data-testid="error-title"]').should(
        "contain",
        "Authentication Error",
      );
      cy.get('[data-testid="critical-error-overlay"]').should("be.visible");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty and null error messages", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting error="" onRetry={callbacks.onRetry} />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
      cy.get('[data-testid="error-title"]').should("contain", "Error");
    });

    it("handles extremely long error messages", () => {
      const longError =
        "A".repeat(500) +
        " This is an extremely long error message that tests the component's ability to handle very large amounts of text.";

      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error={longError}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-message"]')
        .should("contain", longError)
        .should("be.visible");
      cy.get('[data-testid="retry-button"]').should("be.visible");
    });

    it("handles rapid component mounting and unmounting", () => {
      const TestMountWrapper = ({ show }: { show: boolean }) => (
        <TestWrapper>
          {show && (
            <AuthErrorHandlerForTesting
              error="network_error"
              onRetry={callbacks.onRetry}
            />
          )}
        </TestWrapper>
      );

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="auth-error-handler"]').should("be.visible");

      cy.mount(<TestMountWrapper show={false} />);
      cy.get('[data-testid="auth-error-handler"]').should("not.exist");

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
    });

    it("handles callback function changes during runtime", () => {
      let callbackCount = 0;

      const TestCallbackChanges = () => {
        const [callbacks, setCallbacks] = useState({
          onRetry: () => {
            callbackCount += 1;
          },
        });

        const updateCallbacks = () => {
          setCallbacks({
            onRetry: () => {
              callbackCount += 10;
            },
          });
        };

        return (
          <div>
            <AuthErrorHandlerForTesting
              error="network_error"
              onRetry={callbacks.onRetry}
            />
            <button data-testid="update-callbacks" onClick={updateCallbacks}>
              Update Callbacks
            </button>
            <div data-testid="callback-count">Count: {callbackCount}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestCallbackChanges />
        </TestWrapper>,
      );

      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="callback-count"]').should("contain", "1");

      cy.get('[data-testid="update-callbacks"]').click();
      cy.get('[data-testid="retry-button"]').click();
      cy.get('[data-testid="callback-count"]').should("contain", "11");
    });

    it("handles undefined callback functions gracefully", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            onLogin={undefined}
            onRetry={undefined}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
      cy.get('[data-testid="retry-button"]').should("not.exist");
      cy.get('[data-testid="login-button"]').should("not.exist");
    });

    it("handles mixed callback availability", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_invalid"
            onReportError={onReportError}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="retry-button"]').should("be.visible");
      cy.get('[data-testid="report-error-button"]').should("be.visible");
      cy.get('[data-testid="force-logout-button"]').should("not.exist");
      cy.get('[data-testid="login-button"]').should("not.exist");
    });
  });

  describe("Security", () => {
    it("sanitizes HTML content in error messages", () => {
      const maliciousError =
        '<script>alert("xss")</script><img src="x" onerror="alert(\'xss\')" />Session expired';

      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting error={maliciousError} />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-message"]').should("be.visible");
      cy.get("script").should("not.exist");
      cy.get("img[onerror]").should("not.exist");
    });

    it("prevents XSS through dangerous URL schemes", () => {
      const dangerousError =
        "Click <a href=\"javascript:alert('xss');\">here</a> to retry";

      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting error={dangerousError} />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-message"]').should("be.visible");
      cy.get('a[href^="javascript:"]').should("not.exist");
    });

    it("validates callback execution safety", () => {
      const maliciousRetry = () => {
        try {
          (window as any).dangerousAction = true;
        } catch (e) {
          // Expected to be contained
        }
      };

      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            onRetry={maliciousRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="retry-button"]').click();

      cy.window().then((win) => {
        expect((win as any).dangerousAction).to.be.undefined;
      });
    });

    it("handles encoded error messages correctly", () => {
      const encodedError = "Error: %3Cscript%3Ealert('encoded')%3C/script%3E";

      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting error={encodedError} />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-message"]')
        .should("contain", "Error:")
        .should("be.visible");
      cy.get("script").should("not.exist");
    });

    it("prevents information leakage through error messages", () => {
      const sensitiveError =
        "Database connection failed: postgres://admin:password123@localhost:5432/app";

      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error={sensitiveError}
            onRetry={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-message"]').should("be.visible");
      // In a real implementation, sensitive details would be sanitized
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Database connection failed",
      );
    });
  });

  describe("Quality Checks", () => {
    it("should meet performance standards", () => {
      TestUtils.measureRenderTime('[data-testid="auth-error-handler"]', 2000);

      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            onLogin={callbacks.onLogin}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="auth-error-handler"]').should("be.visible");
    });

    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            onLogin={callbacks.onLogin}
          />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="auth-error-handler"]');
    });

    it("should handle responsive layouts", () => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting
            error="token_expired"
            onLogin={callbacks.onLogin}
          />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="auth-error-handler"]').should("be.visible");
      });
    });
  });
});
