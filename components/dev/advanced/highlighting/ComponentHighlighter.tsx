"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

import { highlightManager, HighlightOptions } from "./HighlightManager";

import { COMPONENT_REGISTRY } from "@/lib/component-registry";

interface ComponentHighlighterProps {
  enabled?: boolean;
  hoverHighlight?: boolean;
  clickHighlight?: boolean;
  showTooltip?: boolean;
  animateOnHover?: boolean;
  children?: React.ReactNode;
}

interface TooltipInfo {
  componentId: string;
  category: string;
  name: string;
  filePath: string;
  position: { x: number; y: number };
}

export const ComponentHighlighter: React.FC<ComponentHighlighterProps> = ({
  enabled = true,
  hoverHighlight = true,
  clickHighlight = true,
  showTooltip = true,
  animateOnHover = false,
  children,
}) => {
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if visual dev mode is enabled
  const isVisualDevMode = useCallback(() => {
    if (typeof window === "undefined") return false;

    return localStorage.getItem("visualDevMode") === "true";
  }, []);

  const [visualDevMode, setVisualDevMode] = useState(false);

  useEffect(() => {
    setVisualDevMode(isVisualDevMode());

    // Listen for storage changes to update visual dev mode
    const handleStorageChange = () => {
      setVisualDevMode(isVisualDevMode());
    };

    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isVisualDevMode]);

  const handleMouseEnter = useCallback(
    (event: Event) => {
      if (!enabled || !visualDevMode || !hoverHighlight) return;

      const target = event.target as Element;
      const componentElement = target.closest("[data-component-id]");

      if (!componentElement) return;

      const componentId = componentElement.getAttribute("data-component-id");
      const componentCategory = componentElement.getAttribute(
        "data-component-category",
      );

      if (!componentId) return;

      // Highlight the component
      const highlightOptions: HighlightOptions = {
        category: componentCategory || "ui",
        animated: animateOnHover,
        opacity: 0.3,
      };

      highlightManager.highlightComponent(
        componentId,
        componentElement,
        highlightOptions,
      );

      // Show tooltip if enabled
      if (showTooltip) {
        const componentMetadata = COMPONENT_REGISTRY[componentId];

        if (componentMetadata) {
          const rect = componentElement.getBoundingClientRect();

          setTooltip({
            componentId,
            category: componentMetadata.category.toString(),
            name: componentMetadata.name,
            filePath: componentMetadata.filePath,
            position: {
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
            },
          });
        }
      }
    },
    [enabled, visualDevMode, hoverHighlight, showTooltip, animateOnHover],
  );

  const handleMouseLeave = useCallback(
    (event: Event) => {
      if (!enabled || !visualDevMode || !hoverHighlight) return;

      const target = event.target as Element;
      const componentElement = target.closest("[data-component-id]");

      if (!componentElement) return;

      const componentId = componentElement.getAttribute("data-component-id");

      if (!componentId) return;

      // Remove highlight
      highlightManager.removeHighlight(componentId);

      // Hide tooltip
      setTooltip(null);
    },
    [enabled, visualDevMode, hoverHighlight],
  );

  const handleClick = useCallback(
    (event: Event) => {
      if (!enabled || !visualDevMode || !clickHighlight) return;

      const target = event.target as Element;
      const componentElement = target.closest("[data-component-id]");

      if (!componentElement) return;

      const componentId = componentElement.getAttribute("data-component-id");
      const componentCategory = componentElement.getAttribute(
        "data-component-category",
      );

      if (!componentId) return;

      // Toggle persistent highlight
      if (highlightManager.isHighlighted(componentId)) {
        highlightManager.removeHighlight(componentId);
      } else {
        // Remove other persistent highlights first
        highlightManager.removeAllHighlights();

        // Add persistent highlight
        const highlightOptions: HighlightOptions = {
          category: componentCategory || "ui",
          animated: true,
          opacity: 0.4,
        };

        highlightManager.highlightComponent(
          componentId,
          componentElement,
          highlightOptions,
        );
      }

      // Prevent event propagation to avoid triggering parent components
      event.stopPropagation();
    },
    [enabled, visualDevMode, clickHighlight],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !visualDevMode) return;

      // ESC key to clear all highlights
      if (event.key === "Escape") {
        highlightManager.removeAllHighlights();
        setTooltip(null);
      }

      // H key to toggle highlighting
      if (event.key === "h" && event.ctrlKey) {
        const allHighlights = highlightManager.getAllHighlights();

        if (allHighlights.length > 0) {
          highlightManager.removeAllHighlights();
        } else {
          // Highlight all visible components
          const componentElements = document.querySelectorAll(
            "[data-component-id]",
          );

          componentElements.forEach((element) => {
            const componentId = element.getAttribute("data-component-id");
            const componentCategory = element.getAttribute(
              "data-component-category",
            );

            if (componentId) {
              highlightManager.highlightComponent(componentId, element, {
                category: componentCategory || "ui",
                opacity: 0.2,
              });
            }
          });
        }
        event.preventDefault();
      }
    },
    [enabled, visualDevMode],
  );

  useEffect(() => {
    if (!enabled || !visualDevMode) return;

    const container = containerRef.current || document;

    // Add event listeners
    container.addEventListener("mouseenter", handleMouseEnter, {
      capture: true,
    });
    container.addEventListener("mouseleave", handleMouseLeave, {
      capture: true,
    });
    container.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      // Remove event listeners
      container.removeEventListener("mouseenter", handleMouseEnter, {
        capture: true,
      });
      container.removeEventListener("mouseleave", handleMouseLeave, {
        capture: true,
      });
      container.removeEventListener("click", handleClick, { capture: true });
      document.removeEventListener("keydown", handleKeyDown);

      // Clean up highlights
      highlightManager.removeAllHighlights();
    };
  }, [
    enabled,
    visualDevMode,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleKeyDown,
  ]);

  // Don't render anything if visual dev mode is disabled
  if (!enabled || !visualDevMode) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="component-highlighter-container">
      {children}

      {/* Tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-[10001] px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltip.position.x,
            top: tooltip.position.y,
            maxWidth: "300px",
          }}
        >
          <div className="font-semibold text-yellow-300">{tooltip.name}</div>
          <div className="text-xs text-gray-300">ID: {tooltip.componentId}</div>
          <div className="text-xs text-blue-300">
            Category: {tooltip.category}
          </div>
          <div className="text-xs text-green-300 truncate">
            Path: {tooltip.filePath}
          </div>

          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}

      {/* Instructions overlay */}
      <div className="fixed bottom-4 left-4 z-[10000] bg-black bg-opacity-75 text-white p-2 rounded-lg text-xs">
        <div>🎨 Component Highlighting Active</div>
        <div>Hover: Temporary highlight</div>
        <div>Click: Toggle persistent highlight</div>
        <div>Ctrl+H: Highlight all components</div>
        <div>Esc: Clear all highlights</div>
      </div>
    </div>
  );
};

export default ComponentHighlighter;
