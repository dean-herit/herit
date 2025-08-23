// Script to enable visual dev mode programmatically
console.log('🎨 Enabling Visual Dev Mode...');

// Set localStorage settings
localStorage.setItem('visualDevMode', 'true');
localStorage.setItem('highlightingEnabled', 'true');
localStorage.setItem('showTooltips', 'true');
localStorage.setItem('boundaryOverlay', 'false');
localStorage.setItem('animateOnHover', 'false');

// Dispatch events to notify components
window.dispatchEvent(new CustomEvent('visualModeToggled'));
window.dispatchEvent(new Event('storage'));

console.log('✅ Visual Dev Mode ENABLED');
console.log('📋 Settings updated:', {
    visualDevMode: localStorage.getItem('visualDevMode'),
    highlightingEnabled: localStorage.getItem('highlightingEnabled'),
    showTooltips: localStorage.getItem('showTooltips')
});

// Try to click the dev panel button if it exists
setTimeout(() => {
    const devButton = document.querySelector('[data-component-id="visual-dev-mode-panel"] button');
    if (devButton) {
        console.log('🔘 Clicking dev panel button...');
        devButton.click();
        
        setTimeout(() => {
            // Try to find and click the visual mode toggle
            const visualModeSwitch = document.querySelector('[data-component-id="switch"]');
            if (visualModeSwitch && !visualModeSwitch.checked) {
                console.log('🔄 Toggling visual mode switch...');
                visualModeSwitch.click();
            }
        }, 500);
    }
}, 1000);

console.log('🎯 Visual dev mode should now be active. Try hovering over components!');