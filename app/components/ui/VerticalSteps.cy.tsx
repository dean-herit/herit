import { VerticalSteps, VerticalStepProps } from "./VerticalSteps";
import { TestUtils } from "../../../cypress/support/test-utils";


// Mock steps data
const mockSteps: VerticalStepProps[] = [
  {
    title: "Personal Information",
    description: "Enter your basic details and contact information",
  },
  {
    title: "Digital Signature",
    description: "Create your legal digital signature",
  },
  {
    title: "Legal Consent",
    description: "Review and accept terms and conditions",
  },
  {
    title: "Identity Verification",
    description: "Verify your identity with official documents",
  },
];

describe("VerticalSteps Component", () => {
  it("renders all steps correctly", () => {
    cy.mount(
      <VerticalSteps
        currentStep={0}
        steps={mockSteps}
        onStepChange={cy.stub()}
      />,
    );

    // Should display all step titles and descriptions
    cy.contains("Personal Information").should("be.visible");
    cy.contains("Enter your basic details").should("be.visible");
    cy.contains("Digital Signature").should("be.visible");
    cy.contains("Create your legal digital signature").should("be.visible");
    cy.contains("Legal Consent").should("be.visible");
    cy.contains("Review and accept terms").should("be.visible");
    cy.contains("Identity Verification").should("be.visible");
    cy.contains("Verify your identity").should("be.visible");
  });

  it("shows correct step states", () => {
    cy.mount(
      <VerticalSteps
        currentStep={1}
        steps={mockSteps}
        onStepChange={cy.stub()}
      />,
    );

    // First step should be completed (no number visible, checkmark instead)
    cy.get('[data-status="complete"]').should("exist");

    // Second step should be active (number 2 visible)
    cy.get('[data-status="active"]').should("contain", "2");

    // Remaining steps should be inactive
    cy.get('[data-status="inactive"]').should("have.length", 2);
  });

  it("handles step completion progression", () => {
    // Test progression through steps
    const steps = [0, 1, 2, 3];

    steps.forEach((currentStep) => {
      cy.mount(
        <VerticalSteps
          currentStep={currentStep}
          steps={mockSteps}
          onStepChange={cy.stub()}
        />,
      );

      // Check completed steps (should have checkmarks)
      if (currentStep > 0) {
        cy.get('[data-status="complete"]').should("have.length", currentStep);
      }

      // Check active step
      if (currentStep < mockSteps.length) {
        cy.get('[data-status="active"]').should("exist");
      }

      // Check inactive steps
      const inactiveCount = mockSteps.length - currentStep - 1;

      if (inactiveCount > 0) {
        cy.get('[data-status="inactive"]').should("have.length", inactiveCount);
      }
    });
  });

  it("handles click interactions when steps are clickable", () => {
    const onStepChange = cy.stub();

    cy.mount(
      <VerticalSteps
        clickableSteps={[true, true, true, false]}
        currentStep={2}
        steps={mockSteps}
        onStepChange={onStepChange}
      />,
    );

    // Click on first step (completed and clickable)
    cy.get('[data-testid*="Button"]').first().click();
    cy.wrap(onStepChange).should("have.been.calledWith", 0);
  });

  it("prevents clicks when steps are not clickable", () => {
    const onStepChange = cy.stub();

    cy.mount(
      <VerticalSteps
        clickableSteps={[false, false, false, false]}
        currentStep={1}
        steps={mockSteps}
        onStepChange={onStepChange}
      />,
    );

    // Try to click on steps - buttons should be disabled
    cy.get('[data-testid*="Button"]').first().should("be.disabled");
    cy.get('[data-testid*="Button"]').first().click({ force: true });

    // onStepChange should not be called
    cy.wrap(onStepChange).should("not.have.been.called");
  });

  it("hides progress bars when configured", () => {
    cy.mount(
      <VerticalSteps
        currentStep={1}
        hideProgressBars={true}
        steps={mockSteps}
        onStepChange={cy.stub()}
      />,
    );

    // Should not show connecting lines between steps
    // (This tests the styling logic - connecting lines should not be rendered)
    cy.get("body").should("not.contain.html", 'style="height: 36px"');
  });

  it("applies custom styling classes", () => {
    const customClass = "test-custom-class";
    const stepCustomClass = "test-step-class";

    cy.mount(
      <VerticalSteps
        className={customClass}
        currentStep={0}
        stepClassName={stepCustomClass}
        steps={mockSteps}
        onStepChange={cy.stub()}
      />,
    );

    // Should apply custom classes
    cy.get(`.${customClass}`).should("exist");
    cy.get(`.${stepCustomClass}`).should("exist");
  });

  it("handles single step correctly", () => {
    cy.mount(
      <VerticalSteps
        currentStep={0}
        steps={[mockSteps[0]]}
        onStepChange={cy.stub()}
      />,
    );

    // Should show only one step
    cy.contains("Personal Information").should("be.visible");
    cy.contains("Digital Signature").should("not.exist");

    // Should be in active state
    cy.get('[data-status="active"]').should("contain", "1");
  });

  it("handles empty steps array", () => {
    cy.mount(
      <VerticalSteps currentStep={0} steps={[]} onStepChange={cy.stub()} />,
    );

    // Should render without errors
    cy.get("nav").should("exist");
    cy.get("ol").should("exist");
  });

  it("handles long text content", () => {
    const longSteps = [
      {
        title:
          "This Is A Very Long Step Title That Should Handle Text Wrapping Gracefully Without Breaking The Layout",
        description:
          "This is a very long description that should wrap properly and not break the layout of the vertical steps component even with extensive text content that goes on and on.",
      },
    ];

    cy.mount(
      <VerticalSteps
        currentStep={0}
        steps={longSteps}
        onStepChange={cy.stub()}
      />,
    );

    // Long text should be visible and contained within reasonable bounds
    cy.contains("This Is A Very Long Step Title").should("be.visible");
    cy.contains("This is a very long description").should("be.visible");

    // Container should not overflow
    cy.get("nav")
      .should("be.visible")
      .then(($nav) => {
        expect($nav[0].scrollWidth).to.be.lessThan(600);
      });
  });

  it("updates when currentStep prop changes", () => {
    cy.mount(
      <VerticalSteps
        currentStep={0}
        steps={mockSteps}
        onStepChange={cy.stub()}
      />,
    );

    // Initial state - first step active
    cy.get('[data-status="active"]').should("contain", "1");

    // Re-mount with different currentStep
    cy.mount(
      <VerticalSteps
        currentStep={2}
        steps={mockSteps}
        onStepChange={cy.stub()}
      />,
    );

    // Should update to show third step as active
    cy.get('[data-status="active"]').should("contain", "3");
    cy.get('[data-status="complete"]').should("have.length", 2);
  });

  it("maintains proper accessibility", () => {
    cy.mount(
      <VerticalSteps
        currentStep={1}
        steps={mockSteps}
        onStepChange={cy.stub()}
      />,
    );

    // Should have proper ARIA labels
    cy.get('nav[aria-label="Progress"]').should("exist");

    // Should be keyboard navigable
    cy.get('[data-testid*="Button"]').first().focus();
    cy.focused().should("exist");

    // Tab through steps
    cy.focused().tab();
    cy.focused().tab();
    cy.focused().should("exist");
  });

  it("handles keyboard navigation", () => {
    const onStepChange = cy.stub();

    cy.mount(
      <VerticalSteps
        clickableSteps={[true, true, true, true]}
        currentStep={1}
        steps={mockSteps}
        onStepChange={onStepChange}
      />,
    );

    // Focus first step and press Enter
    cy.get('[data-testid*="Button"]').first().focus();
    cy.focused().type("{enter}");

    cy.wrap(onStepChange).should("have.been.calledWith", 0);
  });

  it("displays step numbers and checkmarks correctly", () => {
    cy.mount(
      <VerticalSteps
        currentStep={2}
        steps={mockSteps}
        onStepChange={cy.stub()}
      />,
    );

    // Completed steps should not show numbers (checkmarks instead)
    cy.get('[data-status="complete"]').should("not.contain", "1");
    cy.get('[data-status="complete"]').should("not.contain", "2");

    // Active step should show number
    cy.get('[data-status="active"]').should("contain", "3");

    // Inactive steps should show numbers
    cy.get('[data-status="inactive"]').should("contain", "4");
  });

  it("maintains responsive layout", () => {
    cy.mount(
      <VerticalSteps
        currentStep={1}
        steps={mockSteps}
        onStepChange={cy.stub()}
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

      // Steps should remain visible and properly laid out
      cy.contains("Personal Information").should("be.visible");
      cy.contains("Digital Signature").should("be.visible");
      cy.get('[data-status="active"]').should("be.visible");

      // Navigation should work
      cy.get("nav").should("be.visible");
    });
  });
});
