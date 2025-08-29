// Direct test to force component highlighting
console.log("🚀 STARTING DIRECT HIGHLIGHTING TEST");

// Wait for page to load
setTimeout(() => {
  console.log("🔍 Looking for components with data-component-id...");

  // Find all components
  const components = document.querySelectorAll("[data-component-id]");
  console.log(`📦 Found ${components.length} components`);

  // Apply highlighting CSS directly to each component
  components.forEach((component, index) => {
    const componentId = component.getAttribute("data-component-id");
    const category = component.getAttribute("data-component-category") || "ui";

    console.log(`🎨 Highlighting component ${index + 1}:`, {
      id: componentId,
      category: category,
      element: component.tagName,
    });

    // Apply the highlighting styles directly
    component.classList.add("component-highlight-fallback");
    component.style.setProperty("--highlight-color", "#3b82f6");
    component.style.setProperty("--highlight-bg", "rgba(59, 130, 246, 0.1)");

    // Also apply inline styles to ensure visibility
    component.style.boxShadow = "0 0 0 3px #3b82f6";
    component.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
    component.style.position = "relative";
    component.style.zIndex = "999";
    component.style.borderRadius = "4px";
  });

  console.log(
    "✅ HIGHLIGHTING TEST COMPLETE - All components should now be highlighted",
  );

  // Create a visible indicator
  const indicator = document.createElement("div");
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  `;
  indicator.textContent = `✅ ${components.length} components highlighted`;
  document.body.appendChild(indicator);
}, 1000);
