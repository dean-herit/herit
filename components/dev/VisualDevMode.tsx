"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardBody, Switch } from "@heroui/react";

import ComponentHighlighter from "./advanced/highlighting/ComponentHighlighter";
import BoundaryOverlay from "./advanced/highlighting/BoundaryOverlay";

import { getComponentStats } from "@/lib/component-registry";

/**
 * Visual Development Mode Control Panel
 */
export const VisualDevModePanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [visualMode, setVisualMode] = useState(false);
  const [highlightingEnabled, setHighlightingEnabled] = useState(false);
  const [boundaryOverlay, setBoundaryOverlay] = useState(false);
  const [showTooltips, setShowTooltips] = useState(true);
  const [animateOnHover, setAnimateOnHover] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    // Check if visual dev mode is active
    const isActive =
      process.env.NEXT_PUBLIC_VISUAL_DEV_MODE === "true" ||
      localStorage.getItem("visualDevMode") === "true";

    setVisualMode(isActive);

    // Load highlighting setting separately - can be different from visual mode
    const highlightingActive =
      localStorage.getItem("highlightingEnabled") === "true" || isActive;

    setHighlightingEnabled(highlightingActive);

    // Load additional settings
    setBoundaryOverlay(localStorage.getItem("boundaryOverlay") === "true");
    setShowTooltips(localStorage.getItem("showTooltips") !== "false"); // Default true
    setAnimateOnHover(localStorage.getItem("animateOnHover") === "true");
  }, []);

  const toggleVisualMode = () => {
    const newMode = !visualMode;

    setVisualMode(newMode);
    setHighlightingEnabled(newMode);
    localStorage.setItem("visualDevMode", newMode.toString());
    localStorage.setItem("highlightingEnabled", newMode.toString());

    // Dispatch custom event to notify ComponentOverlay
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("visualModeToggled"));
    }

    if (newMode) {
      console.log("🎨 Visual Dev Mode: ENABLED");
      console.log("💡 Hover over components to see their metadata");
      console.log("🔲 Use Ctrl+B for boundary overlay");
      console.log("🖱️ Click components for persistent highlighting");
    } else {
      console.log("🎨 Visual Dev Mode: DISABLED");
    }
  };

  const toggleHighlighting = () => {
    const newState = !highlightingEnabled;

    setHighlightingEnabled(newState);
    localStorage.setItem("highlightingEnabled", newState.toString());
  };

  const toggleBoundaryOverlay = () => {
    const newState = !boundaryOverlay;

    setBoundaryOverlay(newState);
    localStorage.setItem("boundaryOverlay", newState.toString());
  };

  const toggleTooltips = () => {
    const newState = !showTooltips;

    setShowTooltips(newState);
    localStorage.setItem("showTooltips", newState.toString());
  };

  const toggleAnimations = () => {
    const newState = !animateOnHover;

    setAnimateOnHover(newState);
    localStorage.setItem("animateOnHover", newState.toString());
  };

  const stats = getComponentStats();

  if (!isDev) return null;

  return (
    <>
      {/* Component Highlighter - Always rendered when visual mode is active */}
      {visualMode && (
        <ComponentHighlighter
          animateOnHover={animateOnHover}
          enabled={highlightingEnabled}
          showTooltip={showTooltips}
        />
      )}

      {/* Boundary Overlay */}
      <BoundaryOverlay
        enabled={boundaryOverlay}
        opacity={0.3}
        showDimensions={false}
        showLabels={true}
      />

      {/* Floating Dev Mode Toggle */}
      <div className="fixed bottom-4 right-4 z-[10000]">
        <Button
          className="rounded-full p-2 min-w-12 h-12"
          color="primary"
          size="sm"
          variant="shadow"
          onClick={() => setIsOpen(!isOpen)}
        >
          🛠️
        </Button>
      </div>

      {/* Dev Mode Panel */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 z-[10000] w-96">
          <CardBody className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Visual Dev Mode</h3>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={() => setIsOpen(false)}
                >
                  ✕
                </Button>
              </div>

              {/* Main Visual Mode Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Visual Component Mode
                </span>
                <Switch
                  checked={visualMode}
                  color="primary"
                  size="sm"
                  onChange={toggleVisualMode}
                />
              </div>

              {/* Advanced Highlighting Options */}
              {visualMode && (
                <div className="space-y-3 border-t pt-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Highlighting Options
                  </h4>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Component Highlighting</span>
                    <Switch
                      checked={highlightingEnabled}
                      color="primary"
                      size="sm"
                      onChange={toggleHighlighting}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Boundary Overlay</span>
                    <Switch
                      checked={boundaryOverlay}
                      color="secondary"
                      size="sm"
                      onChange={toggleBoundaryOverlay}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Show Tooltips</span>
                    <Switch
                      checked={showTooltips}
                      color="success"
                      size="sm"
                      onChange={toggleTooltips}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Animate on Hover</span>
                    <Switch
                      checked={animateOnHover}
                      color="warning"
                      size="sm"
                      onChange={toggleAnimations}
                    />
                  </div>
                </div>
              )}

              {/* Component Statistics */}
              <div className="border-t pt-3">
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="font-semibold">📊 Registry Stats</div>
                  <div>Total Components: {stats.total}</div>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {Object.entries(stats.byCategory).map(
                      ([category, count]) => (
                        <div
                          key={category}
                          className="flex justify-between text-xs"
                        >
                          <span className="capitalize">{category}:</span>
                          <span className="font-mono">{count}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="border-t pt-3 text-xs text-gray-500">
                {visualMode ? (
                  <div className="space-y-1">
                    <div className="font-semibold text-green-600">
                      ✅ Visual Mode Active
                    </div>
                    <div>🖱️ Hover: Temporary highlight</div>
                    <div>👆 Click: Toggle persistent highlight</div>
                    <div>⌨️ Ctrl+H: Highlight all components</div>
                    <div>⌨️ Ctrl+B: Toggle boundary overlay</div>
                    <div>⌨️ Esc: Clear all highlights</div>
                  </div>
                ) : (
                  <div>
                    💡 Enable visual mode to see component boundaries and
                    metadata
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </>
  );
};
