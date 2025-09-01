/**
 * Integration Testing Utilities
 * Provides utilities for testing component interactions and user flows
 */

import { PersonalInfo, Signature, OnboardingProgress } from "@/app/types/onboarding";
import { createMockPersonalInfo, createMockSignature, createMockCallbacks } from "./test-utils";

// =============================================================================
// ONBOARDING FLOW INTEGRATION UTILITIES
// =============================================================================

export interface OnboardingFlowState {
  currentStep: number;
  personalInfo: PersonalInfo | null;
  signature: Signature | null;
  completedSteps: number[];
}

export const createMockOnboardingState = (
  step: number = 0,
  overrides: Partial<OnboardingFlowState> = {}
): OnboardingFlowState => ({
  currentStep: step,
  personalInfo: step > 0 ? createMockPersonalInfo() : null,
  signature: step > 1 ? createMockSignature() : null,
  completedSteps: Array.from({ length: step }, (_, i) => i),
  ...overrides,
});

export const testOnboardingStepTransition = (
  fromStep: number,
  toStep: number,
  transitionData?: any
) => {
  cy.log(`Testing transition from step ${fromStep} to step ${toStep}`);
  
  // Verify current step state
  cy.get(`[data-step="${fromStep}"]`).should("be.visible");
  
  // Perform transition action
  if (transitionData) {
    // Fill form data if provided
    Object.entries(transitionData).forEach(([field, value]) => {
      cy.get(`[data-testid*="${field}"]`).clear().type(String(value));
    });
  }
  
  // Click continue/next button
  cy.get('[data-testid*="continue"], [data-testid*="next"], [data-testid*="submit"]')
    .should("be.visible")
    .click();
  
  // Verify transition to next step
  cy.get(`[data-step="${toStep}"]`).should("be.visible");
  cy.get(`[data-step="${fromStep}"]`).should("not.exist");
};

// =============================================================================
// SIGNATURE FLOW INTEGRATION UTILITIES
// =============================================================================

export const testSignatureCreationFlow = (
  signatureType: "template" | "drawn" | "uploaded"
) => {
  cy.log(`Testing ${signatureType} signature creation flow`);
  
  // Step 1: Method selection
  cy.get('[data-testid*="method-selection"]').should("be.visible");
  cy.get(`[data-testid*="${signatureType}"]`).click();
  
  // Step 2: Creation
  cy.get('[data-testid*="creation"]').should("be.visible");
  
  switch (signatureType) {
    case "template":
      // Select a font
      cy.get('[data-testid*="font"]').first().click();
      break;
    case "drawn":
      // Simulate drawing
      cy.get('[data-testid*="canvas"]').trigger("mousedown", { x: 100, y: 100 });
      cy.get('[data-testid*="canvas"]').trigger("mousemove", { x: 200, y: 150 });
      cy.get('[data-testid*="canvas"]').trigger("mouseup");
      break;
    case "uploaded":
      // Upload file
      cy.get('[data-testid*="file-input"]').selectFile({
        contents: Cypress.Buffer.from("fake-image-data"),
        fileName: "signature.jpg",
        mimeType: "image/jpeg",
      });
      break;
  }
  
  // Continue to confirmation
  cy.get('[data-testid*="continue"]').click();
  
  // Step 3: Confirmation
  cy.get('[data-testid*="confirmation"]').should("be.visible");
  cy.get('[data-testid*="signature-preview"]').should("be.visible");
  
  // Final submit
  cy.get('[data-testid*="submit"], [data-testid*="complete"]').click();
};

// =============================================================================
// AUTH FLOW INTEGRATION UTILITIES
// =============================================================================

export const testAuthFlowIntegration = () => {
  describe("Authentication Flow Integration", () => {
    it("should handle complete login to onboarding flow", () => {
      // Start at login
      cy.visit("/login");
      
      // Complete login
      cy.get('[data-testid*="email"]').type("test@example.com");
      cy.get('[data-testid*="password"]').type("password123");
      cy.get('[data-testid*="login-button"]').click();
      
      // Should redirect to onboarding if new user
      cy.url().should("include", "/onboarding");
      
      // Complete personal info step
      testOnboardingStepTransition(0, 1, createMockPersonalInfo());
      
      // Complete signature step
      testSignatureCreationFlow("template");
      
      // Should complete onboarding flow
      cy.url().should("include", "/dashboard");
    });
  });
};

// =============================================================================
// ERROR RECOVERY INTEGRATION UTILITIES
// =============================================================================

