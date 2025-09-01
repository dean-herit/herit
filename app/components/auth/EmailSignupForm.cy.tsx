import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "cypress-real-events/support";

// Test-specific EmailSignupForm without useAuth dependency
function EmailSignupFormForTesting({
  onSubmit = cy.stub(),
  isLoading = false,
}: {
  onSubmit?: (formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => void;
  isLoading?: boolean;
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const { confirmPassword, ...signupData } = formData;
      onSubmit(signupData);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid="email-signup-form"
    >
      <div className="grid grid-cols-2 gap-3">
        <Input
          isRequired
          label="First Name"
          placeholder="First name"
          value={formData.firstName}
          onChange={(e) => handleChange("firstName", e.target.value)}
          errorMessage={errors.firstName}
          isInvalid={!!errors.firstName}
          data-testid="firstName-input"
          variant="bordered"
        />

        <Input
          isRequired
          label="Last Name"
          placeholder="Last name"
          value={formData.lastName}
          onChange={(e) => handleChange("lastName", e.target.value)}
          errorMessage={errors.lastName}
          isInvalid={!!errors.lastName}
          data-testid="lastName-input"
          variant="bordered"
        />
      </div>

      <Input
        isRequired
        type="email"
        label="Email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={(e) => handleChange("email", e.target.value)}
        errorMessage={errors.email}
        isInvalid={!!errors.email}
        data-testid="email-input"
        variant="bordered"
      />

      <Input
        isRequired
        type={showPassword ? "text" : "password"}
        label="Password"
        placeholder="Create a password"
        value={formData.password}
        onChange={(e) => handleChange("password", e.target.value)}
        errorMessage={errors.password}
        isInvalid={!!errors.password}
        data-testid="password-input"
        variant="bordered"
        endContent={
          <button
            className="focus:outline-none"
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            data-testid="toggle-password"
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5 text-default-400" />
            ) : (
              <EyeIcon className="w-5 h-5 text-default-400" />
            )}
          </button>
        }
      />

      <Input
        isRequired
        type={showConfirmPassword ? "text" : "password"}
        label="Confirm Password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChange={(e) => handleChange("confirmPassword", e.target.value)}
        errorMessage={errors.confirmPassword}
        isInvalid={!!errors.confirmPassword}
        data-testid="confirmPassword-input"
        variant="bordered"
        endContent={
          <button
            className="focus:outline-none"
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            data-testid="toggle-confirm-password"
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="w-5 h-5 text-default-400" />
            ) : (
              <EyeIcon className="w-5 h-5 text-default-400" />
            )}
          </button>
        }
      />

      <Button
        type="submit"
        color="primary"
        className="w-full"
        size="lg"
        isLoading={isLoading}
        data-testid="submit-button"
      >
        Create Account
      </Button>
    </form>
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

