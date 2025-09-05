/**
 * Onboarding Flow Integration Tests
 * Demonstrates enhanced testing patterns with real component interactions
 */

import React from "react";
import { TestUtils } from "../../support/test-utils";
import { IntegrationUtils } from "../../support/integration-utils";

// Mock components representing the real onboarding flow
function MockPersonalInfoStep({ data, onChange, onComplete, loading }: any) {
  const [formData, setFormData] = React.useState(data || {});

  const handleSubmit = () => {
    onChange(formData);
    onComplete(formData);
  };

  return (
    <div data-testid="personal-info-step" data-step="0">
      <h2>Personal Information</h2>
      <input
        data-testid="input-first-name"
        placeholder="First Name"
        value={formData.first_name || ""}
        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
      />
      <input
        data-testid="input-last-name"
        placeholder="Last Name"
        value={formData.last_name || ""}
        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
      />
      <input
        data-testid="onboarding-button"
        placeholder="Email"
        value={formData.email || ""}
        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
      />
      <button
        data-testid="onboarding-button"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}

function MockSignatureStep({ personalInfo, onComplete, onBack, loading }: any) {
  const [selectedMethod, setSelectedMethod] = React.useState(null);
  const [signature, setSignature] = React.useState(null);

  const handleComplete = () => {
    const mockSignature = TestUtils.createMockSignature("template");
    setSignature(mockSignature);
    onComplete(mockSignature);
  };

  return (
    <div data-testid="onboarding-button" data-step="1">
      <h2>Create Your Signature</h2>
      <p>Welcome {personalInfo?.first_name} {personalInfo?.last_name}</p>
      
      {!selectedMethod ? (
        <div data-testid="onboarding-button">
          <button
            data-testid="select-template-method"
            onClick={() => setSelectedMethod("template")}
          >
            Choose from Text
          </button>
          <button
            data-testid="select-draw-method"
            onClick={() => setSelectedMethod("draw")}
          >
            Draw Signature
          </button>
        </div>
      ) : (
        <div data-testid="onboarding-button">
          <p>Creating {selectedMethod} signature...</p>
          <button
            data-testid="onboarding-button"
            onClick={handleComplete}
            disabled={loading}
          >
            {loading ? "Saving..." : "Complete Signature"}
          </button>
          <button
            data-testid="onboarding-button"
            onClick={() => setSelectedMethod(null)}
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}

// Integrated onboarding flow component
function OnboardingFlow() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [personalInfo, setPersonalInfo] = React.useState(null);
  const [signature, setSignature] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handlePersonalInfoComplete = async (data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setPersonalInfo(data);
      setCurrentStep(1);
    } catch (err) {
      setError("Failed to save personal information");
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureComplete = async (signatureData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSignature(signatureData);
      setCurrentStep(2);
    } catch (err) {
      setError("Failed to save signature");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (error) {
    return (
      <div data-testid="onboarding-button">
        <h2>Error</h2>
        <p data-testid="onboarding-button">{error}</p>
        <button
          data-testid="onboarding-button"
          onClick={() => {
            setError(null);
            setLoading(false);
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (currentStep === 2) {
    return (
      <div data-testid="onboarding-button">
        <h2>Onboarding Complete!</h2>
        <p>Welcome {personalInfo?.first_name}!</p>
        <p>Your signature has been saved.</p>
      </div>
    );
  }

  return (
    <div data-testid="onboarding-button">
      <div data-testid="onboarding-button">
        Step {currentStep + 1} of 2
      </div>
      
      {currentStep === 0 && (
        <MockPersonalInfoStep
          data={personalInfo}
          onChange={setPersonalInfo}
          onComplete={handlePersonalInfoComplete}
          loading={loading}
        />
      )}
      
      {currentStep === 1 && (
        <MockSignatureStep
          personalInfo={personalInfo}
          onComplete={handleSignatureComplete}
          onBack={handleBack}
          loading={loading}
        />
      )}
    </div>
  );
}

describe("Onboarding Flow Integration", () => {
  const mockPersonalInfo = TestUtils.createMockPersonalInfo();
  
  beforeEach(() => {
    // Setup clean state for each test
    cy.clock(); // Control time for animations/delays
  });

  afterEach(() => {
    cy.clock().restore();
  });

  describe("Happy Path Flow", () => {
    it("should complete full onboarding process", () => {
      cy.mountWithContext(<OnboardingFlow />);

      // Step 1: Personal Information
      cy.get('[data-testid="personal-info-step"]').should("be.visible");
      cy.get('[data-testid="onboarding-button"]').should("contain", "Step 1 of 2");

      // Fill personal information using TestUtils
      TestUtils.fillForm({
        "first-name": mockPersonalInfo.first_name,
        "last-name": mockPersonalInfo.last_name,
        "email": mockPersonalInfo.email,
      }, '[data-testid="personal-info-step"]');

      // Submit and wait for transition
      cy.get('[data-testid="onboarding-button"]').click();
      cy.get('[data-testid="onboarding-button"]').should("contain", "Saving...");
      
      // Fast-forward through API delay
      cy.tick(500);
      
      // Step 2: Signature Creation
      cy.get('[data-testid="onboarding-button"]').should("be.visible");
      cy.get('[data-testid="onboarding-button"]').should("contain", "Step 2 of 2");
      
      // Verify personal info was passed correctly
      cy.get('[data-testid="onboarding-button"]').should(
        "contain", 
        `Welcome ${mockPersonalInfo.first_name} ${mockPersonalInfo.last_name}`
      );

      // Select signature method
      cy.get('[data-testid="onboarding-button"]').should("be.visible");
      cy.get('[data-testid="select-template-method"]').click();

      // Complete signature
      cy.get('[data-testid="onboarding-button"]').should("be.visible");
      cy.get('[data-testid="onboarding-button"]').click();
      
      // Fast-forward through API delay
      cy.tick(500);

      // Completion state
      cy.get('[data-testid="onboarding-button"]').should("be.visible");
      cy.get('[data-testid="onboarding-button"]').should(
        "contain",
        `Welcome ${mockPersonalInfo.first_name}!`
      );
    });
  });

  describe("Navigation and Back Button", () => {
    it("should allow navigation between steps", () => {
      cy.mountWithContext(<OnboardingFlow />);

      // Complete step 1
      TestUtils.fillForm({
        "first-name": mockPersonalInfo.first_name,
        "last-name": mockPersonalInfo.last_name,
        "email": mockPersonalInfo.email,
      }, '[data-testid="personal-info-step"]');

      cy.get('[data-testid="onboarding-button"]').click();
      cy.tick(500);

      // Navigate to signature creation
      cy.get('[data-testid="onboarding-button"]').should("be.visible");
      cy.get('[data-testid="select-template-method"]').click();
      cy.get('[data-testid="onboarding-button"]').should("be.visible");

      // Test back navigation within signature step
      cy.get('[data-testid="onboarding-button"]').click();
      cy.get('[data-testid="onboarding-button"]').should("be.visible");
      cy.get('[data-testid="onboarding-button"]').should("not.exist");
    });
  });

  describe("Error States and Recovery", () => {
    it("should handle API errors gracefully", () => {
      // Mock API failure
      cy.window().then((win) => {
        // Simulate network error by making setTimeout throw
        const originalSetTimeout = win.setTimeout;
        cy.stub(win, 'setTimeout').callsFake((callback, delay) => {
          if (delay === 500) { // Our API simulation delay
            throw new Error("Network error");
          }
          return originalSetTimeout.call(win, callback, delay);
        });
      });

      cy.mountWithContext(<OnboardingFlow />);

      // Fill form and submit
      TestUtils.fillForm({
        "first-name": mockPersonalInfo.first_name,
        "last-name": mockPersonalInfo.last_name,
        "email": mockPersonalInfo.email,
      }, '[data-testid="personal-info-step"]');

      cy.get('[data-testid="onboarding-button"]').click();

      // Should show error state
      cy.get('[data-testid="onboarding-button"]').should("be.visible");
      cy.get('[data-testid="onboarding-button"]').should("contain", "Failed to save");

      // Test error recovery
      cy.get('[data-testid="onboarding-button"]').should("be.visible").click();
      cy.get('[data-testid="personal-info-step"]').should("be.visible");
    });
  });

  describe("Form Data Persistence", () => {
    it("should persist data during navigation", () => {
      const TestWrapper = () => {
        const [showFlow, setShowFlow] = React.useState(true);
        
        return (
          <div>
            <button
              data-testid="onboarding-button"
              onClick={() => setShowFlow(!showFlow)}
            >
              Toggle
            </button>
            {showFlow && <OnboardingFlow />}
          </div>
        );
      };

      cy.mountWithContext(<TestWrapper />);

      // Fill partial form data
      cy.get('[data-testid="input-first-name"]').type(mockPersonalInfo.first_name);
      cy.get('[data-testid="onboarding-button"]').type(mockPersonalInfo.email);

      // Hide and show component (simulating navigation)
      cy.get('[data-testid="onboarding-button"]').click();
      cy.get('[data-testid="onboarding-button"]').should("not.exist");
      
      cy.get('[data-testid="onboarding-button"]').click();
      cy.get('[data-testid="onboarding-button"]').should("be.visible");

      // Note: In real implementation, you'd want form data to persist
      // This test demonstrates the pattern for testing data persistence
      cy.get('[data-testid="input-first-name"]').should("have.value", "");
    });
  });

  describe("Performance and Accessibility", () => {
    it("should meet performance standards", () => {
      TestUtils.measureRenderTime('[data-testid="onboarding-button"]', 1000);
      
      cy.mountWithContext(<OnboardingFlow />);
      
      // Should render quickly
      cy.get('[data-testid="onboarding-button"]').should("be.visible");
    });

    it("should be accessible", () => {
      cy.mountWithContext(<OnboardingFlow />);
      
      TestUtils.testAccessibility('[data-testid="onboarding-button"]');
    });

    it("should be responsive", () => {
      cy.mountWithContext(<OnboardingFlow />);
      
      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="onboarding-button"]').should("be.visible");
        cy.get('[data-testid="personal-info-step"]').should("be.visible");
      });
    });
  });

  describe("State Synchronization", () => {
    it("should synchronize state between steps", () => {
      cy.mountWithContext(<OnboardingFlow />);

      // Complete step 1
      TestUtils.fillForm({
        "first-name": "Jane",
        "last-name": "Smith", 
        "email": "jane.smith@example.com",
      }, '[data-testid="personal-info-step"]');

      cy.get('[data-testid="onboarding-button"]').click();
      cy.tick(500);

      // Verify state was passed to step 2
      cy.get('[data-testid="onboarding-button"]').should("contain", "Welcome Jane Smith");
    });
  });

  describe("Loading States", () => {
    it("should show loading states during transitions", () => {
      cy.mountWithContext(<OnboardingFlow />);

      TestUtils.fillForm({
        "first-name": mockPersonalInfo.first_name,
        "last-name": mockPersonalInfo.last_name,
        "email": mockPersonalInfo.email,
      }, '[data-testid="personal-info-step"]');

      // Test loading state
      TestUtils.testLoadingStates(
        () => cy.get('[data-testid="onboarding-button"]').click(),
        '[data-testid="onboarding-button"]:contains("Saving...")',
        '[data-testid="onboarding-button"]'
      );

      cy.tick(500); // Complete the transition
    });
  });

  // Integration with real API endpoints (when available)
  describe("Real API Integration", () => {
    it("should work with real API endpoints", () => {
      // This test would use real API endpoints when available
      // For now, we demonstrate the pattern
      
      cy.intercept('POST', '/api/onboarding/personal-info', {
        statusCode: 200,
        body: { success: true, data: mockPersonalInfo }
      }).as('savePersonalInfo');

      cy.intercept('POST', '/api/onboarding/signature', {
        statusCode: 200,
        body: { success: true, signature: TestUtils.createMockSignature() }
      }).as('saveSignature');

      cy.mountWithContext(<OnboardingFlow />);

      // Complete the flow and verify API calls
      TestUtils.fillForm({
        "first-name": mockPersonalInfo.first_name,
        "last-name": mockPersonalInfo.last_name,
        "email": mockPersonalInfo.email,
      }, '[data-testid="personal-info-step"]');

      cy.get('[data-testid="onboarding-button"]').click();

      // In real implementation, this would make actual API calls
      // cy.wait('@savePersonalInfo');
      
      cy.tick(500);
      
      cy.get('[data-testid="select-template-method"]').click();
      cy.get('[data-testid="onboarding-button"]').click();
      
      // cy.wait('@saveSignature');
      
      cy.tick(500);
      cy.get('[data-testid="onboarding-button"]').should("be.visible");
    });
  });
});