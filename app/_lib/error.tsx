"use client";

import { useEffect, useMemo } from "react";
import DOMPurify from "dompurify";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    /* eslint-disable no-console */
    console.error(error);
  }, [error]);

  // Sanitize error message to prevent XSS attacks
  const sanitizedMessage = useMemo(() => {
    if (typeof window !== "undefined") {
      return DOMPurify.sanitize(error.message || "An unexpected error occurred", {
        ALLOWED_TAGS: [], // Strip all HTML tags
        ALLOWED_ATTR: [], // Strip all attributes
      });
    }
    // Server-side: basic string sanitization
    return (error.message || "An unexpected error occurred").replace(/<[^>]*>/g, "");
  }, [error.message]);

  return (
    <div role="alert" aria-live="polite">
      <h2>Something went wrong!</h2>
      <div data-testid="error-message" aria-describedby="error-description">
        {sanitizedMessage}
      </div>
      <button
        data-testid="button"
        aria-label="Try to reload the component and fix the error"
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  );
}
