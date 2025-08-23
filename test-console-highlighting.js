// Direct browser console test - paste this into the browser console
// This will test if the highlighting system works at all

console.log('🔬 DIRECT CONSOLE TEST: Testing highlighting system');

// Check if visual dev mode is enabled
console.log('Visual Dev Mode:', localStorage.getItem('visualDevMode'));
console.log('Highlighting Enabled:', localStorage.getItem('highlightingEnabled'));

// Find all components
const components = document.querySelectorAll('[data-component-id]');
console.log(`Found ${components.length} components`);

// Try to highlight them directly with inline styles
components.forEach((comp, i) => {
  const id = comp.getAttribute('data-component-id');
  const category = comp.getAttribute('data-component-category');
  
  // Apply VERY visible inline styles
  comp.style.border = '4px solid red';
  comp.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
  comp.style.boxShadow = '0 0 20px red';
  
  console.log(`Applied red highlighting to: ${id} [${category}]`);
});

// Also try calling the global test function if it exists
if (typeof window.testHighlightAllComponents === 'function') {
  console.log('🎯 Calling testHighlightAllComponents()...');
  window.testHighlightAllComponents();
} else {
  console.log('❌ testHighlightAllComponents function not found');
}

console.log('✅ Test complete - components should have RED borders if working');