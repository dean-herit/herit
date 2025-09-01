import { BeneficiaryCard } from "./BeneficiaryCard";
import { BeneficiaryWithPhoto } from "@/app/types/beneficiaries";
import "cypress-real-events/support";

// Mock beneficiary data for testing
const mockBeneficiary: BeneficiaryWithPhoto = {
  id: "test-beneficiary-1",
  user_id: "user-1",
  name: "John Doe",
  relationship_type: "spouse",
  percentage: 50,
  email: "john.doe@example.com",
  phone: "+353 85 123 4567",
  address_line_1: "123 Main Street",
  address_line_2: "Apartment 2B",
  city: "Dublin",
  county: "Dublin",
  eircode: "D02 X285",
  country: "Ireland",
  pps_number: "1234567T",
  photo_url: "https://via.placeholder.com/150",
  conditions: "Must complete university education before inheritance",
  created_at: new Date(),
  updated_at: new Date(),
  date_of_birth: "1990-01-15",
};

const minimalBeneficiary: BeneficiaryWithPhoto = {
  id: "test-beneficiary-2",
  user_id: "user-1",
  name: "Jane Smith",
  relationship_type: "child",
  percentage: 25,
  email: null,
  phone: null,
  address_line_1: null,
  address_line_2: null,
  city: null,
  county: null,
  eircode: null,
  country: null,
  pps_number: null,
  photo_url: null,
  conditions: null,
  created_at: new Date(),
  updated_at: new Date(),
  date_of_birth: null,
};

