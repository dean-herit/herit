describe("Authentication Flow", () => {
  beforeEach(() => {
    cy.cleanupTestData();
    cy.setupTestUser({
      email: "test@example.com",
      onboarding_completed: true,
    });
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it("should complete full login flow", () => {
    cy.visit("/login");

    // Verify login form renders
    cy.get('[data-testid*="email"]').should("be.visible");
    cy.get('[data-testid*="password"]').should("be.visible");
    cy.get('[data-testid*="submit"]').should("be.visible");

    // Fill out login form
    cy.get('[data-testid*="email"]').type("test@example.com");
    cy.get('[data-testid*="password"]').type("password123");
    cy.get('[data-testid*="submit"]').click();

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
    cy.get('[data-testid*="dashboard"]').should("be.visible");

    // Verify audit log
    cy.verifyAuditLog("user_login");
  });

  it("should handle invalid credentials", () => {
    cy.visit("/login");

    cy.get('[data-testid*="email"]').type("invalid@example.com");
    cy.get('[data-testid*="password"]').type("wrongpassword");
    cy.get('[data-testid*="submit"]').click();

    // Should show error message
    cy.get('[data-testid*="error"]').should("contain", "Invalid credentials");
    cy.url().should("include", "/login");
  });

  it("should logout successfully", () => {
    cy.loginWithAPI("test@example.com", "password123");
    cy.visit("/dashboard");

    // Click logout
    cy.get('[data-testid*="user-menu"]').click();
    cy.get('[data-testid*="logout"]').click();

    // Should redirect to home
    cy.url().should("eq", Cypress.config().baseUrl + "/");
    cy.verifyAuditLog("user_logout");
  });

  it("should protect authenticated routes", () => {
    // Try to access protected route without authentication
    cy.visit("/dashboard");

    // Should redirect to login
    cy.url().should("include", "/login");
  });

  it("should redirect authenticated users from auth pages", () => {
    cy.loginWithAPI("test@example.com", "password123");
    cy.visit("/login");

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
  });
});
