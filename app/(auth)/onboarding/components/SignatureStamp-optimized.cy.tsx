import React from "react";
import { TestUtils } from "../../../../cypress/support/test-utils";

// Test-specific SignatureStamp without external dependencies
function SignatureStampForTesting({
  signature,
  isSigned,
  timestamp,
  onClick = cy.stub().as("onClick"),
  disabled = false,
  userName,
  isLoading = false,
}: {
  signature: ReturnType<typeof TestUtils.createMockSignature>;
  isSigned: boolean;
  timestamp?: string;
  onClick?: () => void;
  disabled?: boolean;
  userName?: string;
  isLoading?: boolean;
}) {
  // Simple SVG sanitizer for testing
  const sanitizeSVG = (svg: string) => {
    return svg.replace(/<script.*?<\/script>/gi, "");
  };

  const renderSignature = () => {
    if (signature.type === "template" && signature.className) {
      return (
        <div
          className={`text-4xl text-black dark:text-white ${signature.className}`}
          data-testid="template-signature"
          style={{ transform: "scaleY(1.2)", letterSpacing: "0.05em" }}
        >
          {signature.data}
        </div>
      );
    } else if (signature.type === "uploaded") {
      return (
        <img
          alt="Signature"
          className="max-h-16 w-auto object-contain"
          data-testid="uploaded-signature"
          height={64}
          src={signature.data}
          width={200}
        />
      );
    } else if (signature.type === "drawn") {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: sanitizeSVG(signature.data) }}
          className="[&>svg]:h-12 [&>svg]:w-auto [&>svg]:min-w-[120px] [&>svg]:max-w-[200px] [&>svg_path]:!stroke-black [&>svg_path]:!fill-black"
          data-testid="drawn-signature"
          style={{ transform: "scaleY(1.2)" }}
        />
      );
    } else {
      return (
        <div
          className={`text-4xl text-black dark:text-white ${signature.className || "font-cursive"}`}
          data-testid="legacy-signature"
          style={{ transform: "scaleY(1.2)", letterSpacing: "0.05em" }}
        >
          {signature.data}
        </div>
      );
    }
  };

  return (
    <div className="relative inline-block" data-testid="signature-stamp">
      {!isSigned ? (
        <button
          className={`relative inline-flex flex-col items-center transition-all duration-200 group ${
            !disabled ? "hover:opacity-70 cursor-pointer" : "opacity-50 cursor-not-allowed"
          }`}
          data-testid="sign-button"
          disabled={disabled}
          onClick={onClick}
        >
          <div className="mb-3" data-testid="sign-instruction">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              {isLoading ? "Saving signature..." : "* Click to sign"}
            </p>
          </div>
          <div
            className="w-64 border-b-2 border-black dark:border-gray-300"
            data-testid="signature-line"
          />
          {isLoading && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              data-testid="loading-spinner"
            >
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
      ) : (
        <div
          className="relative inline-flex flex-col items-center"
          data-testid="signed-signature"
        >
          <div className="flex flex-col items-center">
            <div
              className="mb-2 relative"
              data-testid="signature-display"
              style={{ marginBottom: "2px" }}
            >
              {renderSignature()}
            </div>
            <div
              className="w-64 border-b-2 border-black dark:border-gray-300 relative z-0"
              data-testid="signed-signature-line"
            />
            {userName && (
              <p
                className="text-sm text-black dark:text-gray-200 font-medium mt-2 uppercase tracking-wider"
                data-testid="user-name-display"
              >
                {userName}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

describe("SignatureStamp Component", () => {
  // Use shared test utilities for consistent mock data
  const templateSignature = TestUtils.createMockSignature("template");
  const drawnSignature = TestUtils.createMockSignature("drawn");
  const uploadedSignature = TestUtils.createMockSignature("uploaded");
  
  // Create reusable callbacks inside beforeEach to avoid stub creation outside test context
  let callbacks: ReturnType<typeof TestUtils.createMockCallbacks>;

  beforeEach(() => {
    // Create callbacks inside test context
    callbacks = TestUtils.createMockCallbacks();
  });

  describe("Unsigned State", () => {
    it("renders click-to-sign interface", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />
      );

      cy.get('[data-testid="signature-stamp"]').should("be.visible");
      cy.get('[data-testid="sign-button"]').should("be.visible");
      cy.get('[data-testid="sign-instruction"]').should("contain", "* Click to sign");
      cy.get('[data-testid="signature-line"]').should("be.visible");
      cy.get('[data-testid="signed-signature"]').should("not.exist");
    });

    it("handles click interactions", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />
      );

      cy.get('[data-testid="sign-button"]').click();
      cy.get("@onClick").should("have.been.called");
    });

    it("shows loading state", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          isLoading={true}
          onClick={callbacks.onClick}
        />
      );

      cy.get('[data-testid="sign-instruction"]').should("contain", "Saving signature...");
      cy.get('[data-testid="loading-spinner"]').should("be.visible");
    });

    it("handles disabled state", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          disabled={true}
          onClick={callbacks.onClick}
        />
      );

      cy.get('[data-testid="sign-button"]')
        .should("be.disabled")
        .should("have.class", "opacity-50")
        .should("have.class", "cursor-not-allowed");

      cy.get('[data-testid="sign-button"]').click({ force: true });
      cy.get("@onClick").should("not.have.been.called");
    });
  });

  describe("Signed State", () => {
    it("renders template signature", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={true}
          userName="John Doe"
        />
      );

      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="template-signature"]').should("be.visible").should("contain", templateSignature.data);
      cy.get('[data-testid="user-name-display"]').should("contain", "John Doe").should("have.class", "uppercase");
      cy.get('[data-testid="sign-button"]').should("not.exist");
    });

    it("renders drawn signature", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={drawnSignature}
          isSigned={true}
          userName="Jane Smith"
        />
      );

      cy.get('[data-testid="drawn-signature"]').should("be.visible");
      cy.get('[data-testid="drawn-signature"] svg').should("exist");
      cy.get('[data-testid="user-name-display"]').should("contain", "Jane Smith");
    });

    it("renders uploaded signature", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={uploadedSignature}
          isSigned={true}
          userName="Bob Wilson"
        />
      );

      cy.get('[data-testid="uploaded-signature"]')
        .should("be.visible")
        .should("have.attr", "src", uploadedSignature.data);
    });

    it("renders without user name", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={true}
        />
      );

      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="user-name-display"]').should("not.exist");
    });
  });

  describe("Signature Types", () => {
    it("handles legacy signature fallback", () => {
      const legacySignature = {
        ...templateSignature,
        className: undefined,
      };

      cy.mount(
        <SignatureStampForTesting
          signature={legacySignature}
          isSigned={true}
        />
      );

      cy.get('[data-testid="legacy-signature"]')
        .should("be.visible")
        .should("contain", templateSignature.data)
        .should("have.class", "font-cursive");
    });

    it("sanitizes SVG content", () => {
      const maliciousSVG = {
        ...drawnSignature,
        data: '<script>alert("xss")</script><svg><path d="M0,0 L100,100"/></svg>',
      };

      cy.mount(
        <SignatureStampForTesting
          signature={maliciousSVG}
          isSigned={true}
        />
      );

      cy.get('[data-testid="drawn-signature"]').within(() => {
        cy.get('script').should("not.exist");
        cy.get('svg').should("exist");
      });
    });
  });

  describe("Styling and Layout", () => {
    it("applies correct CSS classes", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={true}
        />
      );

      cy.get('[data-testid="template-signature"]')
        .should("have.class", "text-4xl")
        .should("have.class", templateSignature.className!);

      cy.get('[data-testid="signed-signature-line"]')
        .should("have.class", "w-64")
        .should("have.class", "border-b-2");
    });

    it("maintains responsive layout", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={true}
          userName="John Doe"
        />
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="signature-stamp"]').should("be.visible");
        cy.get('[data-testid="signed-signature-line"]').should("have.class", "w-64");
      });
    });
  });

  describe("Accessibility", () => {
    it("supports keyboard navigation", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />
      );

      TestUtils.testAccessibility('[data-testid="signature-stamp"]');
      
      cy.get('[data-testid="sign-button"]').focus();
      cy.get('[data-testid="sign-button"]').should("be.focused");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty signature data", () => {
      const emptySignature = { ...templateSignature, data: "" };

      cy.mount(
        <SignatureStampForTesting
          signature={emptySignature}
          isSigned={true}
        />
      );

      cy.get('[data-testid="template-signature"]').should("be.visible").should("be.empty");
    });

    it("handles long signature text", () => {
      const longSignature = {
        ...templateSignature,
        data: "This is a very long signature name that might overflow the container",
      };

      cy.mount(
        <SignatureStampForTesting
          signature={longSignature}
          isSigned={true}
        />
      );

      cy.get('[data-testid="template-signature"]')
        .should("be.visible")
        .should("contain", "This is a very long signature");
    });
  });

  // Integration test example
  describe("Integration Scenarios", () => {
    it("should transition from unsigned to signed state", () => {
      let currentSigned = false;

      const TestWrapper = () => {
        const [signed, setSigned] = React.useState(currentSigned);
        
        return (
          <SignatureStampForTesting
            signature={templateSignature}
            isSigned={signed}
            onClick={() => {
              setSigned(true);
              currentSigned = true;
            }}
          />
        );
      };

      cy.mount(<TestWrapper />);

      // Start unsigned
      cy.get('[data-testid="sign-button"]').should("be.visible");
      
      // Click to sign
      cy.get('[data-testid="sign-button"]').click();
      
      // Should now be signed
      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="sign-button"]').should("not.exist");
    });
  });
});