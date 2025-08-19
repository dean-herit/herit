import {
  DocumentRequirement,
  DocumentCategory,
  DocumentPriority,
  IrishFinancialDocumentType,
  IrishPropertyDocumentType,
  IrishBusinessDocumentType,
  IrishPersonalDocumentType,
  DigitalDocumentType,
} from "@/types/documents";
import {
  FinancialAssetType,
  PropertyAssetType,
  BusinessAssetType,
  PersonalAssetType,
  DigitalAssetType,
} from "@/types/assets";

// =====================================================
// IRISH DOCUMENT REQUIREMENTS BY ASSET TYPE
// =====================================================

export const IrishDocumentRequirements: Record<string, DocumentRequirement[]> =
  {
    // ==================== FINANCIAL ASSETS ====================

    [FinancialAssetType.IRISH_BANK_ACCOUNT]: [
      {
        assetType: FinancialAssetType.IRISH_BANK_ACCOUNT,
        documentType: IrishFinancialDocumentType.BANK_STATEMENT,
        displayName: "Recent Bank Statement",
        description:
          "Statement from the last 3-6 months showing account details and balance",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.FINANCIAL,
        helpText:
          "Upload your most recent statement showing account number and balance",
        exampleFormats: ["PDF", "JPG", "PNG"],
      },
      {
        assetType: FinancialAssetType.IRISH_BANK_ACCOUNT,
        documentType: IrishFinancialDocumentType.ACCOUNT_OPENING_DOCS,
        displayName: "Account Opening Documentation",
        description: "Original account opening forms or welcome letter",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.OWNERSHIP,
        helpText: "Helps establish account ownership and signing authorities",
      },
      {
        assetType: FinancialAssetType.IRISH_BANK_ACCOUNT,
        documentType: IrishFinancialDocumentType.NOMINATION_FORM,
        displayName: "Nomination Form",
        description: "Death benefit nomination if applicable",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.LEGAL,
      },
    ],

    [FinancialAssetType.IRISH_CREDIT_UNION]: [
      {
        assetType: FinancialAssetType.IRISH_CREDIT_UNION,
        documentType: IrishFinancialDocumentType.SHARE_CERTIFICATE,
        displayName: "Share/Savings Certificate",
        description: "Certificate showing share holding and savings balance",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.OWNERSHIP,
        helpText: "Your credit union share certificate or passbook",
      },
      {
        assetType: FinancialAssetType.IRISH_CREDIT_UNION,
        documentType: IrishFinancialDocumentType.MEMBERSHIP_CERT,
        displayName: "Membership Documentation",
        description: "Proof of credit union membership",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.CERTIFICATE,
      },
      {
        assetType: FinancialAssetType.IRISH_CREDIT_UNION,
        documentType: IrishFinancialDocumentType.NOMINATION_FORM,
        displayName: "Death Benefit Nomination",
        description: "Nomination form for death benefit (up to €23,000)",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.LEGAL,
        helpText:
          "Important for ensuring death benefit is paid to intended beneficiary",
      },
    ],

    [FinancialAssetType.IRISH_SHARES_PORTFOLIO]: [
      {
        assetType: FinancialAssetType.IRISH_SHARES_PORTFOLIO,
        documentType: IrishFinancialDocumentType.PORTFOLIO_VALUATION,
        displayName: "Portfolio Valuation",
        description: "Recent valuation of share portfolio",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.VALUATION,
        helpText: "Statement from broker showing current holdings and values",
      },
      {
        assetType: FinancialAssetType.IRISH_SHARES_PORTFOLIO,
        documentType: IrishFinancialDocumentType.BROKER_STATEMENT,
        displayName: "Broker Account Statement",
        description: "Recent statement from stockbroker",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.STATEMENT,
      },
      {
        assetType: FinancialAssetType.IRISH_SHARES_PORTFOLIO,
        documentType: IrishFinancialDocumentType.DEALING_NOTE,
        displayName: "Dealing Notes",
        description: "Purchase contracts for significant holdings",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.FINANCIAL,
      },
      {
        assetType: FinancialAssetType.IRISH_SHARES_PORTFOLIO,
        documentType: IrishFinancialDocumentType.DIVIDEND_STATEMENT,
        displayName: "Dividend Statements",
        description: "Recent dividend payment records",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.FINANCIAL,
      },
    ],

    [FinancialAssetType.IRISH_PRSA]: [
      {
        assetType: FinancialAssetType.IRISH_PRSA,
        documentType: IrishFinancialDocumentType.BENEFIT_STATEMENT,
        displayName: "Annual Benefit Statement",
        description: "Most recent annual benefit statement",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.STATEMENT,
        helpText: "Shows current fund value and projected retirement benefits",
      },
      {
        assetType: FinancialAssetType.IRISH_PRSA,
        documentType: IrishFinancialDocumentType.SCHEME_MEMBERSHIP,
        displayName: "PRSA Certificate",
        description: "PRSA membership certificate",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.CERTIFICATE,
      },
      {
        assetType: FinancialAssetType.IRISH_PRSA,
        documentType: IrishFinancialDocumentType.EXPRESSION_OF_WISH,
        displayName: "Expression of Wish Form",
        description: "Beneficiary nomination for death benefits",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.LEGAL,
        helpText: "Ensures pension death benefits go to intended beneficiaries",
      },
    ],

    [FinancialAssetType.LIFE_INSURANCE]: [
      {
        assetType: FinancialAssetType.LIFE_INSURANCE,
        documentType: IrishFinancialDocumentType.POLICY_DOCUMENT,
        displayName: "Policy Document",
        description: "Full life insurance policy document",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.INSURANCE,
        helpText: "Complete policy terms and conditions",
      },
      {
        assetType: FinancialAssetType.LIFE_INSURANCE,
        documentType: IrishFinancialDocumentType.PREMIUM_RECEIPT,
        displayName: "Premium Payment Receipts",
        description: "Recent premium payment confirmations",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.FINANCIAL,
      },
      {
        assetType: FinancialAssetType.LIFE_INSURANCE,
        documentType: IrishFinancialDocumentType.SURRENDER_VALUE,
        displayName: "Surrender Value Statement",
        description: "Current surrender/cash value if applicable",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.VALUATION,
      },
      {
        assetType: FinancialAssetType.LIFE_INSURANCE,
        documentType: IrishFinancialDocumentType.BENEFICIARY_NOMINATION,
        displayName: "Beneficiary Details",
        description: "Current beneficiary nomination forms",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.LEGAL,
      },
    ],

    // ==================== PROPERTY ASSETS ====================

    [PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY]: [
      {
        assetType: PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY,
        documentType: IrishPropertyDocumentType.TITLE_DEEDS,
        displayName: "Title Deeds",
        description: "Property title deeds or Land Registry folio",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.OWNERSHIP,
        helpText:
          "Proof of property ownership from Land Registry or Registry of Deeds",
      },
      {
        assetType: PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY,
        documentType: IrishPropertyDocumentType.LPT_RECEIPT,
        displayName: "Local Property Tax Receipt",
        description: "Recent LPT payment confirmation",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.TAX,
        helpText: "Revenue confirmation of LPT compliance",
      },
      {
        assetType: PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY,
        documentType: IrishPropertyDocumentType.MORTGAGE_DOCS,
        displayName: "Mortgage Documentation",
        description: "Mortgage agreement and recent statement",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.FINANCIAL,
        helpText: "If property has outstanding mortgage",
      },
      {
        assetType: PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY,
        documentType: IrishPropertyDocumentType.BER_CERTIFICATE,
        displayName: "BER Certificate",
        description: "Building Energy Rating certificate",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.CERTIFICATE,
      },
      {
        assetType: PropertyAssetType.IRISH_RESIDENTIAL_PROPERTY,
        documentType: IrishPropertyDocumentType.PLANNING_PERMISSION,
        displayName: "Planning Permission",
        description: "Planning permissions for extensions/alterations",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.COMPLIANCE,
      },
    ],

    [PropertyAssetType.IRISH_COMMERCIAL_PROPERTY]: [
      {
        assetType: PropertyAssetType.IRISH_COMMERCIAL_PROPERTY,
        documentType: IrishPropertyDocumentType.TITLE_DEEDS,
        displayName: "Commercial Title Documentation",
        description: "Title deeds or folio for commercial property",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.OWNERSHIP,
      },
      {
        assetType: PropertyAssetType.IRISH_COMMERCIAL_PROPERTY,
        documentType: IrishPropertyDocumentType.COMMERCIAL_RATES,
        displayName: "Commercial Rates Receipt",
        description: "Local authority rates payment",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.TAX,
      },
      {
        assetType: PropertyAssetType.IRISH_COMMERCIAL_PROPERTY,
        documentType: IrishPropertyDocumentType.LEASE_AGREEMENT,
        displayName: "Lease Agreements",
        description: "Current tenant lease agreements",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.AGREEMENT,
        helpText: "If property is let to tenants",
      },
      {
        assetType: PropertyAssetType.IRISH_COMMERCIAL_PROPERTY,
        documentType: IrishPropertyDocumentType.FIRE_SAFETY_CERT,
        displayName: "Fire Safety Certificate",
        description: "Fire safety compliance certificate",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.COMPLIANCE,
      },
      {
        assetType: PropertyAssetType.IRISH_COMMERCIAL_PROPERTY,
        documentType: IrishPropertyDocumentType.RENT_ROLL,
        displayName: "Rent Roll",
        description: "Schedule of rental income",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.FINANCIAL,
      },
    ],

    [PropertyAssetType.IRISH_AGRICULTURAL_LAND]: [
      {
        assetType: PropertyAssetType.IRISH_AGRICULTURAL_LAND,
        documentType: IrishPropertyDocumentType.LAND_REGISTRY_FOLIO,
        displayName: "Land Registry Folio",
        description: "Folio details for agricultural land",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.OWNERSHIP,
      },
      {
        assetType: PropertyAssetType.IRISH_AGRICULTURAL_LAND,
        documentType: IrishPropertyDocumentType.BASIC_PAYMENT_SCHEME,
        displayName: "Basic Payment Scheme",
        description: "BPS entitlements and payment statements",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.FINANCIAL,
        helpText: "Department of Agriculture payment details",
      },
      {
        assetType: PropertyAssetType.IRISH_AGRICULTURAL_LAND,
        documentType: IrishPropertyDocumentType.ENTITLEMENTS,
        displayName: "Entitlement Documentation",
        description: "Agricultural entitlements owned",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.CERTIFICATE,
      },
      {
        assetType: PropertyAssetType.IRISH_AGRICULTURAL_LAND,
        documentType: IrishPropertyDocumentType.FORESTRY_GRANTS,
        displayName: "Forestry Grants/Schemes",
        description: "Forestry premium or grant documentation",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.FINANCIAL,
      },
      {
        assetType: PropertyAssetType.IRISH_AGRICULTURAL_LAND,
        documentType: IrishPropertyDocumentType.ENVIRONMENTAL_SCHEME,
        displayName: "Environmental Schemes",
        description: "GLAS, REAP, or other scheme participation",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.COMPLIANCE,
      },
    ],

    // ==================== BUSINESS ASSETS ====================

    [BusinessAssetType.IRISH_LIMITED_COMPANY_SHARES]: [
      {
        assetType: BusinessAssetType.IRISH_LIMITED_COMPANY_SHARES,
        documentType: IrishBusinessDocumentType.SHARE_CERTIFICATE,
        displayName: "Share Certificate",
        description: "Company share certificate",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.OWNERSHIP,
      },
      {
        assetType: BusinessAssetType.IRISH_LIMITED_COMPANY_SHARES,
        documentType: IrishBusinessDocumentType.CRO_CERT,
        displayName: "CRO Certificate",
        description: "Company Registration Office certificate",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.REGISTRATION,
        helpText: "Certificate of incorporation from CRO",
      },
      {
        assetType: BusinessAssetType.IRISH_LIMITED_COMPANY_SHARES,
        documentType: IrishBusinessDocumentType.ANNUAL_RETURN_B1,
        displayName: "Annual Return (B1)",
        description: "Latest annual return filed with CRO",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.COMPLIANCE,
      },
      {
        assetType: BusinessAssetType.IRISH_LIMITED_COMPANY_SHARES,
        documentType: IrishBusinessDocumentType.SHAREHOLDERS_AGREEMENT,
        displayName: "Shareholders' Agreement",
        description: "Agreement between shareholders",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.AGREEMENT,
        helpText: "Important for succession planning",
      },
      {
        assetType: BusinessAssetType.IRISH_LIMITED_COMPANY_SHARES,
        documentType: IrishBusinessDocumentType.FINANCIAL_STATEMENTS,
        displayName: "Financial Statements",
        description: "Recent audited accounts",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.FINANCIAL,
      },
    ],

    [BusinessAssetType.IRISH_SOLE_TRADER_BUSINESS]: [
      {
        assetType: BusinessAssetType.IRISH_SOLE_TRADER_BUSINESS,
        documentType: IrishBusinessDocumentType.BUSINESS_REGISTRATION,
        displayName: "Business Registration",
        description: "Business name registration certificate",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.REGISTRATION,
      },
      {
        assetType: BusinessAssetType.IRISH_SOLE_TRADER_BUSINESS,
        documentType: IrishBusinessDocumentType.TAX_REGISTRATION,
        displayName: "Revenue Registration",
        description: "Tax registration certificate from Revenue",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.TAX,
      },
      {
        assetType: BusinessAssetType.IRISH_SOLE_TRADER_BUSINESS,
        documentType: IrishBusinessDocumentType.TAX_RETURNS,
        displayName: "Recent Tax Returns",
        description: "Form 11 tax returns for last 2 years",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.TAX,
      },
      {
        assetType: BusinessAssetType.IRISH_SOLE_TRADER_BUSINESS,
        documentType: IrishBusinessDocumentType.VAT_REGISTRATION,
        displayName: "VAT Registration",
        description: "VAT registration if applicable",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.TAX,
      },
      {
        assetType: BusinessAssetType.IRISH_SOLE_TRADER_BUSINESS,
        documentType: IrishBusinessDocumentType.MANAGEMENT_ACCOUNTS,
        displayName: "Management Accounts",
        description: "Recent profit & loss statements",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.FINANCIAL,
      },
    ],

    // ==================== PERSONAL ASSETS ====================

    [PersonalAssetType.IRISH_MOTOR_VEHICLE]: [
      {
        assetType: PersonalAssetType.IRISH_MOTOR_VEHICLE,
        documentType: IrishPersonalDocumentType.VRC,
        displayName: "Vehicle Registration Certificate",
        description: "VRC (logbook) showing ownership",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.OWNERSHIP,
        helpText: "The vehicle logbook from Revenue",
      },
      {
        assetType: PersonalAssetType.IRISH_MOTOR_VEHICLE,
        documentType: IrishPersonalDocumentType.NCT_CERT,
        displayName: "NCT Certificate",
        description: "Current NCT certificate",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.CERTIFICATE,
        helpText: "National Car Test certificate if applicable",
      },
      {
        assetType: PersonalAssetType.IRISH_MOTOR_VEHICLE,
        documentType: IrishPersonalDocumentType.INSURANCE_DISC,
        displayName: "Insurance Documentation",
        description: "Current insurance disc and policy",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.INSURANCE,
      },
      {
        assetType: PersonalAssetType.IRISH_MOTOR_VEHICLE,
        documentType: IrishPersonalDocumentType.PURCHASE_INVOICE,
        displayName: "Purchase Invoice",
        description: "Original purchase documentation",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.FINANCIAL,
      },
    ],

    [PersonalAssetType.IRISH_BOAT_VESSEL]: [
      {
        assetType: PersonalAssetType.IRISH_BOAT_VESSEL,
        documentType: IrishPersonalDocumentType.BOAT_REGISTRATION,
        displayName: "Boat Registration",
        description: "Registration certificate from Marine Survey Office",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.REGISTRATION,
      },
      {
        assetType: PersonalAssetType.IRISH_BOAT_VESSEL,
        documentType: IrishPersonalDocumentType.MARINE_SURVEY,
        displayName: "Marine Survey Report",
        description: "Recent survey report on vessel condition",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.VALUATION,
      },
      {
        assetType: PersonalAssetType.IRISH_BOAT_VESSEL,
        documentType: IrishPersonalDocumentType.MOORING_AGREEMENT,
        displayName: "Mooring Agreement",
        description: "Marina or mooring arrangement",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.AGREEMENT,
      },
    ],

    [PersonalAssetType.JEWELRY]: [
      {
        assetType: PersonalAssetType.JEWELRY,
        documentType: IrishPersonalDocumentType.VALUATION_CERT,
        displayName: "Valuation Certificate",
        description: "Professional valuation from certified jeweler",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.VALUATION,
        helpText: "Required for insurance and probate purposes",
      },
      {
        assetType: PersonalAssetType.JEWELRY,
        documentType: IrishPersonalDocumentType.PURCHASE_RECEIPT,
        displayName: "Purchase Receipt",
        description: "Original purchase documentation",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.FINANCIAL,
      },
      {
        assetType: PersonalAssetType.JEWELRY,
        documentType: IrishPersonalDocumentType.AUTHENTICITY_CERT,
        displayName: "Certificate of Authenticity",
        description: "Authenticity certificates for precious stones",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.CERTIFICATE,
      },
      {
        assetType: PersonalAssetType.JEWELRY,
        documentType: IrishPersonalDocumentType.INSURANCE_APPRAISAL,
        displayName: "Insurance Appraisal",
        description: "Insurance company valuation",
        priority: DocumentPriority.OPTIONAL,
        category: DocumentCategory.INSURANCE,
      },
    ],

    // ==================== DIGITAL ASSETS ====================

    [DigitalAssetType.CRYPTOCURRENCY]: [
      {
        assetType: DigitalAssetType.CRYPTOCURRENCY,
        documentType: DigitalDocumentType.WALLET_ADDRESS,
        displayName: "Wallet Addresses",
        description: "Public wallet addresses (NOT private keys)",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.OWNERSHIP,
        helpText: "Store private keys separately and securely",
      },
      {
        assetType: DigitalAssetType.CRYPTOCURRENCY,
        documentType: DigitalDocumentType.EXCHANGE_STATEMENT,
        displayName: "Exchange Statements",
        description: "Recent statements from crypto exchanges",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.STATEMENT,
      },
      {
        assetType: DigitalAssetType.CRYPTOCURRENCY,
        documentType: DigitalDocumentType.TRANSACTION_HISTORY,
        displayName: "Transaction History",
        description: "Purchase and trading history for tax purposes",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.TAX,
        helpText: "Important for Capital Gains Tax calculations",
      },
    ],

    [DigitalAssetType.DOMAIN_NAMES]: [
      {
        assetType: DigitalAssetType.DOMAIN_NAMES,
        documentType: DigitalDocumentType.DOMAIN_REGISTRATION,
        displayName: "Domain Registration",
        description: "Registration details from domain registrar",
        priority: DocumentPriority.REQUIRED,
        category: DocumentCategory.REGISTRATION,
      },
      {
        assetType: DigitalAssetType.DOMAIN_NAMES,
        documentType: DigitalDocumentType.ACCOUNT_VERIFICATION,
        displayName: "Account Verification",
        description: "Registrar account ownership proof",
        priority: DocumentPriority.RECOMMENDED,
        category: DocumentCategory.OWNERSHIP,
      },
    ],
  };

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getDocumentRequirements(assetType: string): {
  required: DocumentRequirement[];
  recommended: DocumentRequirement[];
  optional: DocumentRequirement[];
} {
  const requirements = IrishDocumentRequirements[assetType] || [];

  return {
    required: requirements.filter(
      (r) => r.priority === DocumentPriority.REQUIRED,
    ),
    recommended: requirements.filter(
      (r) => r.priority === DocumentPriority.RECOMMENDED,
    ),
    optional: requirements.filter(
      (r) => r.priority === DocumentPriority.OPTIONAL,
    ),
  };
}

