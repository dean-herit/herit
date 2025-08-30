"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { useTheme } from "next-themes";
import SignaturePad from "signature_pad";

interface SignatureCanvasProps {
  onSave: (signatureData: string, signatureType: "svg" | "png") => void;
  onCancel: () => void;
  fullName: string;
}

export function SignatureCanvas({
  onSave,
  onCancel,
  fullName,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  // Resize canvas for high DPI displays
  const resizeCanvas = useCallback(
    (shouldClear = true) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;

      if (!canvas || !container) return;

      // Save existing signature data if we need to preserve it
      let existingData: any[] = [];
      let wasEmpty = isEmpty;
      if (!shouldClear && signaturePadRef.current) {
        existingData = signaturePadRef.current.toData();
      }

      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      // Set display size (CSS pixels)
      const rect = container.getBoundingClientRect();

      canvas.style.width = rect.width + "px";
      canvas.style.height = "200px";

      // Set actual size in memory (scaled for DPI)
      canvas.width = rect.width * ratio;
      canvas.height = 200 * ratio;

      // Scale drawing context to match device pixel ratio
      const context = canvas.getContext("2d");

      if (context) {
        context.scale(ratio, ratio);
      }

      // Handle signature clearing/restoration
      if (signaturePadRef.current) {
        if (shouldClear) {
          signaturePadRef.current.clear();
          setIsEmpty(true);
        } else if (existingData.length > 0) {
          // Restore preserved signature
          signaturePadRef.current.fromData(existingData);
          setIsEmpty(wasEmpty);
        }
      }
    },
    [isEmpty],
  );

  // Initialize SignaturePad with theme support and signature preservation
  useEffect(() => {
    if (!canvasRef.current) return; // Only wait for canvas, not theme

    // Robust theme detection with fallback to system preference
    const systemPreference = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const isDarkMode =
      resolvedTheme === "dark" || (!resolvedTheme && systemPreference);

    // Save existing signature data if SignaturePad exists
    let existingSignatureData: any[] = [];
    let shouldRestoreSignature = false;

    if (signaturePadRef.current) {
      existingSignatureData = signaturePadRef.current.toData();

      // Convert stroke colors to match new theme
      if (existingSignatureData.length > 0) {
        const newPenColor = isDarkMode ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)";

        // Convert all strokes to use the new theme's pen color
        existingSignatureData = existingSignatureData.map((stroke) => ({
          ...stroke,
          penColor: newPenColor,
          points: stroke.points.map((point: any) => ({
            ...point,
            color: newPenColor,
          })),
        }));

        shouldRestoreSignature = true;
      }

      signaturePadRef.current.off(); // Clean up existing instance
    }

    // Set up canvas dimensions BEFORE creating SignaturePad
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      canvasRef.current.style.width = rect.width + "px";
      canvasRef.current.style.height = "200px";
      canvasRef.current.width = rect.width * ratio;
      canvasRef.current.height = 200 * ratio;

      const context = canvasRef.current.getContext("2d");
      if (context) {
        context.scale(ratio, ratio);
      }
    }

    const signaturePad = new SignaturePad(canvasRef.current, {
      backgroundColor: "rgba(0, 0, 0, 0)", // Transparent background
      penColor: isDarkMode ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)", // Correct color for theme
      minWidth: 0.5,
      maxWidth: 2.5,
      throttle: 16, // 60fps
      velocityFilterWeight: 0.7,
    });

    // Add event listeners
    signaturePad.addEventListener("beginStroke", () => {
      setIsDrawing(true);
      setIsEmpty(false);
    });

    signaturePad.addEventListener("endStroke", () => {
      setIsDrawing(false);
    });

    signaturePadRef.current = signaturePad;

    // Restore existing signature data if it should be preserved
    if (shouldRestoreSignature && existingSignatureData.length > 0) {
      signaturePad.fromData(existingSignatureData);
      setIsEmpty(false);
    } else if (existingSignatureData.length > 0) {
      // Signature was cleared due to theme change
      setIsEmpty(true);
    }

    // Add resize listener for window resize events (these should clear)
    const handleResize = () => resizeCanvas(true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      signaturePad.off();
    };
  }, [resolvedTheme]); // React to theme changes and reinitialize

  // Clear the signature
  const handleClear = useCallback(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
      setIsEmpty(true);
    }
  }, []);

  // Undo last stroke
  const handleUndo = useCallback(() => {
    if (!signaturePadRef.current) return;

    const data = signaturePadRef.current.toData();

    if (data.length > 0) {
      data.pop(); // Remove last stroke
      signaturePadRef.current.fromData(data);
      setIsEmpty(data.length === 0);
    }
  }, []);

  // Save the signature
  const handleSave = useCallback(() => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      return;
    }

    // Get SVG string with transparent background
    const svgString = signaturePadRef.current.toSVG({
      includeBackgroundColor: false, // Keep transparent
    });

    // Save as SVG (vector format)
    onSave(svgString, "svg");
  }, [onSave]);

  // Prevent scrolling when drawing on touch devices
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const preventScroll = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    canvas.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      canvas.removeEventListener("touchmove", preventScroll);
    };
  }, [isDrawing]);

  return (
    <div className="space-y-4">
      <div className="text-left">
        <h3 className="text-lg font-semibold mb-2">Draw Your Signature</h3>
        <p className="text-default-600 text-sm">
          Use your mouse or finger to draw your signature below
        </p>
      </div>

      {/* Canvas Container */}
      <Card>
        <CardBody className="p-4">
          <div
            ref={containerRef}
            className="relative w-full"
            style={{ minHeight: "200px" }}
          >
            <canvas
              ref={canvasRef}
              className="border-2 border-dashed border-default-300 rounded-lg w-full touch-none bg-background"
              data-testid="signature-canvas"
              style={{
                cursor: "crosshair",
              }}
            />

            {/* Placeholder text */}
            {isEmpty && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-default-400 text-lg">
                  Sign here: {fullName}
                </p>
              </div>
            )}
          </div>

          {/* Canvas Controls */}
          <div className="flex gap-2 mt-4 justify-center">
            <Button
              data-testid="signature-clear-button"
              isDisabled={isEmpty}
              size="sm"
              variant="flat"
              onPress={handleClear}
            >
              Clear
            </Button>
            <Button
              data-testid="signature-undo-button"
              isDisabled={isEmpty}
              size="sm"
              variant="flat"
              onPress={handleUndo}
            >
              Undo
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between gap-2">
        <Button
          data-testid="signature-cancel-button"
          variant="bordered"
          onPress={onCancel}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          data-testid="signature-save-button"
          isDisabled={isEmpty}
          onPress={handleSave}
        >
          Use This Signature
        </Button>
      </div>

      {/* Instructions */}
      <div className="text-xs text-default-500 space-y-1">
        <p>
          • Your signature will be saved as a vector image with transparent
          background
        </p>
        <p>
          • Draw naturally - the line width will vary based on drawing speed
        </p>
        <p>
          • You can redraw your signature anytime from your profile settings
        </p>
      </div>
    </div>
  );
}
