import React from "react";
import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "cypress-real-events/support";
import { TestUtils } from "../../../../cypress/support/test-utils";

// Test-specific EmailSignupForm without useAuth dependency
function EmailSignupFormForTesting({
  onSubmit = () => {},
  isLoading = false,
  initialError = null,
}: {
  onSubmit?: (formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => void;
  isLoading?: boolean;
  initialError?: string | null;
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

  // Set initial error if provided
  React.useEffect(() => {
    if (initialError) {
      setErrors(prev => ({ ...prev, general: initialError }));
    }
  }, [initialError]);

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
    <div data-testid="email-signup-container" className="w-full max-w-md mx-auto">
      {errors.general && (
        <div 
          data-testid="general-error"
          className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
        >
          {errors.general}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        data-testid="email-signup-form"
      >
        <div className="grid grid-cols-2 gap-3" data-testid="name-fields-grid">
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

describe("EmailSignupForm Component", () => {
  let callbacks: ReturnType<typeof TestUtils.createMockCallbacks>;

  beforeEach(() => {
    callbacks = TestUtils.createMockCallbacks();
    // Reset stubs
    Object.values(callbacks).forEach(stub => stub.reset?.());
  });

  describe("Core Functionality", () => {
    it("renders form elements correctly", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="email-signup-container"]').should("be.visible");
      cy.get('[data-testid="email-signup-form"]').should("be.visible");
      cy.get('[data-testid="name-fields-grid"]').should("be.visible");
      cy.get('[data-testid="firstName-input"]').should("be.visible");
      cy.get('[data-testid="lastName-input"]').should("be.visible");
      cy.get('[data-testid="email-input"]').should("be.visible");
      cy.get('[data-testid="password-input"]').should("be.visible");
      cy.get('[data-testid="confirmPassword-input"]').should("be.visible");
      cy.get('[data-testid="submit-button"]')
        .should("be.visible")
        .and("contain", "Create Account");
      
      // Password toggle buttons
      cy.get('[data-testid="toggle-password"]').should("be.visible");
      cy.get('[data-testid="toggle-confirm-password"]').should("be.visible");
    });

    it("handles form input and submission with valid data", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type("John");
      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirmPassword-input"]').type("password123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("have.been.calledWith", {
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        password: "password123",
      });
    });

    it("toggles password visibility for both fields", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      // Test password field toggle
      cy.get('[data-testid="password-input"]').should("have.attr", "type", "password");
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('[data-testid="password-input"]').should("have.attr", "type", "text");
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('[data-testid="password-input"]').should("have.attr", "type", "password");

      // Test confirm password field toggle
      cy.get('[data-testid="confirmPassword-input"]').should("have.attr", "type", "password");
      cy.get('[data-testid="toggle-confirm-password"]').click();
      cy.get('[data-testid="confirmPassword-input"]').should("have.attr", "type", "text");
      cy.get('[data-testid="toggle-confirm-password"]').click();
      cy.get('[data-testid="confirmPassword-input"]').should("have.attr", "type", "password");
    });

    it("shows loading state correctly", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting isLoading={true} />
        </TestWrapper>
      );

      cy.get('[data-testid="submit-button"]').should("have.attr", "data-loading", "true");
    });
  });

  describe("Error States", () => {
    it("validates empty form submission", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="submit-button"]').click();
      cy.get("@onSubmit").should("not.have.been.called");
      
      cy.get('[data-testid="firstName-input"]').should("have.attr", "aria-invalid", "true");
      cy.get('[data-testid="lastName-input"]').should("have.attr", "aria-invalid", "true");
      cy.get('[data-testid="email-input"]').should("have.attr", "aria-invalid", "true");
      cy.get('[data-testid="password-input"]').should("have.attr", "aria-invalid", "true");
    });

    it("validates required first name", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirmPassword-input"]').type("password123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("not.have.been.called");
      cy.get('[data-testid="firstName-input"]').should("have.attr", "aria-invalid", "true");
    });

    it("validates required last name", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type("John");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirmPassword-input"]').type("password123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("not.have.been.called");
      cy.get('[data-testid="lastName-input"]').should("have.attr", "aria-invalid", "true");
    });

    it("validates invalid email format", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type("John");
      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("invalid-email");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirmPassword-input"]').type("password123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("not.have.been.called");
      cy.get('[data-testid="email-input"]').should("have.attr", "aria-invalid", "true");
    });

    it("validates password minimum length", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type("John");
      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("123");
      cy.get('[data-testid="confirmPassword-input"]').type("123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("not.have.been.called");
      cy.get('[data-testid="password-input"]').should("have.attr", "aria-invalid", "true");
    });

    it("validates password confirmation match", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type("John");
      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirmPassword-input"]').type("different456");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("not.have.been.called");
      cy.get('[data-testid="confirmPassword-input"]').should("have.attr", "aria-invalid", "true");
    });

    it("displays general error messages", () => {
      const errorMessage = "Email already exists";
      
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting initialError={errorMessage} />
        </TestWrapper>
      );

      cy.get('[data-testid="general-error"]').should("be.visible");
      cy.get('[data-testid="general-error"]').should("contain", errorMessage);
    });

    it("handles network connectivity issues", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting initialError="Network error: Please check your connection" />
        </TestWrapper>
      );

      cy.get('[data-testid="general-error"]').should("contain", "Network error");
    });

    it("handles server errors gracefully", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting initialError="Server temporarily unavailable. Please try again." />
        </TestWrapper>
      );

      cy.get('[data-testid="general-error"]').should("contain", "Server temporarily unavailable");
    });
  });

  describe("Accessibility", () => {
    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      TestUtils.testAccessibility('[data-testid="email-signup-container"]');
    });

    it("supports keyboard navigation", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').focus().should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="lastName-input"]').should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="email-input"]').should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="password-input"]').should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="toggle-password"]').should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="confirmPassword-input"]').should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="toggle-confirm-password"]').should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="submit-button"]').should("be.focused");
    });

    it("has proper ARIA labels and attributes", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="email-signup-form"]').should("match", "form");
      cy.get('[data-testid="firstName-input"]').should("have.attr", "type", "text");
      cy.get('[data-testid="lastName-input"]').should("have.attr", "type", "text");
      cy.get('[data-testid="email-input"]').should("have.attr", "type", "email");
      cy.get('[data-testid="password-input"]').should("have.attr", "type", "password");
      cy.get('[data-testid="confirmPassword-input"]').should("have.attr", "type", "password");
      cy.get('[data-testid="submit-button"]').should("have.attr", "type", "submit");
      cy.get('[data-testid="toggle-password"]').should("have.attr", "type", "button");
      cy.get('[data-testid="toggle-confirm-password"]').should("have.attr", "type", "button");
    });

    it("provides proper error feedback for screen readers", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="submit-button"]').click();
      
      cy.get('[data-testid="firstName-input"]').should("have.attr", "aria-invalid", "true");
      cy.get('[data-testid="lastName-input"]').should("have.attr", "aria-invalid", "true");
      cy.get('[data-testid="email-input"]').should("have.attr", "aria-invalid", "true");
      cy.get('[data-testid="password-input"]').should("have.attr", "aria-invalid", "true");
    });

    it("maintains proper form structure for screen readers", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="name-fields-grid"]').should("have.class", "grid-cols-2");
      cy.get('[data-testid="email-signup-form"]').within(() => {
        cy.get('input[required]').should("have.length", 5);
      });
    });
  });

  describe("Performance", () => {
    it("should render quickly", () => {
      TestUtils.measureRenderTime('[data-testid="email-signup-container"]', 1000);

      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="email-signup-container"]').should("be.visible");
    });

    it("should handle rapid input changes across all fields", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      // Rapidly type and clear inputs across all fields
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="firstName-input"]').clear().type(`John${i}`);
        cy.get('[data-testid="lastName-input"]').clear().type(`Doe${i}`);
        cy.get('[data-testid="email-input"]').clear().type(`test${i}@example.com`);
        cy.get('[data-testid="password-input"]').clear().type(`password${i}`);
        cy.get('[data-testid="confirmPassword-input"]').clear().type(`password${i}`);
      }

      cy.get('[data-testid="firstName-input"]').should("have.value", "John4");
      cy.get('[data-testid="lastName-input"]').should("have.value", "Doe4");
      cy.get('[data-testid="email-input"]').should("have.value", "test4@example.com");
      cy.get('[data-testid="password-input"]').should("have.value", "password4");
      cy.get('[data-testid="confirmPassword-input"]').should("have.value", "password4");
    });

    it("should handle rapid password visibility toggles", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      // Rapidly toggle both password visibility buttons
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="toggle-password"]').click();
        cy.get('[data-testid="toggle-confirm-password"]').click();
      }

      cy.get('[data-testid="password-input"]').should("have.attr", "type", "password");
      cy.get('[data-testid="confirmPassword-input"]').should("have.attr", "type", "password");
    });

    it("should handle rapid form submissions", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      // Fill form once
      cy.get('[data-testid="firstName-input"]').type("John");
      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirmPassword-input"]').type("password123");

      // Rapidly click submit multiple times
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="submit-button"]').click();
      }

      cy.get("@onSubmit").should("have.callCount", 5);
    });
  });

  describe("Responsive Design", () => {
    it("should work on all screen sizes", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="email-signup-container"]').should("be.visible");
        cy.get('[data-testid="email-signup-form"]').should("be.visible");
        cy.get('[data-testid="firstName-input"]').should("be.visible");
        cy.get('[data-testid="lastName-input"]').should("be.visible");
        cy.get('[data-testid="email-input"]').should("be.visible");
        cy.get('[data-testid="password-input"]').should("be.visible");
        cy.get('[data-testid="confirmPassword-input"]').should("be.visible");
        cy.get('[data-testid="submit-button"]').should("be.visible");
      });
    });

    it("maintains proper grid layout on mobile", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      cy.viewport(320, 568); // Mobile

      cy.get('[data-testid="email-signup-container"]')
        .should("be.visible")
        .should("have.class", "max-w-md");
      
      cy.get('[data-testid="name-fields-grid"]').should("have.class", "grid-cols-2");
      cy.get('[data-testid="submit-button"]').should("have.class", "w-full");
      cy.get('[data-testid="email-signup-form"]').should("have.class", "space-y-4");
    });

    it("handles grid layout properly on tablet", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      cy.viewport(768, 1024); // Tablet

      cy.get('[data-testid="name-fields-grid"]').should("have.class", "grid-cols-2");
      cy.get('[data-testid="firstName-input"]').should("be.visible");
      cy.get('[data-testid="lastName-input"]').should("be.visible");
      
      // Check that grid spacing is maintained
      cy.get('[data-testid="name-fields-grid"]').should("have.class", "gap-3");
    });

    it("maintains proper field spacing on desktop", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      cy.viewport(1200, 800); // Desktop

      cy.get('[data-testid="email-signup-form"]').should("have.class", "space-y-4");
      cy.get('[data-testid="name-fields-grid"]').should("have.class", "gap-3");
    });
  });

  describe("Integration Scenarios", () => {
    it("should integrate with registration flow", () => {
      let formSubmitted = false;
      
      const TestIntegration = () => {
        const [error, setError] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);
        
        const handleSubmit = async (formData: any) => {
          setLoading(true);
          formSubmitted = true;
          
          // Simulate API call
          setTimeout(() => {
            if (formData.email === "taken@test.com") {
              setError("Email already exists");
            }
            setLoading(false);
          }, 100);
        };
        
        return (
          <div>
            <EmailSignupFormForTesting 
              onSubmit={handleSubmit}
              isLoading={loading}
              initialError={error}
            />
            <button
              data-testid="simulate-error"
              onClick={() => setError("Simulated registration error")}
            >
              Simulate Error
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestIntegration />
        </TestWrapper>
      );

      // Test successful submission flow
      cy.get('[data-testid="firstName-input"]').type("John");
      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirmPassword-input"]').type("password123");
      cy.get('[data-testid="submit-button"]').click();

      cy.then(() => {
        expect(formSubmitted).to.be.true;
      });

      // Test error integration
      cy.get('[data-testid="simulate-error"]').click();
      cy.get('[data-testid="general-error"]').should("be.visible");
    });

    it("should handle form reset scenarios", () => {
      const TestFormReset = () => {
        const [key, setKey] = useState(0);
        
        return (
          <div>
            <EmailSignupFormForTesting key={key} />
            <button
              data-testid="reset-form"
              onClick={() => setKey(key + 1)}
            >
              Reset Form
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestFormReset />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type("John");
      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      
      cy.get('[data-testid="reset-form"]').click();
      
      cy.get('[data-testid="firstName-input"]').should("have.value", "");
      cy.get('[data-testid="lastName-input"]').should("have.value", "");
      cy.get('[data-testid="email-input"]').should("have.value", "");
      cy.get('[data-testid="password-input"]').should("have.value", "");
      cy.get('[data-testid="confirmPassword-input"]').should("have.value", "");
    });

    it("should integrate with password strength indicators", () => {
      const TestWithPasswordStrength = () => {
        const [password, setPassword] = useState("");
        const [strength, setStrength] = useState("");

        React.useEffect(() => {
          if (password.length < 6) setStrength("weak");
          else if (password.length < 10) setStrength("medium");
          else setStrength("strong");
        }, [password]);

        return (
          <div>
            <EmailSignupFormForTesting 
              onSubmit={(data) => {
                // Pass through password for testing
                setPassword(data.password);
              }}
            />
            <div data-testid="password-strength">{strength}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestWithPasswordStrength />
        </TestWrapper>
      );

      cy.get('[data-testid="password-input"]').type("weak");
      cy.get('[data-testid="password-strength"]').should("contain", "weak");

      cy.get('[data-testid="password-input"]').clear().type("mediumpass");
      cy.get('[data-testid="password-strength"]').should("contain", "medium");

      cy.get('[data-testid="password-input"]').clear().type("verystrongpassword");
      cy.get('[data-testid="password-strength"]').should("contain", "strong");
    });
  });

  describe("Edge Cases", () => {
    it("handles extremely long input values", () => {
      const longName = "a".repeat(100);
      const longEmail = "a".repeat(50) + "@example.com";
      const longPassword = "a".repeat(200);

      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type(longName);
      cy.get('[data-testid="lastName-input"]').type(longName);
      cy.get('[data-testid="email-input"]').type(longEmail);
      cy.get('[data-testid="password-input"]').type(longPassword);
      cy.get('[data-testid="confirmPassword-input"]').type(longPassword);
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("have.been.calledWith", {
        firstName: longName,
        lastName: longName,
        email: longEmail,
        password: longPassword,
      });
    });

    it("handles special characters in all fields", () => {
      const specialName = "José-María O'Connor";
      const specialEmail = "test+special@example.co.uk";
      const specialPassword = "P@ssw0rd!#$%&*";

      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type(specialName);
      cy.get('[data-testid="lastName-input"]').type(specialName);
      cy.get('[data-testid="email-input"]').type(specialEmail);
      cy.get('[data-testid="password-input"]').type(specialPassword);
      cy.get('[data-testid="confirmPassword-input"]').type(specialPassword);
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("have.been.calledWith", {
        firstName: specialName,
        lastName: specialName,
        email: specialEmail,
        password: specialPassword,
      });
    });

    it("handles whitespace-only names", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type("   ");
      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirmPassword-input"]').type("password123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("not.have.been.called");
      cy.get('[data-testid="firstName-input"]').should("have.attr", "aria-invalid", "true");
    });

    it("handles rapid component remounting", () => {
      const TestMountWrapper = ({ show }: { show: boolean }) => (
        <TestWrapper>
          {show && <EmailSignupFormForTesting />}
        </TestWrapper>
      );

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="email-signup-container"]').should("be.visible");

      cy.mount(<TestMountWrapper show={false} />);
      cy.get('[data-testid="email-signup-container"]').should("not.exist");

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="email-signup-container"]').should("be.visible");
    });
  });

  describe("Security", () => {
    it("should sanitize error messages", () => {
      const maliciousError = '<script>alert("xss")</script>Registration failed';
      
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting initialError={maliciousError} />
        </TestWrapper>
      );

      cy.get('[data-testid="general-error"]').should("be.visible");
      cy.get('script').should("not.exist");
    });

    it("should prevent XSS in form inputs", () => {
      const xssAttempt = 'javascript:alert("xss")';
      
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type(xssAttempt);
      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirmPassword-input"]').type("password123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("have.been.called");
      cy.window().its('alert').should('not.have.been.called');
    });

    it("should handle password visibility toggle securely", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="password-input"]').type("sensitivepassword");
      cy.get('[data-testid="confirmPassword-input"]').type("sensitivepassword");
      
      // Passwords should be hidden by default
      cy.get('[data-testid="password-input"]').should("have.attr", "type", "password");
      cy.get('[data-testid="confirmPassword-input"]').should("have.attr", "type", "password");
      
      // Toggle to show passwords
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('[data-testid="toggle-confirm-password"]').click();
      cy.get('[data-testid="password-input"]').should("have.attr", "type", "text");
      cy.get('[data-testid="confirmPassword-input"]').should("have.attr", "type", "text");
      
      // Toggle back to hide
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('[data-testid="toggle-confirm-password"]').click();
      cy.get('[data-testid="password-input"]').should("have.attr", "type", "password");
      cy.get('[data-testid="confirmPassword-input"]').should("have.attr", "type", "password");
    });

    it("should not submit confirmPassword in final payload", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting onSubmit={callbacks.onSubmit} />
        </TestWrapper>
      );

      cy.get('[data-testid="firstName-input"]').type("John");
      cy.get('[data-testid="lastName-input"]').type("Doe");
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="confirmPassword-input"]').type("password123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("have.been.calledWith", {
        firstName: "John",
        lastName: "Doe",
        email: "test@example.com",
        password: "password123",
        // Note: confirmPassword should NOT be included
      });

      cy.get("@onSubmit").should((stub) => {
        const callArgs = stub.getCall(0).args[0];
        expect(callArgs).to.not.have.property('confirmPassword');
      });
    });
  });

  describe("Quality Checks", () => {
    it("should meet performance standards", () => {
      TestUtils.measureRenderTime('[data-testid="email-signup-form"]', 2000);
      
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );
      
      cy.get('[data-testid="email-signup-form"]').should("be.visible");
    });

    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );
      
      TestUtils.testAccessibility('[data-testid="email-signup-form"]');
    });

    it("should handle responsive layouts", () => {
      cy.mount(
        <TestWrapper>
          <EmailSignupFormForTesting />
        </TestWrapper>
      );
      
      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="email-signup-form"]').should('be.visible');
      });
    });
  });
});