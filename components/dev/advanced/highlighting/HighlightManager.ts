// Real-time Component Highlighting Manager
// Uses CSS Custom Highlight API (2025) for performance-optimized highlighting

export interface HighlightOptions {
  color?: string;
  opacity?: number;
  borderWidth?: number;
  category?: string;
  animated?: boolean;
}

export interface ComponentHighlight {
  id: string;
  element: Element;
  options: HighlightOptions;
  range?: Range;
}

// Category-specific highlight colors
const CATEGORY_COLORS = {
  ui: "#3b82f6", // Blue
  layout: "#10b981", // Green
  navigation: "#8b5cf6", // Purple
  input: "#f59e0b", // Amber
  feedback: "#ef4444", // Red
  authentication: "#ec4899", // Pink
  business: "#06b6d4", // Cyan
  "data-display": "#84cc16", // Lime
} as const;

class HighlightManager {
  private highlights = new Map<string, ComponentHighlight>();
  private activeHighlight: string | null = null;
  private highlightRegistry?: any;
  private supportsCustomHighlight = false;
  private observer?: IntersectionObserver;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Check for CSS Custom Highlight API support (2025 standard)
    if (typeof CSS !== "undefined" && "highlights" in CSS) {
      this.highlightRegistry = CSS.highlights;
      this.supportsCustomHighlight = true;
      console.log("🎨 CSS Custom Highlight API: Supported");
    } else {
      console.log("⚠️ CSS Custom Highlight API: Not supported, using fallback");
    }

