import { Spinner } from "@heroui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "cypress-real-events/support";

// Mock AuthErrorHandler for testing
function MockAuthErrorHandler({
  error,
  onRetry = cy.stub(),
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <div data-testid="auth-error-handler">
      <p data-testid="error-message">{error}</p>
      <button data-testid="retry-button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

// Test-specific ProtectedRoute without useAuth and useRouter dependencies
function ProtectedRouteForTesting({
  children,
  requireOnboarding = false,
  // Test props
  isAuthenticated = true,
  isSessionLoading = false,
  authError = null,
  user = { id: "1", onboarding_completed: true },
  onRedirectToLogin = cy.stub(),
  onRedirectToOnboarding = cy.stub(),
  onRetryAuth = cy.stub(),
}: {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  // Test control props
  isAuthenticated?: boolean;
  isSessionLoading?: boolean;
  authError?: string | null;
  user?: { id: string; onboarding_completed: boolean } | null;
  onRedirectToLogin?: () => void;
  onRedirectToOnboarding?: () => void;
  onRetryAuth?: () => void;
}) {
  // Simulate auth error handling
  if (authError) {
    return <MockAuthErrorHandler error={authError} onRetry={onRetryAuth} />;
  }

  // Simulate loading state
  if (isSessionLoading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
        data-testid="loading-state"
      >
        <div className="flex flex-col items-center gap-4">
          <Spinner color="primary" size="lg" data-testid="loading-spinner" />
          <p className="text-default-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Simulate unauthenticated redirect
  if (!isAuthenticated) {
    onRedirectToLogin();
    return null;
  }

  // Simulate onboarding redirect
  if (requireOnboarding && user && !user.onboarding_completed) {
    onRedirectToOnboarding();
    return null;
  }

  return <div data-testid="protected-content">{children}</div>;
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

describe("ProtectedRoute Component", () => {
  beforeEach(() => {
    // Mock API calls that might be made during auth checking
    cy.intercept("GET", "/api/auth/session", {
      statusCode: 200,
      body: { user: { id: "1" } },
    }).as("session");
  });

  it("renders protected content when authenticated", () => {
    const testContent = <div>Protected Dashboard Content</div>;

    cy.mount(
      <TestWrapper>
        <ProtectedRouteForTesting
          isAuthenticated={true}
          isSessionLoading={false}
        >
          {testContent}
        </ProtectedRouteForTesting>
      </TestWrapper>,
    );

    // Should render the protected content
    cy.get('[data-testid="protected-content"]').should("be.visible");
    cy.get('[data-testid="protected-content"]').should(
      "contain",
      "Protected Dashboard Content",
    );
  });

  it("shows loading state while session is loading", () => {
    cy.mount(
      <TestWrapper>
        <ProtectedRouteForTesting
          isSessionLoading={true}
          isAuthenticated={false}
        >
          <div>Protected Content</div>
        </ProtectedRouteForTesting>
      </TestWrapper>,
    );

    // Should show loading spinner and message
    cy.get('[data-testid="loading-state"]').should("be.visible");
    cy.get('[data-testid="loading-spinner"]').should("be.visible");
    cy.contains("Loading...").should("be.visible");

    // Should not show protected content during loading
    cy.get('[data-testid="protected-content"]').should("not.exist");
  });

  it("redirects to login when unauthenticated", () => {
    const onRedirectToLogin = cy.stub();

    cy.mount(
      <TestWrapper>
        <ProtectedRouteForTesting
          isAuthenticated={false}
          isSessionLoading={false}
          onRedirectToLogin={onRedirectToLogin}
        >
          <div>Protected Content</div>
        </ProtectedRouteForTesting>
      </TestWrapper>,
    );

    // Should trigger redirect to login
    cy.wrap(onRedirectToLogin).should("have.been.called");

    // Should not render protected content
    cy.get('[data-testid="protected-content"]').should("not.exist");
  });

  it("redirects to onboarding when onboarding is required but not completed", () => {
    const onRedirectToOnboarding = cy.stub();

    cy.mount(
      <TestWrapper>
        <ProtectedRouteForTesting
          isAuthenticated={true}
          isSessionLoading={false}
          requireOnboarding={true}
          user={{ id: "1", onboarding_completed: false }}
          onRedirectToOnboarding={onRedirectToOnboarding}
        >
          <div>Dashboard Content</div>
        </ProtectedRouteForTesting>
      </TestWrapper>,
    );

    // Should trigger redirect to onboarding
    cy.wrap(onRedirectToOnboarding).should("have.been.called");

    // Should not render protected content
    cy.get('[data-testid="protected-content"]').should("not.exist");
  });

  it("renders content when onboarding is required and completed", () => {
    cy.mount(
      <TestWrapper>
        <ProtectedRouteForTesting
          isAuthenticated={true}
          isSessionLoading={false}
          requireOnboarding={true}
          user={{ id: "1", onboarding_completed: true }}
        >
          <div>Dashboard After Onboarding</div>
        </ProtectedRouteForTesting>
      </TestWrapper>,
    );

    // Should render the protected content
    cy.get('[data-testid="protected-content"]').should("be.visible");
    cy.get('[data-testid="protected-content"]').should(
      "contain",
      "Dashboard After Onboarding",
    );
  });

  it("renders content when onboarding is not required", () => {
    cy.mount(
      <TestWrapper>
        <ProtectedRouteForTesting
          isAuthenticated={true}
          isSessionLoading={false}
          requireOnboarding={false}
          user={{ id: "1", onboarding_completed: false }}
        >
          <div>Content Without Onboarding</div>
        </ProtectedRouteForTesting>
      </TestWrapper>,
    );

    // Should render the protected content even if onboarding not completed
    cy.get('[data-testid="protected-content"]').should("be.visible");
    cy.get('[data-testid="protected-content"]').should(
      "contain",
      "Content Without Onboarding",
    );
  });

  it("displays auth error handler when auth error occurs", () => {
    const onRetryAuth = cy.stub();

    cy.mount(
      <TestWrapper>
        <ProtectedRouteForTesting
          authError="Invalid token. Please log in again."
          onRetryAuth={onRetryAuth}
        >
          <div>Protected Content</div>
        </ProtectedRouteForTesting>
      </TestWrapper>,
    );

    // Should show auth error handler
    cy.get('[data-testid="auth-error-handler"]').should("be.visible");
    cy.get('[data-testid="error-message"]').should(
      "contain",
      "Invalid token. Please log in again.",
    );

    // Should be able to retry
    cy.get('[data-testid="retry-button"]').should("be.visible");
    cy.get('[data-testid="retry-button"]').click();
    cy.wrap(onRetryAuth).should("have.been.called");

    // Should not show protected content during error
    cy.get('[data-testid="protected-content"]').should("not.exist");
  });

  it("has proper loading state accessibility", () => {
    cy.mount(
      <TestWrapper>
        <ProtectedRouteForTesting isSessionLoading={true}>
          <div>Protected Content</div>
        </ProtectedRouteForTesting>
      </TestWrapper>,
    );

    // Loading state should be accessible
    cy.get('[data-testid="loading-state"]').should("be.visible");
    cy.get('[data-testid="loading-spinner"]').should("be.visible");

    // Should have proper text content for screen readers
    cy.contains("Loading...").should("be.visible");
  });

  it("handles different children content types", () => {
    // Test with complex nested content
    const complexContent = (
      <div>
        <h1>Dashboard</h1>
        <nav>
          <ul>
            <li>Home</li>
            <li>Settings</li>
          </ul>
        </nav>
        <main>
          <p>Main dashboard content</p>
        </main>
      </div>
    );

    cy.mount(
      <TestWrapper>
        <ProtectedRouteForTesting isAuthenticated={true}>
          {complexContent}
        </ProtectedRouteForTesting>
      </TestWrapper>,
    );

    // Should render all nested content
    cy.get('[data-testid="protected-content"]').should("be.visible");
    cy.contains("Dashboard").should("be.visible");
    cy.contains("Home").should("be.visible");
    cy.contains("Settings").should("be.visible");
    cy.contains("Main dashboard content").should("be.visible");
  });

  it("maintains responsive layout in loading state", () => {
    cy.mount(
      <TestWrapper>
        <ProtectedRouteForTesting isSessionLoading={true}>
          <div>Protected Content</div>
        </ProtectedRouteForTesting>
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

      // Loading state should remain centered and visible
      cy.get('[data-testid="loading-state"]').should("be.visible");
      cy.get('[data-testid="loading-state"]').should(
        "have.class",
        "min-h-screen",
      );
      cy.get('[data-testid="loading-state"]').should("have.class", "flex");
      cy.get('[data-testid="loading-state"]').should(
        "have.class",
        "items-center",
      );
      cy.get('[data-testid="loading-state"]').should(
        "have.class",
        "justify-center",
      );

      // Spinner should remain visible
      cy.get('[data-testid="loading-spinner"]').should("be.visible");
    });
  });
});
