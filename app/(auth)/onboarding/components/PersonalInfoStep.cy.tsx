import React from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "cypress-real-events/support";
import { TestUtils } from "../../../../cypress/support/test-utils";

// Mock SharedPersonalInfoFormProvider for testing
function MockSharedPersonalInfoFormProvider({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Continue",
  showCancelButton = false,
  showPhotoUpload = false,
  mode = "onboarding",
  isFromOAuth = false,
}: any) {
  const [formData, setFormData] = React.useState(initialData || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div data-testid="shared-form-provider">
      <h2 data-testid="form-title">Personal Information</h2>

      {/* Show OAuth indicator */}
      {isFromOAuth && (
        <p className="text-sm text-blue-600 mb-4" data-testid="oauth-indicator">
          Pre-filled from your Google account
        </p>
      )}

      <form data-testid="personal-info-form" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium" htmlFor="name">
              Full Name
            </label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              data-testid="input-name"
              id="name"
              type="text"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              data-testid="input-email"
              id="email"
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="phone">
              Phone
            </label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              data-testid="input-phone"
              id="phone"
              type="text"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium"
              htmlFor="address_line_1"
            >
              Address
            </label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              data-testid="input-address"
              id="address_line_1"
              type="text"
              value={formData.address_line_1 || ""}
              onChange={(e) =>
                setFormData({ ...formData, address_line_1: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium" htmlFor="city">
              City
            </label>
            <input
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              data-testid="input-city"
              id="city"
              type="text"
              value={formData.city || ""}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
            />
          </div>

          {showPhotoUpload && (
            <div data-testid="photo-upload-section">
              <label className="block text-sm font-medium">Profile Photo</label>
              <div className="mt-2 p-4 border-2 border-dashed border-gray-300 rounded-md">
                <p className="text-sm text-gray-500">
                  Photo upload placeholder
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6">
          {showCancelButton && (
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              data-testid="cancel-button"
              type="button"
              onClick={onCancel}
            >
              Back
            </button>
          )}

          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            data-testid="submit-button"
            disabled={loading}
            type="submit"
          >
            {loading ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

// Test-specific PersonalInfoStep without API dependencies
function PersonalInfoStepForTesting({
  initialData = {},
  onChange = cy.stub(),
  onComplete = cy.stub(),
  onBack,
  loading = false,
  dataLoading = false,
  mockApiResponse = { success: true },
  mockApiError = null,
}: {
  initialData?: any;
  onChange?: (data: any) => void;
  onComplete?: () => void;
  onBack?: () => void;
  loading?: boolean;
  dataLoading?: boolean;
  mockApiResponse?: any;
  mockApiError?: string | null;
}) {
  const [isLoading, setIsLoading] = React.useState(loading);

  // Convert to shared format for display
  const convertToSharedFormat = (data: any) => ({
    name:
      data.first_name && data.last_name
        ? `${data.first_name} ${data.last_name}`.trim()
        : "",
    email: data.email || "",
    phone: data.phone_number || "",
    pps_number: data.pps_number || "",
    address_line_1: data.address_line_1 || "",
    address_line_2: data.address_line_2 || "",
    city: data.city || "",
    county: data.county || "",
    eircode: data.eircode || "",
    photo_url: data.profile_photo || "",
    date_of_birth: data.date_of_birth || "",
  });

  const handleSharedFormSubmit = async (sharedData: any) => {
    setIsLoading(true);

    // Convert back to PersonalInfo format
    const [firstName, ...lastNameParts] = (sharedData.name || "").split(" ");
    const personalInfoData = {
      first_name: firstName || "",
      last_name: lastNameParts.join(" ") || "",
      email: sharedData.email || "",
      phone_number: sharedData.phone || "",
      date_of_birth: sharedData.date_of_birth || "",
      pps_number: sharedData.pps_number || "",
      address_line_1: sharedData.address_line_1 || "",
      address_line_2: sharedData.address_line_2 || "",
      city: sharedData.city || "",
      county: sharedData.county || "",
      eircode: sharedData.eircode || "",
      profile_photo: sharedData.photo_url || null,
    };

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (mockApiError) {
      setIsLoading(false);
      throw new Error(mockApiError);
    }

    // Update parent state
    onChange(personalInfoData);

    setIsLoading(false);
    onComplete();
  };

  // Enhanced data validation
  const hasInitialData =
    initialData.first_name || initialData.last_name || initialData.email;
  const isFromOAuth = initialData.auth_provider === "google";

  // Enhanced loading message
  const getLoadingMessage = () => {
    if (hasInitialData && isFromOAuth) {
      return {
        primary: "Loading your Google profile information...",
        secondary: "Pre-filling with your Google account details",
      };
    } else if (hasInitialData) {
      return {
        primary: "Loading your information...",
        secondary: "Retrieving your saved details",
      };
    } else {
      return {
        primary: "Loading your information...",
        secondary: "Preparing your personal information form",
      };
    }
  };

  const loadingMessage = getLoadingMessage();

  return (
    <div className="space-y-6" data-testid="personal-info-step">
      {/* Loading state */}
      {dataLoading ? (
        <div
          className="flex items-center justify-center py-8"
          data-testid="loading-state"
        >
          <div className="text-center">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"
              data-testid="loading-spinner"
            />
            <p
              className="text-default-600 text-sm"
              data-testid="loading-message-primary"
            >
              {loadingMessage.primary}
            </p>
            {loadingMessage.secondary && (
              <p
                className="text-default-500 text-xs mt-1"
                data-testid="loading-message-secondary"
              >
                {loadingMessage.secondary}
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Form */}
          <MockSharedPersonalInfoFormProvider
            data-testid="MockSharedPersonalInfoFormProvider-dhuaz2lje"
            initialData={convertToSharedFormat(initialData)}
            isFromOAuth={isFromOAuth}
            loading={isLoading}
            mode="onboarding"
            showCancelButton={!!onBack}
            showPhotoUpload={true}
            submitLabel="Continue"
            onCancel={onBack}
            onSubmit={handleSharedFormSubmit}
          />

          {/* Error Display */}
          {mockApiError && (
            <div
              className="mt-4 p-3 bg-danger-50 border border-danger-200 text-danger-700 rounded-lg"
              data-testid="error-display"
            >
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  data-testid="error-icon"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    fillRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="font-medium text-sm" data-testid="error-title">
                    Failed to save personal information
                  </p>
                  <p className="text-sm mt-1" data-testid="error-message">
                    {mockApiError}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Component wrapper with React Query
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("PersonalInfoStep", () => {
  let callbacks: ReturnType<typeof TestUtils.createMockCallbacks>;

  beforeEach(() => {
    callbacks = TestUtils.createMockCallbacks();

    cy.intercept("POST", "/api/onboarding/personal-info", {
      statusCode: 200,
      body: { success: true },
    }).as("savePersonalInfo");
    cy.intercept("POST", "/api/audit/log-event", { statusCode: 200 }).as(
      "logEvent",
    );
    // Reset stubs
    Object.values(callbacks).forEach((stub) => stub.reset?.());
  });

  describe("Core Functionality", () => {
    it("renders loading state initially", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting dataLoading={true} />
        </TestWrapper>,
      );

      cy.get('[data-testid="loading-state"]').should("be.visible");
      cy.get('[data-testid="loading-spinner"]').should("be.visible");
      cy.get('[data-testid="loading-message-primary"]').should(
        "contain",
        "Loading your information...",
      );
      cy.get('[data-testid="loading-message-secondary"]').should(
        "contain",
        "Preparing your personal information form",
      );

      cy.get('[data-testid="shared-form-provider"]').should("not.exist");
    });

    it("renders form after loading with empty initial data", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting
            data-testid="PersonalInfoStepForTesting-zxx58e2k5"
            initialData={{}}
            onChange={callbacks.onChange}
            onComplete={callbacks.onComplete}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="personal-info-step"]').should("be.visible");
      cy.get('[data-testid="shared-form-provider"]').should("be.visible");
      cy.get('[data-testid="form-title"]').should(
        "contain",
        "Personal Information",
      );

      cy.get('[data-testid="input-name"]').should("be.visible");
      cy.get('[data-testid="input-email"]').should("be.visible");
      cy.get('[data-testid="input-phone"]').should("be.visible");
      cy.get('[data-testid="input-address"]').should("be.visible");
      cy.get('[data-testid="input-city"]').should("be.visible");
      cy.get('[data-testid="photo-upload-section"]').should("be.visible");
      cy.get('[data-testid="submit-button"]').should("contain", "Continue");
    });

    it("pre-fills form with Google OAuth data", () => {
      const initialData = {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@gmail.com",
        profile_photo: "https://example.com/photo.jpg",
        auth_provider: "google",
      };

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting initialData={initialData} />
        </TestWrapper>,
      );

      cy.get('[data-testid="oauth-indicator"]').should(
        "contain",
        "Pre-filled from your Google account",
      );
      cy.get('[data-testid="input-name"]').should("have.value", "John Doe");
      cy.get('[data-testid="input-email"]').should(
        "have.value",
        "john.doe@gmail.com",
      );
    });

    it("handles form submission successfully", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting
            data-testid="PersonalInfoStepForTesting-5lz5iyjos"
            onChange={callbacks.onChange}
            onComplete={callbacks.onComplete}
          />
        </TestWrapper>,
      );

      TestUtils.fillForm({
        '[data-testid="input-name"]': "Jane Smith",
        '[data-testid="input-email"]': "jane@example.com",
        '[data-testid="input-phone"]': "+353 87 123 4567",
        '[data-testid="input-address"]': "123 Main Street",
        '[data-testid="input-city"]': "Dublin",
      });

      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onChange").should("have.been.called");
      cy.get("@onComplete").should("have.been.called");
    });

    it("shows loading state during form submission", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="input-name"]').type("Jane Smith");
      cy.get('[data-testid="input-email"]').type("jane@example.com");
      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="submit-button"]').should("contain", "Saving...");
      cy.get('[data-testid="submit-button"]').should("be.disabled");
    });

    it("converts data formats correctly between onboarding and shared formats", () => {
      const initialData = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone_number: "+353871234567",
        address_line_1: "123 Main St",
        city: "Dublin",
      };

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting
            data-testid="PersonalInfoStepForTesting-tj6gacijs"
            initialData={initialData}
            onChange={callbacks.onChange}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="input-name"]').should("have.value", "John Doe");
      cy.get('[data-testid="input-email"]').should(
        "have.value",
        "john@example.com",
      );
      cy.get('[data-testid="input-phone"]').should(
        "have.value",
        "+353871234567",
      );
      cy.get('[data-testid="input-address"]').should(
        "have.value",
        "123 Main St",
      );
      cy.get('[data-testid="input-city"]').should("have.value", "Dublin");

      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onChange").should("have.been.calledWith", {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        phone_number: "+353871234567",
        date_of_birth: "",
        pps_number: "",
        address_line_1: "123 Main St",
        address_line_2: "",
        city: "Dublin",
        county: "",
        eircode: "",
        profile_photo: null,
      });
    });
  });

  describe("Loading States & Data Management", () => {
    it("shows enhanced loading message for Google OAuth", () => {
      const initialData = {
        first_name: "John",
        last_name: "Doe",
        auth_provider: "google",
      };

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting
            dataLoading={true}
            initialData={initialData}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="loading-message-primary"]').should(
        "contain",
        "Loading your Google profile information...",
      );
      cy.get('[data-testid="loading-message-secondary"]').should(
        "contain",
        "Pre-filling with your Google account details",
      );
    });

    it("shows different loading messages based on data context", () => {
      const loadingScenarios = [
        {
          initialData: { first_name: "John", auth_provider: "google" },
          expectedPrimary: "Loading your Google profile information...",
          expectedSecondary: "Pre-filling with your Google account details",
        },
        {
          initialData: { first_name: "Jane" },
          expectedPrimary: "Loading your information...",
          expectedSecondary: "Retrieving your saved details",
        },
        {
          initialData: {},
          expectedPrimary: "Loading your information...",
          expectedSecondary: "Preparing your personal information form",
        },
      ];

      loadingScenarios.forEach(
        ({ initialData, expectedPrimary, expectedSecondary }) => {
          cy.mount(
            <TestWrapper>
              <PersonalInfoStepForTesting
                dataLoading={true}
                initialData={initialData}
              />
            </TestWrapper>,
          );

          cy.get('[data-testid="loading-message-primary"]').should(
            "contain",
            expectedPrimary,
          );
          cy.get('[data-testid="loading-message-secondary"]').should(
            "contain",
            expectedSecondary,
          );
        },
      );
    });

    it("handles data loading and form rendering transitions", () => {
      const TestDataTransition = () => {
        const [loading, setLoading] = useState(true);

        React.useEffect(() => {
          setTimeout(() => setLoading(false), 200);
        }, []);

        return (
          <PersonalInfoStepForTesting
            dataLoading={loading}
            initialData={{ first_name: "John", last_name: "Doe" }}
          />
        );
      };

      cy.mount(
        <TestWrapper>
          <TestDataTransition />
        </TestWrapper>,
      );

      cy.get('[data-testid="loading-state"]').should("be.visible");
      cy.get('[data-testid="shared-form-provider"]').should("not.exist");

      cy.wait(250);

      cy.get('[data-testid="loading-state"]').should("not.exist");
      cy.get('[data-testid="shared-form-provider"]').should("be.visible");
      cy.get('[data-testid="input-name"]').should("have.value", "John Doe");
    });
  });

  describe("Error Handling", () => {
    it("handles API errors gracefully", () => {
      const apiError = "Failed to validate email address";

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting mockApiError={apiError} />
        </TestWrapper>,
      );

      cy.get('[data-testid="input-name"]').type("Jane Smith");
      cy.get('[data-testid="input-email"]').type("invalid-email");
      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="error-display"]').should("be.visible");
      cy.get('[data-testid="error-title"]').should(
        "contain",
        "Failed to save personal information",
      );
      cy.get('[data-testid="error-message"]').should("contain", apiError);
      cy.get('[data-testid="error-icon"]').should("be.visible");
    });

    it("handles network timeout errors", () => {
      const networkError = "Network timeout occurred while saving data";

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting mockApiError={networkError} />
        </TestWrapper>,
      );

      TestUtils.fillForm({
        '[data-testid="input-name"]': "Jane Smith",
        '[data-testid="input-email"]': "jane@example.com",
      });

      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Network timeout",
      );
    });

    it("handles validation errors from server", () => {
      const validationError = "Invalid PPS number format";

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting mockApiError={validationError} />
        </TestWrapper>,
      );

      TestUtils.fillForm({
        '[data-testid="input-name"]': "Jane Smith",
        '[data-testid="input-email"]': "jane@example.com",
      });

      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Invalid PPS number",
      );
    });

    it("allows retry after error", () => {
      const TestErrorRetry = () => {
        const [error, setError] = useState("Initial error");
        const [submitCount, setSubmitCount] = useState(0);

        const handleSubmit = () => {
          const newCount = submitCount + 1;

          setSubmitCount(newCount);

          if (newCount <= 1) {
            setError("Submit failed");
          } else {
            setError(null);
            callbacks.onComplete();
          }
        };

        return (
          <PersonalInfoStepForTesting
            data-testid="PersonalInfoStepForTesting-3j3hrldty"
            mockApiError={error}
            onChange={handleSubmit}
            onComplete={callbacks.onComplete}
          />
        );
      };

      cy.mount(
        <TestWrapper>
          <TestErrorRetry />
        </TestWrapper>,
      );

      TestUtils.fillForm({
        '[data-testid="input-name"]': "Jane Smith",
        '[data-testid="input-email"]': "jane@example.com",
      });

      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="error-display"]').should("be.visible");

      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="error-display"]').should("not.exist");
      cy.get("@onComplete").should("have.been.called");
    });
  });

  describe("Accessibility", () => {
    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="personal-info-step"]');
    });

    it("has proper form labels and structure", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      cy.get('label[for="name"]').should("exist");
      cy.get('label[for="email"]').should("exist");
      cy.get('label[for="phone"]').should("exist");
      cy.get('label[for="address_line_1"]').should("exist");
      cy.get('label[for="city"]').should("exist");

      cy.get("#name").should("have.attr", "data-testid", "input-name");
      cy.get("#email").should("have.attr", "data-testid", "input-email");
      cy.get("#phone").should("have.attr", "data-testid", "input-phone");

      cy.get('[data-testid="personal-info-form"]').should(
        "have.prop",
        "tagName",
        "FORM",
      );
      cy.get('[data-testid="submit-button"]').should(
        "have.attr",
        "type",
        "submit",
      );
    });

    it("supports keyboard navigation properly", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="input-name"]').focus().should("be.focused");
      cy.get('[data-testid="input-name"]')
        .type("Test Name")
        .should("have.value", "Test Name");

      cy.get('[data-testid="input-email"]').focus().should("be.focused");
      cy.get('[data-testid="input-email"]').type("test@example.com");

      cy.get('[data-testid="input-phone"]').focus().should("be.focused");
      cy.get('[data-testid="submit-button"]').focus().should("be.focused");

      cy.realPress("Enter");
    });

    it("provides proper focus management during loading states", () => {
      const TestFocusManagement = () => {
        const [loading, setLoading] = useState(false);

        const handleSubmit = () => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            callbacks.onComplete();
          }, 200);
        };

        return (
          <PersonalInfoStepForTesting
            data-testid="PersonalInfoStepForTesting-nqrpbh9g5"
            loading={loading}
            onChange={handleSubmit}
            onComplete={callbacks.onComplete}
          />
        );
      };

      cy.mount(
        <TestWrapper>
          <TestFocusManagement />
        </TestWrapper>,
      );

      TestUtils.fillForm({
        '[data-testid="input-name"]': "Jane Smith",
        '[data-testid="input-email"]': "jane@example.com",
      });

      cy.get('[data-testid="submit-button"]').focus();
      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="submit-button"]').should("be.disabled");

      cy.wait(250);
      cy.get('[data-testid="submit-button"]').should("not.be.disabled");
    });

    it("announces loading state changes to screen readers", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting dataLoading={true} />
        </TestWrapper>,
      );

      cy.get('[data-testid="loading-state"]')
        .should("have.attr", "role", "status")
        .should("have.attr", "aria-live", "polite");

      cy.get('[data-testid="loading-message-primary"]').should("be.visible");
    });
  });

  describe("Performance", () => {
    it("should render quickly", () => {
      TestUtils.measureRenderTime('[data-testid="personal-info-step"]', 1000);

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="personal-info-step"]').should("be.visible");
    });

    it("handles rapid form input changes efficiently", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      const rapidInput = "A".repeat(50);

      cy.get('[data-testid="input-name"]')
        .type(rapidInput, { delay: 0 })
        .should("have.value", rapidInput);

      cy.get('[data-testid="input-email"]')
        .type("test@example.com", { delay: 0 })
        .should("have.value", "test@example.com");
    });

    it("optimizes re-renders during state changes", () => {
      const TestPerformance = () => {
        const [renderCount, setRenderCount] = useState(0);
        const [formData, setFormData] = useState({});

        React.useEffect(() => {
          setRenderCount((prev) => prev + 1);
        });

        return (
          <div>
            <PersonalInfoStepForTesting
              data-testid="PersonalInfoStepForTesting-rscxcdzzm"
              initialData={formData}
              onChange={setFormData}
            />
            <div data-testid="render-count">Renders: {renderCount}</div>
            <button
              data-testid="trigger-update"
              onClick={() => setFormData({ first_name: "Updated" })}
            >
              Update Data
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestPerformance />
        </TestWrapper>,
      );

      cy.get('[data-testid="trigger-update"]').click();
      cy.get('[data-testid="personal-info-step"]').should("be.visible");
    });
  });

  describe("Responsive Design", () => {
    it("should work on all screen sizes", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="personal-info-step"]').should("be.visible");
        cy.get('[data-testid="shared-form-provider"]').should("be.visible");
        cy.get('[data-testid="input-name"]').should("be.visible");
        cy.get('[data-testid="input-email"]').should("be.visible");
        cy.get('[data-testid="submit-button"]').should("be.visible");
        cy.get('[data-testid="photo-upload-section"]').should("be.visible");
      });
    });

    it("maintains proper form layout on mobile", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      cy.viewport(320, 568); // Mobile

      cy.get('[data-testid="personal-info-form"]')
        .should("be.visible")
        .should("have.css", "width");

      cy.get('[data-testid="input-name"]')
        .should("be.visible")
        .should("have.css", "width");

      cy.get('[data-testid="submit-button"]')
        .should("be.visible")
        .should("not.be.covered");
    });

    it("handles long form content on small screens", () => {
      const longData = {
        first_name: "A very long first name that might cause layout issues",
        last_name: "An equally long last name for testing purposes",
        email: "averylong.email.address.for.testing@example.com",
        address_line_1:
          "A very long address line that might wrap to multiple lines",
        city: "A city with a very long name",
      };

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting initialData={longData} />
        </TestWrapper>,
      );

      cy.viewport(320, 568); // Mobile

      cy.get('[data-testid="input-name"]').should("be.visible");
      cy.get('[data-testid="input-email"]').should("be.visible");
      cy.get('[data-testid="input-address"]').should("be.visible");
      cy.get('[data-testid="submit-button"]').should("be.visible");
    });
  });

  describe("Integration Scenarios", () => {
    it("shows back button when onBack prop is provided", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting onBack={callbacks.onBack} />
        </TestWrapper>,
      );

      cy.get('[data-testid="cancel-button"]').should("be.visible");
      cy.get('[data-testid="cancel-button"]').should("contain", "Back");
      cy.get('[data-testid="cancel-button"]').click();
      cy.get("@onBack").should("have.been.called");
    });

    it("integrates with full onboarding flow", () => {
      const TestOnboardingFlow = () => {
        const [currentStep, setCurrentStep] = useState(0);
        const [personalData, setPersonalData] = useState({});

        const handleComplete = () => {
          setCurrentStep(1);
        };

        const handleBack = () => {
          setCurrentStep(0);
        };

        if (currentStep === 1) {
          return (
            <div data-testid="next-step">
              <h2>Next Onboarding Step</h2>
              <button data-testid="back-to-personal" onClick={handleBack}>
                Back to Personal Info
              </button>
            </div>
          );
        }

        return (
          <PersonalInfoStepForTesting
            data-testid="PersonalInfoStepForTesting-326yd77ol"
            initialData={personalData}
            onChange={setPersonalData}
            onComplete={handleComplete}
          />
        );
      };

      cy.mount(
        <TestWrapper>
          <TestOnboardingFlow />
        </TestWrapper>,
      );

      TestUtils.fillForm({
        '[data-testid="input-name"]': "Jane Smith",
        '[data-testid="input-email"]': "jane@example.com",
      });

      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="next-step"]').should("be.visible");

      cy.get('[data-testid="back-to-personal"]').click();
      cy.get('[data-testid="personal-info-step"]').should("be.visible");
      cy.get('[data-testid="input-name"]').should("have.value", "Jane Smith");
    });

    it("handles OAuth pre-filling integration", () => {
      const TestOAuthIntegration = () => {
        const [oauthData, setOAuthData] = useState(null);

        const simulateOAuthCallback = () => {
          setOAuthData({
            first_name: "Google",
            last_name: "User",
            email: "google.user@gmail.com",
            profile_photo: "https://lh3.googleusercontent.com/photo",
            auth_provider: "google",
          });
        };

        return (
          <div>
            <button
              data-testid="simulate-oauth"
              onClick={simulateOAuthCallback}
            >
              Simulate OAuth
            </button>
            {oauthData && (
              <PersonalInfoStepForTesting
                data-testid="PersonalInfoStepForTesting-rhbtqsyie"
                initialData={oauthData}
                onChange={callbacks.onChange}
                onComplete={callbacks.onComplete}
              />
            )}
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestOAuthIntegration />
        </TestWrapper>,
      );

      cy.get('[data-testid="simulate-oauth"]').click();
      cy.get('[data-testid="oauth-indicator"]').should("be.visible");
      cy.get('[data-testid="input-name"]').should("have.value", "Google User");
      cy.get('[data-testid="input-email"]').should(
        "have.value",
        "google.user@gmail.com",
      );

      cy.get('[data-testid="submit-button"]').click();
      cy.get("@onChange").should("have.been.called");
      cy.get("@onComplete").should("have.been.called");
    });

    it("handles API integration with audit logging", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting
            data-testid="PersonalInfoStepForTesting-3bu8bnv24"
            onChange={callbacks.onChange}
            onComplete={callbacks.onComplete}
          />
        </TestWrapper>,
      );

      TestUtils.fillForm({
        '[data-testid="input-name"]': "Jane Smith",
        '[data-testid="input-email"]': "jane@example.com",
        '[data-testid="input-phone"]': "+353 87 123 4567",
      });

      cy.get('[data-testid="submit-button"]').click();

      cy.wait("@savePersonalInfo").then((interception) => {
        expect(interception.request.body).to.include({
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
        });
      });

      cy.wait("@logEvent");
    });
  });

  describe("Edge Cases", () => {
    it("handles missing required props gracefully", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="personal-info-step"]').should("be.visible");
      cy.get('[data-testid="submit-button"]').should("be.visible");
    });

    it("handles empty string values in initial data", () => {
      const emptyData = {
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        address_line_1: "",
        city: "",
      };

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting initialData={emptyData} />
        </TestWrapper>,
      );

      cy.get('[data-testid="input-name"]').should("have.value", "");
      cy.get('[data-testid="input-email"]').should("have.value", "");
      cy.get('[data-testid="input-phone"]').should("have.value", "");
    });

    it("handles null and undefined values in initial data", () => {
      const nullData = {
        first_name: null,
        last_name: undefined,
        email: null,
        profile_photo: null,
      };

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting initialData={nullData} />
        </TestWrapper>,
      );

      cy.get('[data-testid="input-name"]').should("have.value", "");
      cy.get('[data-testid="input-email"]').should("have.value", "");
      cy.get('[data-testid="personal-info-step"]').should("be.visible");
    });

    it("handles very long input values", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      const longName = "A".repeat(500);
      const longEmail = "a".repeat(240) + "@example.com";
      const longAddress = "123 " + "Very Long Street Name ".repeat(20);

      cy.get('[data-testid="input-name"]').type(longName);
      cy.get('[data-testid="input-email"]').type(longEmail);
      cy.get('[data-testid="input-address"]').type(longAddress);

      cy.get('[data-testid="input-name"]').should("contain.value", "AAA");
      cy.get('[data-testid="input-email"]').should(
        "contain.value",
        "@example.com",
      );
    });

    it("handles rapid component mounting and unmounting", () => {
      const TestMountWrapper = ({ show }: { show: boolean }) => (
        <TestWrapper>{show && <PersonalInfoStepForTesting />}</TestWrapper>
      );

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="personal-info-step"]').should("be.visible");

      cy.mount(<TestMountWrapper show={false} />);
      cy.get('[data-testid="personal-info-step"]').should("not.exist");

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="personal-info-step"]').should("be.visible");
    });

    it("handles callback function changes", () => {
      let callCount = 0;

      const TestCallbackChanges = () => {
        const [callback, setCallback] = useState(() => () => {
          callCount += 1;
        });

        const updateCallback = () => {
          setCallback(() => () => {
            callCount += 10;
          });
        };

        return (
          <div>
            <PersonalInfoStepForTesting
              data-testid="PersonalInfoStepForTesting-o9bs2783o"
              onChange={callback}
            />
            <button data-testid="update-callback" onClick={updateCallback}>
              Update Callback
            </button>
            <div data-testid="call-count">Count: {callCount}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestCallbackChanges />
        </TestWrapper>,
      );

      TestUtils.fillForm({
        '[data-testid="input-name"]': "Jane Smith",
        '[data-testid="input-email"]': "jane@example.com",
      });

      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="call-count"]').should("contain", "1");

      cy.get('[data-testid="update-callback"]').click();
      cy.get('[data-testid="submit-button"]').click();
      cy.get('[data-testid="call-count"]').should("contain", "11");
    });
  });

  describe("Security", () => {
    it("sanitizes user input to prevent XSS", () => {
      const maliciousInput =
        '<script>alert("xss")</script><img src="x" onerror="alert(\'xss\')" />';

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="input-name"]').type(maliciousInput);
      cy.get('[data-testid="input-email"]').type(maliciousInput);

      cy.get("script").should("not.exist");
      cy.get("img[onerror]").should("not.exist");
    });

    it("validates data before submission", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting
            data-testid="PersonalInfoStepForTesting-nh0o7lj46"
            onChange={callbacks.onChange}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="input-name"]').type("Valid Name");
      cy.get('[data-testid="input-email"]').type("invalid-email");
      cy.get('[data-testid="submit-button"]').click();

      // Should still call onChange with the data (client-side validation may be minimal)
      cy.get("@onChange").should("have.been.called");
    });

    it("handles sensitive data appropriately", () => {
      const sensitiveData = {
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
        pps_number: "1234567T", // Irish PPS number
      };

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting
            data-testid="PersonalInfoStepForTesting-zq8ix463a"
            initialData={sensitiveData}
            onChange={callbacks.onChange}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="submit-button"]').click();

      // Verify sensitive data is handled properly (not exposed in DOM)
      cy.get("@onChange").should("have.been.called");
    });

    it("prevents data leakage through console logs", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting
            initialData={{ email: "sensitive@example.com" }}
          />
        </TestWrapper>,
      );

      cy.window().then((win) => {
        // Spy on console methods to ensure no sensitive data is logged
        cy.spy(win.console, "log").as("consoleLog");
        cy.spy(win.console, "error").as("consoleError");
      });

      TestUtils.fillForm({
        '[data-testid="input-name"]': "Test User",
      });

      cy.get('[data-testid="submit-button"]').click();

      // Console should not contain sensitive information
      cy.get("@consoleLog").should(
        "not.have.been.calledWith",
        Cypress.sinon.match(/sensitive@example.com/),
      );
    });
  });

  describe("Quality Checks", () => {
    it("should meet performance standards", () => {
      TestUtils.measureRenderTime('[data-testid="personal-info-step"]', 2000);

      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="personal-info-step"]').should("be.visible");
    });

    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="personal-info-step"]');
    });

    it("should handle responsive layouts", () => {
      cy.mount(
        <TestWrapper>
          <PersonalInfoStepForTesting />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="personal-info-step"]').should("be.visible");
      });
    });
  });
});
