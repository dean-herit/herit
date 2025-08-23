"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import Image from "next/image";

import { PersonalInfo, Signature } from "@/types/onboarding";
import { signatureFonts } from "@/config/fonts";
import { processSignatureImage } from "@/lib/signature-extract";
import { useOpenCV } from "@/hooks/useOpenCV";

interface SignatureStepProps {
  personalInfo: PersonalInfo;
  initialSignature: Signature | null;
  onChange: (signature: Signature | null) => void;
  onComplete: (signature: Signature) => void;
  onBack?: () => void;
  loading: boolean;
}

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
  const [selectedFont, setSelectedFont] = useState(signatureFonts[0]);
  const [showFontSelector, setShowFontSelector] = useState(false);
  const [uploadedSignatures, setUploadedSignatures] = useState<Signature[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize from existing signature
  useEffect(() => {
    if (initialSignature) {
      setSignature(initialSignature);

      // If signature exists, set selected font and show selector
      if (initialSignature.type === "template" && initialSignature.font) {
        const matchingFont = signatureFonts.find(
          (f) => f.name === initialSignature.font,
        );

        if (matchingFont) {
          setSelectedFont(matchingFont);
        }
        setShowFontSelector(true);
      } else if (initialSignature.type === "uploaded") {
        setShowFontSelector(true);
      }
    }
  }, [initialSignature]);
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

  const handleStartCreating = () => {
    setShowFontSelector(true);
    createTemplateSignature();
  };

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

      // Use the signature returned from the API (with database ID)
      onComplete(result.signature);
    } catch {
      // Error handling signature save
    }
  };

  const resetSignature = () => {
    setSignature(null);
    setShowFontSelector(false);
    setUploadedSignatures([]);
    onChange(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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

      // Add to uploaded signatures list
      setUploadedSignatures((prev) => [...prev, uploadedSignature]);

      // Auto-select this signature
      setSignature(uploadedSignature);
      // Don't call onChange with temporary signatures - only when finalized
      // onChange(uploadedSignature);
      setShowFontSelector(true); // Show the selection interface
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

  if (!showFontSelector && !signature) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">
            Create Your Digital Signature
          </h3>
          <p className="text-default-600">
            Your signature will be used to sign your will and other legal
            documents.
          </p>
        </div>

        <div className="space-y-4">
          <Card
            isPressable
            className="hover:shadow-md transition-shadow cursor-pointer"
            onPress={handleStartCreating}
          >
            <CardBody className="p-6 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary text-xl">T</span>
                </div>
                <h4 className="font-semibold">Text Signature</h4>
                <p className="text-sm text-default-600 mt-2">
                  Choose from beautiful signature fonts
                </p>
              </div>
              <div className="text-xl font-dancing-script text-primary border-b border-primary-200 pb-2">
                {fullName}
              </div>
            </CardBody>
          </Card>

          <Card
            className={`transition-all ${
              isOpenCVReady && !isProcessing
                ? "hover:shadow-md cursor-pointer"
                : "opacity-60 cursor-not-allowed"
            }`}
            isPressable={isOpenCVReady && !isProcessing}
            onPress={
              isOpenCVReady && !isProcessing ? handleUploadClick : undefined
            }
          >
            <CardBody className="p-6 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  {isProcessing ? (
                    <Spinner
                      color="secondary"
                      data-component-category="ui"
                      data-component-id="spinner"
                      size="sm"
                    />
                  ) : openCVStatus === "loading" ? (
                    <Spinner
                      color="default"
                      data-component-category="ui"
                      data-component-id="spinner"
                      size="sm"
                    />
                  ) : openCVStatus === "error" ? (
                    <span className="text-danger text-xl">⚠️</span>
                  ) : (
                    <span className="text-secondary text-xl">📁</span>
                  )}
                </div>
                <h4 className="font-semibold">Upload Signature</h4>
                <p className="text-sm text-default-600 mt-2">
                  {isProcessing
                    ? "Processing your signature..."
                    : openCVStatus === "loading"
                      ? "Loading image processing..."
                      : openCVStatus === "error"
                        ? "Image processing unavailable"
                        : "Upload a photo of your signature and we'll convert it"}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            accept="image/*"
            style={{ display: "none" }}
            type="file"
            onChange={handleFileUpload}
          />

          <Card className="opacity-50">
            <CardBody className="p-6 text-center">
              <div className="mb-4">
                <div className="w-12 h-12 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-default-400 text-xl">✏</span>
                </div>
                <h4 className="font-semibold text-default-400">
                  Draw Signature
                </h4>
                <p className="text-sm text-default-400 mt-2">
                  Coming soon - draw your signature with mouse or touch
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Navigation */}
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
  }

  const handleUploadedSignatureSelect = (uploadedSig: Signature) => {
    setSignature(uploadedSig);
    // Don't call onChange with temporary signatures - only when finalized
    // onChange(uploadedSig);
  };

  return (
    <div
      className="space-y-6"
      data-component-category="authentication"
      data-component-id="components-signature-step"
      data-testid="signature-step"
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          Choose Your Signature Style
        </h3>
        <p className="text-default-600">
          Select the signature that best represents your style.
        </p>
      </div>

      {/* Combined Signature Selector */}
      <div>
        <h4 className="text-md font-semibold mb-4">Choose your signature:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upload Signature Option */}
          <Card
            className={`transition-all border-default-200 ${
              isOpenCVReady && !isProcessing
                ? "hover:shadow-md cursor-pointer"
                : "opacity-60 cursor-not-allowed"
            }`}
            isPressable={isOpenCVReady && !isProcessing}
            onPress={
              isOpenCVReady && !isProcessing ? handleUploadClick : undefined
            }
          >
            <CardBody className="p-6 text-center flex items-center justify-center min-h-[100px]">
              <div>
                <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  {isProcessing ? (
                    <Spinner
                      color="secondary"
                      data-component-category="ui"
                      data-component-id="spinner"
                      size="sm"
                    />
                  ) : openCVStatus === "loading" ? (
                    <Spinner
                      color="default"
                      data-component-category="ui"
                      data-component-id="spinner"
                      size="sm"
                    />
                  ) : openCVStatus === "error" ? (
                    <span className="text-danger text-xl">⚠️</span>
                  ) : (
                    <span className="text-secondary text-xl">📁</span>
                  )}
                </div>
                <h4 className="font-semibold text-sm">Upload Signature</h4>
                <p className="text-xs text-default-600 mt-1">
                  {isProcessing
                    ? "Processing..."
                    : openCVStatus === "loading"
                      ? "Loading..."
                      : openCVStatus === "error"
                        ? "Unavailable"
                        : "Upload a photo"}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            accept="image/*"
            style={{ display: "none" }}
            type="file"
            onChange={handleFileUpload}
          />

          {/* Draw Signature Option (Coming Soon) */}
          <Card className="opacity-50">
            <CardBody className="p-6 text-center flex items-center justify-center min-h-[100px]">
              <div>
                <div className="w-12 h-12 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-default-400 text-xl">✏️</span>
                </div>
                <h4 className="font-semibold text-sm text-default-400">
                  Draw Signature
                </h4>
                <p className="text-xs text-default-400 mt-1">Coming soon</p>
              </div>
            </CardBody>
          </Card>

          {/* Uploaded Signatures */}
          {uploadedSignatures.map((uploadedSig) => (
            <Card
              key={uploadedSig.id}
              isPressable
              className={`hover:shadow-md transition-all cursor-pointer ${
                signature?.id === uploadedSig.id
                  ? "border-primary-500 bg-primary-50 shadow-md"
                  : "border-default-200"
              }`}
              onPress={() => handleUploadedSignatureSelect(uploadedSig)}
            >
              <CardBody className="p-6 flex items-center justify-center min-h-[100px]">
                <Image
                  alt="Uploaded signature"
                  className="max-w-full max-h-16 object-contain"
                  height={64}
                  src={uploadedSig.data}
                  width={200}
                />
              </CardBody>
            </Card>
          ))}

          {/* Font-based Signatures */}
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
              data-testid={`signature-font-${fontData.name.toLowerCase().replace(/\s+/g, "-")}`}
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
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <div className="flex gap-2">
          {onBack ? (
            <Button isDisabled={loading} variant="bordered" onPress={onBack}>
              Back
            </Button>
          ) : (
            <div />
          )}

          <Button isDisabled={loading} variant="flat" onPress={resetSignature}>
            Choose Different Type
          </Button>
        </div>

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
}
