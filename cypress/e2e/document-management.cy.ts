describe("Document Management", () => {
  beforeEach(() => {
    cy.cleanupTestData();
    cy.setupTestUser({
      email: "docuser@example.com",
      onboarding_completed: true,
      assets: [
        {
          name: "Family Home",
          type: "property",
          value: 350000,
          metadata: { address: "123 Main St" },
        },
      ],
    });
    cy.loginWithAPI("docuser@example.com", "password123");
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it("should upload a document", () => {
    cy.visit("/documents");

    // Upload document
    cy.fixture("test-document.pdf", "base64").then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(
        fileContent,
        "application/pdf",
      );
      const file = new File([blob], "property-deed.pdf", {
        type: "application/pdf",
      });

      cy.get('[data-testid*="document-upload"]').then(($input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        $input[0].files = dataTransfer.files;

        cy.wrap($input).trigger("change", { force: true });
      });
    });

    // Fill document details
    cy.get('[data-testid*="document-name"]').type("Property Deed");
    cy.get('[data-testid*="document-category"]').select("property");
    cy.get('[data-testid*="document-description"]').type(
      "Legal deed for family home",
    );

    // Associate with asset
    cy.get('[data-testid*="related-asset"]').select("Family Home");

    cy.get('[data-testid*="save-document"]').click();

    // Verify document appears in list
    cy.get('[data-testid*="document-property-deed"]').should("be.visible");
    cy.get('[data-testid*="document-property-deed"]').should(
      "contain",
      "property-deed.pdf",
    );

    // Verify audit log
    cy.verifyAuditLog("document_uploaded");
  });

  it("should validate file types", () => {
    cy.visit("/documents");

    // Try to upload invalid file type
    cy.fixture("invalid-file.txt").then((fileContent) => {
      const blob = new Blob([fileContent], { type: "text/plain" });
      const file = new File([blob], "invalid.txt", { type: "text/plain" });

      cy.get('[data-testid*="document-upload"]').then(($input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        $input[0].files = dataTransfer.files;

        cy.wrap($input).trigger("change", { force: true });
      });
    });

    // Should show file type error
    cy.get('[data-testid*="file-type-error"]').should(
      "contain",
      "File type not supported",
    );
  });

  it("should validate file size limits", () => {
    cy.visit("/documents");

    // Create large file (simulate 15MB file)
    const largeContent = "x".repeat(15 * 1024 * 1024);
    const blob = new Blob([largeContent], { type: "application/pdf" });
    const file = new File([blob], "large-document.pdf", {
      type: "application/pdf",
    });

    cy.get('[data-testid*="document-upload"]').then(($input) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      $input[0].files = dataTransfer.files;

      cy.wrap($input).trigger("change", { force: true });
    });

    // Should show file size error
    cy.get('[data-testid*="file-size-error"]').should(
      "contain",
      "File size too large",
    );
  });

  it("should download a document", () => {
    // First upload a document
    cy.visit("/documents");

    cy.fixture("test-document.pdf", "base64").then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(
        fileContent,
        "application/pdf",
      );
      const file = new File([blob], "downloadable.pdf", {
        type: "application/pdf",
      });

      cy.get('[data-testid*="document-upload"]').then(($input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        $input[0].files = dataTransfer.files;

        cy.wrap($input).trigger("change", { force: true });
      });
    });

    cy.get('[data-testid*="document-name"]').type("Downloadable Document");
    cy.get('[data-testid*="document-category"]').select("legal");
    cy.get('[data-testid*="save-document"]').click();

    // Download the document
    cy.get('[data-testid*="document-downloadable-document"]').within(() => {
      cy.get('[data-testid*="download-document"]').click();
    });

    // Verify download was initiated
    cy.readFile("cypress/downloads/downloadable.pdf").should("exist");
    cy.verifyAuditLog("document_downloaded");
  });

  it("should delete a document", () => {
    // First upload a document
    cy.visit("/documents");

    cy.fixture("test-document.pdf", "base64").then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(
        fileContent,
        "application/pdf",
      );
      const file = new File([blob], "deletable.pdf", {
        type: "application/pdf",
      });

      cy.get('[data-testid*="document-upload"]').then(($input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        $input[0].files = dataTransfer.files;

        cy.wrap($input).trigger("change", { force: true });
      });
    });

    cy.get('[data-testid*="document-name"]').type("Deletable Document");
    cy.get('[data-testid*="document-category"]').select("other");
    cy.get('[data-testid*="save-document"]').click();

    // Delete the document
    cy.get('[data-testid*="document-deletable-document"]').within(() => {
      cy.get('[data-testid*="delete-document"]').click();
    });

    // Confirm deletion
    cy.get('[data-testid*="confirm-delete"]').click();

    // Verify document removed
    cy.get('[data-testid*="document-deletable-document"]').should("not.exist");
    cy.verifyAuditLog("document_deleted");
  });

  it("should organize documents by category", () => {
    // Upload documents in different categories
    const documentTypes = [
      { name: "Will", category: "legal" },
      { name: "Bank Statement", category: "financial" },
      { name: "Insurance Policy", category: "insurance" },
    ];

    documentTypes.forEach((docType) => {
      cy.visit("/documents");

      cy.fixture("test-document.pdf", "base64").then((fileContent) => {
        const blob = Cypress.Blob.base64StringToBlob(
          fileContent,
          "application/pdf",
        );
        const file = new File(
          [blob],
          `${docType.name.toLowerCase().replace(" ", "-")}.pdf`,
          { type: "application/pdf" },
        );

        cy.get('[data-testid*="document-upload"]').then(($input) => {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          $input[0].files = dataTransfer.files;

          cy.wrap($input).trigger("change", { force: true });
        });
      });

      cy.get('[data-testid*="document-name"]').type(docType.name);
      cy.get('[data-testid*="document-category"]').select(docType.category);
      cy.get('[data-testid*="save-document"]').click();
    });

    // Filter by category
    cy.get('[data-testid*="category-filter"]').select("legal");
    cy.get('[data-testid*="document-will"]').should("be.visible");
    cy.get('[data-testid*="document-bank-statement"]').should("not.exist");
    cy.get('[data-testid*="document-insurance-policy"]').should("not.exist");

    // Switch to financial category
    cy.get('[data-testid*="category-filter"]').select("financial");
    cy.get('[data-testid*="document-bank-statement"]').should("be.visible");
    cy.get('[data-testid*="document-will"]').should("not.exist");
  });

  it("should search documents", () => {
    // Upload a searchable document
    cy.visit("/documents");

    cy.fixture("test-document.pdf", "base64").then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(
        fileContent,
        "application/pdf",
      );
      const file = new File([blob], "searchable-document.pdf", {
        type: "application/pdf",
      });

      cy.get('[data-testid*="document-upload"]').then(($input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        $input[0].files = dataTransfer.files;

        cy.wrap($input).trigger("change", { force: true });
      });
    });

    cy.get('[data-testid*="document-name"]').type("Important Contract");
    cy.get('[data-testid*="document-category"]').select("legal");
    cy.get('[data-testid*="document-description"]').type(
      "Very important legal contract for business",
    );
    cy.get('[data-testid*="save-document"]').click();

    // Search for the document
    cy.get('[data-testid*="document-search"]').type("Important");
    cy.get('[data-testid*="document-important-contract"]').should("be.visible");

    // Search by description
    cy.get('[data-testid*="document-search"]').clear().type("business");
    cy.get('[data-testid*="document-important-contract"]').should("be.visible");

    // Clear search
    cy.get('[data-testid*="clear-search"]').click();
    cy.get('[data-testid*="document-important-contract"]').should("be.visible");
  });

  it("should show document metadata", () => {
    // Upload document with metadata
    cy.visit("/documents");

    cy.fixture("test-document.pdf", "base64").then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(
        fileContent,
        "application/pdf",
      );
      const file = new File([blob], "metadata-document.pdf", {
        type: "application/pdf",
      });

      cy.get('[data-testid*="document-upload"]').then(($input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        $input[0].files = dataTransfer.files;

        cy.wrap($input).trigger("change", { force: true });
      });
    });

    cy.get('[data-testid*="document-name"]').type("Metadata Document");
    cy.get('[data-testid*="document-category"]').select("other");
    cy.get('[data-testid*="save-document"]').click();

    // View document details
    cy.get('[data-testid*="document-metadata-document"]').within(() => {
      cy.get('[data-testid*="view-document"]').click();
    });

    // Verify metadata is shown
    cy.get('[data-testid*="document-details"]').should("be.visible");
    cy.get('[data-testid*="file-size"]').should("contain", "KB");
    cy.get('[data-testid*="upload-date"]').should("be.visible");
    cy.get('[data-testid*="file-type"]').should("contain", "PDF");
  });

  it("should handle storage quota limits", () => {
    // Mock storage quota exceeded
    cy.intercept("POST", "/api/documents/upload", {
      statusCode: 413,
      body: { error: "Storage quota exceeded" },
    }).as("uploadFailed");

    cy.visit("/documents");

    cy.fixture("test-document.pdf", "base64").then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(
        fileContent,
        "application/pdf",
      );
      const file = new File([blob], "quota-test.pdf", {
        type: "application/pdf",
      });

      cy.get('[data-testid*="document-upload"]').then(($input) => {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        $input[0].files = dataTransfer.files;

        cy.wrap($input).trigger("change", { force: true });
      });
    });

    cy.get('[data-testid*="document-name"]').type("Quota Test");
    cy.get('[data-testid*="document-category"]').select("other");
    cy.get('[data-testid*="save-document"]').click();

    cy.wait("@uploadFailed");

    // Should show quota error
    cy.get('[data-testid*="quota-error"]').should(
      "contain",
      "Storage quota exceeded",
    );
  });
});
