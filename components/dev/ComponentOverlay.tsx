"use client";

import { useState, useEffect, ReactNode } from "react";

import { ComponentMetadata } from "@/types/component-registry";

interface ComponentOverlayProps {
  componentId: string;
  metadata: ComponentMetadata;
  children: ReactNode;
}

export const ComponentOverlay = ({
  componentId,
  metadata,
  children,
}: ComponentOverlayProps) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [isVisualMode, setIsVisualMode] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    const checkVisualMode = () => {
      const envMode = process.env.NEXT_PUBLIC_VISUAL_DEV_MODE === "true";
      const localMode =
        typeof window !== "undefined" &&
        localStorage.getItem("visualDevMode") === "true";

      setIsVisualMode(envMode || localMode);
    };

    // Initial check
    checkVisualMode();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkVisualMode();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      // Also listen for custom events from our toggle function
      window.addEventListener("visualModeToggled", handleStorageChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("visualModeToggled", handleStorageChange);
      };
    }
  }, []);

  if (!isDev || !isVisualMode) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative component-overlay-container"
      data-component-category={metadata.category}
      data-component-id={componentId}
      data-component-name={metadata.name}
      data-file-path={metadata.filePath}
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
    >
      {children}

      {showOverlay && (
        <div className="absolute top-0 left-0 w-full h-full border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-[9999]">
          <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-1 font-mono max-w-sm truncate">
            <div className="font-bold">{componentId}</div>
            <div>📁 {metadata.filePath.split("/").pop()}</div>
            <div>🎨 {metadata.category}</div>
            {metadata.dependencies.length > 0 && (
              <div className="truncate">
                📊 {metadata.dependencies.slice(0, 3).join(", ")}
                {metadata.dependencies.length > 3 && "..."}
              </div>
            )}
            <div className="text-xs opacity-75">
              Lines {metadata.startLine}-{metadata.endLine}
            </div>
          </div>

          {/* Corner indicators for different states */}
          <div className="absolute top-0 right-0 flex gap-1 p-1">
            {metadata.performance.complexity === "high" && (
              <div
                className="w-2 h-2 bg-red-500 rounded"
                title="High Complexity Component"
              />
            )}
            {metadata.accessibility.violations > 0 && (
              <div
                className="w-2 h-2 bg-orange-500 rounded"
                title={`${metadata.accessibility.violations} A11y Issues`}
              />
            )}
            {metadata.variants.length > 3 && (
              <div
                className="w-2 h-2 bg-green-500 rounded"
                title={`${metadata.variants.length} Variants`}
              />
            )}
            {metadata.dependencies.length > 5 && (
              <div
                className="w-2 h-2 bg-yellow-500 rounded"
                title={`${metadata.dependencies.length} Dependencies`}
              />
            )}
          </div>

          {/* Bottom info bar for file location */}
          <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 truncate">
            Click to open: {metadata.filePath}:{metadata.startLine}
          </div>
        </div>
      )}
    </div>
  );
};
