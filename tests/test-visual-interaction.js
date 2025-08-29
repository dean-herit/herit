// Script to test visual dev mode interactions
console.log("🎨 Testing Visual Dev Mode...");

// Function to safely execute JavaScript in the browser
function testVisualDevMode() {
  try {
    // Find the dev panel button
    const devButton = document.querySelector(
      '[data-component-id="visual-dev-mode-panel"] button',
    );
    if (devButton) {
      console.log("✓ Found dev panel button");
      devButton.click();
      console.log("✓ Clicked dev panel button");

      // Wait for panel to open and try to find the visual mode toggle
      setTimeout(() => {
        const switches = document.querySelectorAll(
          '[data-component-id="switch"]',
        );
        console.log(`Found ${switches.length} switch components`);

        // Try to find the visual component mode switch
        switches.forEach((sw, index) => {
          const parentText = sw.closest(".flex")?.textContent || "";
          if (
            parentText.includes("Visual Component Mode") ||
            parentText.includes("Visual")
          ) {
            console.log(
              `✓ Found Visual Component Mode switch at index ${index}`,
            );
            sw.click();
            console.log("✓ Toggled Visual Component Mode");

            // Test component detection after enabling
            setTimeout(() => {
              const componentsWithIds = document.querySelectorAll(
                "[data-component-id]",
              );
              console.log(
                `📊 Found ${componentsWithIds.length} components with data-component-id`,
              );

              // Test hover highlighting by programmatically triggering events
              if (componentsWithIds.length > 0) {
                const testComponent = componentsWithIds[0];
                const mouseEnterEvent = new Event("mouseenter", {
                  bubbles: true,
                });
                testComponent.dispatchEvent(mouseEnterEvent);
                console.log("✓ Triggered mouseenter on first component");

                setTimeout(() => {
                  const mouseLeaveEvent = new Event("mouseleave", {
                    bubbles: true,
                  });
                  testComponent.dispatchEvent(mouseLeaveEvent);
                  console.log("✓ Triggered mouseleave on first component");
                }, 1000);
              }
            }, 1000);
          }
        });
      }, 1000);
    } else {
      console.log("✗ Dev panel button not found");

      // Check if components exist anyway
      const componentsWithIds = document.querySelectorAll(
        "[data-component-id]",
      );
      console.log(
        `📊 Found ${componentsWithIds.length} components with data-component-id`,
      );

      // List first few components
      Array.from(componentsWithIds)
        .slice(0, 5)
        .forEach((comp, i) => {
          console.log(
            `  ${i + 1}. ${comp.getAttribute("data-component-id")} (${comp.getAttribute("data-component-category") || "no-category"})`,
          );
        });
    }
  } catch (error) {
    console.error("❌ Error testing visual dev mode:", error);
  }
}

// Check current localStorage settings
console.log("📋 Current localStorage settings:");
console.log("  visualDevMode:", localStorage.getItem("visualDevMode"));
console.log(
  "  highlightingEnabled:",
  localStorage.getItem("highlightingEnabled"),
);
console.log("  showTooltips:", localStorage.getItem("showTooltips"));

// Enable visual dev mode via localStorage (backup method)
localStorage.setItem("visualDevMode", "true");
localStorage.setItem("highlightingEnabled", "true");
localStorage.setItem("showTooltips", "true");

// Dispatch storage events to notify components
window.dispatchEvent(new Event("storage"));
window.dispatchEvent(new CustomEvent("visualModeToggled"));

console.log("✅ Visual dev mode enabled via localStorage");

// Run the test
testVisualDevMode();

// Also test direct component highlighting
setTimeout(() => {
  console.log("🔍 Testing direct component highlighting...");
  const allComponents = document.querySelectorAll("[data-component-id]");

  if (allComponents.length > 0) {
    // Add temporary highlighting to test
    allComponents.forEach((comp, index) => {
      setTimeout(() => {
        comp.style.outline = "2px solid #3b82f6";
        comp.style.backgroundColor = "rgba(59, 130, 246, 0.1)";

        setTimeout(() => {
          comp.style.outline = "";
          comp.style.backgroundColor = "";
        }, 1000);
      }, index * 200);
    });

    console.log(
      `✨ Applied temporary highlighting to ${allComponents.length} components`,
    );
  }
}, 3000);

console.log("🚀 Visual dev mode test script completed");
