import {
  FinancialAssetType,
  PropertyAssetType,
  BusinessAssetType,
  PersonalAssetType,
  DigitalAssetType,
  AssetType,
} from "@/app/types/assets";

/**
 * Maps detailed asset subtypes to high-level categories for database storage
 */
export function mapAssetTypeToCategory(
  detailedType: AssetType,
): "financial" | "property" | "business" | "personal" | "digital" {
  // Financial asset types
  if (
    Object.values(FinancialAssetType).includes(
      detailedType as FinancialAssetType,
    )
  ) {
    return "financial";
  }

  // Property asset types
  if (
    Object.values(PropertyAssetType).includes(detailedType as PropertyAssetType)
  ) {
    return "property";
  }

  // Business asset types
  if (
    Object.values(BusinessAssetType).includes(detailedType as BusinessAssetType)
  ) {
    return "business";
  }

  // Personal asset types
  if (
    Object.values(PersonalAssetType).includes(detailedType as PersonalAssetType)
  ) {
    return "personal";
  }

  // Digital asset types
  if (
    Object.values(DigitalAssetType).includes(detailedType as DigitalAssetType)
  ) {
    return "digital";
  }

  // Default fallback (should not happen with proper types)
  return "personal";
}

/**
 * Type guard to check if a value is a valid high-level asset category
 */
export function isValidAssetCategory(
  value: string,
): value is "financial" | "property" | "business" | "personal" | "digital" {
  return ["financial", "property", "business", "personal", "digital"].includes(
    value,
  );
}
