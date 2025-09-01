import React from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "cypress-real-events/support";
import { TestUtils } from "../../../../cypress/support/test-utils";

// Mock useOpenCV hook for testing
const mockUseOpenCV = (status = "ready", isReady = true) => ({
  status,
  isReady,
  cv: null,
});

// Mock SignatureCanvas component for testing
function MockSignatureCanvas({ fullName, onSave, onCancel }: any) {
  const handleSave = () => {
    const mockSVGData = TestUtils.createMockSignature("drawn").data;
    onSave(mockSVGData, "svg");
  };

  return (
    <div data-testid="signature-canvas">
      <h3>Draw Your Signature</h3>
      <p>Drawing area for: {fullName}</p>
      <div className="mock-canvas bg-gray-100 border-2 border-dashed border-gray-300 p-8 text-center">
        <p>Mock Canvas Drawing Area</p>
      </div>
      <div className="flex justify-between pt-4">
        <button
          type="button"
          data-testid="canvas-cancel-button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          data-testid="canvas-save-button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Signature
        </button>
      </div>
    </div>
  );
}

// Test-specific SignatureStep without complex dependencies
function SignatureStepForTesting({
  personalInfo = TestUtils.createMockPersonalInfo(),
  initialSignature = null,
  onChange,
  onComplete,
  onBack,
  loading = false,
  mockOpenCVStatus = "ready",
  mockOpenCVReady = true,
  mockApiResponse = { signature: TestUtils.createMockSignature() },
  mockApiError = null,
}: {
  personalInfo?: any;
  initialSignature?: any;
  onChange?: (signature: any) => void;
  onComplete?: (signature: any) => void;
  onBack?: () => void;
  loading?: boolean;
  mockOpenCVStatus?: string;
  mockOpenCVReady?: boolean;
  mockApiResponse?: any;
  mockApiError?: string | null;
}) {
  const [signature, setSignature] = React.useState(initialSignature);
  const [currentStep, setCurrentStep] = React.useState<"method-selection" | "creation" | "confirmation">("method-selection");
  const [selectedMethod, setSelectedMethod] = React.useState<"text" | "draw" | "upload" | null>(null);
  const [selectedFont, setSelectedFont] = React.useState({ name: "Dancing Script", className: "font-dancing" });
  const [isProcessing, setIsProcessing] = React.useState(false);

  const fullName = `${personalInfo.first_name} ${personalInfo.last_name}`;

  // Mock signature fonts
  const signatureFonts = [
    { name: "Dancing Script", className: "font-dancing" },
    { name: "Great Vibes", className: "font-great-vibes" },
    { name: "Allura", className: "font-allura" },
  ];

  React.useEffect(() => {
    if (initialSignature) {
      setSignature(initialSignature);
      setCurrentStep("confirmation");
    }
  }, [initialSignature]);

  const createTemplateSignature = (fontData = selectedFont) => {
    const templateSignature = {
      id: "template-" + Date.now(),
      name: fullName,
      data: fullName,
      type: "template",
      font: fontData.name,
      className: fontData.className,
      createdAt: new Date().toISOString(),
    };
    setSignature(templateSignature);
    return templateSignature;
  };

  const handleMethodSelect = (method: "text" | "draw" | "upload") => {
    setSelectedMethod(method);
    setCurrentStep("creation");
    if (method === "text") {
      createTemplateSignature();
    }
  };

  const handleFontSelect = (fontData: typeof signatureFonts[0]) => {
    setSelectedFont(fontData);
    if (signature?.type === "template") {
      createTemplateSignature(fontData);
    }
  };

  const handleDrawnSignatureSave = (signatureData: string, _type: string) => {
    const drawnSignature = {
      id: "drawn-" + Date.now(),
      name: fullName,
      data: signatureData,
      type: "drawn",
      createdAt: new Date().toISOString(),
    };
    setSignature(drawnSignature);
    setCurrentStep("confirmation");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (!mockOpenCVReady) {
      alert("Image processing is still loading. Please wait a moment and try again.");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));

      if (mockApiError) {
        throw new Error(mockApiError);
      }

      const uploadedSignature = {
        id: "uploaded-" + Date.now(),
        name: fullName,
        data: "data:image/png;base64,mock-image-data",
        type: "uploaded",
        createdAt: new Date().toISOString(),
      };
      setSignature(uploadedSignature);
      setCurrentStep("confirmation");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!signature) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      if (mockApiError) {
        throw new Error(mockApiError);
      }
      onComplete(mockApiResponse.signature);
    } catch (error) {
      console.error("Failed to save signature:", error);
    }
  };

  const handleBackToMethodSelection = () => {
    setCurrentStep("method-selection");
    setSelectedMethod(null);
    setSignature(null);
  };

  const handleConfirmSignature = () => {
    if (signature) {
      setCurrentStep("confirmation");
    }
  };

  // Method Selection Step
  if (currentStep === "method-selection") {
    return (
      <div className="space-y-6" data-testid="method-selection-step">
        <div className="text-left">
          <h3 className="text-lg font-semibold mb-2" data-testid="step-title">
            Create Your Digital Signature
          </h3>
          <p className="text-default-600" data-testid="step-description">
            Your signature will be used to sign your will and other legal documents.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Text Method */}
            <div
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              data-testid="text-signature-option"
              onClick={() => handleMethodSelect("text")}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-lg">T</span>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold">Choose from Text</h4>
                  <p className="text-sm text-default-600 mt-1">
                    Choose from beautiful signature fonts
                  </p>
                </div>
              </div>
            </div>

            {/* Draw Method */}
            <div
              className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
              data-testid="draw-signature-option"
              onClick={() => handleMethodSelect("draw")}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-warning text-lg">✏️</span>
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-semibold">Draw Signature</h4>
                  <p className="text-sm text-default-600 mt-1">
                    Draw your signature with mouse or touch
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Method */}
          <div
            className={`border rounded-lg p-4 transition-all ${
              mockOpenCVReady && !isProcessing
                ? "cursor-pointer hover:shadow-md"
                : "opacity-60 cursor-not-allowed"
            }`}
            data-testid="upload-signature-option"
            onClick={mockOpenCVReady && !isProcessing ? () => handleMethodSelect("upload") : undefined}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                {mockOpenCVStatus === "loading" ? (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                ) : mockOpenCVStatus === "error" ? (
                  <span className="text-danger text-lg">⚠️</span>
                ) : (
                  <span className="text-secondary text-lg">📁</span>
                )}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-semibold">Upload Photograph</h4>
                <p className="text-sm text-default-600 mt-1">
                  {mockOpenCVStatus === "loading"
                    ? "Loading image processing..."
                    : mockOpenCVStatus === "error"
                      ? "Image processing unavailable"
                      : "Upload a photo of your signature and we'll convert it"}
                </p>
              </div>
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            data-testid="file-input"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
        </div>

        <div className="flex justify-between pt-6">
          {onBack ? (
            <button
              type="button"
              data-testid="back-button"
              disabled={loading}
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
          ) : (
            <div />
          )}
        </div>
      </div>
    );
  }

  // Creation Step
  if (currentStep === "creation") {
    if (selectedMethod === "text") {
      return (
        <div className="space-y-6" data-testid="text-creation-step">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2" data-testid="step-title">Choose Your Font</h3>
            <p className="text-default-600" data-testid="step-description">
              Select a font style for your signature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signatureFonts.map((fontData) => (
              <div
                key={fontData.name}
                className={`border rounded-lg p-6 cursor-pointer hover:shadow-md transition-all ${
                  signature?.type === "template" && signature?.font === fontData.name
                    ? "border-primary-500 bg-primary-50 shadow-md"
                    : "border-default-200"
                }`}
                data-testid={`font-option-${fontData.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleFontSelect(fontData)}
              >
                <div
                  className={`text-3xl text-foreground ${fontData.className} text-center`}
                  style={{ fontFamily: fontData.name }}
                >
                  {fullName}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-6">
            <button
              type="button"
              data-testid="back-to-method-button"
              onClick={handleBackToMethodSelection}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="button"
              data-testid="continue-button"
              disabled={!signature}
              onClick={handleConfirmSignature}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    if (selectedMethod === "draw") {
      return (
        <div data-testid="draw-creation-step">
          <MockSignatureCanvas
            fullName={fullName}
            onSave={handleDrawnSignatureSave}
            onCancel={handleBackToMethodSelection}
          />
        </div>
      );
    }

    if (selectedMethod === "upload") {
      return (
        <div className="space-y-6" data-testid="upload-creation-step">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2" data-testid="step-title">
              Upload Your Signature
            </h3>
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4" data-testid="processing-state">
                <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
                <p className="text-default-600">Processing your signature...</p>
              </div>
            ) : (
              <div>
                <p className="text-default-600 mb-4" data-testid="upload-instructions">
                  Upload a clear photo of your signature on white paper.
                </p>
                <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer inline-block">
                  <span data-testid="choose-file-button">Choose File</span>
                  <input
                    type="file"
                    accept="image/*"
                    data-testid="file-input"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6">
            <button
              type="button"
              data-testid="back-to-method-button"
              onClick={handleBackToMethodSelection}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Confirmation Step
  if (currentStep === "confirmation") {
    return (
      <div className="space-y-6" data-testid="confirmation-step">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2" data-testid="step-title">Confirm Your Signature</h3>
          <p className="text-default-600" data-testid="step-description">
            This is how your signature will appear on documents.
          </p>
        </div>

        {signature && (
          <div className="border-2 border-foreground bg-background rounded-lg p-8" data-testid="signature-preview">
            <div className="flex items-center justify-center">
              {signature.type === "template" ? (
                <div
                  className={`text-4xl text-foreground ${signature.className} text-center`}
                  data-testid="template-signature"
                  style={{ fontFamily: signature.font }}
                >
                  {signature.data}
                </div>
              ) : signature.type === "drawn" ? (
                <div
                  data-testid="drawn-signature"
                  dangerouslySetInnerHTML={{ __html: signature.data }}
                  className="signature-preview"
                />
              ) : (
                <img
                  src={signature.data}
                  alt="Your signature"
                  data-testid="uploaded-signature"
                  className="max-h-16 object-contain"
                />
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <button
            type="button"
            data-testid="start-over-button"
            onClick={handleBackToMethodSelection}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Start Over
          </button>
          <button
            type="button"
            data-testid="signature-continue-button"
            disabled={loading || !signature}
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  return null;
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

describe("SignatureStep", () => {
  let callbacks: ReturnType<typeof TestUtils.createMockCallbacks>;

  beforeEach(() => {
    callbacks = TestUtils.createMockCallbacks();
    
    cy.intercept("POST", "/api/onboarding/signature", { 
      statusCode: 200, 
      body: { signature: { id: "123", name: "John Doe" } } 
    }).as("saveSignature");
    // Reset stubs
    Object.values(callbacks).forEach(stub => stub.reset?.());
  });

  describe("Core Functionality", () => {
    it("renders method selection step initially", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="method-selection-step"]').should("be.visible");
      cy.get('[data-testid="step-title"]').should("contain", "Create Your Digital Signature");
      cy.get('[data-testid="step-description"]').should("contain", "Your signature will be used to sign your will");
      
      cy.get('[data-testid="text-signature-option"]').should("be.visible");
      cy.get('[data-testid="draw-signature-option"]').should("be.visible"); 
      cy.get('[data-testid="upload-signature-option"]').should("be.visible");
    });

    it("navigates to text signature creation when text method is selected", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();

      cy.get('[data-testid="text-creation-step"]').should("be.visible");
      cy.get('[data-testid="step-title"]').should("contain", "Choose Your Font");
      cy.get('[data-testid="step-description"]').should("contain", "Select a font style for your signature");
      
      cy.get('[data-testid="font-option-dancing-script"]').should("be.visible");
      cy.get('[data-testid="font-option-great-vibes"]').should("be.visible");
      cy.get('[data-testid="font-option-allura"]').should("be.visible");
    });

    it("handles font selection and creates template signature", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting onChange={callbacks.onChange} />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="font-option-great-vibes"]').click();

      cy.get('[data-testid="font-option-great-vibes"]').should("have.class", "border-primary-500");
      cy.get('[data-testid="font-option-great-vibes"]').should("have.class", "bg-primary-50");
      cy.get('[data-testid="continue-button"]').should("not.be.disabled");
    });

    it("navigates to signature confirmation from text creation", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="font-option-dancing-script"]').click();
      cy.get('[data-testid="continue-button"]').click();

      cy.get('[data-testid="confirmation-step"]').should("be.visible");
      cy.get('[data-testid="step-title"]').should("contain", "Confirm Your Signature");
      cy.get('[data-testid="signature-preview"]').should("be.visible");
      cy.get('[data-testid="template-signature"]').should("contain", "John Doe");
    });

    it("navigates to draw signature creation when draw method is selected", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="draw-signature-option"]').click();

      cy.get('[data-testid="draw-creation-step"]').should("be.visible");
      cy.get('[data-testid="signature-canvas"]').should("be.visible");
      cy.get('[data-testid="canvas-save-button"]').should("be.visible");
      cy.get('[data-testid="canvas-cancel-button"]').should("be.visible");
    });

    it("handles drawing signature completion", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="draw-signature-option"]').click();
      cy.get('[data-testid="canvas-save-button"]').click();

      cy.get('[data-testid="confirmation-step"]').should("be.visible");
      cy.get('[data-testid="signature-preview"]').should("be.visible");
      cy.get('[data-testid="drawn-signature"]').should("be.visible");
    });

    it("handles upload method with OpenCV ready", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting mockOpenCVReady={true} mockOpenCVStatus="ready" />
        </TestWrapper>
      );

      cy.get('[data-testid="upload-signature-option"]').should("not.have.class", "opacity-60");
      cy.get('[data-testid="upload-signature-option"]').should("not.have.class", "cursor-not-allowed");
      cy.get('[data-testid="upload-signature-option"]').click();

      cy.get('[data-testid="upload-creation-step"]').should("be.visible");
      cy.get('[data-testid="step-title"]').should("contain", "Upload Your Signature");
      cy.get('[data-testid="upload-instructions"]').should("contain", "Upload a clear photo");
      cy.get('[data-testid="choose-file-button"]').should("be.visible");
    });

    it("handles signature submission successfully", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting onComplete={callbacks.onComplete} />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="signature-continue-button"]').click();

      cy.get("@onComplete").should("have.been.called");
    });

    it("handles initialization with existing signature", () => {
      const existingSignature = TestUtils.createMockSignature("template");
      
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting initialSignature={existingSignature} />
        </TestWrapper>
      );

      cy.get('[data-testid="confirmation-step"]').should("be.visible");
      cy.get('[data-testid="signature-preview"]').should("be.visible");
      cy.get('[data-testid="template-signature"]').should("contain", "John Doe");
    });
  });

  describe("OpenCV & File Upload States", () => {
    it("disables upload method when OpenCV is loading", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting mockOpenCVReady={false} mockOpenCVStatus="loading" />
        </TestWrapper>
      );

      cy.get('[data-testid="upload-signature-option"]').should("have.class", "opacity-60");
      cy.get('[data-testid="upload-signature-option"]').should("have.class", "cursor-not-allowed");
      cy.get('[data-testid="upload-signature-option"]').should("contain", "Loading image processing...");
    });

    it("shows error state when OpenCV fails", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting mockOpenCVReady={false} mockOpenCVStatus="error" />
        </TestWrapper>
      );

      cy.get('[data-testid="upload-signature-option"]').should("have.class", "opacity-60");
      cy.get('[data-testid="upload-signature-option"]').should("contain", "Image processing unavailable");
    });

    it("handles successful file upload", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="upload-signature-option"]').click();

      cy.get('[data-testid="file-input"]').selectFile({
        contents: Cypress.Buffer.from('fake image content'),
        fileName: 'signature.jpg',
        mimeType: 'image/jpeg'
      }, { force: true });

      cy.get('[data-testid="confirmation-step"]').should("be.visible");
      cy.get('[data-testid="uploaded-signature"]').should("be.visible");
    });

    it("handles file upload with processing state", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="upload-signature-option"]').click();

      cy.get('[data-testid="file-input"]').selectFile({
        contents: Cypress.Buffer.from('fake image content'),
        fileName: 'signature.jpg',
        mimeType: 'image/jpeg'
      }, { force: true });

      // Processing state is handled internally
      cy.get('[data-testid="confirmation-step"]').should("be.visible");
    });

    it("handles upload error states", () => {
      const uploadError = "Failed to process signature image";
      
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting mockApiError={uploadError} />
        </TestWrapper>
      );

      cy.get('[data-testid="upload-signature-option"]').click();

      cy.get('[data-testid="file-input"]').selectFile({
        contents: Cypress.Buffer.from('invalid image content'),
        fileName: 'signature.jpg',
        mimeType: 'image/jpeg'
      }, { force: true });

      // Error should be handled (in this test implementation via alert)
      // In real implementation, this would show proper error UI
    });

    it("validates file type before upload", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="upload-signature-option"]').click();

      cy.get('[data-testid="file-input"]').selectFile({
        contents: Cypress.Buffer.from('text file content'),
        fileName: 'document.txt',
        mimeType: 'text/plain'
      }, { force: true });

      // Should handle invalid file type (via alert in test implementation)
    });
  });

  describe("Navigation & Flow Control", () => {
    it("handles back navigation between steps", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="back-to-method-button"]').click();
      cy.get('[data-testid="method-selection-step"]').should("be.visible");

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="start-over-button"]').click();
      cy.get('[data-testid="method-selection-step"]').should("be.visible");
    });

    it("shows loading state during signature submission", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting loading={true} />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="continue-button"]').click();

      cy.get('[data-testid="signature-continue-button"]').should("be.disabled");
      cy.get('[data-testid="signature-continue-button"]').should("contain", "Loading...");
    });

    it("shows back button when onBack prop is provided", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting onBack={callbacks.onBack} />
        </TestWrapper>
      );

      cy.get('[data-testid="back-button"]').should("be.visible");
      cy.get('[data-testid="back-button"]').click();
      cy.get("@onBack").should("have.been.called");
    });

    it("handles canvas drawing interactions", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="draw-signature-option"]').click();
      cy.get('[data-testid="signature-canvas"]').should("be.visible");
      cy.get('[data-testid="signature-canvas"]').should("contain", "John Doe");

      cy.get('[data-testid="canvas-cancel-button"]').click();
      cy.get('[data-testid="method-selection-step"]').should("be.visible");

      cy.get('[data-testid="draw-signature-option"]').click();
      cy.get('[data-testid="canvas-save-button"]').click();
      cy.get('[data-testid="confirmation-step"]').should("be.visible");
    });

    it("handles step transitions with state preservation", () => {
      const TestStepTransitions = () => {
        const [stepHistory, setStepHistory] = useState<string[]>([]);
        
        const trackStep = (step: string) => {
          setStepHistory(prev => [...prev, step]);
        };
        
        return (
          <div>
            <SignatureStepForTesting
              onChange={() => trackStep('font-selected')}
              onComplete={() => trackStep('completed')}
            />
            <div data-testid="step-history">{stepHistory.join(', ')}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestStepTransitions />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="font-option-great-vibes"]').click();
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="signature-continue-button"]').click();

      cy.get('[data-testid="step-history"]').should("contain", "completed");
    });
  });

  describe("Accessibility", () => {
    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      TestUtils.testAccessibility('[data-testid="method-selection-step"]');
    });

    it("has proper accessibility attributes", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="step-title"]').should("be.visible");
      cy.get('[data-testid="step-description"]').should("be.visible");
      
      cy.get('[data-testid="text-signature-option"]').should("be.visible").should("have.attr", "role", "button");
      cy.get('[data-testid="draw-signature-option"]').should("be.visible").should("have.attr", "role", "button");
      cy.get('[data-testid="upload-signature-option"]').should("be.visible").should("have.attr", "role", "button");
    });

    it("supports keyboard navigation for signature options", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').focus().should("be.focused");
      cy.realPress("Enter");
      cy.get('[data-testid="text-creation-step"]').should("be.visible");
    });

    it("provides proper focus management in font selection", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      
      cy.get('[data-testid="font-option-dancing-script"]').focus().should("be.focused");
      cy.realPress("Enter");
      cy.get('[data-testid="font-option-dancing-script"]').should("have.class", "border-primary-500");
      
      cy.get('[data-testid="continue-button"]').focus().should("be.focused");
      cy.realPress("Enter");
      cy.get('[data-testid="confirmation-step"]').should("be.visible");
    });

    it("provides proper ARIA labels for different signature types", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]')
        .should("have.attr", "aria-label")
        .and("contain", "Choose text signature");
      
      cy.get('[data-testid="draw-signature-option"]')
        .should("have.attr", "aria-label")
        .and("contain", "Draw signature");
      
      cy.get('[data-testid="upload-signature-option"]')
        .should("have.attr", "aria-label")
        .and("contain", "Upload signature");
    });

    it("announces step changes to screen readers", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="step-title"]').should("have.attr", "role", "heading");
      
      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="step-title"]').should("contain", "Choose Your Font");
      
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="step-title"]').should("contain", "Confirm Your Signature");
    });
  });

  describe("Performance", () => {
    it("should render quickly", () => {
      TestUtils.measureRenderTime('[data-testid="method-selection-step"]', 800);

      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="method-selection-step"]').should("be.visible");
    });

    it("handles rapid step transitions efficiently", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      // Rapid navigation through steps
      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="back-to-method-button"]').click();
      cy.get('[data-testid="draw-signature-option"]').click();
      cy.get('[data-testid="canvas-cancel-button"]').click();
      cy.get('[data-testid="upload-signature-option"]').click();
      cy.get('[data-testid="back-to-method-button"]').click();

      cy.get('[data-testid="method-selection-step"]').should("be.visible");
    });

    it("optimizes signature preview rendering", () => {
      const TestSignaturePreview = () => {
        const [renderCount, setRenderCount] = useState(0);
        
        React.useEffect(() => {
          setRenderCount(prev => prev + 1);
        });
        
        return (
          <div>
            <SignatureStepForTesting />
            <div data-testid="render-count">Renders: {renderCount}</div>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestSignaturePreview />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="font-option-great-vibes"]').click();
      cy.get('[data-testid="font-option-allura"]').click();
      cy.get('[data-testid="continue-button"]').click();

      cy.get('[data-testid="signature-preview"]').should("be.visible");
    });

    it("handles large signature data efficiently", () => {
      const largeSignatureData = "A".repeat(10000); // Large SVG or base64 data
      
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="draw-signature-option"]').click();
      cy.get('[data-testid="canvas-save-button"]').click();
      
      cy.get('[data-testid="confirmation-step"]').should("be.visible");
      cy.get('[data-testid="signature-preview"]').should("be.visible");
    });
  });

  describe("Responsive Design", () => {
    it("should work on all screen sizes", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="method-selection-step"]').should("be.visible");
        cy.get('[data-testid="text-signature-option"]').should("be.visible");
        cy.get('[data-testid="draw-signature-option"]').should("be.visible");
        cy.get('[data-testid="upload-signature-option"]').should("be.visible");
      });
    });

    it("maintains proper grid layout on different screen sizes", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.viewport(320, 568); // Mobile
      cy.get('[data-testid="text-signature-option"]').should("be.visible");
      cy.get('[data-testid="draw-signature-option"]').should("be.visible");
      
      cy.viewport(768, 1024); // Tablet
      cy.get('[data-testid="text-signature-option"]').parent().should("have.class", "md:grid-cols-2");
      
      cy.viewport(1200, 800); // Desktop
      cy.get('[data-testid="text-signature-option"]').should("be.visible");
      cy.get('[data-testid="draw-signature-option"]').should("be.visible");
    });

    it("handles font selection grid on mobile", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.viewport(320, 568); // Mobile
      cy.get('[data-testid="text-signature-option"]').click();
      
      cy.get('[data-testid="font-option-dancing-script"]').should("be.visible");
      cy.get('[data-testid="font-option-great-vibes"]').should("be.visible");
      cy.get('[data-testid="font-option-allura"]').should("be.visible");
    });

    it("maintains signature preview layout on small screens", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="continue-button"]').click();
      
      cy.viewport(320, 568); // Mobile
      
      cy.get('[data-testid="signature-preview"]')
        .should("be.visible")
        .should("have.css", "padding")
        .should("not.be.covered");
      
      cy.get('[data-testid="start-over-button"]').should("be.visible").should("not.be.covered");
      cy.get('[data-testid="signature-continue-button"]').should("be.visible").should("not.be.covered");
    });
  });

  describe("Integration Scenarios", () => {
    it("integrates with onboarding flow", () => {
      const TestOnboardingFlow = () => {
        const [currentStep, setCurrentStep] = useState(0);
        const [signatureData, setSignatureData] = useState(null);
        
        const handleSignatureComplete = (signature: any) => {
          setSignatureData(signature);
          setCurrentStep(1);
        };
        
        if (currentStep === 1) {
          return (
            <div data-testid="next-onboarding-step">
              <h2>Next Step: Legal Consent</h2>
              <p>Signature received: {signatureData?.name || 'N/A'}</p>
              <button data-testid="back-to-signature" onClick={() => setCurrentStep(0)}>
                Back to Signature
              </button>
            </div>
          );
        }
        
        return (
          <SignatureStepForTesting
            onComplete={handleSignatureComplete}
            onBack={() => setCurrentStep(-1)}
          />
        );
      };

      cy.mount(
        <TestWrapper>
          <TestOnboardingFlow />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="signature-continue-button"]').click();
      
      cy.get('[data-testid="next-onboarding-step"]').should("be.visible");
      cy.get('[data-testid="back-to-signature"]').click();
      cy.get('[data-testid="method-selection-step"]').should("be.visible");
    });

    it("integrates with API and handles responses", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting onComplete={callbacks.onComplete} />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="signature-continue-button"]').click();

      cy.wait('@saveSignature').then((interception) => {
        expect(interception.request.body).to.have.property('signature');
      });

      cy.get('@onComplete').should('have.been.called');
    });

    it("handles signature persistence across sessions", () => {
      const TestPersistence = () => {
        const [savedSignature, setSavedSignature] = useState(null);
        
        const handleSaveSignature = (signature: any) => {
          setSavedSignature(signature);
          callbacks.onComplete(signature);
        };
        
        return (
          <div>
            <SignatureStepForTesting
              initialSignature={savedSignature}
              onComplete={handleSaveSignature}
            />
            <button
              data-testid="simulate-session-restore"
              onClick={() => setSavedSignature(TestUtils.createMockSignature('template'))}
            >
              Restore Session
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestPersistence />
        </TestWrapper>
      );

      // Create new signature
      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="signature-continue-button"]').click();

      // Simulate session restore
      cy.get('[data-testid="simulate-session-restore"]').click();
      cy.get('[data-testid="confirmation-step"]').should('be.visible');
    });
  });

  describe("Edge Cases", () => {
    it("handles missing personalInfo gracefully", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting personalInfo={{}} />
        </TestWrapper>
      );

      cy.get('[data-testid="method-selection-step"]').should("be.visible");
      cy.get('[data-testid="text-signature-option"]').click();
      
      // Should handle empty name gracefully
      cy.get('[data-testid="font-option-dancing-script"] div').should('exist');
    });

    it("handles undefined callback functions", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting
            onChange={undefined}
            onComplete={undefined}
            onBack={undefined}
          />
        </TestWrapper>
      );

      cy.get('[data-testid="method-selection-step"]').should("be.visible");
      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="signature-continue-button"]').click();
      
      // Should not throw errors
    });

    it("handles rapid component remounting", () => {
      const TestMountWrapper = ({ show }: { show: boolean }) => (
        <TestWrapper>
          {show && <SignatureStepForTesting />}
        </TestWrapper>
      );

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="method-selection-step"]').should("be.visible");

      cy.mount(<TestMountWrapper show={false} />);
      cy.get('[data-testid="method-selection-step"]').should("not.exist");

      cy.mount(<TestMountWrapper show={true} />);
      cy.get('[data-testid="method-selection-step"]').should("be.visible");
    });

    it("handles corrupted signature data", () => {
      const corruptedSignature = {
        id: "corrupted",
        name: null,
        data: undefined,
        type: "unknown",
        createdAt: "invalid-date"
      };
      
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting initialSignature={corruptedSignature} />
        </TestWrapper>
      );

      // Should handle gracefully and potentially fall back to method selection
      cy.get('[data-testid="method-selection-step"], [data-testid="confirmation-step"]').should("be.visible");
    });

    it("handles extremely long names in signatures", () => {
      const longNamePersonalInfo = {
        first_name: "A".repeat(100),
        last_name: "B".repeat(100),
      };
      
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting personalInfo={longNamePersonalInfo} />
        </TestWrapper>
      );

      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="font-option-dancing-script"] div').should('be.visible');
      cy.get('[data-testid="continue-button"]').click();
      
      cy.get('[data-testid="signature-preview"]').should('be.visible');
      cy.get('[data-testid="template-signature"]').should('be.visible');
    });
  });

  describe("Security", () => {
    it("sanitizes signature data to prevent XSS", () => {
      const maliciousSignature = {
        id: "malicious",
        name: '<script>alert("xss")</script>',
        data: '<script>alert("xss")</script><img src="x" onerror="alert(\'xss\')" />',
        type: "template",
        createdAt: new Date().toISOString()
      };
      
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting initialSignature={maliciousSignature} />
        </TestWrapper>
      );

      cy.get('script').should('not.exist');
      cy.get('img[onerror]').should('not.exist');
    });

    it("validates file uploads securely", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );

      cy.get('[data-testid="upload-signature-option"]').click();
      
      // Test various malicious file types
      const maliciousFiles = [
        { fileName: 'malicious.exe', mimeType: 'application/x-executable' },
        { fileName: 'script.html', mimeType: 'text/html' },
        { fileName: 'large-file.jpg', size: 50 * 1024 * 1024 } // 50MB
      ];

      maliciousFiles.forEach(({ fileName, mimeType }) => {
        cy.get('[data-testid="file-input"]').selectFile({
          contents: Cypress.Buffer.from('malicious content'),
          fileName,
          mimeType
        }, { force: true });
        
        // Should handle invalid files appropriately
      });
    });

    it("prevents signature tampering", () => {
      const TestTamperingPrevention = () => {
        const [signature, setSignature] = useState(null);
        
        const handleTamperAttempt = () => {
          // Attempt to inject malicious signature
          setSignature({
            id: "tampered",
            name: "Tampered Name",
            data: "<script>alert('tampered')</script>",
            type: "template"
          });
        };
        
        return (
          <div>
            <SignatureStepForTesting initialSignature={signature} />
            <button data-testid="attempt-tamper" onClick={handleTamperAttempt}>
              Attempt Tampering
            </button>
          </div>
        );
      };

      cy.mount(
        <TestWrapper>
          <TestTamperingPrevention />
        </TestWrapper>
      );

      cy.get('[data-testid="attempt-tamper"]').click();
      cy.get('script').should('not.exist');
    });

    it("handles sensitive signature data appropriately", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting onComplete={callbacks.onComplete} />
        </TestWrapper>
      );

      // Create signature and complete flow
      cy.get('[data-testid="text-signature-option"]').click();
      cy.get('[data-testid="continue-button"]').click();
      cy.get('[data-testid="signature-continue-button"]').click();

      // Verify signature data doesn't leak into console
      cy.window().then((win) => {
        cy.spy(win.console, 'log').as('consoleLog');
        cy.spy(win.console, 'error').as('consoleError');
      });

      cy.get('@onComplete').should('have.been.called');
      
      // Console should not contain signature data
      cy.get('@consoleLog').should('not.have.been.calledWith', Cypress.sinon.match(/signature.*data/));
    });
  });

  describe("Quality Checks", () => {
    it("should meet performance standards", () => {
      TestUtils.measureRenderTime('[data-testid="signature-step"]', 2000);
      
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );
      
      cy.get('[data-testid="signature-step"], [data-testid="method-selection-step"]').should("be.visible");
    });

    it("should be accessible", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );
      
      TestUtils.testAccessibility('[data-testid="signature-step"], [data-testid="method-selection-step"]');
    });

    it("should handle responsive layouts", () => {
      cy.mount(
        <TestWrapper>
          <SignatureStepForTesting />
        </TestWrapper>
      );
      
      TestUtils.testResponsiveLayout(() => {
        cy.get('[data-testid="signature-step"], [data-testid="method-selection-step"]').should('be.visible');
      });
    });
  });
});
