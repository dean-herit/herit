import React from "react";
import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "cypress-real-events/support";
import { TestUtils } from "../../../../cypress/support/test-utils";

// Test-specific EmailLoginForm without useAuth dependency
function EmailLoginFormForTesting({
  onSubmit = () => {},
  isLoading = false,
  initialError = null,
}: {
  onSubmit?: (email: string, password: string) => void;
  isLoading?: boolean;
  initialError?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  // Set initial error if provided
  React.useEffect(() => {
    if (initialError) {
      setErrors((prev) => ({ ...prev, general: initialError }));
    }
  }, [initialError]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; general?: string } =
      {};

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
    <div
      className="w-full max-w-md mx-auto"
      data-testid="email-login-container"
    >
      {errors.general && (
        <div
          className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
          data-testid="general-error"
        >
          {errors.general}
        </div>
      )}

      <form
        className="space-y-4"
        data-testid="email-login-form"
        onSubmit={handleSubmit}
      >
        <Input
          isRequired
          data-testid="email-input"
          errorMessage={errors.email}
          isInvalid={!!errors.email}
          label="Email"
          placeholder="Enter your email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          isRequired
          data-testid="password-input"
          endContent={
            <button
              className="focus:outline-none"
              data-testid="toggle-password"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5 text-default-400" />
              ) : (
                <EyeIcon className="w-5 h-5 text-default-400" />
              )}
            </button>
          }
          errorMessage={errors.password}
          isInvalid={!!errors.password}
          label="Password"
          placeholder="Enter your password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          className="w-full"
          color="primary"
          data-testid="submit-button"
          isLoading={isLoading}
          type="submit"
        >
          Sign In
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

