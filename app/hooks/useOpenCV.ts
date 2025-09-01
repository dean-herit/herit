"use client";

import { useState, useEffect } from "react";

type OpenCVStatus = "loading" | "ready" | "error";

export function useOpenCV() {
  const [status, setStatus] = useState<OpenCVStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkOpenCV = () => {
      const cv = (window as any).cv;

      // Check if OpenCV is ready
      if (cv && typeof cv.Mat === "function" && cv.wasmReady) {
        setStatus("ready");

        return;
      }

      // If OpenCV object exists but not ready, keep checking
      if (cv && typeof cv.Mat === "function") {
        timeoutId = setTimeout(checkOpenCV, 100);

        return;
      }

      // If no OpenCV object yet, keep checking
      timeoutId = setTimeout(checkOpenCV, 200);
    };

    // Start checking immediately
    checkOpenCV();

    // Set a maximum timeout
    const maxTimeout = setTimeout(() => {
      setStatus("error");
      setError("Image processing is not available. Please refresh the page.");
    }, 15000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(maxTimeout);
    };
  }, []);

  return { status, error, isReady: status === "ready" };
}
