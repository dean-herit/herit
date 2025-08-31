import DOMPurify from "dompurify";

/**
 * Sanitize SVG content to prevent XSS attacks
 * Allows only safe SVG elements and attributes
 */
export function sanitizeSVG(svgContent: string): string {
  if (!svgContent || typeof svgContent !== "string") {
    return "";
  }

  // Configure DOMPurify for SVG sanitization
  const config = {
    USE_PROFILES: { svg: true },
    ALLOWED_TAGS: [
      "svg",
      "g",
      "path",
      "circle",
      "ellipse",
      "line",
      "rect",
      "polyline",
      "polygon",
      "text",
      "tspan",
      "defs",
      "clipPath",
      "mask",
    ],
    ALLOWED_ATTR: [
      "d",
      "cx",
      "cy",
      "r",
      "rx",
      "ry",
      "x",
      "y",
      "x1",
      "y1",
      "x2",
      "y2",
      "width",
      "height",
      "viewBox",
      "fill",
      "stroke",
      "stroke-width",
      "stroke-linecap",
      "stroke-linejoin",
      "stroke-dasharray",
      "stroke-dashoffset",
      "transform",
      "opacity",
      "points",
      "class",
      "id",
    ],
    FORBID_TAGS: ["script", "object", "embed", "iframe", "form", "input"],
    FORBID_ATTR: [
      "onload",
      "onerror",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
      "href",
      "xlink:href",
    ],
    KEEP_CONTENT: false,
    WHOLE_DOCUMENT: false,
  };

  try {
    const sanitized = DOMPurify.sanitize(svgContent, config);

    // Additional check: ensure it's a valid SVG
    if (!sanitized.includes("<svg")) {
      console.warn("Sanitized content does not contain SVG tag");

      return "";
    }

    return sanitized;
  } catch (error) {
    console.error("SVG sanitization failed:", error);

    return "";
  }
}

/**
 * Check if SVG content is safe (basic validation)
 */
export function isSafeSVG(svgContent: string): boolean {
  if (!svgContent || typeof svgContent !== "string") {
    return false;
  }

  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick, onload
    /<object/i,
    /<embed/i,
    /<iframe/i,
    /href\s*=\s*["']javascript:/i,
    /xlink:href\s*=\s*["']javascript:/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(svgContent));
}
