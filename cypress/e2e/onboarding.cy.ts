describe("Onboarding Flow", () => {
  beforeEach(() => {
    cy.cleanupTestData();
    cy.setupTestUser({
      email: "newuser@example.com",
      onboarding_completed: false,
    });
    cy.loginWithAPI("newuser@example.com", "password123");
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it("should complete full onboarding process", () => {
    cy.visit("/onboarding");

    // Step 1: Personal Information
    cy.get('[data-testid*="personal-info"]').should("be.visible");
    cy.get('[data-testid*="first-name"]').type("John");
    cy.get('[data-testid*="last-name"]').type("Doe");
    cy.get('[data-testid*="date-of-birth"]').type("1990-01-15");
    cy.get('[data-testid*="phone"]').type("+353-1-555-0123");
    cy.get('[data-testid*="address"]').type("123 Main St");
    cy.get('[data-testid*="city"]').type("Dublin");
    cy.get('[data-testid*="eircode"]').type("D01 A1B2");
    cy.get('[data-testid*="continue"]').click();

    // Step 2: Signature
    cy.get('[data-testid*="signature-canvas"]').should("be.visible");

    // Draw signature (simulate mouse events)
    cy.get('[data-testid*="signature-canvas"]')
      .trigger("mousedown", { which: 1, pageX: 100, pageY: 100 })
      .trigger("mousemove", { which: 1, pageX: 150, pageY: 120 })
      .trigger("mousemove", { which: 1, pageX: 200, pageY: 100 })
      .trigger("mouseup");

    cy.get('[data-testid*="continue"]').click();

    // Step 3: Legal Consent
    cy.get('[data-testid*="legal-consent"]').should("be.visible");
    cy.get('[data-testid*="terms-checkbox"]').check();
    cy.get('[data-testid*="privacy-checkbox"]').check();
    cy.get('[data-testid*="continue"]').click();

    // Step 4: Verification (Stripe Identity)
    cy.get('[data-testid*="verification-step"]').should("be.visible");
    cy.get('[data-testid*="start-verification"]').click();

    // Mock Stripe verification completion
    cy.window().then((win) => {
      win.postMessage(
        {
          type: "stripe-verification-complete",
          sessionId: "vs_test_123",
          status: "verified",
        },
        "*",
      );
    });

    // Should complete onboarding and redirect to dashboard
    cy.url().should("include", "/dashboard");
    cy.get('[data-testid*="onboarding-complete"]').should("be.visible");

    // Verify audit logs
    cy.verifyAuditLog("onboarding_completed");
    cy.verifyAuditLog("identity_verified");
  });

  it("should save progress between steps", () => {
    cy.visit("/onboarding");

    // Fill personal info
    cy.get('[data-testid*="first-name"]').type("Jane");
    cy.get('[data-testid*="last-name"]').type("Smith");
    cy.get('[data-testid*="continue"]').click();

    // Navigate away and back
    cy.visit("/dashboard");
    cy.visit("/onboarding");

    // Should resume from signature step
    cy.get('[data-testid*="signature-canvas"]').should("be.visible");

    // Go back to personal info
    cy.get('[data-testid*="back"]').click();

    // Data should be preserved
    cy.get('[data-testid*="first-name"]').should("have.value", "Jane");
    cy.get('[data-testid*="last-name"]').should("have.value", "Smith");
  });

  it("should handle signature validation", () => {
    cy.visit("/onboarding/signature");

    // Try to continue without signature
    cy.get('[data-testid*="continue"]').click();

    // Should show validation error
    cy.get('[data-testid*="signature-error"]').should(
      "contain",
      "Please provide your signature",
    );
  });

  it("should handle verification failure gracefully", () => {
    cy.visit("/onboarding/verification");

    cy.get('[data-testid*="start-verification"]').click();

    // Mock verification failure
    cy.window().then((win) => {
      win.postMessage(
        {
          type: "stripe-verification-complete",
          sessionId: "vs_test_123",
          status: "failed",
        },
        "*",
      );
    });

    // Should show retry option
    cy.get('[data-testid*="verification-failed"]').should("be.visible");
    cy.get('[data-testid*="retry-verification"]').should("be.visible");
  });

  it("should redirect completed users away from onboarding", () => {
    // Setup user with completed onboarding
    cy.setupTestUser({
      email: "completed@example.com",
      onboarding_completed: true,
    });
    cy.loginWithAPI("completed@example.com", "password123");

    cy.visit("/onboarding");

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
  });
});
