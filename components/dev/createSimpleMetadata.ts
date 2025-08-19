import { ComponentMetadata, ComponentCategory } from '@/types/component-registry';

/**
 * Creates a minimal ComponentMetadata object for simple component wrapping
 */
export function createSimpleMetadata(
  id: string, 
  name: string, 
  category: ComponentCategory | string = 'ui',
  filePath: string = '/app/dashboard'
): ComponentMetadata {
  return {
    id,
    name,
    filePath,
    startLine: 1,
    endLine: 50,
    category: category as ComponentCategory,
    description: `Simple ${name} component`,
    dependencies: [],
    variants: [],
    accessibility: {
      violations: 0,
      hasAriaLabels: true,
      hasKeyboardSupport: true,
      screenReaderFriendly: true
    },
    performance: {
      complexity: 'low' as const
    },
    lastUpdated: new Date().toISOString(),
    exports: [name]
  };
}