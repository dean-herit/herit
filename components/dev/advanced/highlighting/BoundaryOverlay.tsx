"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { highlightManager } from './HighlightManager';

interface ComponentBounds {
  id: string;
  name: string;
  category: string;
  rect: DOMRect;
  color: string;
  zIndex: number;
}

interface BoundaryOverlayProps {
  enabled?: boolean;
  showLabels?: boolean;
  showDimensions?: boolean;
  opacity?: number;
}

const CATEGORY_COLORS = {
  'ui': '#3b82f6',           // Blue
  'layout': '#10b981',       // Green  
  'navigation': '#8b5cf6',   // Purple
  'input': '#f59e0b',        // Amber
  'feedback': '#ef4444',     // Red
  'authentication': '#ec4899', // Pink
  'business': '#06b6d4',     // Cyan
  'data-display': '#84cc16'  // Lime
} as const;

export const BoundaryOverlay: React.FC<BoundaryOverlayProps> = ({
  enabled = true,
  showLabels = true,
  showDimensions = false,
  opacity = 0.3
}) => {
  const [componentBounds, setComponentBounds] = useState<ComponentBounds[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const updateComponentBounds = useCallback(() => {
    if (!enabled) {
      setComponentBounds([]);
      return;
    }

    const components = document.querySelectorAll('[data-component-id]');
    const bounds: ComponentBounds[] = [];

    components.forEach((element, index) => {
      const componentId = element.getAttribute('data-component-id');
      const componentCategory = element.getAttribute('data-component-category') || 'ui';
      
      if (!componentId) return;

      const rect = element.getBoundingClientRect();
      
      // Only include visible components
      if (rect.width > 0 && rect.height > 0 && 
          rect.top < window.innerHeight && rect.bottom > 0 &&
          rect.left < window.innerWidth && rect.right > 0) {
        
        // Get component name from registry or element
        let componentName = componentId;
        const nameAttr = element.getAttribute('data-component-name');
        if (nameAttr) {
          componentName = nameAttr;
        }

        bounds.push({
          id: componentId,
          name: componentName,
          category: componentCategory,
          rect: rect,
          color: CATEGORY_COLORS[componentCategory as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.ui,
          zIndex: 10000 - index // Ensure proper stacking order
        });
      }
    });

    // Sort by area (largest first) to ensure proper overlay ordering
    bounds.sort((a, b) => {
      const areaA = a.rect.width * a.rect.height;
      const areaB = b.rect.width * b.rect.height;
      return areaB - areaA;
    });

    setComponentBounds(bounds);
  }, [enabled]);

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Initial update
    updateComponentBounds();

    // Update on scroll, resize, or DOM changes
    const handleUpdate = () => {
      requestAnimationFrame(updateComponentBounds);
    };

    const handleKeydown = (event: KeyboardEvent) => {
      // Toggle with Ctrl+B
      if (event.ctrlKey && event.key === 'b') {
        event.preventDefault();
        toggleVisibility();
      }
      
      // Update bounds when components might have changed
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        setTimeout(updateComponentBounds, 100);
      }
    };

    // Set up observers and listeners
    const resizeObserver = new ResizeObserver(handleUpdate);
    const mutationObserver = new MutationObserver(handleUpdate);

    // Observe body for size changes and DOM mutations
    resizeObserver.observe(document.body);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-component-id', 'style', 'class']
    });

    // Listen for events
    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate);
    document.addEventListener('keydown', handleKeydown);

    // Update periodically for dynamic content
    const interval = setInterval(updateComponentBounds, 2000);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      document.removeEventListener('keydown', handleKeydown);
      clearInterval(interval);
    };
  }, [enabled, updateComponentBounds, toggleVisibility]);

  if (!enabled || !isVisible || componentBounds.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]">
      {componentBounds.map((component) => (
        <div
          key={component.id}
          className="absolute border-2 transition-all duration-200"
          style={{
            left: component.rect.left + window.scrollX,
            top: component.rect.top + window.scrollY,
            width: component.rect.width,
            height: component.rect.height,
            borderColor: component.color,
            backgroundColor: `${component.color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
            zIndex: component.zIndex
          }}
        >
          {/* Component label */}
          {showLabels && (
            <div
              className="absolute -top-6 left-0 px-2 py-1 text-xs font-mono text-white rounded shadow-lg"
              style={{
                backgroundColor: component.color,
                maxWidth: component.rect.width,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {component.name}
            </div>
          )}

          {/* Dimensions label */}
          {showDimensions && (
            <div
              className="absolute bottom-0 right-0 px-1 py-0.5 text-xs font-mono text-white bg-black bg-opacity-75 rounded-tl"
              style={{
                fontSize: '10px'
              }}
            >
              {Math.round(component.rect.width)} × {Math.round(component.rect.height)}
            </div>
          )}

          {/* Category indicator */}
          <div
            className="absolute top-0 right-0 w-3 h-3 rounded-bl"
            style={{
              backgroundColor: component.color
            }}
            title={`Category: ${component.category}`}
          />
        </div>
      ))}

      {/* Control panel */}
      <div className="fixed bottom-20 right-4 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs">
        <div className="font-semibold mb-2">🔲 Boundary Overlay</div>
        <div className="space-y-1">
          <div>Components: {componentBounds.length}</div>
          <div>Ctrl+B: Toggle visibility</div>
          <div>Labels: {showLabels ? '✓' : '✗'}</div>
          <div>Dimensions: {showDimensions ? '✓' : '✗'}</div>
        </div>
        
        {/* Legend */}
        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className="text-xs font-semibold mb-1">Categories:</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
              <div key={category} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="capitalize">{category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoundaryOverlay;