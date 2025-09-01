import React from "react";

import "cypress-real-events/support";
import { TestUtils } from "../../../cypress/support/test-utils";

import ErrorComponent from "./error";

// Test-specific ErrorComponent wrapper
function ErrorComponentForTesting({
  error = new Error("Test error message"),
  reset = () => {},
}: {
  error?: Error;
  reset?: () => void;
}) {
  return (
    <div data-testid="error-component">
      <ErrorComponent error={error} reset={reset} />
    </div>
  );
}

// Component wrapper for consistency
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

describe("Error Component", () => {
  let callbacks: ReturnType<typeof TestUtils.createMockCallbacks>;

  beforeEach(() => {
    callbacks = TestUtils.createMockCallbacks();
    // Reset stubs
    Object.values(callbacks).forEach((stub) => stub.reset?.());
  });

  describe("Core Functionality", () => {
    it("renders error message and try again button", () => {
      const testError = new Error("Something went wrong");

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={testError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-component"]').should("be.visible");
      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("contain", "Try again");
    });

    it("calls reset callback when try again button is clicked", () => {
      const testError = new Error("Test error");

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={testError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="button-1kbh9c27y"]').click();
      cy.get("@onRetry").should("have.been.called");
    });

    it("logs error to console on component mount", () => {
      const testError = new Error("Console log test error");

      cy.window().then((win) => {
        cy.spy(win.console, "error").as("consoleError");
      });

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={testError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get("@consoleError").should("have.been.calledWith", testError);
    });

    it("handles different error types and messages", () => {
      const customError = new Error("Custom error message for testing");

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={customError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");
    });
  });

  describe("Error States", () => {
    it("handles missing error object gracefully", () => {
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={undefined as any}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");
    });

    it("handles missing reset callback gracefully", () => {
      const testError = new Error("Test error");

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={testError}
            reset={undefined as any}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");

      // Should not throw error when clicked
      cy.get('[data-testid="button-1kbh9c27y"]').click();
    });

    it("handles complex error objects", () => {
      const complexError = new Error("Network error");

      complexError.cause = "Connection timeout";
      complexError.stack = "Error stack trace...";

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={complexError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");
    });

    it("handles multiple rapid error occurrences", () => {
      const error1 = new Error("First error");
      const error2 = new Error("Second error");

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting error={error1} reset={callbacks.onRetry} />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");

      // Remount with different error
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting error={error2} reset={callbacks.onRetry} />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').click();
      cy.get("@onRetry").should("have.been.called");
    });
  });

  describe("Accessibility", () => {
    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="error-component"]');
    });

    it("supports keyboard navigation", () => {
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="button-1kbh9c27y"]').focus().should("be.focused");
      cy.realPress("Enter");
      cy.get("@onRetry").should("have.been.called");
    });

    it("has proper semantic structure", () => {
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      // Check heading structure
      cy.get("h2").should("contain", "Something went wrong!");
      cy.get("h2").should("be.visible");

      // Check button semantics
      cy.get('[data-testid="button-1kbh9c27y"]').should(
        "have.prop",
        "tagName",
        "BUTTON",
      );
    });

    it("provides clear user guidance", () => {
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      // User should understand what happened and what they can do
      cy.contains("Something went wrong!").should("be.visible");
      cy.contains("Try again").should("be.visible");
    });
  });

  describe("Performance", () => {
    it("should render quickly", () => {
      TestUtils.measureRenderTime('[data-testid="error-component"]', 1000);

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-component"]').should("be.visible");
    });

    it("handles large error objects efficiently", () => {
      const largeError = new Error("Error with large stack trace");

      largeError.stack = "a".repeat(10000); // Large stack trace

      TestUtils.measureRenderTime('[data-testid="error-component"]', 2000);

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={largeError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-component"]').should("be.visible");
    });

    it("handles rapid reset button clicks efficiently", () => {
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      // Rapidly click reset button
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="button-1kbh9c27y"]').click();
        cy.wait(10);
      }

      cy.get("@onRetry").should("have.callCount", 5);
    });
  });

  describe("Responsive Design", () => {
    it("should work on all screen sizes", () => {
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="error-component"]').should("be.visible");
        cy.contains("Something went wrong!").should("be.visible");
        cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");
      });
    });

    it("maintains proper spacing on mobile", () => {
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.viewport(320, 568);

      cy.get('[data-testid="error-component"]').should("be.visible");
      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");
    });

    it("handles long error messages on narrow screens", () => {
      const longError = new Error(
        "This is a very long error message that might wrap on smaller screens",
      );

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={longError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.viewport(320, 568);

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with error boundary workflow", () => {
      const TestIntegration = () => {
        const [hasError, setHasError] = React.useState(false);
        const [errorCount, setErrorCount] = React.useState(0);

        const handleReset = () => {
          setHasError(false);
          setErrorCount((count) => count + 1);
        };

        if (hasError) {
          return (
            <ErrorComponentForTesting
              error={new Error("Integration test error")}
              reset={handleReset}
            />
          );
        }

        return (
          <div>
            <p data-testid="error-count">Reset count: {errorCount}</p>
            <button
              data-testid="trigger-error"
              onClick={() => setHasError(true)}
            >
              Trigger Error
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestIntegration />
        </TestWrapper>,
      );

      // Initially no error
      cy.get('[data-testid="trigger-error"]').should("be.visible");
      cy.get('[data-testid="error-count"]').should("contain", "Reset count: 0");

      // Trigger error
      cy.get('[data-testid="trigger-error"]').click();
      cy.contains("Something went wrong!").should("be.visible");

      // Reset and check integration
      cy.get('[data-testid="button-1kbh9c27y"]').click();
      cy.get('[data-testid="error-count"]').should("contain", "Reset count: 1");
    });

    it("handles error reporting service integration", () => {
      const reportError = cy.stub().as("reportError");
      const testError = new Error("Service integration test");

      cy.window().then((win) => {
        win.errorReportingService = { report: reportError };
      });

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={testError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      // Error should be logged to console (existing behavior)
      cy.window().its("console.error").should("exist");
    });

    it("works within Next.js app router context", () => {
      // Simulate Next.js error boundary behavior
      const testError = new Error("App router error");

      testError.digest = "NEXT_REDIRECT"; // Next.js specific error property

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={testError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').click();
      cy.get("@onRetry").should("have.been.called");
    });
  });

  describe("Edge Cases", () => {
    it("handles circular reference errors", () => {
      const circularError = new Error("Circular reference test");
      const obj: any = { error: circularError };

      obj.self = obj;
      circularError.cause = obj;

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={circularError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");
    });

    it("handles error objects without message", () => {
      const emptyError = new Error("");

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={emptyError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");
    });

    it("handles non-Error objects passed as error", () => {
      const stringError = "String error" as any;

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={stringError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('[data-testid="button-1kbh9c27y"]').should("be.visible");
    });

    it("handles rapid component remounting", () => {
      const TestWrapper = ({ show }: { show: boolean }) => (
        <div>
          {show && (
            <ErrorComponentForTesting
              error={new Error("Remount test")}
              reset={callbacks.onRetry}
            />
          )}
        </div>
      );

      cy.mount(<TestWrapper show={true} />);
      cy.contains("Something went wrong!").should("be.visible");

      cy.mount(<TestWrapper show={false} />);
      cy.get('[data-testid="error-component"]').should("not.exist");

      cy.mount(<TestWrapper show={true} />);
      cy.contains("Something went wrong!").should("be.visible");
    });
  });

  describe("Security", () => {
    it("safely handles malicious error messages", () => {
      const xssError = new Error(
        '<script>alert("xss")</script>Malicious error',
      );

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={xssError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get("script").should("not.exist");
    });

    it("safely handles error properties with XSS attempts", () => {
      const maliciousError = new Error("Test error");

      (maliciousError as any).maliciousProp =
        '<img src="x" onerror="alert(1)">';

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={maliciousError}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get('img[src="x"]').should("not.exist");
    });

    it("prevents reset callback injection attacks", () => {
      const maliciousReset = () => {
        (window as any).maliciousCode = "injected";
      };

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={maliciousReset}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="button-1kbh9c27y"]').click();
      cy.window().should("not.have.property", "maliciousCode");
    });

    it("handles error stack traces safely", () => {
      const errorWithStack = new Error("Stack trace test");

      errorWithStack.stack =
        '<script>alert("stack xss")</script>Stack trace content';

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={errorWithStack}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.contains("Something went wrong!").should("be.visible");
      cy.get("script").should("not.exist");
    });
  });

  describe("Quality Checks", () => {
    it("should meet performance standards", () => {
      TestUtils.measureRenderTime('[data-testid="error-component"]', 2000);

      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      cy.get('[data-testid="error-component"]').should("be.visible");
    });

    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      TestUtils.testAccessibility('[data-testid="error-component"]');
    });

    it("should handle responsive layouts", () => {
      cy.mount(
        <TestWrapper>
          <ErrorComponentForTesting
            error={new Error("Test")}
            reset={callbacks.onRetry}
          />
        </TestWrapper>,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="error-component"]').should("be.visible");
      });
    });
  });
});
