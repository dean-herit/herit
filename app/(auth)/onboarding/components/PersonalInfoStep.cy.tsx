import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "cypress-real-events/support";

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
        <p data-testid="oauth-indicator" className="text-sm text-blue-600 mb-4">
          Pre-filled from your Google account
        </p>
      )}

      <form onSubmit={handleSubmit} data-testid="personal-info-form">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Full Name
            </label>
            <input
              id="name"
              data-testid="input-name"
              type="text"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              data-testid="input-email"
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Phone
            </label>
            <input
              id="phone"
              data-testid="input-phone"
              type="text"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label
              htmlFor="address_line_1"
              className="block text-sm font-medium"
            >
              Address
            </label>
            <input
              id="address_line_1"
              data-testid="input-address"
              type="text"
              value={formData.address_line_1 || ""}
              onChange={(e) =>
                setFormData({ ...formData, address_line_1: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium">
              City
            </label>
            <input
              id="city"
              data-testid="input-city"
              type="text"
              value={formData.city || ""}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
              type="button"
              data-testid="cancel-button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          )}

          <button
            type="submit"
            data-testid="submit-button"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
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
            initialData={convertToSharedFormat(initialData)}
            onSubmit={handleSharedFormSubmit}
            onCancel={onBack}
            loading={isLoading}
            submitLabel="Continue"
            showCancelButton={!!onBack}
            showPhotoUpload={true}
            mode="onboarding"
            isFromOAuth={isFromOAuth}
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
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  data-testid="error-icon"
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

describe("PersonalInfoStep Component", () => {
  beforeEach(() => {
    // Mock API calls
    cy.intercept("POST", "/api/onboarding/personal-info", {
      statusCode: 200,
      body: { success: true },
    }).as("savePersonalInfo");
    cy.intercept("POST", "/api/audit/log-event", { statusCode: 200 }).as(
      "logEvent",
    );
  });

  it("renders loading state initially", () => {
    cy.mount(
      <TestWrapper>
        <PersonalInfoStepForTesting dataLoading={true} />
      </TestWrapper>,
    );

    // Should show loading state
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

    // Should not show form during loading
    cy.get('[data-testid="shared-form-provider"]').should("not.exist");
  });

  it("renders form after loading with empty initial data", () => {
    const onChange = cy.stub();
    const onComplete = cy.stub();

    cy.mount(
      <TestWrapper>
        <PersonalInfoStepForTesting
          initialData={{}}
          onChange={onChange}
          onComplete={onComplete}
        />
      </TestWrapper>,
    );

    // Should show the form
    cy.get('[data-testid="personal-info-step"]').should("be.visible");
    cy.get('[data-testid="shared-form-provider"]').should("be.visible");
    cy.get('[data-testid="form-title"]').should(
      "contain",
      "Personal Information",
    );

    // Should show form fields
    cy.get('[data-testid="input-name"]').should("be.visible");
    cy.get('[data-testid="input-email"]').should("be.visible");
    cy.get('[data-testid="input-phone"]').should("be.visible");
    cy.get('[data-testid="input-address"]').should("be.visible");
    cy.get('[data-testid="input-city"]').should("be.visible");

    // Should show photo upload section
    cy.get('[data-testid="photo-upload-section"]').should("be.visible");

    // Should show submit button
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

    // Should show OAuth indicator
    cy.get('[data-testid="oauth-indicator"]').should(
      "contain",
      "Pre-filled from your Google account",
    );

    // Should pre-fill form fields
    cy.get('[data-testid="input-name"]').should("have.value", "John Doe");
    cy.get('[data-testid="input-email"]').should(
      "have.value",
      "john.doe@gmail.com",
    );
  });

  it("shows enhanced loading message for Google OAuth", () => {
    const initialData = {
      first_name: "John",
      last_name: "Doe",
      auth_provider: "google",
    };

    cy.mount(
      <TestWrapper>
        <PersonalInfoStepForTesting
          initialData={initialData}
          dataLoading={true}
        />
      </TestWrapper>,
    );

    // Should show Google-specific loading message
    cy.get('[data-testid="loading-message-primary"]').should(
      "contain",
      "Loading your Google profile information...",
    );
    cy.get('[data-testid="loading-message-secondary"]').should(
      "contain",
      "Pre-filling with your Google account details",
    );
  });

  it("handles form submission successfully", () => {
    const onChange = cy.stub();
    const onComplete = cy.stub();

    cy.mount(
      <TestWrapper>
        <PersonalInfoStepForTesting
          onChange={onChange}
          onComplete={onComplete}
        />
      </TestWrapper>,
    );

    // Fill out form
    cy.get('[data-testid="input-name"]').type("Jane Smith");
    cy.get('[data-testid="input-email"]').type("jane@example.com");
    cy.get('[data-testid="input-phone"]').type("+353 87 123 4567");
    cy.get('[data-testid="input-address"]').type("123 Main Street");
    cy.get('[data-testid="input-city"]').type("Dublin");

    // Submit form
    cy.get('[data-testid="submit-button"]').click();

    // Should call callbacks
    cy.wrap(onChange).should("have.been.called");
    cy.wrap(onComplete).should("have.been.called");
  });

  it("shows loading state during form submission", () => {
    cy.mount(
      <TestWrapper>
        <PersonalInfoStepForTesting />
      </TestWrapper>,
    );

    // Fill out form
    cy.get('[data-testid="input-name"]').type("Jane Smith");
    cy.get('[data-testid="input-email"]').type("jane@example.com");

    // Submit form
    cy.get('[data-testid="submit-button"]').click();

    // Should show loading state on button
    cy.get('[data-testid="submit-button"]').should("contain", "Saving...");
    cy.get('[data-testid="submit-button"]').should("be.disabled");
  });

  it("handles API errors gracefully", () => {
    const apiError = "Failed to validate email address";

    cy.mount(
      <TestWrapper>
        <PersonalInfoStepForTesting mockApiError={apiError} />
      </TestWrapper>,
    );

    // Fill out form
    cy.get('[data-testid="input-name"]').type("Jane Smith");
    cy.get('[data-testid="input-email"]').type("invalid-email");

    // Submit form
    cy.get('[data-testid="submit-button"]').click();

    // Should show error display
    cy.get('[data-testid="error-display"]').should("be.visible");
    cy.get('[data-testid="error-title"]').should(
      "contain",
      "Failed to save personal information",
    );
    cy.get('[data-testid="error-message"]').should("contain", apiError);
    cy.get('[data-testid="error-icon"]').should("be.visible");
  });

  it("shows back button when onBack prop is provided", () => {
    const onBack = cy.stub();

    cy.mount(
      <TestWrapper>
        <PersonalInfoStepForTesting onBack={onBack} />
      </TestWrapper>,
    );

    // Should show cancel/back button
    cy.get('[data-testid="cancel-button"]').should("be.visible");
    cy.get('[data-testid="cancel-button"]').should("contain", "Back");

    // Should call onBack when clicked
    cy.get('[data-testid="cancel-button"]').click();
    cy.wrap(onBack).should("have.been.called");
  });

  it("handles keyboard navigation properly", () => {
    cy.mount(
      <TestWrapper>
        <PersonalInfoStepForTesting />
      </TestWrapper>,
    );

    // Test that form fields can be focused and accessed via keyboard
    cy.get('[data-testid="input-name"]').focus();
    cy.get('[data-testid="input-name"]').should("be.focused");

    // Type to verify focused element is interactive
    cy.get('[data-testid="input-name"]').type("Test Name");
    cy.get('[data-testid="input-name"]').should("have.value", "Test Name");

    // Focus next field
    cy.get('[data-testid="input-email"]').focus();
    cy.get('[data-testid="input-email"]').should("be.focused");
    cy.get('[data-testid="input-email"]').type("test@example.com");

    // Focus phone field
    cy.get('[data-testid="input-phone"]').focus();
    cy.get('[data-testid="input-phone"]').should("be.focused");

    // Test submit button focus
    cy.get('[data-testid="submit-button"]').focus();
    cy.get('[data-testid="submit-button"]').should("be.focused");

    // Test that Enter can activate submit button
    cy.get('[data-testid="submit-button"]').realPress("Enter");
    // Form should attempt submission
  });

  it("maintains responsive layout across viewports", () => {
    cy.mount(
      <TestWrapper>
        <PersonalInfoStepForTesting />
      </TestWrapper>,
    );

    // Test different viewport sizes
    const viewports = [
      { width: 320, height: 568 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1200, height: 800 }, // Desktop
    ];

    viewports.forEach(({ width, height }) => {
      cy.viewport(width, height);

      // Form should remain functional
      cy.get('[data-testid="personal-info-step"]').should("be.visible");
      cy.get('[data-testid="shared-form-provider"]').should("be.visible");
      cy.get('[data-testid="input-name"]').should("be.visible");
      cy.get('[data-testid="input-email"]').should("be.visible");
      cy.get('[data-testid="submit-button"]').should("be.visible");

      // Photo upload should remain accessible
      cy.get('[data-testid="photo-upload-section"]').should("be.visible");
    });
  });

  it("has proper accessibility attributes", () => {
    cy.mount(
      <TestWrapper>
        <PersonalInfoStepForTesting />
      </TestWrapper>,
    );

    // Form should have proper labels
    cy.get('label[for="name"]').should("exist");
    cy.get('label[for="email"]').should("exist");
    cy.get('label[for="phone"]').should("exist");
    cy.get('label[for="address_line_1"]').should("exist");
    cy.get('label[for="city"]').should("exist");

    // Inputs should be properly associated with labels
    cy.get("#name").should("have.attr", "data-testid", "input-name");
    cy.get("#email").should("have.attr", "data-testid", "input-email");
    cy.get("#phone").should("have.attr", "data-testid", "input-phone");

    // Form should have proper structure
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

  it("converts data formats correctly between onboarding and shared formats", () => {
    const onChange = cy.stub();
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
          initialData={initialData}
          onChange={onChange}
        />
      </TestWrapper>,
    );

    // Should display converted data correctly
    cy.get('[data-testid="input-name"]').should("have.value", "John Doe");
    cy.get('[data-testid="input-email"]').should(
      "have.value",
      "john@example.com",
    );
    cy.get('[data-testid="input-phone"]').should("have.value", "+353871234567");
    cy.get('[data-testid="input-address"]').should("have.value", "123 Main St");
    cy.get('[data-testid="input-city"]').should("have.value", "Dublin");

    // Submit to test conversion back
    cy.get('[data-testid="submit-button"]').click();

    // Should call onChange with properly converted data
    cy.wrap(onChange).should("have.been.calledWith", {
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
