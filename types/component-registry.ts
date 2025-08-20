// Component Registry Types and Interfaces
export enum ComponentCategory {
  LAYOUT = "layout",
  NAVIGATION = "navigation",
  DATA_DISPLAY = "data-display",
  INPUT = "input",
  FEEDBACK = "feedback",
  AUTHENTICATION = "authentication",
  BUSINESS = "business",
  UI = "ui",
}

export interface ComponentVariant {
  name: string;
  description: string;
  props: Record<string, any>;
  conditions?: string[];
}

export interface PerformanceInfo {
  bundleSize?: number;
  renderTime?: number;
  complexity?: "low" | "medium" | "high";
}

export interface A11yInfo {
  violations: number;
  hasAriaLabels: boolean;
  hasKeyboardSupport: boolean;
  screenReaderFriendly: boolean;
}

export interface ComponentMetadata {
  id: string;
  name: string;
  filePath: string;
  startLine: number;
  endLine: number;
  category: ComponentCategory;
  description: string;
  dependencies: string[];
  variants: ComponentVariant[];
  accessibility: A11yInfo;
  performance: PerformanceInfo;
  lastUpdated: string;
  exports: string[];
}

export type ComponentRegistry = Record<string, ComponentMetadata>;

// Auto-generated component registry will be exported from here
export const COMPONENT_REGISTRY: ComponentRegistry = {};