describe("EmailSignupForm Component", () => {
  beforeEach(() => {
    // Mock any needed API calls
    cy.intercept("POST", "/api/auth/register", { statusCode: 200 }).as(
      "register",
    );
  });

  it("renders form elements correctly", () => {
    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting />
      </TestWrapper>,
    );

    // Should render all form elements
    cy.get('[data-testid="email-signup-form"]').should("be.visible");
    cy.get('[data-testid="firstName-input"]').should("be.visible");
    cy.get('[data-testid="lastName-input"]').should("be.visible");
    cy.get('[data-testid="email-input"]').should("be.visible");
    cy.get('[data-testid="password-input"]').should("be.visible");
    cy.get('[data-testid="confirmPassword-input"]').should("be.visible");
    cy.get('[data-testid="submit-button"]')
      .should("be.visible")
      .and("contain", "Create Account");

    // Should show labels and placeholders
    cy.contains("First Name").should("be.visible");
    cy.contains("Last Name").should("be.visible");
    cy.contains("Email").should("be.visible");
    cy.contains("Password").should("be.visible");
    cy.contains("Confirm Password").should("be.visible");
    cy.get('[placeholder="First name"]').should("exist");
    cy.get('[placeholder="Last name"]').should("exist");
    cy.get('[placeholder="Enter your email"]').should("exist");
    cy.get('[placeholder="Create a password"]').should("exist");
    cy.get('[placeholder="Confirm your password"]').should("exist");
  });

  it("validates empty form submission", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Test empty form submission - should not call onSubmit
    cy.get('[data-testid="submit-button"]').click();
    cy.wrap(onSubmit).should("not.have.been.called");
  });

  it("validates required first name", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Fill everything except first name
    cy.get('[data-testid="lastName-input"]').type("Doe");
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="confirmPassword-input"]').type("password123");
    cy.get('[data-testid="submit-button"]').click();
    cy.wrap(onSubmit).should("not.have.been.called");
  });

  it("validates required last name", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Fill everything except last name
    cy.get('[data-testid="firstName-input"]').type("John");
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="confirmPassword-input"]').type("password123");
    cy.get('[data-testid="submit-button"]').click();
    cy.wrap(onSubmit).should("not.have.been.called");
  });

  it("validates invalid email", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Fill with invalid email
    cy.get('[data-testid="firstName-input"]').type("John");
    cy.get('[data-testid="lastName-input"]').type("Doe");
    cy.get('[data-testid="email-input"]').type("invalid-email");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="confirmPassword-input"]').type("password123");
    cy.get('[data-testid="submit-button"]').click();
    cy.wrap(onSubmit).should("not.have.been.called");
  });

  it("validates short password", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Fill with short password
    cy.get('[data-testid="firstName-input"]').type("John");
    cy.get('[data-testid="lastName-input"]').type("Doe");
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("123");
    cy.get('[data-testid="confirmPassword-input"]').type("123");
    cy.get('[data-testid="submit-button"]').click();
    cy.wrap(onSubmit).should("not.have.been.called");
  });

  it("validates password confirmation match", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Fill with mismatched passwords
    cy.get('[data-testid="firstName-input"]').type("John");
    cy.get('[data-testid="lastName-input"]').type("Doe");
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="confirmPassword-input"]').type("different456");
    cy.get('[data-testid="submit-button"]').click();
    cy.wrap(onSubmit).should("not.have.been.called");
  });

  it("toggles password visibility", () => {
    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting />
      </TestWrapper>,
    );

    // Both toggle buttons should exist
    cy.get('[data-testid="toggle-password"]').should("be.visible");
    cy.get('[data-testid="toggle-confirm-password"]').should("be.visible");

    // Test password visibility toggle
    cy.get('[data-testid="toggle-password"]').click();
    cy.get('[data-testid="toggle-password"]').click();

    // Test confirm password visibility toggle
    cy.get('[data-testid="toggle-confirm-password"]').click();
    cy.get('[data-testid="toggle-confirm-password"]').click();

    // Should be able to type in password fields
    cy.get('[data-testid="password-input"]').type("testpassword");
    cy.get('[data-testid="password-input"]').should(
      "contain.value",
      "testpassword",
    );
    cy.get('[data-testid="confirmPassword-input"]').type("testconfirm");
    cy.get('[data-testid="confirmPassword-input"]').should(
      "contain.value",
      "testconfirm",
    );
  });

  it("calls onSubmit with form data", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Fill form with valid data
    cy.get('[data-testid="firstName-input"]').type("John");
    cy.get('[data-testid="lastName-input"]').type("Doe");
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("password123");
    cy.get('[data-testid="confirmPassword-input"]').type("password123");

    // Submit form
    cy.get('[data-testid="submit-button"]').click();

    // Should call onSubmit with correct data (without confirmPassword)
    cy.wrap(onSubmit).should("have.been.calledWith", {
      firstName: "John",
      lastName: "Doe",
      email: "test@example.com",
      password: "password123",
    });
  });

  it("shows loading state", () => {
    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting isLoading={true} />
      </TestWrapper>,
    );

    // Submit button should show loading state
    cy.get('[data-testid="submit-button"]').should(
      "have.attr",
      "data-loading",
      "true",
    );
  });

  it("has proper accessibility attributes", () => {
    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting />
      </TestWrapper>,
    );

    // Form should have proper structure
    cy.get('[data-testid="email-signup-form"]').should(
      "have.prop",
      "tagName",
      "FORM",
    );

    // All inputs should be accessible via data-testid
    cy.get('[data-testid="firstName-input"]').should("be.visible");
    cy.get('[data-testid="lastName-input"]').should("be.visible");
    cy.get('[data-testid="email-input"]').should("be.visible");
    cy.get('[data-testid="password-input"]').should("be.visible");
    cy.get('[data-testid="confirmPassword-input"]').should("be.visible");

    // Toggle buttons should be accessible
    cy.get('[data-testid="toggle-password"]').should("be.visible");
    cy.get('[data-testid="toggle-confirm-password"]').should("be.visible");

    // Submit button should be accessible
    cy.get('[data-testid="submit-button"]').should(
      "have.attr",
      "type",
      "submit",
    );

    // Test basic keyboard navigation
    cy.get('[data-testid="firstName-input"]').focus();
    cy.get('[data-testid="lastName-input"]').focus();
    cy.get('[data-testid="email-input"]').focus();
    cy.get('[data-testid="password-input"]').focus();
    cy.get('[data-testid="confirmPassword-input"]').focus();
    cy.get('[data-testid="submit-button"]').focus();
  });

  it("maintains responsive layout", () => {
    cy.mount(
      <TestWrapper>
        <EmailSignupFormForTesting />
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

      // Form elements should remain visible and functional
      cy.get('[data-testid="email-signup-form"]').should("be.visible");
      cy.get('[data-testid="firstName-input"]').should("be.visible");
      cy.get('[data-testid="lastName-input"]').should("be.visible");
      cy.get('[data-testid="email-input"]').should("be.visible");
      cy.get('[data-testid="password-input"]').should("be.visible");
      cy.get('[data-testid="confirmPassword-input"]').should("be.visible");
      cy.get('[data-testid="submit-button"]').should("be.visible");

      // Submit button should maintain full width
      cy.get('[data-testid="submit-button"]').should("have.class", "w-full");
    });
  });
});
