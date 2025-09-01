describe("Asset Management", () => {
  beforeEach(() => {
    cy.cleanupTestData();
    cy.setupTestUser({
      email: "assetuser@example.com",
      onboarding_completed: true,
      assets: [
        {
          name: "Family Home",
          type: "property",
          value: 350000,
          metadata: {
            address: "123 Main St, Dublin",
            property_type: "residential",
            eircode: "D01 A1B2",
          },
        },
        {
          name: "Savings Account",
          type: "financial",
          value: 25000,
          metadata: {
            bank_name: "Bank of Ireland",
            iban: "IE29AIBK93115212345678",
            account_type: "savings",
          },
        },
      ],
    });
    cy.loginWithAPI("assetuser@example.com", "password123");
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it("should display existing assets on dashboard", () => {
    cy.visit("/dashboard");

    // Verify assets appear in dashboard
    cy.get('[data-testid*="asset-family-home"]').should("be.visible");
    cy.get('[data-testid*="asset-savings-account"]').should("be.visible");

    // Verify total value calculation
    cy.get('[data-testid*="total-value"]').should("contain", "€375,000");
    cy.get('[data-testid*="asset-count"]').should("contain", "2");
  });

  it("should create a new property asset", () => {
    cy.visit("/assets/add");

    // Select property type
    cy.get('[data-testid*="asset-type"]').select("property");

    // Fill property details
    cy.get('[data-testid*="asset-name"]').type("Rental Property");
    cy.get('[data-testid*="property-address"]').type("456 Oak Street");
    cy.get('[data-testid*="property-city"]').type("Cork");
    cy.get('[data-testid*="property-eircode"]').type("T12 AB34");
    cy.get('[data-testid*="property-type"]').select("rental");
    cy.get('[data-testid*="asset-value"]').type("280000");

    // Add description
    cy.get('[data-testid*="asset-description"]').type(
      "Two-bedroom rental property in city center",
    );

    // Submit form
    cy.get('[data-testid*="save-asset"]').click();

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");

    // Verify new asset appears
    cy.get('[data-testid*="asset-rental-property"]').should("be.visible");
    cy.get('[data-testid*="total-value"]').should("contain", "€655,000");

    // Verify audit log
    cy.verifyAuditLog("asset_created");
  });

  it("should create a financial asset with Irish bank details", () => {
    cy.visit("/assets/add");

    cy.get('[data-testid*="asset-type"]').select("financial");

    cy.get('[data-testid*="asset-name"]').type("Investment Account");
    cy.get('[data-testid*="bank-name"]').type("AIB");
    cy.get('[data-testid*="iban"]').type("IE29AIBK93115212345679");
    cy.get('[data-testid*="account-type"]').select("investment");
    cy.get('[data-testid*="asset-value"]').type("150000");

    cy.get('[data-testid*="save-asset"]').click();

    cy.url().should("include", "/dashboard");
    cy.get('[data-testid*="asset-investment-account"]').should("be.visible");

    // Verify IBAN validation worked
    cy.task("db:get-user-assets", "assetuser@example.com").then(
      (assets: any[]) => {
        const investmentAsset = assets.find(
          (a) => a.name === "Investment Account",
        );
        expect(investmentAsset.metadata.iban).to.eq("IE29AIBK93115212345679");
      },
    );
  });

  it("should edit an existing asset", () => {
    cy.visit("/dashboard");

    // Click edit on Family Home
    cy.get('[data-testid*="asset-family-home"]').within(() => {
      cy.get('[data-testid*="edit-asset"]').click();
    });

    // Update the value
    cy.get('[data-testid*="asset-value"]').clear().type("375000");
    cy.get('[data-testid*="save-asset"]').click();

    // Verify updated value
    cy.get('[data-testid*="total-value"]').should("contain", "€400,000");
    cy.verifyAuditLog("asset_updated");
  });

  it("should delete an asset", () => {
    cy.visit("/dashboard");

    // Click delete on Savings Account
    cy.get('[data-testid*="asset-savings-account"]').within(() => {
      cy.get('[data-testid*="delete-asset"]').click();
    });

    // Confirm deletion
    cy.get('[data-testid*="confirm-delete"]').click();

    // Verify asset removed
    cy.get('[data-testid*="asset-savings-account"]').should("not.exist");
    cy.get('[data-testid*="total-value"]').should("contain", "€350,000");
    cy.verifyAuditLog("asset_deleted");
  });

  it("should validate required fields", () => {
    cy.visit("/assets/add");

    // Try to save without required fields
    cy.get('[data-testid*="save-asset"]').click();

    // Should show validation errors
    cy.get('[data-testid*="name-error"]').should(
      "contain",
      "Asset name is required",
    );
    cy.get('[data-testid*="type-error"]').should(
      "contain",
      "Asset type is required",
    );
    cy.get('[data-testid*="value-error"]').should(
      "contain",
      "Asset value is required",
    );
  });

  it("should validate Irish IBAN format", () => {
    cy.visit("/assets/add");

    cy.get('[data-testid*="asset-type"]').select("financial");
    cy.get('[data-testid*="asset-name"]').type("Test Account");
    cy.get('[data-testid*="iban"]').type("INVALID-IBAN");
    cy.get('[data-testid*="save-asset"]').click();

    // Should show IBAN validation error
    cy.get('[data-testid*="iban-error"]').should(
      "contain",
      "Please enter a valid Irish IBAN",
    );
  });

  it("should validate Eircode format for properties", () => {
    cy.visit("/assets/add");

    cy.get('[data-testid*="asset-type"]').select("property");
    cy.get('[data-testid*="asset-name"]').type("Test Property");
    cy.get('[data-testid*="property-eircode"]').type("INVALID");
    cy.get('[data-testid*="save-asset"]').click();

    // Should show Eircode validation error
    cy.get('[data-testid*="eircode-error"]').should(
      "contain",
      "Please enter a valid Eircode",
    );
  });

  it("should handle asset search and filtering", () => {
    cy.visit("/assets");

    // Search for specific asset
    cy.get('[data-testid*="asset-search"]').type("Family");
    cy.get('[data-testid*="asset-family-home"]').should("be.visible");
    cy.get('[data-testid*="asset-savings-account"]').should("not.exist");

    // Filter by type
    cy.get('[data-testid*="asset-search"]').clear();
    cy.get('[data-testid*="asset-type-filter"]').select("financial");
    cy.get('[data-testid*="asset-savings-account"]').should("be.visible");
    cy.get('[data-testid*="asset-family-home"]').should("not.exist");

    // Clear filters
    cy.get('[data-testid*="clear-filters"]').click();
    cy.get('[data-testid*="asset-family-home"]').should("be.visible");
    cy.get('[data-testid*="asset-savings-account"]').should("be.visible");
  });
});
