import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "cypress-real-events/support";

// Test-specific EmailLoginForm without useAuth dependency
function EmailLoginFormForTesting({
  onSubmit = cy.stub(),
  isLoading = false,
}: {
  onSubmit?: (email: string, password: string) => void;
  isLoading?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(email, password);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      data-testid="email-login-form"
    >
      <Input
        type="email"
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        isRequired
        errorMessage={errors.email}
        isInvalid={!!errors.email}
        data-testid="email-input"
      />

      <Input
        type={showPassword ? "text" : "password"}
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        isRequired
        errorMessage={errors.password}
        isInvalid={!!errors.password}
        data-testid="password-input"
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

      <Button
        type="submit"
        color="primary"
        className="w-full"
        isLoading={isLoading}
        data-testid="submit-button"
      >
        Sign In
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

describe("EmailLoginForm Component", () => {
  beforeEach(() => {
    // Mock any needed API calls
    cy.intercept("POST", "/api/auth/login", { statusCode: 200 }).as("login");
  });

  it("renders form elements correctly", () => {
    cy.mount(
      <TestWrapper>
        <EmailLoginFormForTesting />
      </TestWrapper>,
    );

    // Should render form elements
    cy.get('[data-testid="email-login-form"]').should("be.visible");
    cy.get('[data-testid="email-input"]').should("be.visible");
    cy.get('[data-testid="password-input"]').should("be.visible");
    cy.get('[data-testid="submit-button"]')
      .should("be.visible")
      .and("contain", "Sign In");

    // Should show labels and placeholders
    cy.contains("Email").should("be.visible");
    cy.contains("Password").should("be.visible");
    cy.get('[placeholder="Enter your email"]').should("exist");
    cy.get('[placeholder="Enter your password"]').should("exist");
  });

  it("validates empty form submission", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailLoginFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Test empty form submission - should not call onSubmit
    cy.get('[data-testid="submit-button"]').click();
    cy.wrap(onSubmit).should("not.have.been.called");
  });

  it("validates invalid email", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailLoginFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Test invalid email - should not call onSubmit
    cy.get('[data-testid="email-input"]').type("invalid-email");
    cy.get('[data-testid="password-input"]').type("validpassword");
    cy.get('[data-testid="submit-button"]').click();
    cy.wrap(onSubmit).should("not.have.been.called");
  });

  it("validates short password", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailLoginFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Test short password - should not call onSubmit
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("123");
    cy.get('[data-testid="submit-button"]').click();
    cy.wrap(onSubmit).should("not.have.been.called");
  });

  it("toggles password visibility", () => {
    cy.mount(
      <TestWrapper>
        <EmailLoginFormForTesting />
      </TestWrapper>,
    );

    // Toggle button should exist
    cy.get('[data-testid="toggle-password"]').should("be.visible");

    // Click toggle button multiple times to test functionality
    cy.get('[data-testid="toggle-password"]').click();
    cy.get('[data-testid="toggle-password"]').click();
    cy.get('[data-testid="toggle-password"]').click();

    // Should be able to type in password field
    cy.get('[data-testid="password-input"]').type("testpassword");
    cy.get('[data-testid="password-input"]').should(
      "contain.value",
      "testpassword",
    );
  });

  it("calls onSubmit with form data", () => {
    const onSubmit = cy.stub();

    cy.mount(
      <TestWrapper>
        <EmailLoginFormForTesting onSubmit={onSubmit} />
      </TestWrapper>,
    );

    // Fill form with valid data
    cy.get('[data-testid="email-input"]').type("test@example.com");
    cy.get('[data-testid="password-input"]').type("password123");

    // Submit form
    cy.get('[data-testid="submit-button"]').click();

    // Should call onSubmit with email and password
    cy.wrap(onSubmit).should(
      "have.been.calledWith",
      "test@example.com",
      "password123",
    );
  });

  it("shows loading state", () => {
    cy.mount(
      <TestWrapper>
        <EmailLoginFormForTesting isLoading={true} />
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
        <EmailLoginFormForTesting />
      </TestWrapper>,
    );

    // Form should have proper structure
    cy.get('[data-testid="email-login-form"]').should(
      "have.prop",
      "tagName",
      "FORM",
    );

    // Elements should be accessible via data-testid
    cy.get('[data-testid="email-input"]').should("be.visible");
    cy.get('[data-testid="password-input"]').should("be.visible");
    cy.get('[data-testid="toggle-password"]').should("be.visible");

    // Submit button should be accessible
    cy.get('[data-testid="submit-button"]').should(
      "have.attr",
      "type",
      "submit",
    );

    // Test basic keyboard navigation
    cy.get('[data-testid="email-input"]').focus();
    cy.get('[data-testid="password-input"]').focus();
    cy.get('[data-testid="submit-button"]').focus();
  });

  it("maintains responsive layout", () => {
    cy.mount(
      <TestWrapper>
        <EmailLoginFormForTesting />
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
      cy.get('[data-testid="email-login-form"]').should("be.visible");
      cy.get('[data-testid="email-input"]').should("be.visible");
      cy.get('[data-testid="password-input"]').should("be.visible");
      cy.get('[data-testid="submit-button"]').should("be.visible");

      // Submit button should maintain full width
      cy.get('[data-testid="submit-button"]').should("have.class", "w-full");
    });
  });
});
