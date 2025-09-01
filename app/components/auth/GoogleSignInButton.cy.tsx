import React from "react";
import { useState } from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "cypress-real-events/support";
import { TestUtils } from "../../../../cypress/support/test-utils";

// Test-specific GoogleSignInButton without navigation
function GoogleSignInButtonForTesting({
  onSignInStart = () => {},
  onPress = () => {},
  isLoading = false,
  disabled = false,
  error = null,
}: {
  onSignInStart?: () => void;
  onPress?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  error?: string | null;
} = {}) {
  const handleGoogleSignIn = () => {
    if (disabled || isLoading) return;

    if (onSignInStart) {
      onSignInStart();
    }
    onPress();
  };

  return (
    <div
      className="w-full max-w-md mx-auto"
      data-testid="google-signin-container"
    >
      {error && (
        <div
          className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
          data-testid="google-signin-error"
        >
          {error}
        </div>
      )}

      <Button
        className="w-full text-white border-white/50 hover:border-white/70"
        data-testid="google-signin-button"
        isDisabled={disabled}
        isLoading={isLoading}
        startContent={
          !isLoading && (
            <Icon
              data-testid="google-icon"
              icon="flat-color-icons:google"
              width={24}
            />
          )
        }
        variant="bordered"
        onPress={handleGoogleSignIn}
      >
        {isLoading ? "Signing in..." : "Continue with Google"}
      </Button>
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

describe("GoogleSignInButton Component", () => {
  let callbacks: ReturnType<typeof TestUtils.createMockCallbacks>;

  beforeEach(() => {
    callbacks = TestUtils.createMockCallbacks();
    // Reset stubs
    Object.values(callbacks).forEach((stub) => stub.reset?.());
  });

  describe("Core Functionality", () => {
    it("renders button elements correctly", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-container"]').should("be.visible");
      cy.get('[data-testid="google-signin-button"]').should("be.visible");
      cy.get('[data-testid="google-signin-button"]').should(
        "contain",
        "Continue with Google",
      );
      cy.get('[data-testid="google-signin-button"]').should(
        "have.class",
        "w-full",
      );
      cy.get('[data-testid="google-icon"]').should("be.visible");
    });

    it("triggers OAuth action on click", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting
            data-testid="GoogleSignInButtonForTesting-vdu2k1zv7"
            onPress={callbacks.onPress}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').click();
      cy.get("@onPress").should("have.been.called");
    });

    it("calls onSignInStart callback when provided", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting
            data-testid="GoogleSignInButtonForTesting-d5mj3r091"
            onPress={callbacks.onPress}
            onSignInStart={callbacks.onSignInStart}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').click();
      cy.get("@onSignInStart").should("have.been.called");
      cy.get("@onPress").should("have.been.called");
    });

    it("shows loading state correctly", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting isLoading={true} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').should(
        "have.attr",
        "data-loading",
        "true",
      );
      cy.get('[data-testid="google-signin-button"]').should(
        "contain",
        "Signing in...",
      );
      cy.get('[data-testid="google-icon"]').should("not.exist");
    });

    it("handles disabled state correctly", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting
            data-testid="GoogleSignInButtonForTesting-t2z7zdv9x"
            disabled={true}
            onPress={callbacks.onPress}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').should("be.disabled");
      cy.get('[data-testid="google-signin-button"]').click({ force: true });
      cy.get("@onPress").should("not.have.been.called");
    });
  });

  describe("Error States", () => {
    it("displays error messages", () => {
      const errorMessage = "Google sign-in failed. Please try again.";

      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting error={errorMessage} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-error"]').should("be.visible");
      cy.get('[data-testid="google-signin-error"]').should(
        "contain",
        errorMessage,
      );
    });

    it("handles OAuth popup blocked errors", () => {
      const errorMessage = "Popup blocked. Please allow popups and try again.";

      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting error={errorMessage} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-error"]').should(
        "contain",
        "Popup blocked",
      );
    });

    it("handles network connectivity issues", () => {
      const errorMessage = "Network error: Please check your connection";

      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting error={errorMessage} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-error"]').should(
        "contain",
        "Network error",
      );
    });

    it("handles OAuth server errors", () => {
      const errorMessage = "OAuth service temporarily unavailable";

      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting error={errorMessage} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-error"]').should(
        "contain",
        "OAuth service",
      );
    });

    it("handles user cancellation gracefully", () => {
      const errorMessage = "Sign-in cancelled by user";

      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting error={errorMessage} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-error"]').should(
        "contain",
        "cancelled by user",
      );
    });
  });

  describe("Accessibility", () => {
    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="google-signin-container"]');
    });

    it("supports keyboard navigation", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting
            data-testid="GoogleSignInButtonForTesting-313dwp13g"
            onPress={callbacks.onPress}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]')
        .focus()
        .should("be.focused");
      cy.realPress("Enter");
      cy.get("@onPress").should("have.been.called");

      // Test space key activation
      cy.get("@onPress").then((stub) => stub.resetHistory());
      cy.realPress("Space");
      cy.get("@onPress").should("have.been.called");
    });

    it("has proper ARIA labels and attributes", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').should(
        "have.prop",
        "tagName",
        "BUTTON",
      );
      cy.get('[data-testid="google-signin-button"]').should("not.be.disabled");
      cy.get('[data-testid="google-icon"]').should("have.attr", "width", "24");
    });

    it("provides proper feedback for screen readers", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting isLoading={true} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').should(
        "contain",
        "Signing in...",
      );
      cy.get('[data-testid="google-signin-button"]').should(
        "have.attr",
        "data-loading",
        "true",
      );
    });

    it("maintains accessibility when disabled", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting disabled={true} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').should("be.disabled");
      cy.get('[data-testid="google-signin-button"]').should(
        "have.attr",
        "aria-disabled",
        "true",
      );
    });
  });

  describe("Performance", () => {
    it("should render quickly", () => {
      TestUtils.measureRenderTime(
        '[data-testid="google-signin-container"]',
        1000,
      );

      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-container"]').should("be.visible");
    });

    it("should handle rapid button clicks", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting
            data-testid="GoogleSignInButtonForTesting-h0ymgaec4"
            onPress={callbacks.onPress}
          />
        </TestWrapper>,
      );

      // Rapidly click multiple times
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="google-signin-button"]').click();
      }

      cy.get("@onPress").should("have.callCount", 5);
    });

    it("should handle state changes efficiently", () => {
      const TestStateChanges = () => {
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);

        return (
          <div>
            <GoogleSignInButtonForTesting error={error} isLoading={loading} />
            <button
              data-testid="toggle-loading"
              onClick={() => setLoading(!loading)}
            >
              Toggle Loading
            </button>
            <button
              data-testid="toggle-error"
              onClick={() => setError(error ? null : "Test error")}
            >
              Toggle Error
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestStateChanges />
        </TestWrapper>,
      );

      // Rapidly toggle states
      for (let i = 0; i < 3; i++) {
        cy.get('[data-testid="toggle-loading"]').click();
        cy.get('[data-testid="toggle-error"]').click();
      }

      cy.get('[data-testid="google-signin-button"]').should("be.visible");
    });
  });

  describe("Responsive Design", () => {
    it("should work on all screen sizes", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="google-signin-container"]').should("be.visible");
        cy.get('[data-testid="google-signin-button"]').should("be.visible");
        cy.get('[data-testid="google-signin-button"]').should(
          "contain",
          "Continue with Google",
        );
        cy.get('[data-testid="google-icon"]').should("be.visible");
      });
    });

    it("maintains proper button width on mobile", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      cy.viewport(320, 568); // Mobile

      cy.get('[data-testid="google-signin-container"]')
        .should("be.visible")
        .should("have.class", "max-w-md");

      cy.get('[data-testid="google-signin-button"]').should(
        "have.class",
        "w-full",
      );
    });

    it("handles icon visibility on small screens", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      cy.viewport(280, 568); // Very small mobile

      cy.get('[data-testid="google-icon"]').should("be.visible");
      cy.get('[data-testid="google-signin-button"]').should(
        "contain",
        "Continue with Google",
      );
    });
  });

  describe("Integration Scenarios", () => {
    it("should integrate with OAuth flow", () => {
      let signInStarted = false;
      let oauthTriggered = false;

      const TestOAuthIntegration = () => {
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);

        const handleSignInStart = () => {
          signInStarted = true;
          setLoading(true);
        };

        const handleOAuthPress = () => {
          oauthTriggered = true;
          // Simulate OAuth flow
          setTimeout(() => {
            setLoading(false);
            // Simulate success or failure
            if (Math.random() > 0.5) {
              setError(null);
            } else {
              setError("OAuth failed");
            }
          }, 100);
        };

        return (
          <GoogleSignInButtonForTesting
            data-testid="GoogleSignInButtonForTesting-726bv1cfd"
            error={error}
            isLoading={loading}
            onPress={handleOAuthPress}
            onSignInStart={handleSignInStart}
          />
        );
      };

      cy.mount(
        <TestWrapper>
          <TestOAuthIntegration />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').click();

      cy.then(() => {
        expect(signInStarted).to.be.true;
        expect(oauthTriggered).to.be.true;
      });

      cy.get('[data-testid="google-signin-button"]').should(
        "have.attr",
        "data-loading",
        "true",
      );
    });

    it("should handle OAuth callback scenarios", () => {
      const TestOAuthCallback = () => {
        const [state, setState] = useState<
          "idle" | "loading" | "success" | "error"
        >("idle");

        const handleOAuth = () => {
          setState("loading");
          // Simulate OAuth popup and callback
          setTimeout(() => {
            setState(Math.random() > 0.5 ? "success" : "error");
          }, 200);
        };

        return (
          <div>
            <GoogleSignInButtonForTesting
              data-testid="GoogleSignInButtonForTesting-b663ehozj"
              error={state === "error" ? "OAuth failed" : null}
              isLoading={state === "loading"}
              onPress={handleOAuth}
            />
            <div data-testid="oauth-state">{state}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestOAuthCallback />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').click();
      cy.get('[data-testid="oauth-state"]').should("contain", "loading");

      // Wait for OAuth simulation to complete
      cy.get('[data-testid="oauth-state"]').should("not.contain", "loading");
    });

    it("should integrate with error recovery", () => {
      const TestErrorRecovery = () => {
        const [error, setError] = useState<string | null>("Initial error");

        return (
          <div>
            <GoogleSignInButtonForTesting
              data-testid="GoogleSignInButtonForTesting-w5sizc4qw"
              error={error}
              onPress={() => setError(null)}
            />
            <button
              data-testid="simulate-error"
              onClick={() => setError("Simulated error")}
            >
              Simulate Error
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestErrorRecovery />
        </TestWrapper>,
      );

      // Should show initial error
      cy.get('[data-testid="google-signin-error"]').should("be.visible");

      // Click button should clear error
      cy.get('[data-testid="google-signin-button"]').click();
      cy.get('[data-testid="google-signin-error"]').should("not.exist");

      // Simulate new error
      cy.get('[data-testid="simulate-error"]').click();
      cy.get('[data-testid="google-signin-error"]').should("be.visible");
    });
  });

  describe("Edge Cases", () => {
    it("handles missing callback functions gracefully", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      // Should not crash when callbacks are not provided
      cy.get('[data-testid="google-signin-button"]').should("be.visible");
      cy.get('[data-testid="google-signin-button"]').click();
      cy.get('[data-testid="google-signin-button"]').should("be.visible");
    });

    it("handles simultaneous loading and error states", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting
            error="Error while loading"
            isLoading={true}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-error"]').should("be.visible");
      cy.get('[data-testid="google-signin-button"]').should(
        "have.attr",
        "data-loading",
        "true",
      );
      cy.get('[data-testid="google-signin-button"]').should(
        "contain",
        "Signing in...",
      );
    });

    it("handles rapid state transitions", () => {
      const TestRapidStates = () => {
        const [state, setState] = useState<
          "normal" | "loading" | "disabled" | "error"
        >("normal");

        React.useEffect(() => {
          const interval = setInterval(() => {
            setState((prev) => {
              switch (prev) {
                case "normal":
                  return "loading";
                case "loading":
                  return "disabled";
                case "disabled":
                  return "error";
                case "error":
                  return "normal";
                default:
                  return "normal";
              }
            });
          }, 100);

          return () => clearInterval(interval);
        }, []);

        return (
          <GoogleSignInButtonForTesting
            disabled={state === "disabled"}
            error={state === "error" ? "Test error" : null}
            isLoading={state === "loading"}
          />
        );
      };

      cy.mount(
        <TestWrapper>
          <TestRapidStates />
        </TestWrapper>,
      );

      // Let it cycle through states
      cy.wait(1000);
      cy.get('[data-testid="google-signin-button"]').should("be.visible");
    });

    it("handles component remounting", () => {
      const TestMountWrapper = ({ show }: { show: boolean }) => (
        <TestWrapper>{show && <GoogleSignInButtonForTesting />}</TestWrapper>
      );

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="google-signin-container"]').should("be.visible");

      cy.mount(<TestMountWrapper show={false} />);
      cy.get('[data-testid="google-signin-container"]').should("not.exist");

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="google-signin-container"]').should("be.visible");
    });
  });

  describe("Security", () => {
    it("should sanitize error messages", () => {
      const maliciousError = '<script>alert("xss")</script>OAuth failed';

      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting error={maliciousError} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-error"]').should("be.visible");
      cy.get("script").should("not.exist");
    });

    it("should prevent multiple OAuth initiations", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting
            data-testid="GoogleSignInButtonForTesting-ucvvgvbf3"
            isLoading={true}
            onPress={callbacks.onPress}
          />
        </TestWrapper>,
      );

      // Button clicks should be ignored when loading
      cy.get('[data-testid="google-signin-button"]').click({ force: true });
      cy.get("@onPress").should("not.have.been.called");
    });

    it("should prevent OAuth when disabled", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting
            data-testid="GoogleSignInButtonForTesting-hzjizogzi"
            disabled={true}
            onPress={callbacks.onPress}
            onSignInStart={callbacks.onSignInStart}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').click({ force: true });
      cy.get("@onPress").should("not.have.been.called");
      cy.get("@onSignInStart").should("not.have.been.called");
    });

    it("should handle OAuth popup security restrictions", () => {
      const securityError = "Popup blocked by browser security policy";

      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting error={securityError} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-error"]').should(
        "contain",
        "security policy",
      );
    });

    it("should not expose sensitive OAuth details in errors", () => {
      const safeError = "Authentication failed";

      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting error={safeError} />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-error"]').should(
        "contain",
        "Authentication failed",
      );
      cy.get('[data-testid="google-signin-error"]').should(
        "not.contain",
        "token",
      );
      cy.get('[data-testid="google-signin-error"]').should(
        "not.contain",
        "secret",
      );
      cy.get('[data-testid="google-signin-error"]').should(
        "not.contain",
        "key",
      );
    });
  });

  describe("Quality Checks", () => {
    it("should meet performance standards", () => {
      TestUtils.measureRenderTime('[data-testid="google-signin-button"]', 2000);

      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="google-signin-button"]').should("be.visible");
    });

    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="google-signin-button"]');
    });

    it("should handle responsive layouts", () => {
      cy.mount(
        <TestWrapper>
          <GoogleSignInButtonForTesting />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="google-signin-button"]').should("be.visible");
      });
    });
  });
});
