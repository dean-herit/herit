/**
 * Shared Test Utilities
 * Eliminates duplication across component tests and provides consistent patterns
 */

import { PersonalInfo, Signature } from "@/app/types/onboarding";

// =============================================================================
// MOCK DATA FACTORIES
// =============================================================================

export const createMockPersonalInfo = (overrides: Partial<PersonalInfo> = {}): PersonalInfo => ({
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@example.com",
  date_of_birth: "1990-01-01",
  phone_number: "+353851234567",
  pps_number: "1234567T",
  address_line_1: "123 Main Street",
  address_line_2: "Apartment 4B",
  city: "Dublin",
  county: "Dublin",
  eircode: "D01 A1B2",
  profile_photo: null,
  ...overrides,
});

export const createMockSignature = (
  type: "template" | "drawn" | "uploaded" = "template",
  overrides: Partial<Signature> = {}
): Signature => {
  const baseSignature = {
    id: `${type}-${Date.now()}`,
    name: "John Doe",
    createdAt: new Date().toISOString(),
    ...overrides,
  };

  switch (type) {
    case "template":
      return {
        ...baseSignature,
        data: "John Doe",
        type: "template",
        font: "Dancing Script",
        className: "font-cursive",
      };
    case "drawn":
      return {
        ...baseSignature,
        data: '<svg viewBox="0 0 300 100"><path d="M10,80 Q100,30 200,80" stroke="black" stroke-width="2" fill="none"/></svg>',
        type: "drawn",
      };
    case "uploaded":
      return {
        ...baseSignature,
        data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        type: "uploaded",
      };
  }
};

// =============================================================================
// COMMON MOCK FUNCTIONS
// =============================================================================

export const createMockCallbacks = () => {
  // This function should only be called within test contexts
  // Return a factory function instead of creating stubs immediately
  return {
    get onChange() { return cy.stub().as("onChange"); },
    get onComplete() { return cy.stub().as("onComplete"); },
    get onSubmit() { return cy.stub().as("onSubmit"); },
    get onClick() { return cy.stub().as("onClick"); },
    get onBack() { return cy.stub().as("onBack"); },
    get onSave() { return cy.stub().as("onSave"); },
    get onCancel() { return cy.stub().as("onCancel"); },
    get onRetry() { return cy.stub().as("onRetry"); },
    get onLogin() { return cy.stub().as("onLogin"); },
    get onForceLogout() { return cy.stub().as("onForceLogout"); },
  };
};

// =============================================================================
// RESPONSIVE TESTING UTILITIES
// =============================================================================

export const VIEWPORT_SIZES = {
  mobile: { width: 320, height: 568 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1200, height: 800 },
  large: { width: 1920, height: 1080 },
} as const;

export const testResponsiveLayout = (
  testCallback: (viewport: keyof typeof VIEWPORT_SIZES) => void,
  viewports: (keyof typeof VIEWPORT_SIZES)[] = ["mobile", "tablet", "desktop"]
) => {
  viewports.forEach((viewport) => {
    const { width, height } = VIEWPORT_SIZES[viewport];
    cy.viewport(width, height);
    testCallback(viewport);
  });
};

// =============================================================================
// ACCESSIBILITY TESTING UTILITIES
// =============================================================================

export const testAccessibility = (containerSelector: string = "body") => {
  // Focus management
  cy.get(containerSelector).within(() => {
    cy.get('button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      .first()
      .focus()
      .should("be.focused");
  });

  // Check for proper ARIA attributes
  cy.get('[aria-label], [aria-labelledby], [aria-describedby]').should("exist");
  
  // Check for proper heading hierarchy
  cy.get('h1, h2, h3, h4, h5, h6').should("exist");
  
  // Ensure interactive elements are keyboard accessible
  cy.get('button:not([disabled]), [role="button"]:not([aria-disabled="true"])')
    .should("be.visible");
};

// =============================================================================
// FORM TESTING UTILITIES
// =============================================================================

export const testFormValidation = (
  formSelector: string,
  validationCases: Array<{
    field: string;
    invalidValue: string;
    expectedError: string;
  }>
) => {
  validationCases.forEach(({ field, invalidValue, expectedError }) => {
    cy.get(`${formSelector} [data-testid*="${field}"], ${formSelector} [name="${field}"]`)
      .clear()
      .type(invalidValue)
      .blur();
    
    cy.contains(expectedError).should("be.visible");
  });
};

export const fillForm = (
  formData: Record<string, string>,
  formSelector: string = "form"
) => {
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`${formSelector} [data-testid*="${field}"], ${formSelector} [name="${field}"]`)
      .clear()
      .type(value);
  });
};