export function getRequiredDocumentCount(assetType: string): number {
  const requirements = IrishDocumentRequirements[assetType] || [];

  return requirements.filter((r) => r.priority === DocumentPriority.REQUIRED)
    .length;
}

export function getDocumentCompleteness(
  assetType: string,
  uploadedDocuments: string[],
): {
  percentage: number;
  required: number;
  uploaded: number;
} {
  const requirements = getDocumentRequirements(assetType);
  const requiredCount = requirements.required.length;
  const uploadedRequired = requirements.required.filter((r) =>
    uploadedDocuments.includes(r.documentType),
  ).length;

  return {
    percentage:
      requiredCount > 0 ? (uploadedRequired / requiredCount) * 100 : 100,
    required: requiredCount,
    uploaded: uploadedRequired,
  };
}

export function getSuggestedDocuments(
  assetType: string,
): DocumentRequirement[] {
  const requirements = IrishDocumentRequirements[assetType] || [];

  // Return required and recommended documents as suggestions
  return requirements.filter(
    (r) =>
      r.priority === DocumentPriority.REQUIRED ||
      r.priority === DocumentPriority.RECOMMENDED,
  );
}

// =====================================================
// DOCUMENT CATEGORIES BY ASSET TYPE
// =====================================================

export const DocumentCategoriesByAssetCategory = {
  financial: [
    DocumentCategory.STATEMENT,
    DocumentCategory.CERTIFICATE,
    DocumentCategory.OWNERSHIP,
    DocumentCategory.LEGAL,
    DocumentCategory.VALUATION,
  ],
  property: [
    DocumentCategory.OWNERSHIP,
    DocumentCategory.TAX,
    DocumentCategory.FINANCIAL,
    DocumentCategory.COMPLIANCE,
    DocumentCategory.CERTIFICATE,
  ],
  business: [
    DocumentCategory.OWNERSHIP,
    DocumentCategory.REGISTRATION,
    DocumentCategory.TAX,
    DocumentCategory.FINANCIAL,
    DocumentCategory.AGREEMENT,
  ],
  personal: [
    DocumentCategory.OWNERSHIP,
    DocumentCategory.CERTIFICATE,
    DocumentCategory.INSURANCE,
    DocumentCategory.VALUATION,
  ],
  digital: [
    DocumentCategory.OWNERSHIP,
    DocumentCategory.STATEMENT,
    DocumentCategory.REGISTRATION,
  ],
};
