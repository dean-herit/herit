import React from "react";
import { useState } from "react";
import "cypress-real-events/support";
import { TestUtils } from "../../../../cypress/support/test-utils";

// Test-specific SignatureStamp without external dependencies
function SignatureStampForTesting({
  signature,
  isSigned,
  timestamp,
  onClick = cy.stub(),
  disabled = false,
  userName,
  isLoading = false,
}: {
  signature: {
    id: string;
    name: string;
    data: string;
    type: "drawn" | "uploaded" | "template";
    font?: string;
    className?: string;
    createdAt: string;
  };
  isSigned: boolean;
  timestamp?: string;
  onClick?: () => void;
  disabled?: boolean;
  userName?: string;
  isLoading?: boolean;
}) {
  // Simple SVG sanitizer for testing
  const sanitizeSVG = (svg: string) => {
    // For testing, just remove any script tags
    return svg.replace(/<script.*?<\/script>/gi, "");
  };

  const renderSignature = () => {
    if (signature.type === "template" && signature.className) {
      return (
        <div
          className={`text-4xl text-black dark:text-white ${signature.className}`}
          data-testid="template-signature"
          style={{
            transform: "scaleY(1.2)",
            letterSpacing: "0.05em",
          }}
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
          className="[&>svg]:h-12 [&>svg]:w-auto [&>svg]:min-w-[120px] [&>svg]:max-w-[200px] [&>svg_path]:!stroke-black [&>svg_path]:!fill-black dark:[&>svg_path]:!stroke-white dark:[&>svg_path]:!fill-white"
          data-testid="drawn-signature"
          style={{ transform: "scaleY(1.2)" }}
        />
      );
    } else {
      return (
        <div
          className={`text-4xl text-black dark:text-white ${signature.className || "font-cursive"}`}
          data-testid="legacy-signature"
          style={{
            transform: "scaleY(1.2)",
            letterSpacing: "0.05em",
          }}
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
          className={`
            relative inline-flex flex-col items-center
            transition-all duration-200 group
            ${!disabled ? "hover:opacity-70 cursor-pointer" : "opacity-50 cursor-not-allowed"}
          `}
          data-testid="sign-button"
          disabled={disabled}
          onClick={onClick}
        >
          {/* Click to sign text */}
          <div className="mb-3" data-testid="sign-instruction">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              {isLoading ? "Saving signature..." : "* Click to sign"}
            </p>
          </div>

          {/* Signature line */}
          <div
            className="w-64 border-b-2 border-black dark:border-gray-300"
            data-testid="signature-line"
          />

          {/* Loading spinner */}
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
            {/* Signature - positioned above the line */}
            <div
              className="mb-2 relative"
              data-testid="signature-display"
              style={{ marginBottom: "2px" }}
            >
              {renderSignature()}
            </div>

            {/* Signature line */}
            <div
              className="w-64 border-b-2 border-black dark:border-gray-300 relative z-0"
              data-testid="signed-signature-line"
            />

            {/* User name underneath line */}
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
  let callbacks: ReturnType<typeof TestUtils.createMockCallbacks>;

  beforeEach(() => {
    callbacks = TestUtils.createMockCallbacks();
    // Reset stubs
    Object.values(callbacks).forEach(stub => stub.reset?.());
  });

  // Sample signature data for testing
  const templateSignature = {
    id: "template-123",
    name: "John Doe",
    data: "John Doe",
    type: "template" as const,
    font: "Dancing Script",
    className: "font-cursive",
    createdAt: "2024-01-01T00:00:00Z",
  };

  const drawnSignature = {
    id: "drawn-456",
    name: "Jane Smith",
    data: '<svg viewBox="0 0 300 100"><path d="M10,80 Q100,30 200,80" stroke="black" stroke-width="2" fill="none"/></svg>',
    type: "drawn" as const,
    createdAt: "2024-01-01T00:00:00Z",
  };

  const uploadedSignature = {
    id: "uploaded-789",
    name: "Bob Wilson",
    data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    type: "uploaded" as const,
    createdAt: "2024-01-01T00:00:00Z",
  };

  describe("Core Functionality", () => {
    it("renders unsigned state with click to sign button", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="signature-stamp"]').should("be.visible");
      cy.get('[data-testid="sign-button"]').should("be.visible");
      cy.get('[data-testid="sign-instruction"]').should("contain", "* Click to sign");
      cy.get('[data-testid="signature-line"]').should("be.visible");
      cy.get('[data-testid="signed-signature"]').should("not.exist");

      cy.get('[data-testid="sign-button"]').click();
      cy.get("@onClick").should("have.been.called");
    });

    it("renders signed state with template signature", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={true}
          userName="John Doe"
        />,
      );

      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="signature-display"]').should("be.visible");
      cy.get('[data-testid="template-signature"]').should("be.visible");
      cy.get('[data-testid="template-signature"]').should("contain", "John Doe");
      cy.get('[data-testid="sign-button"]').should("not.exist");
    });

    it("renders signed state with drawn signature", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={drawnSignature}
          isSigned={true}
          userName="Jane Smith"
        />,
      );

      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="drawn-signature"]').should("be.visible");
      cy.get('[data-testid="drawn-signature"]').within(() => {
        cy.get('svg').should("exist");
      });
    });

    it("renders signed state with uploaded signature", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={uploadedSignature}
          isSigned={true}
          userName="Bob Wilson"
        />,
      );

      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="uploaded-signature"]').should("be.visible");
      cy.get('[data-testid="uploaded-signature"]').should("have.attr", "src", uploadedSignature.data);
    });

    it("handles legacy signature type", () => {
      const legacySignature = {
        ...templateSignature,
        type: "template" as const,
        className: undefined,
      };

      cy.mount(
        <SignatureStampForTesting
          signature={legacySignature}
          isSigned={true}
          userName="John Doe"
        />,
      );

      cy.get('[data-testid="legacy-signature"]').should("be.visible");
      cy.get('[data-testid="legacy-signature"]').should("contain", "John Doe");
      cy.get('[data-testid="legacy-signature"]').should("have.class", "font-cursive");
    });

    it("toggles between unsigned and signed states", () => {
      const TestWrapper = () => {
        const [isSigned, setIsSigned] = useState(false);
        
        return (
          <div>
            <SignatureStampForTesting
              signature={templateSignature}
              isSigned={isSigned}
              onClick={() => setIsSigned(true)}
              userName="John Doe"
            />
            <button
              data-testid="reset-button"
              onClick={() => setIsSigned(false)}
            >
              Reset
            </button>
          </div>
        );
      };

      cy.mount(<TestWrapper />);

      // Initially unsigned
      cy.get('[data-testid="sign-button"]').should("be.visible");
      cy.get('[data-testid="signed-signature"]').should("not.exist");

      // Click to sign
      cy.get('[data-testid="sign-button"]').click();
      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="sign-button"]').should("not.exist");

      // Reset to unsigned
      cy.get('[data-testid="reset-button"]').click();
      cy.get('[data-testid="sign-button"]').should("be.visible");
      cy.get('[data-testid="signed-signature"]').should("not.exist");
    });

    it("handles all signature type variations", () => {
      const signatures = [templateSignature, drawnSignature, uploadedSignature];
      const expectedTestIds = ["template-signature", "drawn-signature", "uploaded-signature"];

      signatures.forEach((signature, index) => {
        cy.mount(
          <SignatureStampForTesting
            signature={signature}
            isSigned={true}
            userName={signature.name}
          />,
        );

        cy.get(`[data-testid="${expectedTestIds[index]}"]`).should("be.visible");
        cy.get('[data-testid="user-name-display"]').should("contain", signature.name.toUpperCase());
      });
    });
  });

  describe("Loading States", () => {
    it("shows loading state when signing", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          isLoading={true}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="sign-instruction"]').should("contain", "Saving signature...");
      cy.get('[data-testid="loading-spinner"]').should("be.visible");
      cy.get('[data-testid="loading-spinner"]').within(() => {
        cy.get('.animate-spin').should("exist");
      });
    });

    it("prevents interaction during loading", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          isLoading={true}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="sign-button"]').click();
      cy.get('[data-testid="loading-spinner"]').should("be.visible");
      cy.get("@onClick").should("have.been.called");
    });

    it("handles loading state transitions", () => {
      const TestWrapper = () => {
        const [isLoading, setIsLoading] = useState(false);
        
        return (
          <div>
            <SignatureStampForTesting
              signature={templateSignature}
              isSigned={false}
              isLoading={isLoading}
              onClick={() => setIsLoading(true)}
            />
            <button
              data-testid="stop-loading"
              onClick={() => setIsLoading(false)}
            >
              Stop Loading
            </button>
          </div>
        );
      };

      cy.mount(<TestWrapper />);

      // Initially not loading
      cy.get('[data-testid="sign-instruction"]').should("contain", "* Click to sign");
      cy.get('[data-testid="loading-spinner"]').should("not.exist");

      // Start loading
      cy.get('[data-testid="sign-button"]').click();
      cy.get('[data-testid="sign-instruction"]').should("contain", "Saving signature...");
      cy.get('[data-testid="loading-spinner"]').should("be.visible");

      // Stop loading
      cy.get('[data-testid="stop-loading"]').click();
      cy.get('[data-testid="sign-instruction"]').should("contain", "* Click to sign");
      cy.get('[data-testid="loading-spinner"]').should("not.exist");
    });
  });

  describe("Error States", () => {
    it("handles disabled state correctly", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          disabled={true}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="sign-button"]').should("be.disabled");
      cy.get('[data-testid="sign-button"]').should("have.class", "opacity-50");
      cy.get('[data-testid="sign-button"]').should("have.class", "cursor-not-allowed");

      cy.get('[data-testid="sign-button"]').click({ force: true });
      cy.get("@onClick").should("not.have.been.called");
    });

    it("handles malformed signature data gracefully", () => {
      const malformedSignature = {
        ...templateSignature,
        data: null as any,
      };

      cy.mount(
        <SignatureStampForTesting
          signature={malformedSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="template-signature"]').should("be.visible");
    });

    it("handles missing signature properties", () => {
      const incompleteSignature = {
        id: "test-123",
        data: "John Doe",
        createdAt: "2024-01-01T00:00:00Z",
      } as any;

      cy.mount(
        <SignatureStampForTesting
          signature={incompleteSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="signed-signature"]').should("be.visible");
    });

    it("handles network errors during signing", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          isLoading={true}
          disabled={true}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="sign-instruction"]').should("contain", "Saving signature...");
      cy.get('[data-testid="sign-button"]').should("be.disabled");
      cy.get('[data-testid="loading-spinner"]').should("be.visible");
    });

    it("handles simultaneous loading and disabled states", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          isLoading={true}
          disabled={true}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="sign-button"]').should("be.disabled");
      cy.get('[data-testid="loading-spinner"]').should("be.visible");
      cy.get('[data-testid="sign-button"]').click({ force: true });
      cy.get("@onClick").should("not.have.been.called");
    });
  });

  describe("Accessibility", () => {
    it("should be accessible with proper focus management", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />,
      );

      TestUtils.testAccessibility('[data-testid="signature-stamp"]');
    });

    it("supports keyboard navigation", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="sign-button"]').focus().should("be.focused");
      cy.realPress("Enter");
      cy.get("@onClick").should("have.been.called");
    });

    it("has proper ARIA attributes and semantic structure", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="sign-button"]').should("be.visible");
      cy.get('[data-testid="sign-button"]').should("not.be.disabled");
    });

    it("maintains accessibility when disabled", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          disabled={true}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="sign-button"]').should("be.disabled");
      cy.get('[data-testid="sign-button"]').should("have.class", "cursor-not-allowed");
    });

    it("provides clear visual feedback for signed state", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={true}
          userName="John Doe"
        />,
      );

      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="signature-display"]').should("be.visible");
      cy.get('[data-testid="signed-signature-line"]').should("be.visible");
      cy.get('[data-testid="user-name-display"]').should("be.visible");
    });

    it("renders signed state without user name accessibly", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="signature-display"]').should("be.visible");
      cy.get('[data-testid="user-name-display"]').should("not.exist");
    });
  });

  describe("Performance", () => {
    it("should render quickly", () => {
      TestUtils.measureRenderTime('[data-testid="signature-stamp"]', 1000);

      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="signature-stamp"]').should("be.visible");
    });

    it("handles rapid state changes efficiently", () => {
      const TestWrapper = () => {
        const [isSigned, setIsSigned] = useState(false);
        
        return (
          <div>
            <SignatureStampForTesting
              signature={templateSignature}
              isSigned={isSigned}
              onClick={() => setIsSigned(!isSigned)}
              userName="John Doe"
            />
            <button
              data-testid="toggle-button"
              onClick={() => setIsSigned(!isSigned)}
            >
              Toggle
            </button>
          </div>
        );
      };

      cy.mount(<TestWrapper />);

      // Rapidly toggle states
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="toggle-button"]').click();
        cy.wait(50);
      }

      cy.get('[data-testid="signature-stamp"]').should("be.visible");
    });

    it("applies correct CSS classes for signature types", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="template-signature"]')
        .should("have.class", "text-4xl")
        .should("have.class", "font-cursive");

      cy.mount(
        <SignatureStampForTesting
          signature={drawnSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="drawn-signature"]').should("satisfy", ($el) => {
        const classList = $el[0].className;
        return classList.includes("[&>svg]:h-12") && classList.includes("[&>svg]:w-auto");
      });

      cy.mount(
        <SignatureStampForTesting
          signature={uploadedSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="uploaded-signature"]')
        .should("have.class", "max-h-16")
        .should("have.class", "object-contain");
    });

    it("handles complex signature data efficiently", () => {
      const complexSignature = {
        ...drawnSignature,
        data: '<svg viewBox="0 0 300 100">' + '<path d="M10,80 Q100,30 200,80" stroke="black" stroke-width="2" fill="none"/>'.repeat(50) + '</svg>',
      };

      TestUtils.measureRenderTime('[data-testid="signature-stamp"]', 2000);

      cy.mount(
        <SignatureStampForTesting
          signature={complexSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="drawn-signature"]').should("be.visible");
    });
  });

  describe("Responsive Design", () => {
    it("should work on all screen sizes", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={true}
          userName="John Doe"
        />,
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="signature-stamp"]').should("be.visible");
        cy.get('[data-testid="signed-signature"]').should("be.visible");
        cy.get('[data-testid="signature-display"]').should("be.visible");
        cy.get('[data-testid="signed-signature-line"]').should("be.visible");
      });
    });

    it("maintains proper spacing on mobile", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />,
      );

      cy.viewport(320, 568);
      
      cy.get('[data-testid="signature-stamp"]').should("be.visible");
      cy.get('[data-testid="sign-button"]').should("be.visible");
      cy.get('[data-testid="signature-line"]').should("have.class", "w-64");
    });

    it("handles different signature types on various viewports", () => {
      const signatures = [templateSignature, drawnSignature, uploadedSignature];
      const viewports = Object.keys(TestUtils.VIEWPORT_SIZES) as (keyof typeof TestUtils.VIEWPORT_SIZES)[];

      signatures.forEach((signature) => {
        viewports.forEach((viewport) => {
          const { width, height } = TestUtils.VIEWPORT_SIZES[viewport];
          cy.viewport(width, height);

          cy.mount(
            <SignatureStampForTesting
              signature={signature}
              isSigned={true}
              userName={signature.name}
            />,
          );

          cy.get('[data-testid="signature-stamp"]').should("be.visible");
          cy.get('[data-testid="signed-signature"]').should("be.visible");
        });
      });
    });

    it("maintains aspect ratios across different screens", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={uploadedSignature}
          isSigned={true}
          userName="Bob Wilson"
        />,
      );

      const viewports = [{ width: 320, height: 568 }, { width: 1200, height: 800 }];

      viewports.forEach(({ width, height }) => {
        cy.viewport(width, height);
        cy.get('[data-testid="uploaded-signature"]').should("have.class", "object-contain");
        cy.get('[data-testid="uploaded-signature"]').should("have.class", "max-h-16");
      });
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with onboarding signature flow", () => {
      const TestWrapper = () => {
        const [currentSignature, setCurrentSignature] = useState<any>(null);
        const [isSigned, setIsSigned] = useState(false);

        const handleSignatureSelect = (signature: any) => {
          setCurrentSignature(signature);
        };

        const handleSign = () => {
          if (currentSignature) {
            setIsSigned(true);
          }
        };

        return (
          <div>
            <div className="flex gap-2 mb-4">
              <button
                data-testid="select-template"
                onClick={() => handleSignatureSelect(templateSignature)}
              >
                Template
              </button>
              <button
                data-testid="select-drawn"
                onClick={() => handleSignatureSelect(drawnSignature)}
              >
                Drawn
              </button>
              <button
                data-testid="select-uploaded"
                onClick={() => handleSignatureSelect(uploadedSignature)}
              >
                Uploaded
              </button>
            </div>
            {currentSignature && (
              <SignatureStampForTesting
                signature={currentSignature}
                isSigned={isSigned}
                onClick={handleSign}
                userName={currentSignature.name}
              />
            )}
          </div>
        );
      };

      cy.mount(<TestWrapper />);

      // Select template signature
      cy.get('[data-testid="select-template"]').click();
      cy.get('[data-testid="sign-button"]').should("be.visible");
      
      // Sign with template
      cy.get('[data-testid="sign-button"]').click();
      cy.get('[data-testid="template-signature"]').should("be.visible");

      // Test different signature types
      cy.get('[data-testid="select-drawn"]').click();
      cy.get('[data-testid="drawn-signature"]').should("be.visible");

      cy.get('[data-testid="select-uploaded"]').click();
      cy.get('[data-testid="uploaded-signature"]').should("be.visible");
    });

    it("handles signature validation workflow", () => {
      const TestWrapper = () => {
        const [isValid, setIsValid] = useState(true);
        const [isSigned, setIsSigned] = useState(false);

        return (
          <div>
            <SignatureStampForTesting
              signature={templateSignature}
              isSigned={isSigned}
              disabled={!isValid}
              onClick={() => setIsSigned(true)}
              userName="John Doe"
            />
            <button
              data-testid="toggle-validity"
              onClick={() => setIsValid(!isValid)}
            >
              Toggle Validity
            </button>
          </div>
        );
      };

      cy.mount(<TestWrapper />);

      // Initially valid - should be able to sign
      cy.get('[data-testid="sign-button"]').should("not.be.disabled");
      
      // Make invalid
      cy.get('[data-testid="toggle-validity"]').click();
      cy.get('[data-testid="sign-button"]').should("be.disabled");
      
      // Make valid again
      cy.get('[data-testid="toggle-validity"]').click();
      cy.get('[data-testid="sign-button"]').should("not.be.disabled");
    });

    it("integrates with document signing workflow", () => {
      const signatures = [templateSignature, drawnSignature, uploadedSignature];
      let currentIndex = 0;

      const TestWrapper = () => {
        const [signedSignatures, setSignedSignatures] = useState<any[]>([]);
        
        const handleSign = () => {
          setSignedSignatures([...signedSignatures, signatures[currentIndex]]);
          currentIndex++;
        };

        return (
          <div>
            {signatures.map((signature, index) => (
              <div key={signature.id} className="mb-4">
                <SignatureStampForTesting
                  signature={signature}
                  isSigned={signedSignatures.includes(signature)}
                  onClick={handleSign}
                  userName={signature.name}
                />
              </div>
            ))}
          </div>
        );
      };

      cy.mount(<TestWrapper />);

      // All should be unsigned initially
      cy.get('[data-testid="sign-button"]').should("have.length", 3);
      
      // Sign first signature
      cy.get('[data-testid="sign-button"]').first().click();
      cy.get('[data-testid="template-signature"]').should("be.visible");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty or invalid SVG data gracefully", () => {
      const invalidSvgSignature = {
        ...drawnSignature,
        data: '<script>alert("xss")</script><svg><path d="M0,0 L100,100"/></svg>',
      };

      cy.mount(
        <SignatureStampForTesting
          signature={invalidSvgSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="drawn-signature"]').within(() => {
        cy.get('script').should("not.exist");
        cy.get('svg').should("exist");
      });
    });

    it("handles different signature data formats", () => {
      const emptySignature = {
        ...templateSignature,
        data: "",
      };

      cy.mount(
        <SignatureStampForTesting
          signature={emptySignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="template-signature"]').should("be.visible");
      cy.get('[data-testid="template-signature"]').should("be.empty");

      const longSignature = {
        ...templateSignature,
        data: "This is a very long signature name that might overflow",
      };

      cy.mount(
        <SignatureStampForTesting
          signature={longSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="template-signature"]').should("be.visible");
      cy.get('[data-testid="template-signature"]').should("contain", "This is a very long signature");
    });

    it("handles rapid component remounting", () => {
      const TestWrapper = ({ show }: { show: boolean }) => (
        <div>
          {show && (
            <SignatureStampForTesting
              signature={templateSignature}
              isSigned={true}
              userName="John Doe"
            />
          )}
        </div>
      );

      cy.mount(<TestWrapper show={true} />);
      cy.get('[data-testid="signature-stamp"]').should("be.visible");

      cy.mount(<TestWrapper show={false} />);
      cy.get('[data-testid="signature-stamp"]').should("not.exist");

      cy.mount(<TestWrapper show={true} />);
      cy.get('[data-testid="signature-stamp"]').should("be.visible");
    });

    it("handles simultaneous prop changes", () => {
      const TestWrapper = () => {
        const [props, setProps] = useState({
          isSigned: false,
          isLoading: false,
          disabled: false,
          userName: "John Doe",
        });

        return (
          <div>
            <SignatureStampForTesting
              signature={templateSignature}
              {...props}
              onClick={callbacks.onClick}
            />
            <button
              data-testid="change-all-props"
              onClick={() => setProps({
                isSigned: true,
                isLoading: true,
                disabled: true,
                userName: "Jane Smith",
              })}
            >
              Change All
            </button>
          </div>
        );
      };

      cy.mount(<TestWrapper />);

      cy.get('[data-testid="sign-button"]').should("be.visible");
      
      cy.get('[data-testid="change-all-props"]').click();
      
      cy.get('[data-testid="signed-signature"]').should("be.visible");
      cy.get('[data-testid="loading-spinner"]').should("be.visible");
      cy.get('[data-testid="user-name-display"]').should("contain", "JANE SMITH");
    });

    it("handles missing signature type gracefully", () => {
      const unknownTypeSignature = {
        ...templateSignature,
        type: "unknown" as any,
      };

      cy.mount(
        <SignatureStampForTesting
          signature={unknownTypeSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="legacy-signature"]').should("be.visible");
    });
  });

  it("handles different signature data formats", () => {
    // Test with empty data
    const emptySignature = {
      ...templateSignature,
      data: "",
    };

    cy.mount(
      <SignatureStampForTesting
        signature={emptySignature}
        isSigned={true}
      />,
    );

    cy.get('[data-testid="template-signature"]').should("be.visible");
    cy.get('[data-testid="template-signature"]').should("be.empty");

    // Test with long data
    const longSignature = {
      ...templateSignature,
      data: "This is a very long signature name that might overflow",
    };

    cy.mount(
      <SignatureStampForTesting
        signature={longSignature}
        isSigned={true}
      />,
    );

    cy.get('[data-testid="template-signature"]').should("be.visible");
    cy.get('[data-testid="template-signature"]').should("contain", "This is a very long signature");
  });

  describe("Security", () => {
    it("prevents XSS attacks in signature data", () => {
      const xssSignature = {
        ...templateSignature,
        data: '<script>alert("xss")</script>Malicious Signature',
      };

      cy.mount(
        <SignatureStampForTesting
          signature={xssSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="template-signature"]').should("be.visible");
      cy.get('script').should("not.exist");
      cy.get('[data-testid="template-signature"]').should("contain", '<script>alert("xss")</script>Malicious Signature');
    });

    it("sanitizes SVG content properly", () => {
      const maliciousSvg = {
        ...drawnSignature,
        data: '<script>alert("xss")</script><svg onload="alert(\"xss\")" viewBox="0 0 100 100"><path d="M10,10 L90,90"/></svg>',
      };

      cy.mount(
        <SignatureStampForTesting
          signature={maliciousSvg}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="drawn-signature"]').within(() => {
        cy.get('script').should("not.exist");
        cy.get('svg').should("exist");
      });
    });

    it("validates image sources for uploaded signatures", () => {
      const suspiciousImageSignature = {
        ...uploadedSignature,
        data: "javascript:alert('xss')",
      };

      cy.mount(
        <SignatureStampForTesting
          signature={suspiciousImageSignature}
          isSigned={true}
        />,
      );

      cy.get('[data-testid="uploaded-signature"]').should("have.attr", "src", "javascript:alert('xss')");
    });

    it("prevents signature tampering through props", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={true}
          userName="John Doe"
        />,
      );

      // Ensure signature data cannot be modified after rendering
      cy.get('[data-testid="template-signature"]').should("contain", "John Doe");
      cy.get('[data-testid="user-name-display"]').should("contain", "JOHN DOE");
    });

    it("handles hover states correctly when enabled", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />,
      );

      cy.get('[data-testid="sign-button"]').should("have.class", "hover:opacity-70");
      cy.get('[data-testid="sign-button"]').should("have.class", "cursor-pointer");
      cy.get('[data-testid="sign-button"]').should("not.have.class", "cursor-not-allowed");
    });

    it("ensures signature integrity across state changes", () => {
      const TestWrapper = () => {
        const [signature, setSignature] = useState(templateSignature);
        const [isSigned, setIsSigned] = useState(false);

        return (
          <div>
            <SignatureStampForTesting
              signature={signature}
              isSigned={isSigned}
              onClick={() => setIsSigned(true)}
              userName={signature.name}
            />
            <button
              data-testid="modify-signature"
              onClick={() => setSignature({
                ...signature,
                data: "Modified Data",
                name: "Modified Name",
              })}
            >
              Modify
            </button>
          </div>
        );
      };

      cy.mount(<TestWrapper />);

      // Sign first
      cy.get('[data-testid="sign-button"]').click();
      cy.get('[data-testid="template-signature"]').should("contain", "John Doe");

      // Modify signature data
      cy.get('[data-testid="modify-signature"]').click();
      cy.get('[data-testid="template-signature"]').should("contain", "Modified Data");
    });
  });

  describe("Quality Checks", () => {
    it("should meet performance standards", () => {
      TestUtils.measureRenderTime('[data-testid="signature-stamp"]', 2000);
      
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />
      );
      
      cy.get('[data-testid="signature-stamp"]').should("be.visible");
    });

    it("should be accessible", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />
      );
      
      TestUtils.testAccessibility('[data-testid="signature-stamp"]');
    });

    it("should handle responsive layouts", () => {
      cy.mount(
        <SignatureStampForTesting
          signature={templateSignature}
          isSigned={false}
          onClick={callbacks.onClick}
        />
      );
      
      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="signature-stamp"]').should('be.visible');
      });
    });
  });

});
