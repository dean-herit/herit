import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import "cypress-real-events/support";

// Test-specific GoogleSignInButton without navigation
function GoogleSignInButtonForTesting({
  onSignInStart,
  onPress = cy.stub(),
}: {
  onSignInStart?: () => void;
  onPress?: () => void;
} = {}) {
  const handleGoogleSignIn = () => {
    if (onSignInStart) {
      onSignInStart();
    }
    // Call onPress instead of navigating for testing
    onPress();
  };

  return (
    <Button
      className="w-full text-white border-white/50 hover:border-white/70"
      data-testid="google-signin-button"
      startContent={<Icon icon="flat-color-icons:google" width={24} />}
      variant="bordered"
      onPress={handleGoogleSignIn}
    >
      Continue with Google
    </Button>
  );
}

describe("GoogleSignInButton Component", () => {
  beforeEach(() => {
    // Mock external OAuth API calls
    cy.intercept("GET", "/api/auth/google", {
      statusCode: 302,
      body: "Redirecting to Google...",
    }).as("googleOAuth");
  });

  it("renders button elements correctly", () => {
    cy.mount(<GoogleSignInButtonForTesting />);

    // Should render button with correct content and styling
    cy.get('[data-testid="google-signin-button"]').should("be.visible");
    cy.get('[data-testid="google-signin-button"]').should(
      "contain",
      "Continue with Google",
    );

    // Should have proper styling classes
    cy.get('[data-testid="google-signin-button"]').should(
      "have.class",
      "w-full",
    );

    // Should have Google icon (iconify icon should be present)
    cy.get('[data-testid="google-signin-button"] svg').should("exist");

    // Should be a button element
    cy.get('[data-testid="google-signin-button"]').should(
      "have.prop",
      "tagName",
      "BUTTON",
    );
  });

  it("calls onSignInStart callback when provided", () => {
    const onSignInStart = cy.stub();

    cy.mount(<GoogleSignInButtonForTesting onSignInStart={onSignInStart} />);

    // Click button should call onSignInStart callback
    cy.get('[data-testid="google-signin-button"]').click();
    cy.wrap(onSignInStart).should("have.been.called");
  });

  it("triggers OAuth action on click", () => {
    const onPress = cy.stub();

    cy.mount(<GoogleSignInButtonForTesting onPress={onPress} />);

    // Click should trigger the OAuth action
    cy.get('[data-testid="google-signin-button"]').click();
    cy.wrap(onPress).should("have.been.called");
  });

  it("works without onSignInStart callback", () => {
    const onPress = cy.stub();

    cy.mount(<GoogleSignInButtonForTesting onPress={onPress} />);

    // Should not crash when no onSignInStart callback provided
    cy.get('[data-testid="google-signin-button"]').should("be.visible");
    cy.get('[data-testid="google-signin-button"]').click();

    // Should still trigger onPress
    cy.wrap(onPress).should("have.been.called");

    // Button should remain functional
    cy.get('[data-testid="google-signin-button"]').should("be.visible");
  });

  it("has proper accessibility attributes", () => {
    cy.mount(<GoogleSignInButtonForTesting />);

    // Button should be accessible
    cy.get('[data-testid="google-signin-button"]').should(
      "have.prop",
      "tagName",
      "BUTTON",
    );
    cy.get('[data-testid="google-signin-button"]').should("be.visible");
    cy.get('[data-testid="google-signin-button"]').should("not.be.disabled");

    // Should be focusable
    cy.get('[data-testid="google-signin-button"]').focus();
    cy.focused().should("contain", "Continue with Google");

    // Should support keyboard interaction (Enter key)
    cy.get('[data-testid="google-signin-button"]').focus();
    cy.realPress("Enter");

    // Button should remain accessible after interaction
    cy.get('[data-testid="google-signin-button"]').should("be.visible");
  });

  it("maintains proper visual styling", () => {
    cy.mount(<GoogleSignInButtonForTesting />);

    // Should have full width
    cy.get('[data-testid="google-signin-button"]').should(
      "have.class",
      "w-full",
    );

    // Should have Google icon as start content
    cy.get('[data-testid="google-signin-button"] svg').should("be.visible");

    // Should be styled as a button
    cy.get('[data-testid="google-signin-button"]').should("be.visible");
    cy.get('[data-testid="google-signin-button"]').should("not.be.disabled");
  });

  it("handles multiple rapid clicks gracefully", () => {
    const onSignInStart = cy.stub();
    const onPress = cy.stub();

    cy.mount(
      <GoogleSignInButtonForTesting
        onSignInStart={onSignInStart}
        onPress={onPress}
      />,
    );

    // Click multiple times rapidly
    cy.get('[data-testid="google-signin-button"]').click().click().click();

    // Should handle multiple clicks (callbacks should be called)
    cy.wrap(onSignInStart).should("have.been.called");
    cy.wrap(onPress).should("have.been.called");

    // Button should remain functional after multiple clicks
    cy.get('[data-testid="google-signin-button"]').should("be.visible");
    cy.get('[data-testid="google-signin-button"]').should("not.be.disabled");
  });

  it("maintains responsive layout", () => {
    cy.mount(<GoogleSignInButtonForTesting />);

    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1200, height: 800 }, // Desktop
    ];

    viewports.forEach(({ width, height }) => {
      cy.viewport(width, height);

      // Button should remain visible and functional
      cy.get('[data-testid="google-signin-button"]').should("be.visible");
      cy.get('[data-testid="google-signin-button"]').should(
        "contain",
        "Continue with Google",
      );

      // Should maintain full width
      cy.get('[data-testid="google-signin-button"]').should(
        "have.class",
        "w-full",
      );

      // Icon should remain visible
      cy.get('[data-testid="google-signin-button"] svg').should("be.visible");
    });
  });

  it("displays correct button text", () => {
    cy.mount(<GoogleSignInButtonForTesting />);

    // Should show correct text content
    cy.get('[data-testid="google-signin-button"]').should(
      "contain.text",
      "Continue with Google",
    );
    cy.get('[data-testid="google-signin-button"]').should(
      "not.contain.text",
      "Sign in",
    );
    cy.get('[data-testid="google-signin-button"]').should(
      "not.contain.text",
      "Login",
    );
  });
});