    this.setupIntersectionObserver();
    this.setupHighlightStyles();
  }

  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const componentId = entry.target.getAttribute("data-component-id");

          if (componentId && !entry.isIntersecting) {
            // Remove highlights for components not in view for performance
            this.removeHighlight(componentId);
          }
        });
      },
      { threshold: 0.1 },
    );
  }

  private setupHighlightStyles() {
    if (!document.getElementById("component-highlight-styles")) {
      const style = document.createElement("style");

      style.id = "component-highlight-styles";
      style.textContent = `
        /* CSS Custom Highlight API styles */
        ::highlight(component-highlight) {
          background-color: rgba(59, 130, 246, 0.1);
          outline: 2px solid rgba(59, 130, 246, 0.8);
          outline-offset: -2px;
        }

        ::highlight(component-highlight-ui) {
          background-color: rgba(59, 130, 246, 0.1);
          outline: 2px solid #3b82f6;
          outline-offset: -2px;
        }

        ::highlight(component-highlight-layout) {
          background-color: rgba(16, 185, 129, 0.1);
          outline: 2px solid #10b981;
          outline-offset: -2px;
        }

        ::highlight(component-highlight-navigation) {
          background-color: rgba(139, 92, 246, 0.1);
          outline: 2px solid #8b5cf6;
          outline-offset: -2px;
        }

        ::highlight(component-highlight-input) {
          background-color: rgba(245, 158, 11, 0.1);
          outline: 2px solid #f59e0b;
          outline-offset: -2px;
        }

        ::highlight(component-highlight-feedback) {
          background-color: rgba(239, 68, 68, 0.1);
          outline: 2px solid #ef4444;
          outline-offset: -2px;
        }

        ::highlight(component-highlight-authentication) {
          background-color: rgba(236, 72, 153, 0.1);
          outline: 2px solid #ec4899;
          outline-offset: -2px;
        }

        ::highlight(component-highlight-business) {
          background-color: rgba(6, 182, 212, 0.1);
          outline: 2px solid #06b6d4;
          outline-offset: -2px;
        }

        ::highlight(component-highlight-data-display) {
          background-color: rgba(132, 204, 22, 0.1);
          outline: 2px solid #84cc16;
          outline-offset: -2px;
        }

        /* Animated highlight effects */
        ::highlight(component-highlight-animated) {
          animation: highlight-pulse 2s ease-in-out infinite;
        }

        @keyframes highlight-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }

        /* Fallback styles for browsers without Custom Highlight API */
        .component-highlight-fallback {
          position: relative;
          z-index: 1000;
        }

        .component-highlight-fallback::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          border: 2px solid var(--highlight-color, #3b82f6);
          background: var(--highlight-bg, rgba(59, 130, 246, 0.1));
          pointer-events: none;
          z-index: -1;
        }

        .component-highlight-animated.component-highlight-fallback::before {
          animation: highlight-pulse 2s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }

  public highlightComponent(
    componentId: string,
    element: Element,
    options: HighlightOptions = {},
  ): boolean {
    try {
      // Remove existing highlight
      this.removeHighlight(componentId);

      const category =
        element.getAttribute("data-component-category") ||
        options.category ||
        "ui";
      const highlightOptions: HighlightOptions = {
        color:
          CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] ||
          CATEGORY_COLORS.ui,
        opacity: 0.3,
        borderWidth: 2,
        category,
        animated: false,
        ...options,
      };

      if (this.supportsCustomHighlight && this.highlightRegistry) {
        // Use CSS Custom Highlight API (preferred)
        return this.highlightWithCustomAPI(
          componentId,
          element,
          highlightOptions,
        );
      } else {
        // Fallback to CSS classes
        return this.highlightWithFallback(
          componentId,
          element,
          highlightOptions,
        );
      }
    } catch (error) {
      console.error("Failed to highlight component:", error);

      return false;
    }
  }

  private highlightWithCustomAPI(
    componentId: string,
    element: Element,
    options: HighlightOptions,
  ): boolean {
    try {
      // Create a range that encompasses the entire element
      const range = document.createRange();

      range.selectNode(element);

      // Create highlight name based on category
      const highlightName = options.animated
        ? `component-highlight-${options.category}-animated`
        : `component-highlight-${options.category}`;

      // Create and register the highlight
      const highlight = new Highlight(range);

      this.highlightRegistry!.set(highlightName, highlight);

      // Store highlight info
      const componentHighlight: ComponentHighlight = {
        id: componentId,
        element,
        options,
        range,
      };

      this.highlights.set(componentId, componentHighlight);

      // Set up intersection observer
      if (this.observer) {
        this.observer.observe(element);
      }

      // Set active highlight
      this.activeHighlight = componentId;

      return true;
    } catch (error) {
      console.error("CSS Custom Highlight API error:", error);

      return this.highlightWithFallback(componentId, element, options);
    }
  }

  private highlightWithFallback(
    componentId: string,
    element: Element,
    options: HighlightOptions,
  ): boolean {
    try {
      // Apply CSS class-based highlighting
      element.classList.add("component-highlight-fallback");

      if (options.animated) {
        element.classList.add("component-highlight-animated");
      }

      // Set CSS custom properties for colors
      const htmlElement = element as HTMLElement;

      htmlElement.style.setProperty("--highlight-color", options.color!);
      htmlElement.style.setProperty("--highlight-bg", `${options.color}1A`); // 10% opacity

      // Store highlight info
      const componentHighlight: ComponentHighlight = {
        id: componentId,
        element,
        options,
      };

      this.highlights.set(componentId, componentHighlight);

      // Set active highlight
      this.activeHighlight = componentId;

      return true;
    } catch (error) {
      console.error("Fallback highlight error:", error);

      return false;
    }
  }

  public removeHighlight(componentId: string): boolean {
    const highlight = this.highlights.get(componentId);

    if (!highlight) return false;

    try {
      if (this.supportsCustomHighlight && this.highlightRegistry) {
        // Remove from CSS Custom Highlight API
        const highlightName = highlight.options.animated
          ? `component-highlight-${highlight.options.category}-animated`
          : `component-highlight-${highlight.options.category}`;

        this.highlightRegistry.delete(highlightName);
      } else {
        // Remove fallback classes
        highlight.element.classList.remove(
          "component-highlight-fallback",
          "component-highlight-animated",
        );
        const htmlElement = highlight.element as HTMLElement;

        htmlElement.style.removeProperty("--highlight-color");
        htmlElement.style.removeProperty("--highlight-bg");
      }

      // Remove from observer
      if (this.observer) {
        this.observer.unobserve(highlight.element);
      }

      // Remove from registry
      this.highlights.delete(componentId);

      if (this.activeHighlight === componentId) {
        this.activeHighlight = null;
      }

      return true;
    } catch (error) {
      console.error("Failed to remove highlight:", error);

      return false;
    }
  }

  public removeAllHighlights(): void {
    for (const componentId of this.highlights.keys()) {
      this.removeHighlight(componentId);
    }
  }

  public getActiveHighlight(): string | null {
    return this.activeHighlight;
  }

  public getAllHighlights(): ComponentHighlight[] {
    return Array.from(this.highlights.values());
  }

  public isHighlighted(componentId: string): boolean {
    return this.highlights.has(componentId);
  }

  public updateHighlight(
    componentId: string,
    options: Partial<HighlightOptions>,
  ): boolean {
    const highlight = this.highlights.get(componentId);

    if (!highlight) return false;

    const updatedOptions = { ...highlight.options, ...options };

    return this.highlightComponent(
      componentId,
      highlight.element,
      updatedOptions,
    );
  }

  public dispose(): void {
    this.removeAllHighlights();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }

    // Clean up styles
    const styleElement = document.getElementById("component-highlight-styles");

    if (styleElement) {
      styleElement.remove();
    }
  }
}

// Singleton instance
export const highlightManager = new HighlightManager();
