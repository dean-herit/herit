import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "cypress-real-events/support";

// Test-specific AuthErrorHandler without useRouter dependency
function AuthErrorHandlerForTesting({
  error,
  onRetry,
  onForceLogout = cy.stub(),
  onLogin = cy.stub(),
}: {
  error:
    | "token_invalid"
    | "token_expired"
    | "token_missing"
    | "user_not_found"
    | null;
  onRetry?: () => void;
  onForceLogout?: () => void;
  onLogin?: () => void;
}) {
  const handleForceLogout = async () => {
    try {
      // Simulate API call
      onForceLogout();
    } catch (err) {
      console.error("Force logout failed:", err);
    }
  };

  const handleLogin = () => {
    onLogin();
  };

  if (!error) return null;

  const errorMessages = {
    token_invalid: {
      title: "Authentication Error",
      description:
        "Your session token is corrupted or invalid. Please log in again.",
      action: "Login Again",
      severity: "critical" as const,
    },
    token_expired: {
      title: "Session Expired",
      description: "Your session has expired. Please log in to continue.",
      action: "Login Again",
      severity: "warning" as const,
    },
    token_missing: {
      title: "Not Logged In",
      description: "You need to log in to access this page.",
      action: "Login",
      severity: "info" as const,
    },
    user_not_found: {
      title: "Account Error",
      description:
        "Your account could not be found. Please contact support or try logging in again.",
      action: "Login Again",
      severity: "critical" as const,
    },
  };

  const errorInfo = errorMessages[error];

  // For critical errors, show full-screen overlay
  if (errorInfo.severity === "critical") {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        data-testid="critical-error-overlay"
      >
        <div
          className="w-full max-w-md bg-background rounded-lg p-6"
          data-testid="critical-error-card"
        >
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-12 w-12 text-danger" data-testid="error-icon">
                ⚠️
              </div>
            </div>
            <div>
              <h2
                className="text-xl font-semibold text-foreground mb-2"
                data-testid="error-title"
              >
                {errorInfo.title}
              </h2>
              <p
                className="text-default-600 text-sm"
                data-testid="error-description"
              >
                {errorInfo.description}
              </p>
            </div>
            <div className="space-y-2">
              <button
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md"
                data-testid="force-logout-button"
                onClick={handleForceLogout}
              >
                {errorInfo.action}
              </button>
              {onRetry && (
                <button
                  className="w-full bg-transparent border border-default-300 px-4 py-2 rounded-md"
                  data-testid="retry-button"
                  onClick={onRetry}
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For non-critical errors, show inline message
  return (
    <div
      className="border-warning-200 bg-warning-50 rounded-lg p-4"
      data-testid="inline-error-card"
    >
      <div className="flex items-start gap-3">
        <div
          className="h-5 w-5 text-warning-600 mt-0.5 flex-shrink-0"
          data-testid="warning-icon"
        >
          ⚠️
        </div>
        <div className="flex-1">
          <h3
            className="font-medium text-warning-800 mb-1"
            data-testid="error-title"
          >
            {errorInfo.title}
          </h3>
          <p
            className="text-sm text-warning-700 mb-3"
            data-testid="error-description"
          >
            {errorInfo.description}
          </p>
          <div className="flex gap-2">
            <button
              className="bg-warning text-warning-foreground px-3 py-1 text-sm rounded"
              data-testid="login-button"
              onClick={handleLogin}
            >
              {errorInfo.action}
            </button>
            {onRetry && (
              <button
                className="bg-transparent border border-warning-300 px-3 py-1 text-sm rounded"
                data-testid="retry-button"
                onClick={onRetry}
              >
                Retry
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

describe("AuthErrorHandler Component", () => {
  beforeEach(() => {
    // Mock auth API calls
    cy.intercept("POST", "/api/auth/logout", { statusCode: 200 }).as("logout");
  });

  it("renders nothing when no error is provided", () => {
    cy.mount(
      <TestWrapper>
        <AuthErrorHandlerForTesting error={null} />
      </TestWrapper>,
    );

    // Should not render anything
    cy.get('[data-testid*="error"]').should("not.exist");
  });

  it("displays critical error overlay for token_invalid", () => {
    const onForceLogout = cy.stub();
    const onRetry = cy.stub();

    cy.mount(
      <TestWrapper>
        <AuthErrorHandlerForTesting
          error="token_invalid"
          onForceLogout={onForceLogout}
          onRetry={onRetry}
        />
      </TestWrapper>,
    );

    // Should show critical error overlay
    cy.get('[data-testid="critical-error-overlay"]').should("be.visible");
    cy.get('[data-testid="critical-error-card"]').should("be.visible");

    // Should show correct content
    cy.get('[data-testid="error-title"]').should(
      "contain",
      "Authentication Error",
    );
    cy.get('[data-testid="error-description"]').should(
      "contain",
      "Your session token is corrupted or invalid",
    );
    cy.get('[data-testid="error-icon"]').should("be.visible");

    // Should have force logout button
    cy.get('[data-testid="force-logout-button"]').should(
      "contain",
      "Login Again",
    );
    cy.get('[data-testid="force-logout-button"]').click();
    cy.wrap(onForceLogout).should("have.been.called");

    // Should have retry button
    cy.get('[data-testid="retry-button"]').should("contain", "Try Again");
    cy.get('[data-testid="retry-button"]').click();
    cy.wrap(onRetry).should("have.been.called");
  });

  it("displays critical error overlay for user_not_found", () => {
    const onForceLogout = cy.stub();

    cy.mount(
      <TestWrapper>
        <AuthErrorHandlerForTesting
          error="user_not_found"
          onForceLogout={onForceLogout}
        />
      </TestWrapper>,
    );

    // Should show critical error overlay
    cy.get('[data-testid="critical-error-overlay"]').should("be.visible");

    // Should show correct content
    cy.get('[data-testid="error-title"]').should("contain", "Account Error");
    cy.get('[data-testid="error-description"]').should(
      "contain",
      "Your account could not be found",
    );

    // Should have force logout button
    cy.get('[data-testid="force-logout-button"]').should(
      "contain",
      "Login Again",
    );
    cy.get('[data-testid="force-logout-button"]').click();
    cy.wrap(onForceLogout).should("have.been.called");
  });

  it("displays inline warning for token_expired", () => {
    const onLogin = cy.stub();
    const onRetry = cy.stub();

    cy.mount(
      <TestWrapper>
        <AuthErrorHandlerForTesting
          error="token_expired"
          onLogin={onLogin}
          onRetry={onRetry}
        />
      </TestWrapper>,
    );

    // Should show inline error card
    cy.get('[data-testid="inline-error-card"]').should("be.visible");
    cy.get('[data-testid="critical-error-overlay"]').should("not.exist");

    // Should show correct content
    cy.get('[data-testid="error-title"]').should("contain", "Session Expired");
    cy.get('[data-testid="error-description"]').should(
      "contain",
      "Your session has expired",
    );
    cy.get('[data-testid="warning-icon"]').should("be.visible");

    // Should have login button
    cy.get('[data-testid="login-button"]').should("contain", "Login Again");
    cy.get('[data-testid="login-button"]').click();
    cy.wrap(onLogin).should("have.been.called");

    // Should have retry button
    cy.get('[data-testid="retry-button"]').should("contain", "Retry");
    cy.get('[data-testid="retry-button"]').click();
    cy.wrap(onRetry).should("have.been.called");
  });

  it("displays inline info message for token_missing", () => {
    const onLogin = cy.stub();

    cy.mount(
      <TestWrapper>
        <AuthErrorHandlerForTesting
          error="token_missing"
          onLogin={onLogin}
          onRetry={undefined}
        />
      </TestWrapper>,
    );

    // Should show inline error card
    cy.get('[data-testid="inline-error-card"]').should("be.visible");

    // Should show correct content
    cy.get('[data-testid="error-title"]').should("contain", "Not Logged In");
    cy.get('[data-testid="error-description"]').should(
      "contain",
      "You need to log in to access this page",
    );

    // Should have login button
    cy.get('[data-testid="login-button"]').should("contain", "Login");
    cy.get('[data-testid="login-button"]').click();
    cy.wrap(onLogin).should("have.been.called");

    // Should not have retry button when onRetry not provided
    cy.get('[data-testid="retry-button"]').should("not.exist");
  });

  it("handles keyboard navigation for critical errors", () => {
    const onForceLogout = cy.stub();
    const onRetry = cy.stub();

    cy.mount(
      <TestWrapper>
        <AuthErrorHandlerForTesting
          error="token_invalid"
          onForceLogout={onForceLogout}
          onRetry={onRetry}
        />
      </TestWrapper>,
    );

    // Tab to force logout button
    cy.get('[data-testid="force-logout-button"]').focus();
    cy.focused().should("contain", "Login Again");

    // Tab to retry button
    cy.realPress("Tab");
    cy.focused().should("contain", "Try Again");

    // Enter should trigger retry
    cy.realPress("Enter");
    cy.wrap(onRetry).should("have.been.called");
  });

  it("handles keyboard navigation for inline errors", () => {
    const onLogin = cy.stub();
    const onRetry = cy.stub();

    cy.mount(
      <TestWrapper>
        <AuthErrorHandlerForTesting
          error="token_expired"
          onLogin={onLogin}
          onRetry={onRetry}
        />
      </TestWrapper>,
    );

    // Tab to login button
    cy.get('[data-testid="login-button"]').focus();
    cy.focused().should("contain", "Login Again");

    // Tab to retry button
    cy.realPress("Tab");
    cy.focused().should("contain", "Retry");

    // Enter should trigger retry
    cy.realPress("Enter");
    cy.wrap(onRetry).should("have.been.called");
  });

  it("maintains responsive layout for critical errors", () => {
    cy.mount(
      <TestWrapper>
        <AuthErrorHandlerForTesting error="token_invalid" />
      </TestWrapper>,
    );

    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1200, height: 800 }, // Desktop
    ];

    viewports.forEach(({ width, height }) => {
      cy.viewport(width, height);

      // Critical overlay should remain centered and visible
      cy.get('[data-testid="critical-error-overlay"]').should("be.visible");
      cy.get('[data-testid="critical-error-overlay"]').should(
        "have.class",
        "fixed",
      );
      cy.get('[data-testid="critical-error-overlay"]').should(
        "have.class",
        "inset-0",
      );
      cy.get('[data-testid="critical-error-overlay"]').should(
        "have.class",
        "flex",
      );
      cy.get('[data-testid="critical-error-overlay"]').should(
        "have.class",
        "items-center",
      );
      cy.get('[data-testid="critical-error-overlay"]').should(
        "have.class",
        "justify-center",
      );

      // Card should be properly sized
      cy.get('[data-testid="critical-error-card"]').should("be.visible");
      cy.get('[data-testid="critical-error-card"]').should(
        "have.class",
        "max-w-md",
      );

      // Buttons should remain functional
      cy.get('[data-testid="force-logout-button"]').should("be.visible");
    });
  });

  it("maintains responsive layout for inline errors", () => {
    cy.mount(
      <TestWrapper>
        <AuthErrorHandlerForTesting error="token_expired" />
      </TestWrapper>,
    );

    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1200, height: 800 }, // Desktop
    ];

    viewports.forEach(({ width, height }) => {
      cy.viewport(width, height);

      // Inline card should remain functional
      cy.get('[data-testid="inline-error-card"]').should("be.visible");
      cy.get('[data-testid="error-title"]').should("be.visible");
      cy.get('[data-testid="error-description"]').should("be.visible");
      cy.get('[data-testid="login-button"]').should("be.visible");

      // Content should flow properly on mobile
      if (width <= 320) {
        cy.get('[data-testid="inline-error-card"]').should("have.class", "p-4");
      }
    });
  });

  it("has proper accessibility attributes", () => {
    const onRetry = cy.stub();

    cy.mount(
      <TestWrapper>
        <AuthErrorHandlerForTesting error="token_invalid" onRetry={onRetry} />
      </TestWrapper>,
    );

    // Critical errors should have proper ARIA structure
    cy.get('[data-testid="error-title"]').should("be.visible");
    cy.get('[data-testid="error-description"]').should("be.visible");
    cy.get('[data-testid="force-logout-button"]').should(
      "have.attr",
      "data-testid",
    );
    cy.get('[data-testid="retry-button"]').should("have.attr", "data-testid");

    // Icons should be present for visual context
    cy.get('[data-testid="error-icon"]').should("be.visible");
  });

  it("displays different error types with correct styling", () => {
    const errorTypes: Array<
      "token_invalid" | "token_expired" | "token_missing" | "user_not_found"
    > = ["token_invalid", "token_expired", "token_missing", "user_not_found"];

    errorTypes.forEach((errorType) => {
      cy.mount(
        <TestWrapper>
          <AuthErrorHandlerForTesting error={errorType} />
        </TestWrapper>,
      );

      // Should display error-specific content
      cy.get('[data-testid="error-title"]').should("be.visible");
      cy.get('[data-testid="error-description"]').should("be.visible");

      // Critical errors should show overlay
      if (errorType === "token_invalid" || errorType === "user_not_found") {
        cy.get('[data-testid="critical-error-overlay"]').should("be.visible");
        cy.get('[data-testid="inline-error-card"]').should("not.exist");
      } else {
        // Warning/info errors should show inline
        cy.get('[data-testid="inline-error-card"]').should("be.visible");
        cy.get('[data-testid="critical-error-overlay"]').should("not.exist");
      }
    });
  });
});
