"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import Image from "next/image";

import { PersonalInfo, Signature } from "@/types/onboarding";
import { signatureFonts } from "@/config/fonts";
import { processSignatureImage } from "@/lib/signature-extract";
import { useOpenCV } from "@/hooks/useOpenCV";
import { SignatureCanvas } from "@/components/auth/SignatureCanvas";

interface SignatureStepProps {
  personalInfo: PersonalInfo;
  initialSignature: Signature | null;
  onChange: (signature: Signature | null) => void;
  onComplete: (signature: Signature) => void;
  onBack?: () => void;
  loading: boolean;
}

type Step = "method-selection" | "creation" | "confirmation";
type Method = "text" | "draw" | "upload";

export function SignatureStep({
  personalInfo,
  initialSignature,
  onChange,
  onComplete,
  onBack,
  loading,
}: SignatureStepProps) {
  const [signature, setSignature] = useState<Signature | null>(
    initialSignature,
  );
  const [currentStep, setCurrentStep] = useState<Step>("method-selection");
  const [selectedMethod, setSelectedMethod] = useState<Method | null>(null);
  const [selectedFont, setSelectedFont] = useState(signatureFonts[0]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize from existing signature
  useEffect(() => {
    if (initialSignature) {
      setSignature(initialSignature);
      setCurrentStep("confirmation");

      // Set selected font for template signatures
      if (initialSignature.type === "template" && initialSignature.font) {
        const matchingFont = signatureFonts.find(
          (f) => f.name === initialSignature.font,
        );

        if (matchingFont) {
          setSelectedFont(matchingFont);
        }
      }
    }
  }, [initialSignature]);

  // Auto-trigger file input when upload method is selected
  useEffect(() => {
    if (selectedMethod === "upload" && currentStep === "creation") {
      handleUploadClick();
    }
  }, [selectedMethod, currentStep]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status: openCVStatus, isReady: isOpenCVReady } = useOpenCV();

  const fullName = `${personalInfo.first_name} ${personalInfo.last_name}`;

  const createTemplateSignature = (fontData = selectedFont) => {
    const templateSignature: Signature = {
      id: "template-" + Date.now(),
      name: fullName,
      data: fullName,
      type: "template",
      font: fontData.name,
      className: fontData.className,
      createdAt: new Date().toISOString(),
    };

    setSignature(templateSignature);
    // Don't call onChange with template signatures - only when finalized
    // onChange(templateSignature);
  };

  const handleFontSelect = (fontData: (typeof signatureFonts)[0]) => {
    setSelectedFont(fontData);
    if (signature && signature.type === "template") {
      // Update existing signature with new font
      createTemplateSignature(fontData);
    }
  };

  // Step Navigation Handlers
  const handleMethodSelect = (method: Method) => {
    setSelectedMethod(method);
    setCurrentStep("creation");

    if (method === "text") {
      createTemplateSignature();
    }
  };

  const handleBackToMethodSelection = () => {
    setCurrentStep("method-selection");
    setSelectedMethod(null);
    setSignature(null);
  };

  const handleBackToCreation = () => {
    setCurrentStep("creation");
  };

  const handleConfirmSignature = () => {
    if (signature) {
      setCurrentStep("confirmation");
    }
  };

  // Final submission handler
  const handleSubmit = async () => {
    if (!signature) return;

    try {
      const response = await fetch("/api/onboarding/signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signature.name,
          signatureType: signature.type,
          signatureData: signature.data,
          font: signature.font,
          className: signature.className,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save signature");
      }

      const result = await response.json();

      onComplete(result.signature);
    } catch {
      // Error handling signature save
    }
  };

  // Method-specific handlers
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrawnSignatureSave = (
    signatureData: string,
    _signatureType: "svg" | "png",
  ) => {
    // Create a signature object from the drawn SVG
    const drawnSignature: Signature = {
      id: "drawn-" + Date.now(),
      name: fullName,
      data: signatureData,
      type: "drawn",
      createdAt: new Date().toISOString(),
    };

    // Set signature and move to confirmation step
    setSignature(drawnSignature);
    setCurrentStep("confirmation");
  };

  const handleDrawCancel = () => {
    setCurrentStep("method-selection");
    setSelectedMethod(null);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");

      return;
    }

    // Check if OpenCV is ready
    if (!isOpenCVReady) {
      alert(
        "Image processing is still loading. Please wait a moment and try again.",
      );

      return;
    }

    setIsProcessing(true);
    try {
      // Process the uploaded image to extract signature
      const result = await processSignatureImage(file, {
        cropPadding: 20,
        returnDesaturated: true,
      });

      // Create a signature object from the processed result
      const uploadedSignature: Signature = {
        id: "uploaded-" + Date.now(),
        name: fullName,
        data: result.dataUrl,
        type: "uploaded",
        createdAt: new Date().toISOString(),
      };

      // Set signature and move to confirmation step
      setSignature(uploadedSignature);
      setCurrentStep("confirmation");
    } catch (error) {
      let errorMessage =
        "Failed to process the image. Please try a clearer photo with better contrast.";

      if (error instanceof Error) {
        if (error.message.includes("not ready")) {
          errorMessage =
            "Image processing is not ready yet. Please refresh the page and try again.";
        }
      }

      alert(errorMessage);
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Step 1: Method Selection
  const renderMethodSelection = () => (
    <div className="space-y-6">
      <div className="text-left">
        <h3 className="text-lg font-semibold mb-2">
          Create Your Digital Signature
        </h3>
        <p className="text-default-600">
          Your signature will be used to sign your will and other legal
          documents.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            isPressable
            className="hover:shadow-md transition-shadow cursor-pointer"
            onPress={() => handleMethodSelect("text")}
          >
            <CardBody className="p-4">
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
            </CardBody>
          </Card>

          <Card
            isPressable
            className="hover:shadow-md transition-shadow cursor-pointer"
            data-testid="draw-signature-option"
            onPress={() => handleMethodSelect("draw")}
          >
            <CardBody className="p-4">
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
            </CardBody>
          </Card>
        </div>

        <Card
          className={`transition-all ${
            isOpenCVReady && !isProcessing
              ? "hover:shadow-md cursor-pointer"
              : "opacity-60 cursor-not-allowed"
          }`}
          isPressable={isOpenCVReady && !isProcessing}
          onPress={
            isOpenCVReady && !isProcessing
              ? () => handleMethodSelect("upload")
              : undefined
          }
        >
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0">
                {openCVStatus === "loading" ? (
                  <Spinner color="default" size="sm" />
                ) : openCVStatus === "error" ? (
                  <span className="text-danger text-lg">⚠️</span>
                ) : (
                  <span className="text-secondary text-lg">📁</span>
                )}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-semibold">Upload Photograph</h4>
                <p className="text-sm text-default-600 mt-1">
                  {openCVStatus === "loading"
                    ? "Loading image processing..."
                    : openCVStatus === "error"
                      ? "Image processing unavailable"
                      : "Upload a photo of your signature and we'll convert it"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <input
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          type="file"
          onChange={handleFileUpload}
        />
      </div>

      <div className="flex justify-between pt-6">
        {onBack ? (
          <Button isDisabled={loading} variant="bordered" onPress={onBack}>
            Back
          </Button>
        ) : (
          <div />
        )}
        <div />
      </div>
    </div>
  );

  // Step 2: Signature Creation
  const renderSignatureCreation = () => {
    if (selectedMethod === "text") {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Choose Your Font</h3>
            <p className="text-default-600">
              Select a font style for your signature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signatureFonts.map((fontData) => (
              <Card
                key={fontData.name}
                isPressable
                className={`hover:shadow-md transition-all cursor-pointer ${
                  signature?.type === "template" &&
                  signature?.font === fontData.name
                    ? "border-primary-500 bg-primary-50 shadow-md"
                    : "border-default-200"
                }`}
                onPress={() => handleFontSelect(fontData)}
              >
                <CardBody className="p-6 flex items-center justify-center min-h-[100px]">
                  <div
                    className={`text-3xl text-foreground ${fontData.className} text-center`}
                    style={{ fontFamily: fontData.name }}
                  >
                    {fullName}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="bordered" onPress={handleBackToMethodSelection}>
              Back
            </Button>
            <Button
              color="primary"
              isDisabled={!signature}
              onPress={handleConfirmSignature}
            >
              Continue
            </Button>
          </div>
        </div>
      );
    }

    if (selectedMethod === "draw") {
      return (
        <div className="space-y-6">
          <SignatureCanvas
            fullName={fullName}
            onCancel={handleDrawCancel}
            onSave={handleDrawnSignatureSave}
          />
        </div>
      );
    }

    if (selectedMethod === "upload") {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Upload Your Signature
            </h3>
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-default-600">Processing your signature...</p>
              </div>
            ) : (
              <div>
                <p className="text-default-600 mb-4">
                  Upload a clear photo of your signature on white paper.
                </p>
                <Button onPress={handleUploadClick}>Choose File</Button>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6">
            <Button variant="bordered" onPress={handleBackToMethodSelection}>
              Back
            </Button>
            <div />
          </div>
        </div>
      );
    }

    return null;
  };

  // Step 3: Confirmation
  const renderConfirmation = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Confirm Your Signature</h3>
        <p className="text-default-600">
          This is how your signature will appear on documents.
        </p>
      </div>

      {signature && (
        <Card className="border-2 border-foreground bg-background">
          <CardBody className="p-8 flex items-center justify-center">
            {signature.type === "template" ? (
              <div
                className={`text-4xl text-foreground ${signature.className} text-center`}
                style={{ fontFamily: signature.font }}
              >
                {signature.data}
              </div>
            ) : signature.type === "drawn" ? (
              <div
                dangerouslySetInnerHTML={{ __html: signature.data }}
                className="signature-preview [&>svg]:h-16 [&>svg]:w-auto [&>svg]:max-w-[300px] [&>svg_path]:!stroke-foreground [&>svg_path]:!fill-foreground"
              />
            ) : (
              <Image
                alt="Your signature"
                className="max-h-16 object-contain"
                height={64}
                src={signature.data}
                width={300}
              />
            )}
          </CardBody>
        </Card>
      )}

      <div className="flex justify-between pt-6">
        <Button variant="bordered" onPress={handleBackToMethodSelection}>
          Start Over
        </Button>
        <Button
          color="primary"
          data-testid="signature-continue-button"
          isDisabled={loading || !signature}
          isLoading={loading}
          onPress={handleSubmit}
        >
          Continue
        </Button>
      </div>
    </div>
  );

  // Main render logic based on current step
  if (currentStep === "method-selection") {
    return renderMethodSelection();
  }

  if (currentStep === "creation") {
    return renderSignatureCreation();
  }

  if (currentStep === "confirmation") {
    return renderConfirmation();
  }

  return null;
}
