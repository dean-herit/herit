/**
 * Irish Document Requirements for Estate Planning
 * Defines required documents for different asset types in Ireland
 */

export interface DocumentRequirement {
  category: string;
  required: boolean;
  priority: number;
  description: string;
  irishSpecific?: boolean;
}

export interface AssetDocumentRequirements {
  [assetType: string]: DocumentRequirement[];
}

export const IRISH_DOCUMENT_REQUIREMENTS: AssetDocumentRequirements = {
  property: [
    {
      category: "title_deed",
      required: true,
      priority: 1,
      description: "Property title deed or land registry documents",
      irishSpecific: true,
    },
    {
      category: "mortgage_statement",
      required: false,
      priority: 2,
      description: "Current mortgage statement (if applicable)",
    },
    {
      category: "property_valuation",
      required: true,
      priority: 3,
      description: "Recent property valuation report",
    },
    {
      category: "property_insurance",
      required: false,
      priority: 4,
      description: "Property insurance documentation",
    },
  ],
  financial: [
    {
      category: "bank_statements",
      required: true,
      priority: 1,
      description: "Recent bank account statements",
    },
    {
      category: "investment_statements",
      required: true,
      priority: 2,
      description: "Investment account statements",
    },
    {
      category: "pension_statements",
      required: true,
      priority: 3,
      description: "Pension fund statements",
      irishSpecific: true,
    },
  ],
  business: [
    {
      category: "business_registration",
      required: true,
      priority: 1,
      description: "Companies Registration Office (CRO) certificate",
      irishSpecific: true,
    },
    {
      category: "financial_statements",
      required: true,
      priority: 2,
      description: "Business financial statements",
    },
    {
      category: "share_certificates",
      required: false,
      priority: 3,
      description: "Share certificates (if applicable)",
    },
  ],
  personal: [
    {
      category: "identification",
      required: true,
      priority: 1,
      description: "Irish passport or national ID card",
      irishSpecific: true,
    },
    {
      category: "pps_number_verification",
      required: true,
      priority: 2,
      description: "PPS number verification",
      irishSpecific: true,
    },
  ],
  vehicle: [
    {
      category: "vehicle_registration",
      required: true,
      priority: 1,
      description: "Irish vehicle registration certificate",
      irishSpecific: true,
    },
    {
      category: "vehicle_insurance",
      required: false,
      priority: 2,
      description: "Current vehicle insurance certificate",
    },
  ],
};

export function getDocumentRequirements(assetType: string): {
  required: DocumentRequirement[];
  recommended: DocumentRequirement[];
  optional: DocumentRequirement[];
} {
  const allRequirements = IRISH_DOCUMENT_REQUIREMENTS[assetType] || [];

  return {
    required: allRequirements.filter(
      (req) => req.required && req.priority <= 2,
    ),
    recommended: allRequirements.filter(
      (req) => req.required && req.priority > 2,
    ),
    optional: allRequirements.filter((req) => !req.required),
  };
}

export function getRequiredDocuments(assetType: string): DocumentRequirement[] {
  const allRequirements = IRISH_DOCUMENT_REQUIREMENTS[assetType] || [];

  return allRequirements.filter((req) => req.required);
}

export function getOptionalDocuments(assetType: string): DocumentRequirement[] {
  const allRequirements = IRISH_DOCUMENT_REQUIREMENTS[assetType] || [];

  return allRequirements.filter((req) => !req.required);
}

export function getIrishSpecificDocuments(
  assetType: string,
): DocumentRequirement[] {
  const allRequirements = IRISH_DOCUMENT_REQUIREMENTS[assetType] || [];

  return allRequirements.filter((req) => req.irishSpecific);
}