export const testErrorRecoveryFlow = (
  componentSelector: string,
  errorTrigger: () => void,
  recoveryAction: () => void,
  expectedRecoveryState: () => void
) => {
  cy.log("Testing error recovery flow");
  
  // Initial state
  cy.get(componentSelector).should("be.visible");
  
  // Trigger error
  errorTrigger();
  
  // Verify error state
  cy.get('[data-testid*="error"]').should("be.visible");
  
  // Perform recovery action
  recoveryAction();
  
  // Verify recovery
  expectedRecoveryState();
  cy.get('[data-testid*="error"]').should("not.exist");
};

// =============================================================================
// FORM PERSISTENCE INTEGRATION UTILITIES
// =============================================================================

export const testFormPersistence = (
  formData: Record<string, string>,
  navigationAction: () => void,
  returnAction: () => void
) => {
  cy.log("Testing form data persistence across navigation");
  
  // Fill form
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid*="${field}"]`).clear().type(value);
  });
  
  // Navigate away
  navigationAction();
  
  // Return to form
  returnAction();
  
  // Verify data persistence
  Object.entries(formData).forEach(([field, value]) => {
    cy.get(`[data-testid*="${field}"]`).should("have.value", value);
  });
};

// =============================================================================
// MULTI-COMPONENT STATE SYNCHRONIZATION
// =============================================================================

export const testStateSync = (
  sourceComponent: string,
  targetComponent: string,
  stateChange: () => void,
  expectedStateInTarget: () => void
) => {
  cy.log("Testing state synchronization between components");
  
  // Verify both components are present
  cy.get(sourceComponent).should("be.visible");
  cy.get(targetComponent).should("be.visible");
  
  // Make state change in source
  stateChange();
  
  // Verify state change reflected in target
  expectedStateInTarget();
};

// =============================================================================
// PERFORMANCE INTEGRATION TESTING
// =============================================================================

export const testPerformanceFlow = (
  flowSteps: Array<{
    action: () => void;
    expectedMaxTime: number;
    checkpoints?: string[];
  }>
) => {
  cy.log("Testing performance across integration flow");
  
  flowSteps.forEach(({ action, expectedMaxTime, checkpoints }, index) => {
    const startTime = performance.now();
    
    action();
    
    if (checkpoints) {
      checkpoints.forEach((checkpoint) => {
        cy.get(checkpoint).should("be.visible");
      });
    }
    
    cy.then(() => {
      const elapsed = performance.now() - startTime;
      expect(elapsed).to.be.lessThan(expectedMaxTime);
      cy.log(`Step ${index + 1} completed in ${elapsed}ms (max: ${expectedMaxTime}ms)`);
    });
  });
};

// =============================================================================
// REAL DATA FLOW TESTING (WITH BACKEND INTEGRATION)
// =============================================================================

export const testRealDataFlow = (
  apiEndpoint: string,
  testData: any,
  expectedResponse: any
) => {
  cy.log(`Testing real data flow with ${apiEndpoint}`);
  
  // Intercept API call to verify it's made with correct data
  cy.intercept("POST", apiEndpoint, (req) => {
    expect(req.body).to.deep.include(testData);
    req.reply(expectedResponse);
  }).as("apiCall");
  
  // Trigger the action that should make the API call
  cy.get('[data-testid*="submit"]').click();
  
  // Verify API call was made
  cy.wait("@apiCall");
  
  // Verify UI reflects the response
  if (expectedResponse.success) {
    cy.get('[data-testid*="success"]').should("be.visible");
  } else {
    cy.get('[data-testid*="error"]').should("be.visible");
  }
};

// =============================================================================
// COMPONENT LIFECYCLE INTEGRATION
// =============================================================================

export const testComponentLifecycle = (
  componentSelector: string,
  lifecycleEvents: Array<{
    event: "mount" | "update" | "unmount";
    trigger?: () => void;
    expectedState: () => void;
  }>
) => {
  lifecycleEvents.forEach(({ event, trigger, expectedState }) => {
    cy.log(`Testing ${event} lifecycle event`);
    
    if (trigger) {
      trigger();
    }
    
    expectedState();
  });
};

// =============================================================================
// EXPORT INTEGRATION UTILITIES
// =============================================================================

export const IntegrationUtils = {
  // Onboarding flow
  createMockOnboardingState,
  testOnboardingStepTransition,
  testSignatureCreationFlow,
  
  // Auth flow
  testAuthFlowIntegration,
  
  // Error handling
  testErrorRecoveryFlow,
  
  // Data persistence
  testFormPersistence,
  testStateSync,
  
  // Performance
  testPerformanceFlow,
  
  // Real data flows
  testRealDataFlow,
  
  // Component lifecycle
  testComponentLifecycle,
};

export default IntegrationUtils;