describe("EmailLoginForm Component", () => {
  let callbacks: ReturnType<typeof TestUtils.createMockCallbacks>;

  beforeEach(() => {
    callbacks = TestUtils.createMockCallbacks();
    // Reset stubs
    Object.values(callbacks).forEach((stub) => stub.reset?.());
  });

  describe("Core Functionality", () => {
    it("renders form elements correctly", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-login-container"]').should("be.visible");
      cy.get('[data-testid="email-login-form"]').should("be.visible");
      cy.get('[data-testid="email-input"]').should("be.visible");
      cy.get('[data-testid="password-input"]').should("be.visible");
      cy.get('[data-testid="submit-button"]')
        .should("be.visible")
        .and("contain", "Sign In");
      cy.get('[data-testid="toggle-password"]').should("be.visible");
    });

    it("handles form input and submission with valid data", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting
            data-testid="EmailLoginFormForTesting-hxhxubbhu"
            onSubmit={callbacks.onSubmit}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should(
        "have.been.calledWith",
        "test@example.com",
        "password123",
      );
    });

    it("toggles password visibility", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "type",
        "password",
      );
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "type",
        "text",
      );
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "type",
        "password",
      );
    });

    it("shows loading state correctly", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting isLoading={true} />
        </TestWrapper>,
      );

      cy.get('[data-testid="submit-button"]').should(
        "have.attr",
        "data-loading",
        "true",
      );
    });
  });

  describe("Error States", () => {
    it("validates empty form submission", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting
            data-testid="EmailLoginFormForTesting-f57zitvvt"
            onSubmit={callbacks.onSubmit}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="submit-button"]').click();
      cy.get("@onSubmit").should("not.have.been.called");

      cy.get('[data-testid="email-input"]').should(
        "have.attr",
        "aria-invalid",
        "true",
      );
      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "aria-invalid",
        "true",
      );
    });

    it("validates invalid email format", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting
            data-testid="EmailLoginFormForTesting-q8r13svmu"
            onSubmit={callbacks.onSubmit}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-input"]').type("invalid-email");
      cy.get('[data-testid="password-input"]').type("validpassword");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("not.have.been.called");
      cy.get('[data-testid="email-input"]').should(
        "have.attr",
        "aria-invalid",
        "true",
      );
    });

    it("validates password minimum length", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting
            data-testid="EmailLoginFormForTesting-q7xfunl9b"
            onSubmit={callbacks.onSubmit}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should("not.have.been.called");
      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "aria-invalid",
        "true",
      );
    });

    it("displays general error messages", () => {
      const errorMessage = "Invalid credentials. Please try again.";

      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting initialError={errorMessage} />
        </TestWrapper>,
      );

      cy.get('[data-testid="general-error"]').should("be.visible");
      cy.get('[data-testid="general-error"]').should("contain", errorMessage);
    });

    it("handles network connectivity issues", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting initialError="Network error: Please check your connection" />
        </TestWrapper>,
      );

      cy.get('[data-testid="general-error"]').should(
        "contain",
        "Network error",
      );
    });

    it("handles server errors gracefully", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting initialError="Server temporarily unavailable. Please try again." />
        </TestWrapper>,
      );

      cy.get('[data-testid="general-error"]').should(
        "contain",
        "Server temporarily unavailable",
      );
    });
  });

  describe("Accessibility", () => {
    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="email-login-container"]');
    });

    it("supports keyboard navigation", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-input"]').focus().should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="password-input"]').should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="toggle-password"]').should("be.focused");
      cy.realPress("Tab");
      cy.get('[data-testid="submit-button"]').should("be.focused");
    });

    it("has proper ARIA labels and attributes", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-login-form"]').should("match", "form");
      cy.get('[data-testid="email-input"]').should(
        "have.attr",
        "type",
        "email",
      );
      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "type",
        "password",
      );
      cy.get('[data-testid="submit-button"]').should(
        "have.attr",
        "type",
        "submit",
      );
      cy.get('[data-testid="toggle-password"]').should(
        "have.attr",
        "type",
        "button",
      );
    });

    it("provides proper error feedback for screen readers", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="submit-button"]').click();

      cy.get('[data-testid="email-input"]').should(
        "have.attr",
        "aria-invalid",
        "true",
      );
      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "aria-invalid",
        "true",
      );
    });
  });

  describe("Performance", () => {
    it("should render quickly", () => {
      TestUtils.measureRenderTime(
        '[data-testid="email-login-container"]',
        1000,
      );

      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-login-container"]').should("be.visible");
    });

    it("should handle rapid input changes", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting
            data-testid="EmailLoginFormForTesting-nz5x1md17"
            onSubmit={callbacks.onSubmit}
          />
        </TestWrapper>,
      );

      // Rapidly type and clear input
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="email-input"]')
          .clear()
          .type(`test${i}@example.com`);
        cy.get('[data-testid="password-input"]').clear().type(`password${i}`);
      }

      cy.get('[data-testid="email-input"]').should(
        "have.value",
        "test4@example.com",
      );
      cy.get('[data-testid="password-input"]').should(
        "have.value",
        "password4",
      );
    });

    it("should handle rapid password visibility toggles", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      // Rapidly toggle password visibility
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="toggle-password"]').click();
      }

      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "type",
        "password",
      );
    });
  });

  describe("Responsive Design", () => {
    it("should work on all screen sizes", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="email-login-container"]').should("be.visible");
        cy.get('[data-testid="email-login-form"]').should("be.visible");
        cy.get('[data-testid="email-input"]').should("be.visible");
        cy.get('[data-testid="password-input"]').should("be.visible");
        cy.get('[data-testid="submit-button"]').should("be.visible");
      });
    });

    it("maintains proper spacing on mobile", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      cy.viewport(320, 568); // Mobile

      cy.get('[data-testid="email-login-container"]')
        .should("be.visible")
        .should("have.class", "max-w-md");

      cy.get('[data-testid="submit-button"]').should("have.class", "w-full");
      cy.get('[data-testid="email-login-form"]').should(
        "have.class",
        "space-y-4",
      );
    });

    it("handles form elements properly on tablet", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      cy.viewport(768, 1024); // Tablet

      cy.get('[data-testid="email-input"]').should("be.visible");
      cy.get('[data-testid="password-input"]').should("be.visible");
      cy.get('[data-testid="toggle-password"]').should("be.visible");
    });
  });

  describe("Integration Scenarios", () => {
    it("should integrate with authentication flow", () => {
      let formSubmitted = false;

      const TestIntegration = () => {
        const [error, setError] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);

        const handleSubmit = async (email: string, password: string) => {
          setLoading(true);
          formSubmitted = true;

          // Simulate API call
          setTimeout(() => {
            if (email === "error@test.com") {
              setError("Invalid credentials");
            }
            setLoading(false);
          }, 100);
        };

        return (
          <div>
            <EmailLoginFormForTesting
              data-testid="EmailLoginFormForTesting-51iku7prg"
              initialError={error}
              isLoading={loading}
              onSubmit={handleSubmit}
            />
            <button
              data-testid="simulate-error"
              onClick={() => setError("Simulated auth error")}
            >
              Simulate Error
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestIntegration />
        </TestWrapper>,
      );

      // Test successful submission flow
      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");
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
            <EmailLoginFormForTesting key={key} />
            <button data-testid="reset-form" onClick={() => setKey(key + 1)}>
              Reset Form
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestFormReset />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-input"]').type("test@example.com");
      cy.get('[data-testid="password-input"]').type("password123");

      cy.get('[data-testid="reset-form"]').click();

      cy.get('[data-testid="email-input"]').should("have.value", "");
      cy.get('[data-testid="password-input"]').should("have.value", "");
    });
  });

  describe("Edge Cases", () => {
    it("handles extremely long input values", () => {
      const longEmail = "a".repeat(100) + "@example.com";
      const longPassword = "a".repeat(200);

      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting
            data-testid="EmailLoginFormForTesting-wlihmwxks"
            onSubmit={callbacks.onSubmit}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-input"]').type(longEmail);
      cy.get('[data-testid="password-input"]').type(longPassword);
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should(
        "have.been.calledWith",
        longEmail,
        longPassword,
      );
    });

    it("handles special characters in input", () => {
      const specialEmail = "test+special@example.co.uk";
      const specialPassword = "P@ssw0rd!#$%";

      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting
            data-testid="EmailLoginFormForTesting-k6wbs0w6w"
            onSubmit={callbacks.onSubmit}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-input"]').type(specialEmail);
      cy.get('[data-testid="password-input"]').type(specialPassword);
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should(
        "have.been.calledWith",
        specialEmail,
        specialPassword,
      );
    });

    it("handles rapid component remounting", () => {
      const TestMountWrapper = ({ show }: { show: boolean }) => (
        <TestWrapper>{show && <EmailLoginFormForTesting />}</TestWrapper>
      );

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="email-login-container"]').should("be.visible");

      cy.mount(<TestMountWrapper show={false} />);
      cy.get('[data-testid="email-login-container"]').should("not.exist");

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="email-login-container"]').should("be.visible");
    });
  });

  describe("Security", () => {
    it("should sanitize error messages", () => {
      const maliciousError = '<script>alert("xss")</script>Login failed';

      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting initialError={maliciousError} />
        </TestWrapper>,
      );

      cy.get('[data-testid="general-error"]').should("be.visible");
      cy.get("script").should("not.exist");
    });

    it("should prevent XSS in form inputs", () => {
      const xssAttempt = 'javascript:alert("xss")';

      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting
            data-testid="EmailLoginFormForTesting-4ybc3ugvo"
            onSubmit={callbacks.onSubmit}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-input"]').type(xssAttempt);
      cy.get('[data-testid="password-input"]').type("password123");
      cy.get('[data-testid="submit-button"]').click();

      cy.get("@onSubmit").should(
        "have.been.calledWith",
        xssAttempt,
        "password123",
      );
      cy.window().its("alert").should("not.have.been.called");
    });

    it("should handle password visibility toggle securely", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="password-input"]').type("sensitivepassword");

      // Password should be hidden by default
      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "type",
        "password",
      );

      // Toggle to show password
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "type",
        "text",
      );

      // Toggle back to hide
      cy.get('[data-testid="toggle-password"]').click();
      cy.get('[data-testid="password-input"]').should(
        "have.attr",
        "type",
        "password",
      );
    });
  });

  describe("Quality Checks", () => {
    it("should meet performance standards", () => {
      TestUtils.measureRenderTime('[data-testid="email-login-form"]', 2000);

      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      cy.get('[data-testid="email-login-form"]').should("be.visible");
    });

    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="email-login-form"]');
    });

    it("should handle responsive layouts", () => {
      cy.mount(
        <TestWrapper>
          <EmailLoginFormForTesting />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="email-login-form"]').should("be.visible");
      });
    });
  });
});
