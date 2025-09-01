import {
  getBrowserInfo,
  browserSpecificWait,
  browserSpecificViewport,
} from "../support/browser-utils";

describe("Cross-Browser Compatibility Tests", () => {
  let browserInfo: { name: any; version: string };

  beforeEach(() => {
    browserInfo = getBrowserInfo();
    browserSpecificViewport(browserInfo.name);

    cy.cleanupTestData();
    cy.setupTestUser({
      email: "crossbrowser@example.com",
      onboarding_completed: true,
    });
    cy.loginWithAPI("crossbrowser@example.com", "password123");
  });

  afterEach(() => {
    cy.cleanupTestData();
  });

  it("should handle authentication across all browsers", () => {
    cy.log(
      `Testing authentication on ${browserInfo.name} ${browserInfo.version}`,
    );

    cy.visit("/dashboard");
    cy.get('[data-testid*="dashboard"]').should("be.visible");

    // Browser-specific wait for full page load
    browserSpecificWait(browserInfo.name);

    // Verify dashboard elements load correctly
    cy.get('[data-testid*="user-menu"]').should("be.visible");
    cy.get('[data-testid*="nav"]').should("be.visible");
  });

  it("should render forms consistently across browsers", () => {
    cy.log(`Testing form rendering on ${browserInfo.name}`);

    cy.visit("/beneficiaries/add");

    // Check form elements render correctly
    cy.get('[data-testid*="first-name"]').should("be.visible");
    cy.get('[data-testid*="last-name"]').should("be.visible");
    cy.get('[data-testid*="email"]').should("be.visible");

    // Test form interactions with browser-specific behavior
    if (browserInfo.name === "firefox") {
      // Firefox specific form testing
      cy.get('[data-testid*="first-name"]').type("John", { delay: 50 });
    } else {
      cy.get('[data-testid*="first-name"]').type("John");
    }

    cy.get('[data-testid*="first-name"]').should("have.value", "John");
  });

  it("should handle file uploads across browsers", function () {
    if (browserInfo.name === "webkit") {
      cy.log("File upload test requires special handling on WebKit");
    }

    cy.visit("/documents");

    // Create a test file for upload
    const fileName = "test-document.pdf";
    const fileContent = "Test PDF content";

    cy.get('[data-testid*="file-upload"]').should("be.visible");

    if (browserInfo.name === "webkit") {
      // WebKit/Safari specific file upload
      cy.get('[data-testid*="file-upload"]').selectFile(
        {
          contents: fileContent,
          fileName: fileName,
          mimeType: "application/pdf",
        },
        { force: true },
      );
    } else {
      cy.get('[data-testid*="file-upload"]').selectFile({
        contents: fileContent,
        fileName: fileName,
        mimeType: "application/pdf",
      });
    }

    // Verify upload success message appears
    cy.get('[data-testid*="upload-success"]', { timeout: 10000 }).should(
      "be.visible",
    );
  });

  it("should handle dropdown menus consistently", () => {
    cy.visit("/beneficiaries");

    // Ensure page is loaded
    browserSpecificWait(browserInfo.name);

    // Test dropdown behavior across browsers
    cy.get('[data-testid*="beneficiary-card"]').first().should("be.visible");

    if (browserInfo.name === "webkit") {
      // Safari sometimes needs force clicks for dropdowns
      cy.get('[data-testid*="Button"]').first().click({ force: true });
    } else {
      cy.get('[data-testid*="Button"]').first().click();
    }

    cy.get('[data-testid*="DropdownItem"]').should("be.visible");
    cy.get('[data-testid*="DropdownItem"]')
      .contains("Edit")
      .should("be.visible");

    // Close dropdown by clicking outside (browser-specific behavior)
    cy.get("body").click(0, 0);
    cy.get('[data-testid*="DropdownItem"]').should("not.exist");
  });

  it("should handle responsive design across browsers", () => {
    const viewports = [
      { width: 375, height: 667, name: "mobile" },
      { width: 768, height: 1024, name: "tablet" },
      { width: 1280, height: 720, name: "desktop" },
    ];

    cy.visit("/dashboard");

    viewports.forEach(({ width, height, name }) => {
      cy.log(
        `Testing ${name} viewport (${width}x${height}) on ${browserInfo.name}`,
      );

      cy.viewport(width, height);
      browserSpecificWait(browserInfo.name);

      // Verify responsive elements
      cy.get('[data-testid*="dashboard"]').should("be.visible");

      if (name === "mobile") {
        // Mobile-specific checks
        cy.get('[data-testid*="mobile-menu"]').should("be.visible");
      } else {
        // Desktop/tablet checks
        cy.get('[data-testid*="sidebar"]').should("be.visible");
      }
    });
  });

  it("should handle JavaScript features across browsers", () => {
    cy.visit("/onboarding/signature");

    // Test canvas-based signature functionality
    cy.get('[data-testid*="signature-canvas"]').should("be.visible");

    // Simulate drawing (different browsers may handle this differently)
    if (browserInfo.name === "firefox") {
      // Firefox might need different event simulation
      cy.get('[data-testid*="signature-canvas"]')
        .trigger("mousedown", { which: 1, clientX: 100, clientY: 100 })
        .trigger("mousemove", { which: 1, clientX: 150, clientY: 120 })
        .trigger("mouseup");
    } else {
      cy.get('[data-testid*="signature-canvas"]')
        .trigger("mousedown", { which: 1, pageX: 100, pageY: 100 })
        .trigger("mousemove", { which: 1, pageX: 150, pageY: 120 })
        .trigger("mouseup");
    }

    // Verify signature was captured
    cy.get('[data-testid*="signature-preview"]').should("be.visible");
  });

  it("should handle CSS animations and transitions", () => {
    cy.visit("/dashboard");

    // Test modal animations work across browsers
    cy.get('[data-testid*="add-asset-button"]').click();

    // Wait for modal animation (different browsers may have different timing)
    browserSpecificWait(browserInfo.name);

    cy.get('[data-testid*="asset-modal"]').should("be.visible");
    cy.get('[data-testid*="asset-modal"]').should("have.css", "opacity", "1");

    // Close modal
    cy.get('[data-testid*="close-modal"]').click();

    // Verify modal closes properly
    cy.get('[data-testid*="asset-modal"]').should("not.exist");
  });

  it("should handle keyboard navigation consistently", () => {
    cy.visit("/beneficiaries");

    // Test tab navigation works across browsers
    cy.get("body").tab();

    // Verify focus states are visible and consistent
    cy.focused().should("be.visible");

    // Test Enter key activation
    cy.focused().type("{enter}");

    // Test Escape key handling
    cy.get("body").type("{esc}");

    // Verify keyboard navigation didn't break anything
    cy.get('[data-testid*="beneficiaries-list"]').should("be.visible");
  });

  // Browser-specific tests
  it("should handle Firefox-specific quirks", function () {
    if (browserInfo.name !== "firefox") {
      cy.log("Skipping Firefox-specific test");
      this.skip();
    }

    cy.visit("/assets");

    // Firefox-specific form validation behavior
    cy.get('[data-testid*="add-asset-button"]').click();
    cy.get('[data-testid*="asset-name"]').type("Test Asset");

    // Firefox might handle HTML5 validation differently
    cy.get('[data-testid*="asset-value"]').type("invalid-number");
    cy.get('[data-testid*="submit-button"]').click();

    // Verify validation message appears
    cy.get('[data-testid*="validation-error"]').should("be.visible");
  });

  it("should handle Safari/WebKit-specific behaviors", function () {
    if (browserInfo.name !== "webkit") {
      cy.log("Skipping Safari/WebKit-specific test");
      this.skip();
    }

    cy.visit("/documents");

    // Safari specific date picker behavior
    cy.get('[data-testid*="date-input"]').click({ force: true });

    // Safari might show native date picker
    cy.get('[data-testid*="date-input"]').type("2024-12-31", { force: true });
    cy.get('[data-testid*="date-input"]').should("have.value", "2024-12-31");
  });
});
