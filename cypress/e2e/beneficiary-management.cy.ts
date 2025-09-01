describe("Beneficiary Management", () => {
  beforeEach(() => {
    cy.cleanupTestData();
    cy.setupTestUser({
      email: "beneficiaryuser@example.com",
      onboarding_completed: true,
      beneficiaries: [
        {
          name: "John Doe",
          relationship: "son",
          allocation: 60,
        },
        {
          name: "Jane Doe",
          relationship: "daughter",
          allocation: 40,
        },
      ],
    });
    cy.loginWithAPI("beneficiaryuser@example.com", "password123");
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it("should display existing beneficiaries", () => {
    cy.visit("/beneficiaries");

    // Verify beneficiaries appear
    cy.get('[data-testid*="beneficiary-john-doe"]').should("be.visible");
    cy.get('[data-testid*="beneficiary-jane-doe"]').should("be.visible");

    // Verify allocation percentages
    cy.get('[data-testid*="beneficiary-john-doe"]').should("contain", "60%");
    cy.get('[data-testid*="beneficiary-jane-doe"]').should("contain", "40%");

    // Verify total allocation
    cy.get('[data-testid*="total-allocation"]').should("contain", "100%");
  });

  it("should create a new beneficiary", () => {
    cy.visit("/beneficiaries/add");

    // Fill beneficiary details
    cy.get('[data-testid*="beneficiary-name"]').type("Michael Smith");
    cy.get('[data-testid*="beneficiary-relationship"]').select("nephew");
    cy.get('[data-testid*="beneficiary-allocation"]').type("25");

    // Add contact information
    cy.get('[data-testid*="beneficiary-email"]').type("michael@example.com");
    cy.get('[data-testid*="beneficiary-phone"]').type("+353-1-555-0124");
    cy.get('[data-testid*="beneficiary-address"]').type("789 Pine Street");
    cy.get('[data-testid*="beneficiary-city"]').type("Galway");
    cy.get('[data-testid*="beneficiary-eircode"]').type("H91 A2B3");

    // Add date of birth
    cy.get('[data-testid*="beneficiary-dob"]').type("1995-03-15");

    cy.get('[data-testid*="save-beneficiary"]').click();

    // Should redirect to beneficiaries list
    cy.url().should("include", "/beneficiaries");

    // Verify new beneficiary appears
    cy.get('[data-testid*="beneficiary-michael-smith"]').should("be.visible");
    cy.get('[data-testid*="beneficiary-michael-smith"]').should(
      "contain",
      "25%",
    );

    // Verify audit log
    cy.verifyAuditLog("beneficiary_created");
  });

  it("should edit an existing beneficiary", () => {
    cy.visit("/beneficiaries");

    // Click edit on John Doe
    cy.get('[data-testid*="beneficiary-john-doe"]').within(() => {
      cy.get('[data-testid*="edit-beneficiary"]').click();
    });

    // Update allocation
    cy.get('[data-testid*="beneficiary-allocation"]').clear().type("50");

    // Update contact info
    cy.get('[data-testid*="beneficiary-email"]').type("john.doe@example.com");

    cy.get('[data-testid*="save-beneficiary"]').click();

    // Verify updated allocation
    cy.get('[data-testid*="beneficiary-john-doe"]').should("contain", "50%");
    cy.verifyAuditLog("beneficiary_updated");
  });

  it("should delete a beneficiary", () => {
    cy.visit("/beneficiaries");

    // Click delete on Jane Doe
    cy.get('[data-testid*="beneficiary-jane-doe"]').within(() => {
      cy.get('[data-testid*="delete-beneficiary"]').click();
    });

    // Confirm deletion
    cy.get('[data-testid*="confirm-delete"]').click();

    // Verify beneficiary removed
    cy.get('[data-testid*="beneficiary-jane-doe"]').should("not.exist");
    cy.get('[data-testid*="total-allocation"]').should("contain", "60%");
    cy.verifyAuditLog("beneficiary_deleted");
  });

  it("should validate allocation percentages", () => {
    cy.visit("/beneficiaries/add");

    cy.get('[data-testid*="beneficiary-name"]').type("Test Person");
    cy.get('[data-testid*="beneficiary-relationship"]').select("friend");
    cy.get('[data-testid*="beneficiary-allocation"]').type("150");

    cy.get('[data-testid*="save-beneficiary"]').click();

    // Should show validation error
    cy.get('[data-testid*="allocation-error"]').should(
      "contain",
      "Allocation cannot exceed 100%",
    );
  });

  it("should warn when total allocation exceeds 100%", () => {
    cy.visit("/beneficiaries/add");

    cy.get('[data-testid*="beneficiary-name"]').type("Test Person");
    cy.get('[data-testid*="beneficiary-relationship"]').select("friend");
    cy.get('[data-testid*="beneficiary-allocation"]').type("50");

    cy.get('[data-testid*="save-beneficiary"]').click();

    // Should show warning about total allocation exceeding 100%
    cy.get('[data-testid*="allocation-warning"]').should(
      "contain",
      "Total allocation will exceed 100%",
    );

    // Verify total shows as over-allocated
    cy.visit("/beneficiaries");
    cy.get('[data-testid*="total-allocation"]').should("contain", "150%");
    cy.get('[data-testid*="allocation-warning"]').should("be.visible");
  });

  it("should validate required fields", () => {
    cy.visit("/beneficiaries/add");

    // Try to save without required fields
    cy.get('[data-testid*="save-beneficiary"]').click();

    // Should show validation errors
    cy.get('[data-testid*="name-error"]').should(
      "contain",
      "Beneficiary name is required",
    );
    cy.get('[data-testid*="relationship-error"]').should(
      "contain",
      "Relationship is required",
    );
    cy.get('[data-testid*="allocation-error"]').should(
      "contain",
      "Allocation percentage is required",
    );
  });

  it("should validate Irish phone number format", () => {
    cy.visit("/beneficiaries/add");

    cy.get('[data-testid*="beneficiary-name"]').type("Test Person");
    cy.get('[data-testid*="beneficiary-relationship"]').select("friend");
    cy.get('[data-testid*="beneficiary-allocation"]').type("10");
    cy.get('[data-testid*="beneficiary-phone"]').type("invalid-phone");

    cy.get('[data-testid*="save-beneficiary"]').click();

    // Should show phone validation error
    cy.get('[data-testid*="phone-error"]').should(
      "contain",
      "Please enter a valid Irish phone number",
    );
  });

  it("should validate email format", () => {
    cy.visit("/beneficiaries/add");

    cy.get('[data-testid*="beneficiary-name"]').type("Test Person");
    cy.get('[data-testid*="beneficiary-relationship"]').select("friend");
    cy.get('[data-testid*="beneficiary-allocation"]').type("10");
    cy.get('[data-testid*="beneficiary-email"]').type("invalid-email");

    cy.get('[data-testid*="save-beneficiary"]').click();

    // Should show email validation error
    cy.get('[data-testid*="email-error"]').should(
      "contain",
      "Please enter a valid email address",
    );
  });

  it("should handle beneficiary search and filtering", () => {
    cy.visit("/beneficiaries");

    // Search for specific beneficiary
    cy.get('[data-testid*="beneficiary-search"]').type("John");
    cy.get('[data-testid*="beneficiary-john-doe"]').should("be.visible");
    cy.get('[data-testid*="beneficiary-jane-doe"]').should("not.exist");

    // Filter by relationship
    cy.get('[data-testid*="beneficiary-search"]').clear();
    cy.get('[data-testid*="relationship-filter"]').select("daughter");
    cy.get('[data-testid*="beneficiary-jane-doe"]').should("be.visible");
    cy.get('[data-testid*="beneficiary-john-doe"]').should("not.exist");

    // Clear filters
    cy.get('[data-testid*="clear-filters"]').click();
    cy.get('[data-testid*="beneficiary-john-doe"]').should("be.visible");
    cy.get('[data-testid*="beneficiary-jane-doe"]').should("be.visible");
  });

  it("should upload beneficiary photo", () => {
    cy.visit("/beneficiaries/add");

    cy.get('[data-testid*="beneficiary-name"]').type("Photo Person");
    cy.get('[data-testid*="beneficiary-relationship"]').select("friend");
    cy.get('[data-testid*="beneficiary-allocation"]').type("5");

    // Upload photo
    cy.fixture("test-photo.jpg", "base64").then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, "image/jpeg");
      const file = new File([blob], "test-photo.jpg", { type: "image/jpeg" });

      cy.get('[data-testid*="photo-upload"]').then(($input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        $input[0].files = dataTransfer.files;

        cy.wrap($input).trigger("change", { force: true });
      });
    });

    // Verify photo preview appears
    cy.get('[data-testid*="photo-preview"]').should("be.visible");

    cy.get('[data-testid*="save-beneficiary"]').click();

    // Verify beneficiary was created with photo
    cy.get('[data-testid*="beneficiary-photo-person"]').within(() => {
      cy.get('[data-testid*="beneficiary-photo"]').should("be.visible");
    });
  });
});