describe("BeneficiaryCard Component", () => {
  it("renders beneficiary information correctly", () => {
    const onEdit = cy.stub();
    const onDelete = cy.stub();
    const onView = cy.stub();

    cy.mount(
      <BeneficiaryCard
        beneficiary={mockBeneficiary}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={onView}
      />,
    );

    // Check basic information
    cy.contains("John Doe").should("be.visible");
    cy.contains("Spouse").should("be.visible");
    cy.contains("50%").should("be.visible");
    cy.contains("john.doe@example.com").should("be.visible");
    cy.contains("+353 85 123 4567").should("be.visible");
    cy.contains("123 Main Street").should("be.visible");
    cy.contains("PPS: 1234567T").should("be.visible");
    cy.contains("Must complete university education").should("be.visible");
  });

  it("renders minimal beneficiary data correctly", () => {
    cy.mount(
      <BeneficiaryCard
        beneficiary={minimalBeneficiary}
        onDelete={cy.stub()}
        onEdit={cy.stub()}
        onView={cy.stub()}
      />,
    );

    // Check basic information
    cy.contains("Jane Smith").should("be.visible");
    cy.contains("Child").should("be.visible");
    cy.contains("25%").should("be.visible");

    // Should not show optional fields when null
    cy.get('[data-testid*="beneficiary-card"]').should("not.contain", "@");
    cy.get('[data-testid*="beneficiary-card"]').should("not.contain", "+353");
    cy.get('[data-testid*="beneficiary-card"]').should("not.contain", "PPS:");
    cy.get('[data-testid*="beneficiary-card"]').should(
      "not.contain",
      "Conditions:",
    );
  });

  it("displays avatar with initials when no photo", () => {
    const beneficiaryNoPhoto = { ...mockBeneficiary, photo_url: null };

    cy.mount(
      <BeneficiaryCard
        beneficiary={beneficiaryNoPhoto}
        onDelete={cy.stub()}
        onEdit={cy.stub()}
        onView={cy.stub()}
      />,
    );

    // Should show initials
    cy.contains("JD").should("be.visible");
  });

  it("handles dropdown menu interactions with real events", () => {
    const onEdit = cy.stub();
    const onDelete = cy.stub();

    cy.mount(
      <BeneficiaryCard
        beneficiary={mockBeneficiary}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={cy.stub()}
      />,
    );

    // Use real click event for dropdown trigger
    cy.get('[data-testid*="Button"]').should("be.visible").realClick();

    // Should show dropdown menu
    cy.contains("Edit").should("be.visible");
    cy.contains("Delete").should("be.visible");

    // Test edit action with real click
    cy.get('[data-testid*="DropdownItem"]').contains("Edit").realClick();
    cy.wrap(onEdit).should("have.been.calledWith", mockBeneficiary);
  });

  it("handles delete action with real mouse events", () => {
    const onDelete = cy.stub();

    cy.mount(
      <BeneficiaryCard
        beneficiary={mockBeneficiary}
        onDelete={onDelete}
        onEdit={cy.stub()}
        onView={cy.stub()}
      />,
    );

    // Open dropdown with real click and use real mouse hover
    cy.get('[data-testid*="Button"]').realClick();
    cy.get('[data-testid*="DropdownItem"]')
      .contains("Delete")
      .realHover()
      .realClick();

    cy.wrap(onDelete).should("have.been.calledWith", mockBeneficiary);
  });

  it("handles card click for view action with real click", () => {
    const onView = cy.stub();

    cy.mount(
      <BeneficiaryCard
        beneficiary={mockBeneficiary}
        onDelete={cy.stub()}
        onEdit={cy.stub()}
        onView={onView}
      />,
    );

    // Use real click on the card
    cy.get(
      `[data-testid="beneficiary-card-${mockBeneficiary.id}"]`,
    ).realClick();

    cy.wrap(onView).should("have.been.calledWith", mockBeneficiary);
  });

  it("prevents card click when dropdown is clicked using real events", () => {
    const onView = cy.stub();

    cy.mount(
      <BeneficiaryCard
        beneficiary={mockBeneficiary}
        onDelete={cy.stub()}
        onEdit={cy.stub()}
        onView={onView}
      />,
    );

    // Real click on dropdown button should not trigger onView
    cy.get('[data-testid*="Button"]').realClick();

    // onView should not be called
    cy.wrap(onView).should("not.have.been.called");
  });

  it("formats address correctly", () => {
    cy.mount(
      <BeneficiaryCard
        beneficiary={mockBeneficiary}
        onDelete={cy.stub()}
        onEdit={cy.stub()}
        onView={cy.stub()}
      />,
    );

    // Should format full address
    cy.contains(
      "123 Main Street, Apartment 2B, Dublin, Dublin, D02 X285, Ireland",
    ).should("be.visible");
  });

  it("handles relationship type labels", () => {
    const relationships = [
      { type: "spouse", label: "Spouse" },
      { type: "child", label: "Child" },
      { type: "parent", label: "Parent" },
      { type: "sibling", label: "Sibling" },
    ];

    relationships.forEach(({ type, label }) => {
      const beneficiary = {
        ...mockBeneficiary,
        relationship_type: type,
        id: `test-${type}`,
      };

      cy.mount(
        <BeneficiaryCard
          beneficiary={beneficiary}
          onDelete={cy.stub()}
          onEdit={cy.stub()}
          onView={cy.stub()}
        />,
      );

      cy.contains(label).should("be.visible");
      cy.get("body").then(() => {
        // Clean up for next iteration
        cy.get('[data-testid*="beneficiary-card"]').should("exist");
      });
    });
  });

  it("renders with long content without breaking", () => {
    const longTextBeneficiary = {
      ...mockBeneficiary,
      name: "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
      conditions:
        "Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur",
    };

    cy.mount(
      <BeneficiaryCard
        beneficiary={longTextBeneficiary}
        onDelete={cy.stub()}
        onEdit={cy.stub()}
        onView={cy.stub()}
      />,
    );

    // Test that the card still functions correctly
    cy.get(`[data-testid="beneficiary-card-${longTextBeneficiary.id}"]`).should(
      "be.visible",
    );

    // Test that dropdowns still work
    cy.get('[data-testid*="Button"]').click();
    cy.contains("Edit").should("be.visible");
    cy.contains("Delete").should("be.visible");
  });

  it("is accessible", () => {
    cy.mount(
      <BeneficiaryCard
        beneficiary={mockBeneficiary}
        onDelete={cy.stub()}
        onEdit={cy.stub()}
        onView={cy.stub()}
      />,
    );

    // Should have proper ARIA attributes
    cy.get(`[data-testid="beneficiary-card-${mockBeneficiary.id}"]`).should(
      "have.attr",
      "data-testid",
    );

    // Open dropdown to check aria-label
    cy.get('[data-testid*="Button"]').click();
    cy.get('[aria-label="Beneficiary actions"]').should("exist");

    // Should be keyboard navigable - focus the card directly
    cy.get(`[data-testid="beneficiary-card-${mockBeneficiary.id}"]`)
      .focus()
      .should("be.focused");

    // Tab to dropdown button
    cy.realPress("Tab");
    cy.focused().should("have.attr", "data-testid").and("contain", "Button");

    // Test Enter key activation
    cy.realPress("Enter");
    cy.contains("Edit").should("be.visible");

    // Test Escape key to close dropdown
    cy.realPress("Escape");
    cy.contains("Edit").should("not.exist");
  });

  it("maintains responsive layout", () => {
    cy.mount(
      <BeneficiaryCard
        beneficiary={mockBeneficiary}
        onDelete={cy.stub()}
        onEdit={cy.stub()}
        onView={cy.stub()}
      />,
    );

    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1200, height: 800 }, // Desktop
    ];

    viewports.forEach(({ width, height }) => {
      cy.viewport(width, height);

      // Card should be visible and properly laid out
      cy.get(`[data-testid="beneficiary-card-${mockBeneficiary.id}"]`).should(
        "be.visible",
      );

      // Essential information should always be visible
      cy.contains("John Doe").should("be.visible");
      cy.contains("50%").should("be.visible");
      cy.get('[data-testid*="Button"]').should("be.visible");
    });
  });
});
