// Comprehensive debug script for visual component highlighting
console.log('🔍 DEBUGGING VISUAL COMPONENT HIGHLIGHTING');
console.log('==========================================');

// 1. Check localStorage settings
console.log('📋 1. Checking localStorage settings:');
const visualDevMode = localStorage.getItem('visualDevMode');
const highlightingEnabled = localStorage.getItem('highlightingEnabled'); 
const showTooltips = localStorage.getItem('showTooltips');
const boundaryOverlay = localStorage.getItem('boundaryOverlay');
const animateOnHover = localStorage.getItem('animateOnHover');

console.log({
    visualDevMode,
    highlightingEnabled,
    showTooltips,
    boundaryOverlay,
    animateOnHover
});

// 2. Check if visual dev mode components are present
console.log('🔧 2. Checking visual dev mode components:');
const devPanel = document.querySelector('[data-component-id="visual-dev-mode-panel"]');
const devButton = document.querySelector('[data-component-id="visual-dev-mode-panel"] button');
console.log('Dev panel found:', !!devPanel);
console.log('Dev button found:', !!devButton);

// 3. Check if ComponentHighlighter is active
console.log('🎨 3. Checking ComponentHighlighter state:');
const instructionsOverlay = document.querySelector('.component-highlighter-container .fixed.bottom-4.left-4');
console.log('Instructions overlay found:', !!instructionsOverlay);
console.log('Instructions text:', instructionsOverlay?.textContent || 'Not found');

// 4. Check component detection
console.log('📊 4. Component detection analysis:');
const componentsWithId = document.querySelectorAll('[data-component-id]');
const componentsWithCategory = document.querySelectorAll('[data-component-category]');
console.log(`Components with data-component-id: ${componentsWithId.length}`);
console.log(`Components with data-component-category: ${componentsWithCategory.length}`);

// List first 10 components
console.log('First 10 components:');
Array.from(componentsWithId).slice(0, 10).forEach((comp, i) => {
    console.log(`  ${i+1}. ${comp.getAttribute('data-component-id')} (${comp.getAttribute('data-component-category') || 'no-category'}) - ${comp.tagName}`);
});

// 5. Check highlight styles
console.log('🎨 5. Checking highlight styles:');
const highlightStyles = document.getElementById('component-highlight-styles');
console.log('Highlight styles element found:', !!highlightStyles);

// 6. Test event listeners manually
console.log('🖱️  6. Testing manual event triggering:');
function testManualHighlighting() {
    if (componentsWithId.length > 0) {
        const testComponent = componentsWithId[0];
        console.log(`Testing on: ${testComponent.getAttribute('data-component-id')}`);
        
        // Add visual highlight manually
        testComponent.style.outline = '2px solid #3b82f6';
        testComponent.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        console.log('✓ Applied manual highlight');
        
        // Trigger mouse events
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
        const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true });
        
        testComponent.dispatchEvent(mouseEnterEvent);
        console.log('✓ Dispatched mouseenter event');
        
        setTimeout(() => {
            testComponent.dispatchEvent(mouseLeaveEvent);
            console.log('✓ Dispatched mouseleave event');
            
            // Remove manual highlight
            testComponent.style.outline = '';
            testComponent.style.backgroundColor = '';
            console.log('✓ Removed manual highlight');
        }, 2000);
    }
}

// 7. Enable visual dev mode programmatically
console.log('⚙️  7. Enabling visual dev mode programmatically:');
localStorage.setItem('visualDevMode', 'true');
localStorage.setItem('highlightingEnabled', 'true');
localStorage.setItem('showTooltips', 'true');

// Dispatch events to notify components
window.dispatchEvent(new CustomEvent('visualModeToggled'));
window.dispatchEvent(new Event('storage'));
console.log('✓ Visual dev mode enabled and events dispatched');

// 8. Check for JavaScript errors
console.log('⚠️  8. Checking for errors:');
window.addEventListener('error', (e) => {
    console.error('JavaScript Error detected:', e.message, e.filename, e.lineno);
});

// 9. Try clicking the dev panel button programmatically
console.log('🔘 9. Attempting to click dev panel button:');
if (devButton) {
    try {
        devButton.click();
        console.log('✓ Clicked dev panel button');
        
        // Wait and try to find switches
        setTimeout(() => {
            const switches = document.querySelectorAll('[data-component-id="switch"]');
            console.log(`Found ${switches.length} switches after opening panel`);
            
            if (switches.length > 0) {
                // Try to click the first switch (likely visual mode toggle)
                switches[0].click();
                console.log('✓ Clicked first switch');
            }
        }, 1000);
    } catch (error) {
        console.error('❌ Error clicking dev button:', error);
    }
} else {
    console.log('❌ Dev button not found');
}

// 10. Run the manual test
console.log('🧪 10. Running manual highlighting test:');
setTimeout(() => {
    testManualHighlighting();
}, 3000);

console.log('==========================================');
console.log('🔍 Debug script completed - check results above');