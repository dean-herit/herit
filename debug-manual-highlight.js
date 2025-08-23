// Manual highlighting activation script for debugging
// This script can be run in the browser console or via MCP

function manuallyHighlightComponents() {
  console.log("🎯 Manual highlighting activation started");
  
  // Find all components with data-component-id
  const components = document.querySelectorAll("[data-component-id]");
  console.log(`📋 Found ${components.length} components with data-component-id`);
  
  // Add bright highlighting to make them visible
  components.forEach((element, index) => {
    const componentId = element.getAttribute("data-component-id");
    const componentCategory = element.getAttribute("data-component-category");
    
    console.log(`🎨 Highlighting component ${index + 1}: ${componentId} (${componentCategory})`);
    
    // Apply very visible highlighting
    element.style.outline = "3px solid #ff0000 !important";
    element.style.outlineOffset = "-3px";
    element.style.backgroundColor = "rgba(255, 0, 0, 0.1) !important";
    element.style.boxShadow = "inset 0 0 0 3px #ff0000 !important";
    
    // Add a temporary label
    const label = document.createElement("div");
    label.textContent = `${componentId} (${componentCategory})`;
    label.style.cssText = `
      position: absolute;
      top: -25px;
      left: 0;
      background: #ff0000;
      color: white;
      padding: 2px 5px;
      font-size: 10px;
      z-index: 10000;
      pointer-events: none;
      border-radius: 3px;
    `;
    
    // Make element position relative if it isn't already
    if (getComputedStyle(element).position === "static") {
      element.style.position = "relative";
    }
    
    element.appendChild(label);
  });
  
  console.log(`✅ Manual highlighting complete - ${components.length} components highlighted`);
  return components.length;
}

// Also create a cleanup function
function removeManualHighlighting() {
  console.log("🧹 Removing manual highlighting");
  
  const components = document.querySelectorAll("[data-component-id]");
  components.forEach(element => {
    element.style.outline = "";
    element.style.outlineOffset = "";
    element.style.backgroundColor = "";
    element.style.boxShadow = "";
    
    // Remove labels
    const labels = element.querySelectorAll("div");
    labels.forEach(label => {
      if (label.textContent.includes("(") && label.style.position === "absolute") {
        label.remove();
      }
    });
  });
  
  console.log("✅ Manual highlighting removed");
}

// Run the highlighting
if (typeof window !== "undefined") {
  console.log("🚀 Starting manual component highlighting");
  manuallyHighlightComponents();
  
  // Make functions available globally
  window.manuallyHighlightComponents = manuallyHighlightComponents;
  window.removeManualHighlighting = removeManualHighlighting;
}