// =============================================================================
// ERROR STATE TESTING UTILITIES
// =============================================================================

export const testErrorStates = (
  component: string,
  errorScenarios: Array<{
    trigger: () => void;
    expectedError: string;
    expectedAction?: string;
  }>
) => {
  errorScenarios.forEach(({ trigger, expectedError, expectedAction }, index) => {
    cy.log(`Testing error scenario ${index + 1}: ${expectedError}`);
    
    trigger();
    
    // Check error message appears
    cy.contains(expectedError).should("be.visible");
    
    // Check error action if provided
    if (expectedAction) {
      cy.contains(expectedAction).should("be.visible").and("not.be.disabled");
    }
    
    // Reset component state for next test
    cy.reload();
  });
};

// =============================================================================
// LOADING STATE TESTING UTILITIES
// =============================================================================

export const testLoadingStates = (
  triggerAction: () => void,
  expectedLoadingIndicator: string,
  completionIndicator: string,
  timeout: number = 5000
) => {
  triggerAction();
  
  // Should show loading state
  cy.get(expectedLoadingIndicator).should("be.visible");
  
  // Should eventually complete
  cy.get(completionIndicator, { timeout }).should("be.visible");
  
  // Loading indicator should disappear
  cy.get(expectedLoadingIndicator).should("not.exist");
};

// =============================================================================
// ANIMATION TESTING UTILITIES
// =============================================================================

export const waitForAnimation = (selector: string, duration: number = 500) => {
  cy.get(selector).should("be.visible");
  cy.wait(duration);
  cy.get(selector).should("have.css", "animation-duration", "0s");
};

// =============================================================================
// FILE UPLOAD TESTING UTILITIES
// =============================================================================

export const createMockFile = (
  name: string = "test-image.jpg",
  type: string = "image/jpeg",
  size: number = 1024
): File => {
  const content = new Array(size).fill("a").join("");
  return new File([content], name, { type });
};

export const testFileUpload = (
  fileInputSelector: string,
  file: File = createMockFile(),
  expectedResultSelector?: string
) => {
  cy.get(fileInputSelector).selectFile(
    {
      contents: Cypress.Buffer.from(file.name),
      fileName: file.name,
      mimeType: file.type,
    },
    { force: true }
  );
  
  if (expectedResultSelector) {
    cy.get(expectedResultSelector).should("be.visible");
  }
};

// =============================================================================
// INTEGRATION TESTING UTILITIES
// =============================================================================

export const testComponentIntegration = (
  parentComponent: string,
  childComponents: string[],
  interactionFlow: Array<{
    action: () => void;
    expectedState: () => void;
  }>
) => {
  // Verify all components are present
  cy.get(parentComponent).should("be.visible");
  childComponents.forEach((child) => {
    cy.get(child).should("exist");
  });
  
  // Execute interaction flow
  interactionFlow.forEach(({ action, expectedState }, index) => {
    cy.log(`Integration step ${index + 1}`);
    action();
    expectedState();
  });
};

// =============================================================================
// PERFORMANCE TESTING UTILITIES
// =============================================================================

export const measureRenderTime = (componentSelector: string, maxTime: number = 2000) => {
  const startTime = Date.now();
  
  cy.get(componentSelector).should("be.visible").then(() => {
    const renderTime = Date.now() - startTime;
    expect(renderTime).to.be.lessThan(maxTime);
  });
};

// =============================================================================
// DARK MODE TESTING UTILITIES  
// =============================================================================

export const testDarkMode = (componentSelector: string) => {
  // Test light mode
  cy.get("html").should("not.have.class", "dark");
  cy.get(componentSelector).should("be.visible");
  
  // Switch to dark mode (assuming Tailwind dark mode toggle)
  cy.get("html").invoke("addClass", "dark");
  
  // Test dark mode
  cy.get(componentSelector).should("be.visible");
  
  // Reset to light mode
  cy.get("html").invoke("removeClass", "dark");
};

// =============================================================================
// EXPORT ALL UTILITIES
// =============================================================================

export const TestUtils = {
  // Data factories
  createMockPersonalInfo,
  createMockSignature,
  createMockCallbacks,
  createMockFile,
  
  // Testing utilities
  testResponsiveLayout,
  testAccessibility,
  testFormValidation,
  testErrorStates,
  testLoadingStates,
  testFileUpload,
  testComponentIntegration,
  testDarkMode,
  
  // Helpers
  fillForm,
  waitForAnimation,
  measureRenderTime,
  
  // Constants
  VIEWPORT_SIZES,
};

export default TestUtils;