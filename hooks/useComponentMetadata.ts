import { ComponentCategory } from "@/types/component-registry";

/**
 * Hook to generate standard component metadata attributes for visual dev mode
 *
 * @param id - Unique component identifier (kebab-case)
 * @param category - Component category from ComponentCategory enum
 * @returns Object with data attributes for visual dev mode integration
 *
 * @example
 * ```tsx
 * export function MyButton() {
 *   const componentProps = useComponentMetadata("my-button", ComponentCategory.INPUT);
 *
 *   return (
 *     <button {...componentProps} className="...">
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export const useComponentMetadata = (
  id: string,
  category: ComponentCategory,
) => {
  return {
    "data-component-id": id,
    "data-component-category": category,
    "data-testid": id,
  } as const;
};

/**
 * Utility function to create component metadata without React hook rules
 * Useful for non-component contexts or static definitions
 */
export const createComponentMetadata = (
  id: string,
  category: ComponentCategory,
) =>
  ({
    "data-component-id": id,
    "data-component-category": category,
    "data-testid": id,
  }) as const;
